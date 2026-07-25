import React, { useRef } from "react";
import DownloadButton from "./DownloadButton.jsx";

const ROWS = [
  { key: "off_duty", label: "Off Duty" },
  { key: "sleeper_berth", label: "Sleeper Berth" },
  { key: "driving", label: "Driving" },
  { key: "on_duty_not_driving", label: "On Duty (Not Driving)" },
];

const ROW_HEIGHT = 34;
const GRID_TOP = 14;
const GRID_LEFT = 168;
const GRID_WIDTH = 720;
const GRID_HEIGHT = ROW_HEIGHT * ROWS.length;

function xForHour(hour) {
  return GRID_LEFT + (hour / 24) * GRID_WIDTH;
}

function yForRow(rowIndex) {
  return GRID_TOP + rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
}

function buildStepPath(segments) {
  if (segments.length === 0) return "";
  const rowIndexOf = (status) => ROWS.findIndex((r) => r.key === status);

  let d = "";
  let prevRow = null;

  segments.forEach((seg, i) => {
    const rowIndex = rowIndexOf(seg.status);
    if (rowIndex === -1) return;
    const x1 = xForHour(seg.start_hour);
    const x2 = xForHour(seg.end_hour);
    const y = yForRow(rowIndex);

    if (prevRow === null) {
      d += `M ${x1} ${y} `;
    } else if (prevRow !== rowIndex) {
      d += `L ${x1} ${y} `;
    }
    d += `L ${x2} ${y} `;
    prevRow = rowIndex;
  });

  return d;
}

export default function LogViewer({ log, dayNumber }) {
  const containerRef = useRef(null);
  const path = buildStepPath(log.segments);

  return (
    <div className="card p-sp-pad" ref={containerRef}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <p className="text-caption text-muted font-semibold uppercase tracking-wide">Day {dayNumber}</p>
          <h3 className="text-lg font-bold text-ink">
            {new Date(log.date + "T00:00:00").toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </h3>
        </div>
        <DownloadButton targetRef={containerRef} filename={`routewise-eld-log-${log.date}`} />
      </div>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${GRID_LEFT + GRID_WIDTH + 16} ${GRID_HEIGHT + 40}`} width="100%" role="img" aria-label={`ELD log grid for ${log.date}`}>
          {/* Row labels + backgrounds */}
          {ROWS.map((row, i) => (
            <g key={row.key}>
              <rect
                x={0}
                y={GRID_TOP + i * ROW_HEIGHT}
                width={GRID_LEFT + GRID_WIDTH}
                height={ROW_HEIGHT}
                fill={i % 2 === 0 ? "#FAFAF9" : "#FFFFFF"}
              />
              <text x={8} y={yForRow(i) + 4} fontSize="11" fontWeight="600" fill="#6B7280">
                {row.label}
              </text>
            </g>
          ))}

          {/* Hour gridlines */}
          {Array.from({ length: 25 }).map((_, h) => (
            <g key={h}>
              <line
                x1={xForHour(h)}
                y1={GRID_TOP}
                x2={xForHour(h)}
                y2={GRID_TOP + GRID_HEIGHT}
                stroke={h % 4 === 0 ? "#D8D8D5" : "#ECECEC"}
                strokeWidth={h % 4 === 0 ? 1.2 : 1}
              />
              <text x={xForHour(h)} y={GRID_TOP + GRID_HEIGHT + 16} fontSize="9" fill="#6B7280" textAnchor="middle">
                {h}
              </text>
            </g>
          ))}

          {/* Duty status step line */}
          <path d={path} fill="none" stroke="#3C8D89" strokeWidth="3" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mt-6 pt-6 border-t border-border">
        <TotalStat label="Driving" value={log.totals.driving} />
        <TotalStat label="On Duty" value={log.totals.on_duty_not_driving} />
        <TotalStat label="Off Duty" value={log.totals.off_duty} />
        <TotalStat label="Sleeper Berth" value={log.totals.sleeper_berth} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
        <div>
          <p className="label mb-1">Mileage</p>
          <p className="text-body text-ink">{log.mileage.toLocaleString()} miles today</p>
        </div>
        <div>
          <p className="label mb-1">Remarks</p>
          <p className="text-body text-ink">{log.remarks.join(" \u00b7 ") || "\u2014"}</p>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-border flex items-center justify-between">
        <div>
          <p className="label mb-1">Driver Signature</p>
          <p className="text-body text-ink italic border-b border-border pb-1 w-48">{log.driver_name}</p>
        </div>
      </div>
    </div>
  );
}

function TotalStat({ label, value }) {
  return (
    <div>
      <p className="text-caption text-muted uppercase tracking-wide mb-1">{label}</p>
      <p className="text-lg font-bold text-ink">{value.toFixed(1)} hrs</p>
    </div>
  );
}
