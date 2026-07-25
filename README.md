# RouteWise

RouteWise is a Trip Decision Dashboard for commercial truck drivers and fleet
managers. Given a current location, pickup, dropoff, and hours already used
in the driver's 70-hour/8-day cycle, it answers one question before the
truck leaves the yard:

> **Can this trip be completed legally and safely, in full compliance with
> FMCSA Hours-of-Service regulations?**

It calculates the full route, driving time, mandatory 30-minute breaks,
10-hour overnight resets, fuel stops every 1,000 miles, and generates one
FMCSA-style ELD daily log sheet per day of the trip — all before you're on
the road.

The app is organized into three sections that mirror how a dispatcher
actually works:

1. **Plan** — enter trip details and generate the plan
2. **Review** — compliance summary, timeline, route map, statistics
3. **Logs** — the generated ELD daily log sheets, exportable as PNG/PDF

---

## Tech stack

**Frontend:** React + Vite, Tailwind CSS, React Leaflet, React Icons, Axios
**Backend:** Django + Django REST Framework
**Routing/Geocoding:** OpenRouteService (if an API key is configured), with
an automatic fallback to the free OpenStreetMap Nominatim + OSRM APIs so the
app works out of the box with **no API key required**.
**Database:** SQLite (stores a lightweight history of generated trip plans)

---

## Project structure

```
RouteWise/
├── backend/                     Django REST API
│   ├── routewise_backend/       Project settings, root URLconf
│   └── planner/                 The trip-planning app
│       ├── services/
│       │   ├── geocoding.py     Address → lat/lon (ORS or Nominatim)
│       │   ├── routing.py       Route, distance, duration (ORS or OSRM)
│       │   ├── hos_calculator.py  FMCSA HOS compliance simulation engine
│       │   ├── eld_generator.py   Builds 24-hour ELD log sheets
│       │   └── exceptions.py
│       ├── models.py            Trip (history of generated plans)
│       ├── serializers.py       Request validation
│       ├── views.py             POST /api/plan-trip/
│       └── urls.py
│
└── frontend/                    React + Vite SPA
    └── src/
        ├── api/client.js        Axios client + error normalization
        ├── components/          Navbar, TripForm, DecisionSummary,
        │                        Timeline, MapCard, StatisticsCards,
        │                        DailyLogs, LogViewer, DownloadButton, ...
        └── pages/                PlanPage, ReviewPage, LogsPage
```

---

## Local setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # see "Environment variables" below

python manage.py migrate
python manage.py runserver      # http://127.0.0.1:8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env            # see "Environment variables" below
npm run dev                     # http://localhost:5173
```

Open `http://localhost:5173`, enter a current location, pickup, dropoff,
and current cycle hours used, and click **Generate Plan**.

---

## Environment variables

### `backend/.env`

| Variable               | Required | Description                                                                                          |
| ----------------------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `SECRET_KEY`            | Yes      | Django secret key. Generate a random one for production.                                              |
| `DEBUG`                 | Yes      | `True` locally, `False` in production.                                                                 |
| `ALLOWED_HOSTS`         | Yes      | Comma-separated hostnames the API is allowed to serve.                                                 |
| `CORS_ALLOWED_ORIGINS`  | Yes      | Comma-separated origins allowed to call the API (your frontend URL).                                   |
| `ORS_API_KEY`           | No       | Free key from [openrouteservice.org](https://openrouteservice.org/dev/#/signup). If blank, RouteWise automatically uses the free OSRM + Nominatim APIs instead — no key needed to run the project. |

### `frontend/.env`

| Variable              | Required | Description                                    |
| ---------------------- | -------- | ----------------------------------------------- |
| `VITE_API_BASE_URL`    | Yes      | Base URL of the Django API, e.g. `http://127.0.0.1:8000/api` in dev, or your Render URL + `/api` in production. |

---

## API

### `GET /api/geocode-suggestions/?q=<partial address>`

Powers the Google-Maps-style "as you type" autocomplete on the Current /
Pickup / Dropoff Location fields (min 3 characters, 350ms debounce on the
frontend). Returns up to 6 candidates:

```json
{ "results": [{ "label": "Dallas, TX, USA", "lat": 32.78, "lon": -96.8 }] }
```

Uses the same OpenRouteService/Nominatim fallback as the main geocoder, and
caches results in-process to minimize outbound requests per the
Performance requirements.

### `POST /api/plan-trip/`

**Request body**

```json
{
  "current_location": "Dallas, TX",
  "pickup_location": "Oklahoma City, OK",
  "dropoff_location": "Chicago, IL",
  "current_cycle_used": 12
}
```

**Response** (abridged)

```json
{
  "locations": { "current": {...}, "pickup": {...}, "dropoff": {...} },
  "map": {
    "geometry_leg1": [[lat, lon], ...],
    "geometry_leg2": [[lat, lon], ...],
    "fuel_stops": [{ "label": "...", "mile_marker": 1000, "lat": ..., "lon": ... }],
    "rest_stops": [{ "label": "...", "mile_marker": ..., "lat": ..., "lon": ... }]
  },
  "summary": {
    "distance_miles": 1700,
    "driving_duration_hours": 30.0,
    "trip_days": 3,
    "remaining_cycle_hours": 27.5,
    "mandatory_breaks": 2,
    "fuel_stops": 1,
    "compliance_status": "Compliant",
    "risk_level": "Low",
    "eta": "2026-07-25T11:30:00"
  },
  "timeline": [{ "type": "driving", "label": "...", "start": "...", "end": "...", "mile_marker": ... }],
  "daily_logs": [{ "date": "2026-07-23", "segments": [...], "totals": {...}, "mileage": ..., "remarks": [...] }]
}
```

Errors return `400` (invalid input), `502` (geocoding/routing failed — bad
address or no drivable route), or `500` (unexpected server error), each with
a `message` field the frontend renders as an error card.

---

## HOS compliance assumptions

As specified for this assessment:

- Property-carrying driver, **70 hours / 8 days** cycle
- **11-hour** driving limit per duty day
- **14-hour** duty window per duty day
- **30-minute break** required after 8 cumulative hours of driving
- **10-hour** off-duty reset between duty days
- **Fuel stop** every 1,000 miles
- **Pickup** and **dropoff** each take 1 hour (on-duty, not driving)
- No adverse weather conditions

The simulation in `backend/planner/services/hos_calculator.py` walks the
trip minute-by-minute in logical chunks, inserting breaks/resets/fuel stops
the moment a limit would otherwise be exceeded, and flags the trip
**Non-Compliant** if the 70-hour cycle would be exhausted before dropoff.

---

## Deployment

### Backend → Render

1. Push this repo to GitHub.
2. Create a new **Web Service** on [Render](https://render.com), pointing at `backend/`.
3. Build command: `pip install -r requirements.txt && python manage.py migrate`
4. Start command: `gunicorn routewise_backend.wsgi`
5. Add the environment variables listed above (set `DEBUG=False`, `ALLOWED_HOSTS` to your Render hostname, `CORS_ALLOWED_ORIGINS` to your Vercel URL).

### Frontend → Vercel

1. Import the repo into [Vercel](https://vercel.com), set the root directory to `frontend/`.
2. Framework preset: Vite.
3. Add `VITE_API_BASE_URL` pointing to your Render backend, e.g. `https://routewise-backend.onrender.com/api`.

---

## Design system

Colors, type scale, spacing, and radii follow a fixed token system (see
`frontend/tailwind.config.js`): background `#F7F7F5`, cards `#FFFFFF`,
primary accent `#3C8D89`, secondary accent `#5E8BFF`, Plus Jakarta Sans
typography, 8-point spacing, 28px card radius. The interface is intentionally
quiet — the map is a supporting element, not the hero; the **Decision
Summary** is.

---

## Known limitations / next steps

- Fuel and rest stop map markers are interpolated along the route polyline
  proportionally to mileage (not a true routing-engine "point at mile X"
  query), which is a close visual approximation but not geodesically exact.
- The 70-hour/8-day cycle is tracked as a simple running total rather than a
  full rolling 8-day recompute; a production system would persist each
  driver's day-by-day log history to compute the true rolling window.
- No authentication/multi-driver accounts — out of scope for this
  assessment but a natural next step alongside the `Trip` history model
  already in place.
