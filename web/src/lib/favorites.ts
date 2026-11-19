import type { RouteSummary, StopPlace } from "./types";

const ROUTES_KEY = "ybs-finder-fav-routes-v1";
const STOPS_KEY = "ybs-finder-fav-stops-v1";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadFavoriteRoutes(): RouteSummary[] {
  return readJson<RouteSummary[]>(ROUTES_KEY, []);
}

export function loadFavoriteStops(): StopPlace[] {
  return readJson<StopPlace[]>(STOPS_KEY, []);
}

export function isFavoriteRoute(slug: string): boolean {
  return loadFavoriteRoutes().some((r) => r.slug === slug);
}

export function isFavoriteStop(id: string): boolean {
  return loadFavoriteStops().some(
    (s) => s.id === id || s.short_id === id,
  );
}

export function toggleFavoriteRoute(route: RouteSummary): RouteSummary[] {
  const current = loadFavoriteRoutes();
  const exists = current.some((r) => r.slug === route.slug);
  const next = exists
    ? current.filter((r) => r.slug !== route.slug)
    : [route, ...current].slice(0, 40);
  writeJson(ROUTES_KEY, next);
  return next;
}

export function toggleFavoriteStop(stop: StopPlace): StopPlace[] {
  const current = loadFavoriteStops();
  const exists = current.some((s) => s.id === stop.id);
  const next = exists
    ? current.filter((s) => s.id !== stop.id)
    : [stop, ...current].slice(0, 40);
  writeJson(STOPS_KEY, next);
  return next;
}
