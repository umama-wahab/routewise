import React from "react";

export function KpiSkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-sp-card">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-6">
          <div className="skeleton h-3 w-20 mb-4" />
          <div className="skeleton h-8 w-24" />
        </div>
      ))}
    </div>
  );
}

export function BlockSkeleton({ height = "h-64" }) {
  return <div className={`card ${height} p-6`}><div className="skeleton w-full h-full" /></div>;
}
