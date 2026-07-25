import React from "react";

export default function NumberField({ icon, label, error, value, onChange, ...inputProps }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className={`input-shell ${error ? "border-error focus-within:border-error focus-within:ring-error/15" : ""}`}>
        <span className="input-shell-icon">{icon}</span>
        <input
          {...inputProps}
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      {error && <p className="text-caption text-error mt-1.5">{error}</p>}
    </div>
  );
}
