"""
Routing service.

If ORS_API_KEY is configured, uses OpenRouteService Directions
(per the assessment's required tech stack). Otherwise falls back to the
free public OSRM demo server so the app is fully functional with zero
setup and no API key.

Both backends are normalized to the same return shape:
    {
        "distance_miles": float,
        "duration_hours": float,
        "geometry": [[lat, lon], ...],
    }
"""
from __future__ import annotations

import requests
from django.conf import settings

from .exceptions import RouteNotFoundError, UpstreamServiceError

ORS_DIRECTIONS_URL = "https://api.openrouteservice.org/v2/directions/driving-hgv/geojson"
OSRM_URL = "https://router.project-osrm.org/route/v1/driving/{coords}"

HEADERS = {"User-Agent": "RouteWise/1.0 (FMCSA HOS trip planning assistant)"}

METERS_PER_MILE = 1609.344


def get_route(origin: tuple[float, float], destination: tuple[float, float]) -> dict:
    """origin/destination are (lat, lon) tuples. Returns distance/duration/geometry."""
    if settings.ORS_API_KEY:
        return _route_ors(origin, destination)
    return _route_osrm(origin, destination)


def _route_ors(origin, destination) -> dict:
    lat1, lon1 = origin
    lat2, lon2 = destination
    try:
        resp = requests.post(
            ORS_DIRECTIONS_URL,
            json={"coordinates": [[lon1, lat1], [lon2, lat2]]},
            headers={**HEADERS, "Authorization": settings.ORS_API_KEY, "Content-Type": "application/json"},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as exc:
        raise UpstreamServiceError(f"OpenRouteService routing is unavailable: {exc}") from exc

    features = data.get("features") or []
    if not features:
        raise RouteNotFoundError("No drivable route was found between these two points.")

    feature = features[0]
    summary = feature["properties"]["summary"]
    coords = feature["geometry"]["coordinates"]
    geometry = [[c[1], c[0]] for c in coords]

    return {
        "distance_miles": summary["distance"] / METERS_PER_MILE,
        "duration_hours": summary["duration"] / 3600.0,
        "geometry": geometry,
    }


def _route_osrm(origin, destination) -> dict:
    lat1, lon1 = origin
    lat2, lon2 = destination
    coords = f"{lon1},{lat1};{lon2},{lat2}"
    url = OSRM_URL.format(coords=coords)

    try:
        resp = requests.get(
            url,
            params={"overview": "full", "geometries": "geojson"},
            headers=HEADERS,
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as exc:
        raise UpstreamServiceError(f"Routing service is unavailable: {exc}") from exc

    if data.get("code") != "Ok" or not data.get("routes"):
        raise RouteNotFoundError("No drivable route was found between these two points.")

    route = data["routes"][0]
    coords = route["geometry"]["coordinates"]
    geometry = [[c[1], c[0]] for c in coords]

    return {
        "distance_miles": route["distance"] / METERS_PER_MILE,
        "duration_hours": route["duration"] / 3600.0,
        "geometry": geometry,
    }
