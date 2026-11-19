import { haversineMeters } from "./geo";
import type { TripLeg, TripPlan } from "./types";

/** Static planning estimates — not live ETA. */
export const BUS_SPEED_KMH = 16;
export const WALK_SPEED_KMH = 4.5;
export const DWELL_SECONDS_PER_STOP = 28;
export const TRANSFER_PENALTY_MINUTES = 3.5;

export type SortMode = "balanced" | "fewer_walks" | "fewer_hops";

export function formatDuration(minutes: number): string {
  const m = Math.max(1, Math.round(minutes));
  if (m < 60) return `~${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `~${h} h ${rem} min` : `~${h} h`;
}

function pathDistanceMeters(
  path: { latitude: number; longitude: number }[],
): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    total += haversineMeters(
      path[i - 1].latitude,
      path[i - 1].longitude,
      path[i].latitude,
      path[i].longitude,
    );
  }
  return total;
}

export function estimatePlan(plan: TripPlan): {
  estimated_minutes: number;
  ride_minutes: number;
  walk_minutes: number;
} {
  let rideMinutes = 0;
  let walkMinutes = 0;

  for (const leg of plan.legs) {
    if (leg.type === "walk") {
      walkMinutes += (leg.distance_meters / 1000 / WALK_SPEED_KMH) * 60;
      continue;
    }

    const path = leg.path?.length
      ? leg.path
      : [
          {
            latitude: leg.from_stop.latitude,
            longitude: leg.from_stop.longitude,
          },
          {
            latitude: leg.to_stop.latitude,
            longitude: leg.to_stop.longitude,
          },
        ];
    const distKm = pathDistanceMeters(path) / 1000;
    const moving = (distKm / BUS_SPEED_KMH) * 60;
    const dwell = (Math.max(0, leg.stop_count - 1) * DWELL_SECONDS_PER_STOP) / 60;
    rideMinutes += moving + dwell;
  }

  const transferPenalty = plan.transfers * TRANSFER_PENALTY_MINUTES;
  return {
    ride_minutes: rideMinutes,
    walk_minutes: walkMinutes,
    estimated_minutes: rideMinutes + walkMinutes + transferPenalty,
  };
}

export function enrichPlanEstimates(plan: TripPlan): TripPlan {
  const est = estimatePlan(plan);
  const minutes = Math.round(est.estimated_minutes);
  const arrive = new Date(Date.now() + minutes * 60_000);
  return {
    ...plan,
    estimated_minutes: minutes,
    ride_minutes: Math.round(est.ride_minutes),
    walk_minutes: Math.round(est.walk_minutes),
    estimated_arrive_at: arrive.toISOString(),
    eta_source: "static_estimate",
  };
}

export function clampWalkTransferMeters(meters: number): number {
  if (!Number.isFinite(meters)) return 130;
  return Math.min(300, Math.max(60, Math.round(meters)));
}

export function sortPlans(plans: TripPlan[], mode: SortMode): TripPlan[] {
  const copy = [...plans];
  copy.sort((a, b) => {
    if (mode === "fewer_walks") {
      return (
        a.total_walk_meters - b.total_walk_meters ||
        a.transfers - b.transfers ||
        a.total_ride_stops - b.total_ride_stops ||
        (a.estimated_minutes ?? a.score) - (b.estimated_minutes ?? b.score)
      );
    }
    if (mode === "fewer_hops") {
      return (
        a.total_ride_stops - b.total_ride_stops ||
        a.transfers - b.transfers ||
        a.total_walk_meters - b.total_walk_meters ||
        (a.estimated_minutes ?? a.score) - (b.estimated_minutes ?? b.score)
      );
    }
    // balanced: prefer time estimate, then transfers
    return (
      (a.estimated_minutes ?? a.score) - (b.estimated_minutes ?? b.score) ||
      a.transfers - b.transfers ||
      a.total_walk_meters - b.total_walk_meters
    );
  });
  return copy;
}

export function mapsWalkUrls(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): { google: string; apple: string } {
  const o = `${from.latitude},${from.longitude}`;
  const d = `${to.latitude},${to.longitude}`;
  return {
    google: `https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${d}&travelmode=walking`,
    apple: `https://maps.apple.com/?saddr=${o}&daddr=${d}&dirflg=w`,
  };
}

export function collectTripPath(legs: TripLeg[]): {
  ridePaths: {
    bus_line: string;
    direction: string;
    points: { latitude: number; longitude: number }[];
  }[];
  transfers: {
    latitude: number;
    longitude: number;
    label: string;
  }[];
  walks: {
    from: { latitude: number; longitude: number };
    to: { latitude: number; longitude: number };
  }[];
} {
  const ridePaths: {
    bus_line: string;
    direction: string;
    points: { latitude: number; longitude: number }[];
  }[] = [];
  const transfers: {
    latitude: number;
    longitude: number;
    label: string;
  }[] = [];
  const walks: {
    from: { latitude: number; longitude: number };
    to: { latitude: number; longitude: number };
  }[] = [];

  for (const leg of legs) {
    if (leg.type === "walk") {
      walks.push({
        from: {
          latitude: leg.from_stop.latitude,
          longitude: leg.from_stop.longitude,
        },
        to: {
          latitude: leg.to_stop.latitude,
          longitude: leg.to_stop.longitude,
        },
      });
      transfers.push({
        latitude: leg.to_stop.latitude,
        longitude: leg.to_stop.longitude,
        label:
          leg.reason === "cross_to_lane"
            ? "Cross to lane"
            : `Transfer · ${leg.to_stop.stop_name_en}`,
      });
      continue;
    }

    const points =
      leg.path && leg.path.length >= 2
        ? leg.path
        : [
            {
              latitude: leg.from_stop.latitude,
              longitude: leg.from_stop.longitude,
            },
            {
              latitude: leg.to_stop.latitude,
              longitude: leg.to_stop.longitude,
            },
          ];
    ridePaths.push({
      bus_line: leg.bus_line,
      direction: leg.direction,
      points,
    });
  }

  return { ridePaths, transfers, walks };
}
