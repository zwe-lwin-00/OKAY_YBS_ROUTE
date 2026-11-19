import type { TripPlan } from "./types";
import { estimatePlan } from "./trip-estimate";

/**
 * Static ETA helpers — NOT live GPS / vehicle tracking.
 * Ready to swap in a live feed later via LiveEtaProvider.
 */

export type EtaSnapshot = {
  source: "static_estimate" | "live";
  depart_at: string;
  arrive_at: string;
  estimated_minutes: number;
  confidence: "low" | "medium";
  note: string;
};

export function formatClock(date: Date, locale = "en-US"): string {
  return date.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function etaFromMinutes(
  minutes: number,
  now = new Date(),
): EtaSnapshot {
  const m = Math.max(1, Math.round(minutes));
  const arrive = new Date(now.getTime() + m * 60_000);
  return {
    source: "static_estimate",
    depart_at: now.toISOString(),
    arrive_at: arrive.toISOString(),
    estimated_minutes: m,
    confidence: "low",
    note: "Static schedule-free estimate from distance — not live bus tracking",
  };
}

export function etaForPlan(plan: TripPlan, now = new Date()): EtaSnapshot {
  const minutes =
    plan.estimated_minutes ?? estimatePlan(plan).estimated_minutes;
  return etaFromMinutes(minutes, now);
}

/** Future hook: replace body when a live AVL/GTFS-RT feed exists. */
export type LiveEtaProvider = {
  getVehicleEtas?: (stopId: string) => Promise<EtaSnapshot[] | null>;
};

export const liveEtaProvider: LiveEtaProvider = {};
