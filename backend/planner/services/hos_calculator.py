"""
FMCSA Hours-of-Service compliance engine.

Implements the assumptions specified for RouteWise:
  - Property-carrying driver, 70 hrs / 8 days cycle
  - 11-hour driving limit per duty day
  - 14-hour duty window per duty day
  - 30-minute break required after 8 cumulative hours of driving
  - 10-hour off-duty reset between duty days
  - Fuel stop every 1,000 miles
  - Pickup and dropoff each take 1 hour (on-duty, not driving)

The simulation walks the trip leg by leg (current -> pickup -> dropoff),
advancing a virtual clock and odometer, and inserting mandatory breaks,
fuel stops, and overnight resets exactly where FMCSA rules require them.
Every duty-status change is recorded both as a human-readable timeline
event and as a raw (status, start, end, miles) segment that the ELD log
generator turns into 24-hour grids.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List, Optional

DRIVING_LIMIT_HOURS = 11.0
DUTY_WINDOW_HOURS = 14.0
BREAK_REQUIRED_AFTER_HOURS = 8.0
BREAK_DURATION_MINUTES = 30
RESET_DURATION_HOURS = 10.0
FUEL_INTERVAL_MILES = 1000.0
FUEL_STOP_MINUTES = 30
DOCK_ACTIVITY_MINUTES = 60
CYCLE_LIMIT_HOURS = 70.0
CYCLE_DAYS = 8


@dataclass
class Segment:
    status: str
    start: datetime
    end: datetime
    miles: float = 0.0
    label: str = ""

    @property
    def hours(self) -> float:
        return (self.end - self.start).total_seconds() / 3600.0


@dataclass
class TimelineEvent:
    type: str
    label: str
    description: str
    start: datetime
    end: datetime
    mile_marker: float

    @property
    def duration_hours(self) -> float:
        return round((self.end - self.start).total_seconds() / 3600.0, 2)

    def to_dict(self):
        return {
            "type": self.type,
            "label": self.label,
            "description": self.description,
            "start": self.start.isoformat(),
            "end": self.end.isoformat(),
            "duration_hours": self.duration_hours,
            "mile_marker": round(self.mile_marker, 1),
        }


@dataclass
class SimState:
    time: datetime
    odometer: float = 0.0
    drive_hours_today: float = 0.0
    duty_window_start: Optional[datetime] = None
    drive_since_break: float = 0.0
    cycle_used: float = 0.0
    next_fuel_mile: float = FUEL_INTERVAL_MILES
    break_count: int = 0
    fuel_stop_count: int = 0
    reset_count: int = 0
    non_compliant: bool = False
    segments: List[Segment] = field(default_factory=list)
    timeline: List[TimelineEvent] = field(default_factory=list)


def _split_segment_by_day(seg: Segment) -> List[Segment]:
    pieces = []
    cursor = seg.start
    total_seconds = (seg.end - seg.start).total_seconds()
    while cursor < seg.end:
        day_end = datetime(cursor.year, cursor.month, cursor.day) + timedelta(days=1)
        piece_end = min(seg.end, day_end)
        piece_seconds = (piece_end - cursor).total_seconds()
        piece_miles = seg.miles * (piece_seconds / total_seconds) if total_seconds > 0 else 0
        pieces.append(Segment(seg.status, cursor, piece_end, piece_miles, seg.label))
        cursor = piece_end
    return pieces or [seg]


def build_schedule(
    leg1_miles: float,
    leg1_hours: float,
    leg2_miles: float,
    leg2_hours: float,
    current_cycle_used: float,
    start_time: Optional[datetime] = None,
    current_label: str = "Current Location",
    pickup_label: str = "Pickup",
    dropoff_label: str = "Dropoff",
) -> dict:
    start_time = start_time or datetime.now().replace(second=0, microsecond=0)

    speed1 = (leg1_miles / leg1_hours) if leg1_hours > 0 else 50.0
    speed2 = (leg2_miles / leg2_hours) if leg2_hours > 0 else 50.0

    state = SimState(time=start_time, cycle_used=current_cycle_used, duty_window_start=start_time)

    def emit_segment(status, start, end, miles=0.0, label=""):
        if end <= start:
            return
        state.segments.extend(_split_segment_by_day(Segment(status, start, end, miles, label)))

    def add_reset():
        start = state.time
        end = start + timedelta(hours=RESET_DURATION_HOURS)
        emit_segment("sleeper_berth", start, end, label="10-Hour Off-Duty Reset")
        state.timeline.append(
            TimelineEvent(
                "overnight_rest",
                "10-Hour Overnight Reset",
                "Mandatory off-duty reset before driving hours and the 14-hour duty window become available again.",
                start,
                end,
                state.odometer,
            )
        )
        state.time = end
        state.drive_hours_today = 0.0
        state.drive_since_break = 0.0
        state.duty_window_start = end
        state.reset_count += 1

    def add_break():
        start = state.time
        end = start + timedelta(minutes=BREAK_DURATION_MINUTES)
        emit_segment("off_duty", start, end, label="30-Minute Break")
        state.timeline.append(
            TimelineEvent(
                "mandatory_break",
                "30-Minute Mandatory Break",
                "Required after 8 cumulative hours of driving.",
                start,
                end,
                state.odometer,
            )
        )
        state.time = end
        state.drive_since_break = 0.0
        state.break_count += 1

    def add_fuel_stop():
        start = state.time
        end = start + timedelta(minutes=FUEL_STOP_MINUTES)
        emit_segment("on_duty_not_driving", start, end, label="Fuel Stop")
        state.timeline.append(
            TimelineEvent(
                "fuel_stop",
                "Fuel Stop",
                "Scheduled refueling stop (every 1,000 miles).",
                start,
                end,
                state.odometer,
            )
        )
        state.time = end
        state.next_fuel_mile += FUEL_INTERVAL_MILES
        state.fuel_stop_count += 1
        state.cycle_used += FUEL_STOP_MINUTES / 60

    def add_activity(minutes, event_type, label, description):
        start = state.time
        end = start + timedelta(minutes=minutes)
        emit_segment("on_duty_not_driving", start, end, label=label)
        state.timeline.append(TimelineEvent(event_type, label, description, start, end, state.odometer))
        state.time = end
        state.cycle_used += minutes / 60

    def drive_leg(miles: float, speed: float, leg_label: str):
        remaining = miles
        guard = 0
        while remaining > 0.05:
            guard += 1
            if guard > 500:
                state.non_compliant = True
                break

            elapsed_window = (state.time - state.duty_window_start).total_seconds() / 3600.0

            if state.drive_hours_today >= DRIVING_LIMIT_HOURS - 1e-6 or elapsed_window >= DUTY_WINDOW_HOURS - 1e-6:
                add_reset()
                continue
            if state.drive_since_break >= BREAK_REQUIRED_AFTER_HOURS - 1e-6:
                add_break()
                continue
            if state.cycle_used >= CYCLE_LIMIT_HOURS - 1e-6:
                state.non_compliant = True
                add_reset()
                continue

            drive_left_11 = DRIVING_LIMIT_HOURS - state.drive_hours_today
            window_left = DUTY_WINDOW_HOURS - elapsed_window
            break_left = BREAK_REQUIRED_AFTER_HOURS - state.drive_since_break
            cycle_left = CYCLE_LIMIT_HOURS - state.cycle_used
            hours_for_remaining_miles = remaining / speed
            miles_to_fuel = state.next_fuel_mile - state.odometer
            hours_to_fuel = (miles_to_fuel / speed) if miles_to_fuel > 0.05 else hours_for_remaining_miles

            chunk_hours = min(
                drive_left_11,
                window_left,
                break_left,
                cycle_left,
                hours_for_remaining_miles,
                hours_to_fuel,
            )
            chunk_hours = max(chunk_hours, 0.01)

            start = state.time
            end = start + timedelta(hours=chunk_hours)
            chunk_miles = chunk_hours * speed
            emit_segment("driving", start, end, miles=chunk_miles, label=leg_label)

            state.timeline.append(
                TimelineEvent(
                    "driving",
                    f"Driving - {leg_label}",
                    f"{round(chunk_miles)} mi at ~{round(speed)} mph.",
                    start,
                    end,
                    state.odometer,
                )
            )

            state.odometer += chunk_miles
            remaining -= chunk_miles
            state.time = end
            state.drive_hours_today += chunk_hours
            state.drive_since_break += chunk_hours
            state.cycle_used += chunk_hours

            if state.odometer >= state.next_fuel_mile - 0.5 and remaining > 0.05:
                add_fuel_stop()

    state.timeline.append(
        TimelineEvent(
            "trip_start",
            f"Depart {current_label}",
            "Trip begins.",
            state.time,
            state.time,
            0,
        )
    )

    drive_leg(leg1_miles, speed1, f"{current_label} -> {pickup_label}")
    add_activity(
        DOCK_ACTIVITY_MINUTES,
        "pickup",
        f"Pickup - {pickup_label}",
        "1 hour on-duty (not driving) for loading.",
    )
    drive_leg(leg2_miles, speed2, f"{pickup_label} -> {dropoff_label}")
    add_activity(
        DOCK_ACTIVITY_MINUTES,
        "dropoff",
        f"Dropoff - {dropoff_label}",
        "1 hour on-duty (not driving) for unloading.",
    )

    remaining_cycle = round(CYCLE_LIMIT_HOURS - state.cycle_used, 2)
    total_driving_hours = sum(s.hours for s in state.segments if s.status == "driving")
    total_on_duty_hours = sum(s.hours for s in state.segments if s.status == "on_duty_not_driving")
    total_off_duty_hours = sum(s.hours for s in state.segments if s.status == "off_duty")
    total_sleeper_hours = sum(s.hours for s in state.segments if s.status == "sleeper_berth")

    trip_dates = sorted({s.start.date() for s in state.segments})

    if state.non_compliant or remaining_cycle < 0:
        compliance_status = "Non-Compliant"
        risk_level = "High"
    elif remaining_cycle < 10:
        compliance_status = "Compliant"
        risk_level = "Medium"
    else:
        compliance_status = "Compliant"
        risk_level = "Low"

    return {
        "start_time": start_time,
        "end_time": state.time,
        "segments": state.segments,
        "timeline": state.timeline,
        "trip_dates": trip_dates,
        "summary": {
            "distance_miles": round(leg1_miles + leg2_miles, 1),
            "driving_duration_hours": round(total_driving_hours, 2),
            "total_duration_hours": round((state.time - start_time).total_seconds() / 3600, 2),
            "trip_days": len(trip_dates),
            "remaining_cycle_hours": max(remaining_cycle, 0),
            "mandatory_breaks": state.break_count,
            "fuel_stops": state.fuel_stop_count,
            "overnight_resets": state.reset_count,
            "compliance_status": compliance_status,
            "risk_level": risk_level,
            "eta": state.time,
            "on_duty_hours": round(total_on_duty_hours, 2),
            "off_duty_hours": round(total_off_duty_hours + total_sleeper_hours, 2),
            "average_speed_mph": round((leg1_miles + leg2_miles) / total_driving_hours, 1)
            if total_driving_hours
            else 0,
        },
    }
