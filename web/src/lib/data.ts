import { promises as fs } from "fs";
import path from "path";
import type { Catalog, CatalogRoute, RouteData, RouteSummary } from "./types";
import { dataFileToSlug, slugToDataFile } from "./slug";

const DATA_ROOT = path.resolve(process.cwd(), "..");

let catalogCache: Catalog | null = null;
const routeCache = new Map<string, RouteData>();

function toSummary(route: CatalogRoute): RouteSummary {
  return {
    ...route,
    slug: dataFileToSlug(route.data_file),
    qrSupported: route.qr_payment.includes("Supported"),
  };
}

export async function getCatalog(): Promise<Catalog> {
  if (catalogCache) return catalogCache;
  const raw = await fs.readFile(
    path.join(DATA_ROOT, "api", "routes.json"),
    "utf8",
  );
  catalogCache = JSON.parse(raw) as Catalog;
  return catalogCache;
}

export async function getRouteSummaries(): Promise<RouteSummary[]> {
  const catalog = await getCatalog();
  return catalog.routes.map(toSummary);
}

export async function getRouteBySlug(
  slug: string,
): Promise<{ summary: RouteSummary; data: RouteData } | null> {
  const summaries = await getRouteSummaries();
  const summary = summaries.find((r) => r.slug === slug);
  if (!summary) return null;

  const cached = routeCache.get(slug);
  if (cached) return { summary, data: cached };

  const filePath = path.join(DATA_ROOT, slugToDataFile(slug));
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const data = JSON.parse(raw) as RouteData;
    routeCache.set(slug, data);
    return { summary, data };
  } catch {
    return null;
  }
}

export async function searchRoutes(query: string): Promise<RouteSummary[]> {
  const q = query.trim().toLowerCase();
  const routes = await getRouteSummaries();
  if (!q) return routes;

  return routes.filter((r) => {
    const hay = [r.bus_line, r.route_name, r.line_name, r.agency, r.slug]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function clearDataCaches() {
  catalogCache = null;
  routeCache.clear();
}

export function getDataRoot() {
  return DATA_ROOT;
}

export async function writeRouteData(
  slug: string,
  data: RouteData,
): Promise<void> {
  const filePath = path.join(DATA_ROOT, slugToDataFile(slug));
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  routeCache.delete(slug);
}
