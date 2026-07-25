import React from "react";
import TripForm from "../components/TripForm.jsx";
import ErrorCard from "../components/ErrorCard.jsx";
import { HiOutlineArrowRight } from "react-icons/hi2";

export default function PlanPage({ onGenerate, isLoading, error, plan, onViewReview }) {
  return (
    <div className="py-sp-section max-w-2xl mx-auto">
      <div className="mb-8 text-center animate-fade-in-up">
        <h1 className="text-hero text-ink">Can this trip be completed legally?</h1>
        <p className="text-body text-muted mt-3 max-w-lg mx-auto">
          Enter your trip details and RouteWise will check FMCSA Hours-of-Service compliance before you leave the yard.
        </p>
      </div>

      <TripForm onGenerate={onGenerate} isLoading={isLoading} />

      {error && (
        <div className="mt-6">
          <ErrorCard title={error.title} message={error.message} />
        </div>
      )}

      {plan && !isLoading && !error && (
        <button
          type="button"
          onClick={onViewReview}
          className="mt-6 w-full flex items-center justify-center gap-2 text-accent font-semibold py-3 hover:underline"
        >
          View your last generated plan
          <HiOutlineArrowRight size={16} />
        </button>
      )}
    </div>
  );
}
