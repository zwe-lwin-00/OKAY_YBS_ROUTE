import type { RouteSummary, Stop } from "./types";

export function filterRoutes(
  routes: RouteSummary[],
  query: string,
  opts?: { qrOnly?: boolean; agency?: string },
): RouteSummary[] {
  const q = query.trim().toLowerCase();
  return routes.filter((r) => {
    if (opts?.qrOnly && !r.qrSupported) return false;
    if (opts?.agency && r.agency !== opts.agency) return false;
    if (!q) return true;
    const hay = [r.bus_line, r.route_name, r.line_name, r.agency, r.slug]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function filterStops(stops: Stop[], query: string): Stop[] {
  const q = query.trim().toLowerCase();
  if (!q) return stops;
  return stops.filter((s) => {
    const hay = [s.stop_name_en, s.stop_name_mm, s.road, s.index]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function uniqueAgencies(routes: RouteSummary[]): string[] {
  return [...new Set(routes.map((r) => r.agency))].sort((a, b) =>
    a.localeCompare(b),
  );
}
