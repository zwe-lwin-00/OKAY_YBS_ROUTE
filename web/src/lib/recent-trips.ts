import type { RecentTrip, StopPlace } from "./types";

const STORAGE_KEY = "ybs-finder-recent-trips-v1";
const MAX_ITEMS = 8;

export function loadRecentTrips(): RecentTrip[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentTrip[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t) => t?.from?.id && t?.to?.id).slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

export function saveRecentTrip(from: StopPlace, to: StopPlace): RecentTrip[] {
  if (typeof window === "undefined") return [];
  const next: RecentTrip = { from, to, savedAt: Date.now() };
  const existing = loadRecentTrips().filter(
    (t) => !(t.from.id === from.id && t.to.id === to.id),
  );
  const list = [next, ...existing].slice(0, MAX_ITEMS);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return list;
}
