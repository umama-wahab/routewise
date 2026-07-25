import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://routewise-production-7e3b.up.railway.app/api";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

/**
 * Calls POST /api/plan-trip/ and returns the structured trip plan.
 * Throws a normalized { title, message } error object on failure so
 * UI components can render a consistent error card.
 */
export async function planTrip({ currentLocation, pickupLocation, dropoffLocation, currentCycleUsed }) {
  try {
    const { data } = await client.post("/plan-trip/", {
      current_location: currentLocation,
      pickup_location: pickupLocation,
      dropoff_location: dropoffLocation,
      current_cycle_used: Number(currentCycleUsed),
    });
    return data;
  } catch (err) {
    throw normalizeError(err);
  }
}

/**
 * Fetches address suggestions for a partial query, powering the
 * Google-Maps-style "as you type" autocomplete on the location fields.
 * Never throws — a failed/aborted lookup just resolves to an empty list
 * so a broken suggestion dropdown never blocks manual typing.
 */
export async function suggestLocations(query, signal) {
  const trimmed = (query || "").trim();
  if (trimmed.length < 3) return [];
  try {
    const { data } = await client.get("/geocode-suggestions/", {
      params: { q: trimmed },
      signal,
    });
    return data?.results || [];
  } catch (err) {
    return [];
  }
}

function normalizeError(err) {
  if (err.code === "ECONNABORTED") {
    return { title: "Request timed out", message: "The trip planning service took too long to respond. Please try again." };
  }
  if (!err.response) {
    return {
      title: "Network error",
      message: "Couldn't reach the RouteWise API. Check your connection or confirm the backend is running.",
    };
  }

  const { status, data } = err.response;

  if (status === 400) {
    const details = data?.details ? Object.values(data.details).flat().join(" ") : null;
    return { title: "Check your trip details", message: details || "One or more fields are invalid." };
  }
  if (status === 502) {
    return {
      title: "Location or route not found",
      message: data?.message || "We couldn't geocode an address or find a drivable route between your stops.",
    };
  }
  return { title: "Something went wrong", message: data?.message || "The server ran into an unexpected error." };
}

export default client;
