import React from "react";

export default function Footer() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="max-w-[1180px] mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-caption text-muted">RouteWise \u2014 built for FMCSA Hours-of-Service compliance planning.</p>
        <p className="text-caption text-muted">Property-carrying driver \u00b7 70 hrs / 8 days cycle</p>
      </div>
    </footer>
  );
}
