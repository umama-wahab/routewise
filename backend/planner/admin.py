from django.contrib import admin

from .models import Trip


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ("id", "pickup_location", "dropoff_location", "compliance_status", "trip_days", "created_at")
    list_filter = ("compliance_status",)
    search_fields = ("pickup_location", "dropoff_location", "current_location")
    readonly_fields = ("created_at",)
