import React from "react";
import {
  HiOutlineFlag,
  HiOutlineTruck,
  HiOutlinePauseCircle,
  HiOutlineMoon,
  HiOutlineArrowDownTray,
  HiOutlineArrowUpTray,
  HiOutlineFire,
} from "react-icons/hi2";

const EVENT_STYLES = {
  trip_start: { icon: HiOutlineFlag, bg: "bg-accent-secondary/10", text: "text-accent-secondary" },
  driving: { icon: HiOutlineTruck, bg: "bg-accent/10", text: "text-accent" },
  pickup: { icon: HiOutlineArrowDownTray, bg: "bg-accent-secondary/10", text: "text-accent-secondary" },
  dropoff: { icon: HiOutlineArrowUpTray, bg: "bg-success/10", text: "text-success" },
  mandatory_break: { icon: HiOutlinePauseCircle, bg: "bg-warning/10", text: "text-warning" },
  fuel_stop: { icon: HiOutlineFire, bg: "bg-warning/10", text: "text-warning" },
  overnight_rest: { icon: HiOutlineMoon, bg: "bg-accent-secondary/10", text: "text-accent-secondary" },
};

export default function Timeline({ events }) {
  return (
    <div className="card p-sp-pad">
      <h3 className="text-lg font-bold text-ink mb-6">Trip timeline</h3>
      <ol className="relative">
        {events.map((event, index) => {
          const style = EVENT_STYLES[event.type] || EVENT_STYLES.driving;
          const Icon = style.icon;
          const isLast = index === events.length - 1;
          const start = new Date(event.start);

          return (
            <li key={index} className="relative pl-14 pb-8 last:pb-0">
              {!isLast && <span className="absolute left-[19px] top-10 bottom-0 w-px bg-border" aria-hidden="true" />}
              <span
                className={`absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center ${style.bg} ${style.text}`}
              >
                <Icon size={18} />
              </span>
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                <p className="font-semibold text-ink">{event.label}</p>
                <span className="text-caption text-muted whitespace-nowrap">
                  {start.toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })}
                  {event.duration_hours > 0 && ` \u00b7 ${formatDuration(event.duration_hours)}`}
                </span>
              </div>
              <p className="text-body text-muted mt-0.5">{event.description}</p>
              {event.mile_marker > 0 && (
                <p className="text-caption text-muted mt-1">Mile {Math.round(event.mile_marker).toLocaleString()}</p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function formatDuration(hours) {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
