"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";

const COLORS = ["#0b6b52", "#c47a00", "#1d4f91", "#8a2f5b"];

const transferIcon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:16px;height:16px;border-radius:999px;background:#f0a202;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)"></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const startIcon = L.divIcon({
  className: "",
  html: `<span style="display:grid;place-items:center;width:18px;height:18px;border-radius:999px;background:#0b6b52;color:#fff;font:700 10px/1 sans-serif;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)">A</span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const endIcon = L.divIcon({
  className: "",
  html: `<span style="display:grid;place-items:center;width:18px;height:18px;border-radius:999px;background:#10241a;color:#fff;font:700 10px/1 sans-serif;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)">B</span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

type Props = {
  ridePaths: {
    bus_line: string;
    direction: string;
    points: { latitude: number; longitude: number }[];
  }[];
  transfers: { latitude: number; longitude: number; label: string }[];
  walks: {
    from: { latitude: number; longitude: number };
    to: { latitude: number; longitude: number };
  }[];
};

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    map.fitBounds(L.latLngBounds(points), { padding: [28, 28] });
  }, [map, points]);
  return null;
}

export function TripMapInner({ ridePaths, transfers, walks }: Props) {
  const allPoints = useMemo(() => {
    const pts: [number, number][] = [];
    for (const ride of ridePaths) {
      for (const p of ride.points) pts.push([p.latitude, p.longitude]);
    }
    for (const w of walks) {
      pts.push(
        [w.from.latitude, w.from.longitude],
        [w.to.latitude, w.to.longitude],
      );
    }
    return pts;
  }, [ridePaths, walks]);

  const center = allPoints[Math.floor(allPoints.length / 2)] ?? [16.8, 96.15];
  const start = allPoints[0];
  const end = allPoints[allPoints.length - 1];

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom={false}
      className="h-full w-full"
      style={{ minHeight: 260 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={allPoints} />

      {ridePaths.map((ride, i) => (
        <Polyline
          key={`ride-${ride.bus_line}-${i}`}
          positions={ride.points.map(
            (p) => [p.latitude, p.longitude] as [number, number],
          )}
          pathOptions={{
            color: COLORS[i % COLORS.length],
            weight: 5,
            opacity: 0.9,
          }}
        >
          <Popup>
            Line {ride.bus_line} ({ride.direction})
          </Popup>
        </Polyline>
      ))}

      {walks.map((w, i) => (
        <Polyline
          key={`walk-${i}`}
          positions={[
            [w.from.latitude, w.from.longitude],
            [w.to.latitude, w.to.longitude],
          ]}
          pathOptions={{
            color: "#666",
            weight: 3,
            opacity: 0.85,
            dashArray: "6 8",
          }}
        />
      ))}

      {transfers.map((t, i) => (
        <Marker
          key={`xfer-${i}-${t.latitude}`}
          position={[t.latitude, t.longitude]}
          icon={transferIcon}
        >
          <Popup>{t.label}</Popup>
        </Marker>
      ))}

      {start ? (
        <Marker position={start} icon={startIcon}>
          <Popup>Start</Popup>
        </Marker>
      ) : null}
      {end ? (
        <Marker position={end} icon={endIcon}>
          <Popup>End</Popup>
        </Marker>
      ) : null}
    </MapContainer>
  );
}
