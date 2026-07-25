from django.db import models


class Trip(models.Model):
    """A stored snapshot of a generated trip plan.

    RouteWise is primarily stateless (the plan is computed and returned
    directly to the client), but every successful /api/plan-trip/ call is
    persisted here so a fleet manager could later build history/reporting
    views on top of it without re-computing anything.
    """

    current_location = models.CharField(max_length=255)
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    current_cycle_used = models.FloatField()

    distance_miles = models.FloatField()
    duration_hours = models.FloatField()
    trip_days = models.PositiveIntegerField()
    compliance_status = models.CharField(max_length=32)

    result_json = models.JSONField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.pickup_location} \u2192 {self.dropoff_location} ({self.created_at:%Y-%m-%d %H:%M})"
