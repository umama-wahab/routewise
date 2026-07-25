"""
Builds one FMCSA-style 24-hour ELD log sheet per calendar day of the trip
from the raw duty-status segments produced by hos_calculator.build_schedule.
"""
from __future__ import annotations

from collections import defaultdict
from datetime import date as date_cls
from typing import List

STATUS_LABELS = {
    "off_duty": "Off Duty",
    "sleeper_berth": "Sleeper Berth",
    "driving": "Driving",
    "on_duty_not_driving": "On Duty (Not Driving)",
}


def _hour_fraction(dt, day: date_cls) -> float:
    """Return the time-of-day as a 0-24 float, clamped to the given day."""
    if dt.date() != day:
        return 24.0 if dt.date() > day else 0.0
    return dt.hour + dt.minute / 60.0 + dt.second / 3600.0


def generate_daily_logs(segments: List, trip_dates: List[date_cls], driver_name: str = "") -> List[dict]:
    by_day = defaultdict(list)
    for seg in segments:
        by_day[seg.start.date()].append(seg)

    logs = []
    for day in trip_dates:
        day_segments = sorted(by_day.get(day, []), key=lambda s: s.start)

        grid_segments = []
        totals = {"driving": 0.0, "on_duty_not_driving": 0.0, "off_duty": 0.0, "sleeper_berth": 0.0}
        miles_today = 0.0
        remarks = []

        for seg in day_segments:
            start_h = round(_hour_fraction(seg.start, day), 3)
            end_h = round(_hour_fraction(seg.end, day), 3)
            if end_h <= start_h:
                continue
            grid_segments.append(
                {
                    "status": seg.status,
                    "status_label": STATUS_LABELS.get(seg.status, seg.status),
                    "start_hour": start_h,
                    "end_hour": end_h,
                    "start_time": seg.start.strftime("%H:%M"),
                    "end_time": seg.end.strftime("%H:%M"),
                    "miles": round(seg.miles, 1),
                }
            )
            totals[seg.status] = totals.get(seg.status, 0.0) + (end_h - start_h)
            miles_today += seg.miles
            if seg.label and seg.label not in remarks:
                remarks.append(seg.label)

        logs.append(
            {
                "date": day.isoformat(),
                "driver_name": driver_name or "Driver",
                "segments": grid_segments,
                "totals": {
                    "driving": round(totals.get("driving", 0.0), 2),
                    "on_duty_not_driving": round(totals.get("on_duty_not_driving", 0.0), 2),
                    "off_duty": round(totals.get("off_duty", 0.0), 2),
                    "sleeper_berth": round(totals.get("sleeper_berth", 0.0), 2),
                },
                "mileage": round(miles_today, 1),
                "remarks": remarks,
            }
        )

    return logs
