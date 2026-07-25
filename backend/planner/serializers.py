from rest_framework import serializers


class PlanTripRequestSerializer(serializers.Serializer):
    current_location = serializers.CharField(max_length=255, trim_whitespace=True)
    pickup_location = serializers.CharField(max_length=255, trim_whitespace=True)
    dropoff_location = serializers.CharField(max_length=255, trim_whitespace=True)
    current_cycle_used = serializers.FloatField(min_value=0, max_value=70)

    def validate_current_location(self, value):
        if not value.strip():
            raise serializers.ValidationError("Current location is required.")
        return value

    def validate_pickup_location(self, value):
        if not value.strip():
            raise serializers.ValidationError("Pickup location is required.")
        return value

    def validate_dropoff_location(self, value):
        if not value.strip():
            raise serializers.ValidationError("Dropoff location is required.")
        return value
