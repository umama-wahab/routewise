import React from "react";
import { HiOutlineMap } from "react-icons/hi2";

const TABS = [
  { id: "plan", label: "Plan" },
  { id: "review", label: "Review" },
  { id: "logs", label: "Logs" },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function Navbar({ activeTab, onTabChange, hasPlan }) {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="w-full border-b border-border bg-bg/90 backdrop-blur sticky top-0 z-30">
      <div className="max-w-[1180px] mx-auto px-5 sm:px-8 py-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-accent flex items-center justify-center text-white shrink-0">
            <HiOutlineMap size={22} />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-lg font-bold tracking-tight text-ink">RouteWise</h1>
              <span className="hidden sm:inline text-caption text-muted">{getGreeting()}, Dispatcher</span>
            </div>
            <p className="text-caption text-muted">{today}</p>
          </div>
        </div>

        <nav aria-label="RouteWise sections" className="flex items-center gap-1 bg-white border border-border rounded-button p-1 self-start sm:self-auto">
          {TABS.map((tab) => {
            const disabled = tab.id !== "plan" && !hasPlan;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                disabled={disabled}
                onClick={() => onTabChange(tab.id)}
                aria-current={isActive ? "page" : undefined}
                className={`px-4 py-2 text-body font-semibold rounded-[14px] transition-all duration-150
                  ${isActive ? "bg-accent text-white shadow-soft" : "text-muted hover:text-ink"}
                  ${disabled ? "opacity-40 cursor-not-allowed hover:text-muted" : "cursor-pointer"}`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
