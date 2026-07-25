import React, { useState } from "react";
import { HiOutlineLocationMarker, HiOutlineFlag, HiOutlineClock } from "react-icons/hi";
import { HiOutlineTruck } from "react-icons/hi2";
import LocationAutocomplete from "./LocationAutocomplete.jsx";
import NumberField from "./NumberField.jsx";

const initialValues = {
  currentLocation: "",
  pickupLocation: "",
  dropoffLocation: "",
  currentCycleUsed: "",
};

function validate(values) {
  const errors = {};

  if (!String(values.currentLocation || "").trim()) {
    errors.currentLocation = "Current location is required.";
  }
  if (!String(values.pickupLocation || "").trim()) {
    errors.pickupLocation = "Pickup location is required.";
  }
  if (!String(values.dropoffLocation || "").trim()) {
    errors.dropoffLocation = "Dropoff location is required.";
  }

  const cycleRaw = values.currentCycleUsed;
  const cycle = Number(cycleRaw);
  if (cycleRaw === "" || cycleRaw === null || Number.isNaN(cycle)) {
    errors.currentCycleUsed = "Enter the hours already used in the 70-hour cycle.";
  } else if (cycle < 0 || cycle > 70) {
    errors.currentCycleUsed = "Cycle hours must be between 0 and 70.";
  }

  return errors;
}

export default function TripForm({ onGenerate, isLoading }) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});

  const errors = validate(values);
  const hasErrors = Object.keys(errors).length > 0;

  function setField(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function markTouched(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setTouched({
      currentLocation: true,
      pickupLocation: true,
      dropoffLocation: true,
      currentCycleUsed: true,
    });
    if (hasErrors || isLoading) return;
    onGenerate(values);
  }

  return (
    <form onSubmit={handleSubmit} className="card p-sp-pad animate-fade-in-up" noValidate>
      <div className="mb-6">
        <h2 className="text-section text-ink">Plan a trip</h2>
        <p className="text-body text-muted mt-1">
          Enter the trip details below and RouteWise will confirm whether it can be completed legally.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div onBlur={() => markTouched("currentLocation")}>
          <LocationAutocomplete
            icon={<HiOutlineLocationMarker size={18} />}
            label="Current Location"
            placeholder="e.g. Dallas, TX"
            value={values.currentLocation}
            onChange={(v) => setField("currentLocation", v)}
            error={touched.currentLocation && errors.currentLocation}
          />
        </div>

        <div onBlur={() => markTouched("pickupLocation")}>
          <LocationAutocomplete
            icon={<HiOutlineTruck size={18} />}
            label="Pickup Location"
            placeholder="e.g. Oklahoma City, OK"
            value={values.pickupLocation}
            onChange={(v) => setField("pickupLocation", v)}
            error={touched.pickupLocation && errors.pickupLocation}
          />
        </div>

        <div onBlur={() => markTouched("dropoffLocation")}>
          <LocationAutocomplete
            icon={<HiOutlineFlag size={18} />}
            label="Dropoff Location"
            placeholder="e.g. Chicago, IL"
            value={values.dropoffLocation}
            onChange={(v) => setField("dropoffLocation", v)}
            error={touched.dropoffLocation && errors.dropoffLocation}
          />
        </div>

        <div onBlur={() => markTouched("currentCycleUsed")}>
          <NumberField
            icon={<HiOutlineClock size={18} />}
            label="Current Cycle Used (Hours)"
            placeholder="e.g. 12"
            value={values.currentCycleUsed}
            onChange={(v) => setField("currentCycleUsed", v)}
            error={touched.currentCycleUsed && errors.currentCycleUsed}
            min="0"
            max="70"
            step="0.5"
          />
        </div>
      </div>

      <button type="submit" disabled={isLoading} className="btn-primary w-full mt-7 flex items-center justify-center gap-2">
        {isLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Calculating compliant route&hellip;
          </>
        ) : (
          "Generate Plan"
        )}
      </button>
    </form>
  );
}
