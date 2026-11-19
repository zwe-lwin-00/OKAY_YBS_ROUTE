import { NextResponse } from "next/server";
import { getRouteBySlug, getRouteSummaries } from "@/lib/data";
import { haversineMeters } from "@/lib/geo";
import type { NearbyStop } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = Number(searchParams.get("radius") ?? 1200);
  const limit = Number(searchParams.get("limit") ?? 40);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "lat and lng query params are required numbers" },
      { status: 400 },
    );
  }

  try {
    const routes = await getRouteSummaries();
    const found: NearbyStop[] = [];

    // Sequential batches keep memory/IO reasonable on mid phones' servers.
    const batchSize = 20;
    for (let i = 0; i < routes.length; i += batchSize) {
      const batch = routes.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (route) => {
          const result = await getRouteBySlug(route.slug);
          if (!result) return;
          for (const stop of result.data.stops) {
            const distanceMeters = haversineMeters(
              lat,
              lng,
              stop.latitude,
              stop.longitude,
            );
            if (distanceMeters <= radius) {
              found.push({
                ...stop,
                bus_line: route.bus_line,
                line_name: route.line_name,
                slug: route.slug,
                distanceMeters,
              });
            }
          }
        }),
      );
    }

    found.sort((a, b) => a.distanceMeters - b.distanceMeters);

    const deduped: NearbyStop[] = [];
    const seen = new Set<string>();
    for (const item of found) {
      const key = `${item.stop_name_en}|${item.latitude.toFixed(5)}|${item.longitude.toFixed(5)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
      if (deduped.length >= limit) break;
    }

    return NextResponse.json({
      lat,
      lng,
      radius,
      count: deduped.length,
      stops: deduped,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Nearby search failed", detail: String(error) },
      { status: 500 },
    );
  }
}
