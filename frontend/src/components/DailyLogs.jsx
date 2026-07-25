import React from "react";
import LogViewer from "./LogViewer.jsx";

export default function DailyLogs({ logs }) {
  return (
    <div className="flex flex-col gap-sp-card">
      {logs.map((log, i) => (
        <LogViewer key={log.date} log={log} dayNumber={i + 1} />
      ))}
    </div>
  );
}
