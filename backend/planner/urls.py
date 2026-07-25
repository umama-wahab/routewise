from django.urls import path

from .views import LocationSuggestionsView, PlanTripView

urlpatterns = [
    path("plan-trip/", PlanTripView.as_view(), name="plan-trip"),
    path("geocode-suggestions/", LocationSuggestionsView.as_view(), name="geocode-suggestions"),
]
