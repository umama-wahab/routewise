import React from "react";
import {
  HiOutlineMapPin,
  HiOutlineClock,
  HiOutlineCalendarDays,
  HiOutlineBattery50,
  HiOutlinePauseCircle,
  HiOutlineTruck,
  HiOutlineShieldCheck,
  HiOutlineFlag,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";

const RISK_STYLES = {
  Low: { bg: "bg-success/10", text: "text-success", dot: "bg-success" },
  Medium: { bg: "bg-warning/10", text: "text-warning", dot: "bg-warning" },
  High: { bg: "bg-error/10", text: "text-error", dot: "bg-error" },
};

export default function DecisionSummary({ summary }) {
  const isCompliant = summary.compliance_status === "Compliant";
  const risk = RISK_STYLES[summary.risk_level] || RISK_STYLES.Low;
  const eta = new Date(summary.eta);

  return (
    <div className="animate-fade-in-up">
      <div
        className={`card p-7 mb-sp-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-l-[6px] ${
          isCompliant ? "border-l-success" : "border-l-error"
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
              isCompliant ? "bg-success/10 text-success" : "bg-error/10 text-error"
            }`}
          >
            {isCompliant ? <HiOutlineShieldCheck size={24} /> : <HiOutlineExclamationTriangle size={24} />}
          </div>
          <div>
            <p className="text-card-number leading-none">
              {isCompliant ? "This trip is compliant" : "This trip is not compliant"}
            </p>
            <p className="text-body text-muted mt-1">
              {isCompliant
                ? "The plan below satisfies FMCSA Hours-of-Service regulations."
                : "The 70-hour / 8-day cycle would be exceeded before dropoff \u2014 a 34-hour restart is required."}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${risk.bg} ${risk.text} font-semibold text-caption shrink-0`}>
          <span className={`w-2 h-2 rounded-full ${risk.dot}`} />
          {summary.risk_level} risk
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-sp-card">
        <Kpi icon={<HiOutlineMapPin size={18} />} label="Distance" value={`${Math.round(summary.distance_miles).toLocaleString()} mi`} />
        <Kpi icon={<HiOutlineClock size={18} />} label="Est. Drive Time" value={`${summary.driving_duration_hours.toFixed(1)} hrs`} />
        <Kpi icon={<HiOutlineCalendarDays size={18} />} label="Trip Days" value={summary.trip_days} />
        <Kpi icon={<HiOutlineBattery50 size={18} />} label="Remaining Cycle" value={`${summary.remaining_cycle_hours.toFixed(1)} hrs`} />
        <Kpi icon={<HiOutlinePauseCircle size={18} />} label="Mandatory Breaks" value={summary.mandatory_breaks} />
        <Kpi icon={<HiOutlineTruck size={18} />} label="Fuel Stops" value={summary.fuel_stops} />
        <Kpi
          icon={<HiOutlineShieldCheck size={18} />}
          label="Compliance"
          value={summary.compliance_status}
          valueClassName={isCompliant ? "text-success" : "text-error"}
        />
        <Kpi
          icon={<HiOutlineFlag size={18} />}
          label="Estimated Arrival"
          value={eta.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
          small
        />
        <Kpi
          icon={<HiOutlineExclamationTriangle size={18} />}
          label="Risk Level"
          value={summary.risk_level}
          valueClassName={risk.text}
        />
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, valueClassName = "", small = false }) {
  return (
    <div className="card p-6 hover:shadow-floating transition-shadow duration-200">
      <div className="flex items-center gap-2 text-muted mb-3">
        {icon}
        <span className="text-caption font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className={`${small ? "text-lg" : "text-card-number"} text-ink ${valueClassName}`}>{value}</p>
    </div>
  );
}
