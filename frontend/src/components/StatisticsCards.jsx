import React from "react";

export default function StatisticsCards({ summary }) {
  const stats = [
    { label: "Average Speed", value: `${summary.average_speed_mph} mph` },
    { label: "Driving Hours", value: `${summary.driving_duration_hours.toFixed(1)} hrs` },
    { label: "On-Duty Hours", value: `${summary.on_duty_hours.toFixed(1)} hrs` },
    { label: "Off-Duty Hours", value: `${summary.off_duty_hours.toFixed(1)} hrs` },
    { label: "Fuel Stops", value: summary.fuel_stops },
    { label: "Overnight Resets", value: summary.overnight_resets },
    { label: "Trip Length", value: `${summary.total_duration_hours.toFixed(1)} hrs total` },
    { label: "Remaining Cycle", value: `${summary.remaining_cycle_hours.toFixed(1)} hrs` },
  ];

  return (
    <div className="card p-sp-pad">
      <h3 className="text-lg font-bold text-ink mb-5">Trip statistics</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-6">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-caption text-muted uppercase tracking-wide mb-1">{s.label}</p>
            <p className="text-lg font-bold text-ink">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
