import React, { useMemo } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from "react-leaflet";

function FitBounds({ positions }) {
  const map = useMap();
  React.useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(positions, { padding: [28, 28] });
    }
  }, [positions, map]);
  return null;
}

const MARKER_STYLES = {
  current: { color: "#5E8BFF", radius: 8 },
  pickup: { color: "#3C8D89", radius: 8 },
  dropoff: { color: "#43B581", radius: 8 },
  fuel: { color: "#F2A93B", radius: 6 },
  rest: { color: "#6B7280", radius: 6 },
};

export default function MapCard({ locations, mapData }) {
  const routeLeg1 = mapData.geometry_leg1 || [];
  const routeLeg2 = mapData.geometry_leg2 || [];
  const allPositions = useMemo(() => [...routeLeg1, ...routeLeg2], [routeLeg1, routeLeg2]);

  const center = allPositions[0] || [39.5, -98.35];

  return (
    <div className="card p-sp-pad">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-ink">Route map</h3>
        <span className="text-caption text-muted">Visual confirmation only</span>
      </div>
      <div className="h-[320px] rounded-card overflow-hidden border border-border">
        <MapContainer center={center} zoom={6} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds positions={allPositions} />

          {routeLeg1.length > 0 && <Polyline positions={routeLeg1} pathOptions={{ color: "#3C8D89", weight: 4, opacity: 0.85 }} />}
          {routeLeg2.length > 0 && <Polyline positions={routeLeg2} pathOptions={{ color: "#5E8BFF", weight: 4, opacity: 0.85 }} />}

          <LocationMarker point={locations.current} type="current" name="Current Location" />
          <LocationMarker point={locations.pickup} type="pickup" name="Pickup" />
          <LocationMarker point={locations.dropoff} type="dropoff" name="Dropoff" />

          {(mapData.fuel_stops || []).map((stop, i) => (
            <CircleMarker
              key={`fuel-${i}`}
              center={[stop.lat, stop.lon]}
              radius={MARKER_STYLES.fuel.radius}
              pathOptions={{ color: "#fff", weight: 2, fillColor: MARKER_STYLES.fuel.color, fillOpacity: 1 }}
            >
              <Popup>
                <strong>{stop.label}</strong>
                <br />
                Mile {Math.round(stop.mile_marker).toLocaleString()}
              </Popup>
            </CircleMarker>
          ))}

          {(mapData.rest_stops || []).map((stop, i) => (
            <CircleMarker
              key={`rest-${i}`}
              center={[stop.lat, stop.lon]}
              radius={MARKER_STYLES.rest.radius}
              pathOptions={{ color: "#fff", weight: 2, fillColor: MARKER_STYLES.rest.color, fillOpacity: 1 }}
            >
              <Popup>
                <strong>{stop.label}</strong>
                <br />
                Mile {Math.round(stop.mile_marker).toLocaleString()}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <Legend />
    </div>
  );
}

function LocationMarker({ point, type, name }) {
  if (!point) return null;
  const style = MARKER_STYLES[type];
  return (
    <CircleMarker
      center={[point.lat, point.lon]}
      radius={style.radius}
      pathOptions={{ color: "#fff", weight: 2, fillColor: style.color, fillOpacity: 1 }}
    >
      <Popup>
        <strong>{name}</strong>
        <br />
        {point.label}
      </Popup>
    </CircleMarker>
  );
}

function Legend() {
  const items = [
    { label: "Current", color: "#5E8BFF" },
    { label: "Pickup", color: "#3C8D89" },
    { label: "Dropoff", color: "#43B581" },
    { label: "Fuel Stop", color: "#F2A93B" },
    { label: "Rest Stop", color: "#6B7280" },
  ];
  return (
    <div className="flex flex-wrap gap-4 mt-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-caption text-muted">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
