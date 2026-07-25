class RouteWiseError(Exception):
    """Base class for all RouteWise domain errors."""


class LocationNotFoundError(RouteWiseError):
    """Raised when an address cannot be geocoded."""


class RouteNotFoundError(RouteWiseError):
    """Raised when no drivable route exists between two points."""


class UpstreamServiceError(RouteWiseError):
    """Raised when a third-party geocoding/routing API is unreachable or errors out."""


class InvalidCycleHoursError(RouteWiseError):
    """Raised when the supplied current cycle used hours are out of range."""
