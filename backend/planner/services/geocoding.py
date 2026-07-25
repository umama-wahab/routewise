"""
Geocoding service.

If ORS_API_KEY is configured, uses OpenRouteService's Pelias geocoder
(per the assessment's required tech stack). Otherwise falls back to the
free OpenStreetMap Nominatim API so the app works with zero setup.

Results are cached in-process for the lifetime of the worker to minimize
outbound API calls, per the "cache geocoding responses" requirement.
"""
from __future__ import annotations

import requests
from django.conf import settings

from .exceptions import LocationNotFoundError, UpstreamServiceError

_CACHE: dict[str, tuple[float, float, str]] = {}
_SUGGEST_CACHE: dict[str, list[dict]] = {}

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
ORS_GEOCODE_URL = "https://api.openrouteservice.org/geocode/search"
ORS_AUTOCOMPLETE_URL = "https://api.openrouteservice.org/geocode/autocomplete"

HEADERS = {"User-Agent": "RouteWise/1.0 (FMCSA HOS trip planning assistant)"}


def suggest(query: str, limit: int = 6) -> list[dict]:
    """Typeahead suggestions for a partial address, e.g. while the user is
    still typing. Returns [{"label": str, "lat": float, "lon": float}, ...].
    Failures are swallowed and return an empty list rather than raising,
    since a broken autocomplete dropdown should never block manual entry.
    """
    query = (query or "").strip()
    if len(query) < 2:
        return []

    cache_key = f"{limit}:{query.lower()}"
    if cache_key in _SUGGEST_CACHE:
        return _SUGGEST_CACHE[cache_key]

    try:
        if settings.ORS_API_KEY:
            results = _suggest_ors(query, limit)
        else:
            results = _suggest_nominatim(query, limit)
    except requests.RequestException:
        results = []

    _SUGGEST_CACHE[cache_key] = results
    return results


def _suggest_ors(query: str, limit: int) -> list[dict]:
    resp = requests.get(
        ORS_AUTOCOMPLETE_URL,
        params={"api_key": settings.ORS_API_KEY, "text": query, "size": limit},
        headers=HEADERS,
        timeout=6,
    )
    resp.raise_for_status()
    data = resp.json()
    results = []
    for feature in data.get("features", []):
        lon, lat = feature["geometry"]["coordinates"][:2]
        label = feature["properties"].get("label", query)
        results.append({"label": label, "lat": float(lat), "lon": float(lon)})
    return results


def _suggest_nominatim(query: str, limit: int) -> list[dict]:
    resp = requests.get(
        NOMINATIM_URL,
        params={"q": query, "format": "json", "limit": limit},
        headers=HEADERS,
        timeout=6,
    )
    resp.raise_for_status()
    data = resp.json()
    return [
        {"label": item.get("display_name", query), "lat": float(item["lat"]), "lon": float(item["lon"])}
        for item in data
    ]


def geocode(address: str) -> tuple[float, float, str]:
    """Return (latitude, longitude, display_name) for a free-text address."""
    key = address.strip().lower()
    if key in _CACHE:
        return _CACHE[key]

    if settings.ORS_API_KEY:
        result = _geocode_ors(address)
    else:
        result = _geocode_nominatim(address)

    _CACHE[key] = result
    return result


def _geocode_ors(address: str) -> tuple[float, float, str]:
    try:
        resp = requests.get(
            ORS_GEOCODE_URL,
            params={"api_key": settings.ORS_API_KEY, "text": address, "size": 1},
            headers=HEADERS,
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as exc:
        raise UpstreamServiceError(f"OpenRouteService geocoding is unavailable: {exc}") from exc

    features = data.get("features") or []
    if not features:
        raise LocationNotFoundError(f"Could not find a location matching '{address}'.")

    lon, lat = features[0]["geometry"]["coordinates"][:2]
    label = features[0]["properties"].get("label", address)
    return float(lat), float(lon), label


def _geocode_nominatim(address: str) -> tuple[float, float, str]:
    try:
        resp = requests.get(
            NOMINATIM_URL,
            params={"q": address, "format": "json", "limit": 1},
            headers=HEADERS,
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as exc:
        raise UpstreamServiceError(f"Geocoding service is unavailable: {exc}") from exc

    if not data:
        raise LocationNotFoundError(f"Could not find a location matching '{address}'.")

    result = data[0]
    return float(result["lat"]), float(result["lon"]), result.get("display_name", address)
