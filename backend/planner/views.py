from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Trip
from .serializers import PlanTripRequestSerializer
from .services import eld_generator, geocoding, hos_calculator, routing
from .services.exceptions import RouteWiseError


class PlanTripView(APIView):
    """
    POST /api/plan-trip/

    Body:
        current_location: str
        pickup_location: str
        dropoff_location: str
        current_cycle_used: float (hours already used in the 70hr/8day cycle)

    Returns a structured JSON payload with the decision summary, route
    map coordinates, chronological timeline, trip statistics, and one
    ELD daily log sheet per day of the trip.
    """

    def post(self, request):
        serializer = PlanTripRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": "invalid_input", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data

        try:
            current_lat, current_lon, current_label = geocoding.geocode(data["current_location"])
            pickup_lat, pickup_lon, pickup_label = geocoding.geocode(data["pickup_location"])
            dropoff_lat, dropoff_lon, dropoff_label = geocoding.geocode(data["dropoff_location"])

            leg1 = routing.get_route((current_lat, current_lon), (pickup_lat, pickup_lon))
            leg2 = routing.get_route((pickup_lat, pickup_lon), (dropoff_lat, dropoff_lon))
        except RouteWiseError as exc:
            return Response({"error": "routing_failed", "message": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception as exc:  # pragma: no cover - defensive catch-all
            return Response(
                {"error": "unexpected_error", "message": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        schedule = hos_calculator.build_schedule(
            leg1_miles=leg1["distance_miles"],
            leg1_hours=leg1["duration_hours"],
            leg2_miles=leg2["distance_miles"],
            leg2_hours=leg2["duration_hours"],
            current_cycle_used=data["current_cycle_used"],
            current_label=current_label.split(",")[0],
            pickup_label=pickup_label.split(",")[0],
            dropoff_label=dropoff_label.split(",")[0],
        )

        daily_logs = eld_generator.generate_daily_logs(schedule["segments"], schedule["trip_dates"])

        summary = schedule["summary"]

        response_payload = {
            "locations": {
                "current": {"label": current_label, "lat": current_lat, "lon": current_lon},
                "pickup": {"label": pickup_label, "lat": pickup_lat, "lon": pickup_lon},
                "dropoff": {"label": dropoff_label, "lat": dropoff_lat, "lon": dropoff_lon},
            },
            "map": {
                "geometry_leg1": leg1["geometry"],
                "geometry_leg2": leg2["geometry"],
                "fuel_stops": _stop_markers(
                    schedule["timeline"], ("fuel_stop",), leg1["geometry"], leg2["geometry"], summary["distance_miles"]
                ),
                "rest_stops": _stop_markers(
                    schedule["timeline"],
                    ("overnight_rest", "mandatory_break"),
                    leg1["geometry"],
                    leg2["geometry"],
                    summary["distance_miles"],
                ),
            },
            "summary": {
                "distance_miles": summary["distance_miles"],
                "driving_duration_hours": summary["driving_duration_hours"],
                "total_duration_hours": summary["total_duration_hours"],
                "trip_days": summary["trip_days"],
                "remaining_cycle_hours": summary["remaining_cycle_hours"],
                "mandatory_breaks": summary["mandatory_breaks"],
                "fuel_stops": summary["fuel_stops"],
                "overnight_resets": summary["overnight_resets"],
                "compliance_status": summary["compliance_status"],
                "risk_level": summary["risk_level"],
                "eta": summary["eta"].isoformat(),
                "on_duty_hours": summary["on_duty_hours"],
                "off_duty_hours": summary["off_duty_hours"],
                "average_speed_mph": summary["average_speed_mph"],
            },
            "timeline": [event.to_dict() for event in schedule["timeline"]],
            "daily_logs": daily_logs,
        }

        try:
            Trip.objects.create(
                current_location=data["current_location"],
                pickup_location=data["pickup_location"],
                dropoff_location=data["dropoff_location"],
                current_cycle_used=data["current_cycle_used"],
                distance_miles=summary["distance_miles"],
                duration_hours=summary["driving_duration_hours"],
                trip_days=summary["trip_days"],
                compliance_status=summary["compliance_status"],
                result_json=response_payload,
            )
        except Exception:
            # Persistence is a bonus, not a requirement for the response to succeed.
            pass

        return Response(response_payload, status=status.HTTP_200_OK)


class LocationSuggestionsView(APIView):
    """
    GET /api/geocode-suggestions/?q=<partial address>

    Powers "as you type" address autocomplete in the Current/Pickup/Dropoff
    Location fields, similar to Google Maps. Returns up to 6 candidate
    addresses with coordinates so a selection needs no further geocoding.
    """

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if len(query) < 2:
            return Response({"results": []})
        try:
            results = geocoding.suggest(query, limit=6)
        except Exception:
            results = []
        return Response({"results": results})


def _stop_markers(timeline, event_types, geometry_leg1, geometry_leg2, total_distance_miles):
    combined = list(geometry_leg1) + list(geometry_leg2)
    markers = []
    for e in timeline:
        if e.type not in event_types:
            continue
        point = _interpolate_point(combined, e.mile_marker, total_distance_miles)
        markers.append(
            {
                "label": e.label,
                "mile_marker": round(e.mile_marker, 1),
                "time": e.start.isoformat(),
                "lat": point[0],
                "lon": point[1],
            }
        )
    return markers


def _interpolate_point(points, mile_marker, total_distance_miles):
    """Approximate a lat/lon along the combined route polyline for a given
    mile marker, by assuming points are roughly evenly spaced by distance."""
    if not points or total_distance_miles <= 0:
        return [0, 0]
    fraction = max(0.0, min(1.0, mile_marker / total_distance_miles))
    index = round(fraction * (len(points) - 1))
    index = max(0, min(len(points) - 1, index))
    return points[index]
