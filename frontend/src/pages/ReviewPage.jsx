import React from "react";
import DecisionSummary from "../components/DecisionSummary.jsx";
import Timeline from "../components/Timeline.jsx";
import MapCard from "../components/MapCard.jsx";
import StatisticsCards from "../components/StatisticsCards.jsx";
import { KpiSkeletonGrid, BlockSkeleton } from "../components/LoadingSkeleton.jsx";
import { HiOutlineArrowRight, HiOutlineArrowLeft } from "react-icons/hi2";

export default function ReviewPage({ plan, isLoading, onGoToPlan, onGoToLogs }) {
  if (isLoading) {
    return (
      <div className="py-sp-section flex flex-col gap-sp-section">
        <KpiSkeletonGrid />
        <BlockSkeleton height="h-96" />
        <BlockSkeleton height="h-80" />
      </div>
    );
  }

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
      <button type="button" onClick={onGoToPlan} className="flex items-center gap-1.5 text-caption font-semibold text-muted hover:text-ink w-fit">
        <HiOutlineArrowLeft size={14} /> Back to plan
      </button>

      <DecisionSummary summary={plan.summary} />
      <Timeline events={plan.timeline} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-sp-section items-start">
        <div className="lg:col-span-3">
          <MapCard locations={plan.locations} mapData={plan.map} />
        </div>
        <div className="lg:col-span-2">
          <StatisticsCards summary={plan.summary} />
        </div>
      </div>

      <button
        type="button"
        onClick={onGoToLogs}
        className="btn-primary w-fit self-center flex items-center gap-2"
      >
        View ELD daily logs
        <HiOutlineArrowRight size={16} />
      </button>
    </div>
  );
}
