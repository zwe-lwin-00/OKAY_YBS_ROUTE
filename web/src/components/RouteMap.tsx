"use client";

import { useEffect, useMemo, useState } from "react";
import type { Stop } from "@/lib/types";

type RouteMapProps = {
  stops: Stop[];
  className?: string;
};

export function RouteMap({ stops, className = "" }: RouteMapProps) {
  const [MapView, setMapView] = useState<React.ComponentType<{
    stops: Stop[];
  }> | null>(null);

  const points = useMemo(
    () =>
      stops.filter(
        (s) =>
          Number.isFinite(s.latitude) &&
          Number.isFinite(s.longitude) &&
          !(s.latitude === 0 && s.longitude === 0),
      ),
    [stops],
  );

  useEffect(() => {
    let cancelled = false;
    void import("./RouteMapInner").then((mod) => {
      if (!cancelled) setMapView(() => mod.RouteMapInner);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!points.length) {
    return (
      <div
        className={`grid place-items-center rounded-2xl border border-line bg-white/60 text-sm text-ink-soft ${className}`}
      >
        No coordinates for this route
      </div>
    );
  }

  if (!MapView) {
    return (
      <div
        className={`grid place-items-center rounded-2xl border border-line bg-white/60 text-sm text-ink-soft ${className}`}
      >
        Loading map…
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-2xl border border-line ${className}`}>
      <MapView stops={points} />
    </div>
  );
}
