"use client";

import { useEffect, useMemo, useState } from "react";
import type { TripPlan } from "@/lib/types";
import { collectTripPath } from "@/lib/trip-estimate";

type TripMapProps = {
  plan: TripPlan;
  className?: string;
};

export function TripMap({ plan, className = "" }: TripMapProps) {
  const [MapView, setMapView] = useState<React.ComponentType<{
    ridePaths: ReturnType<typeof collectTripPath>["ridePaths"];
    transfers: ReturnType<typeof collectTripPath>["transfers"];
    walks: ReturnType<typeof collectTripPath>["walks"];
  }> | null>(null);

  const geometry = useMemo(() => collectTripPath(plan.legs), [plan.legs]);

  useEffect(() => {
    let cancelled = false;
    void import("./TripMapInner").then((mod) => {
      if (!cancelled) setMapView(() => mod.TripMapInner);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!geometry.ridePaths.length && !geometry.walks.length) {
    return (
      <div
        className={`grid place-items-center rounded-2xl border border-line bg-white/60 text-sm text-ink-soft ${className}`}
      >
        No map geometry for this trip
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
      <MapView
        ridePaths={geometry.ridePaths}
        transfers={geometry.transfers}
        walks={geometry.walks}
      />
    </div>
  );
}
