"use client";

import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import type { Stop } from "@/lib/types";

const stopIcon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:12px;height:12px;border-radius:999px;background:#0b6b52;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25)"></span>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const endIcon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:16px;height:16px;border-radius:999px;background:#f0a202;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3)"></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export function RouteMapInner({ stops }: { stops: Stop[] }) {
  const positions = stops.map(
    (s) => [s.latitude, s.longitude] as [number, number],
  );
  const mid = positions[Math.floor(positions.length / 2)] ?? positions[0];

  return (
    <MapContainer
      center={mid}
      zoom={12}
      scrollWheelZoom={false}
      className="h-full w-full"
      style={{ minHeight: 280 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline positions={positions} pathOptions={{ color: "#0b6b52", weight: 4, opacity: 0.85 }} />
      {stops.map((stop, i) => {
        const isEnd = i === 0 || i === stops.length - 1;
        return (
          <Marker
            key={`${stop.index}-${stop.latitude}-${stop.longitude}`}
            position={[stop.latitude, stop.longitude]}
            icon={isEnd ? endIcon : stopIcon}
          >
            <Popup>
              <strong>
                #{stop.index} {stop.stop_name_en}
              </strong>
              <br />
              <span className="mm">{stop.stop_name_mm}</span>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
