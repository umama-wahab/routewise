import React from "react";
import DailyLogs from "../components/DailyLogs.jsx";
import { HiOutlineArrowLeft } from "react-icons/hi2";

export default function LogsPage({ plan, onGoToPlan }) {
  if (!plan) {
    return (
      <div className="py-sp-section text-center">
        <p className="text-body text-muted mb-4">No trip has been planned yet.</p>
        <button type="button" onClick={onGoToPlan} className="btn-primary">
          Plan a trip
        </button>
      </div>
    );
  }

  return (
    <div className="py-sp-section flex flex-col gap-sp-section">
      <div>
        <button
          type="button"
          onClick={onGoToPlan}
          className="flex items-center gap-1.5 text-caption font-semibold text-muted hover:text-ink w-fit mb-4"
        >
          <HiOutlineArrowLeft size={14} /> Back to plan
        </button>
        <h2 className="text-section text-ink">Daily ELD logs</h2>
        <p className="text-body text-muted mt-1">
          One 24-hour log sheet is generated automatically for each day of the trip, ready to export.
        </p>
      </div>

      <DailyLogs logs={plan.daily_logs} />
    </div>
  );
}
