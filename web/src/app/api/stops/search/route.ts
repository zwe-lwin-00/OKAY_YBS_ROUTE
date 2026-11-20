import { NextResponse } from "next/server";
import { clampSearchLimit, rateLimit } from "@/lib/api-limits";
import { searchStopPlaces } from "@/lib/transit-index";

export async function GET(request: Request) {
  const limited = rateLimit(request, { key: "stops-search", limit: 90 });
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const limit = clampSearchLimit(Number(searchParams.get("limit") ?? 12));

  try {
    const stops = await searchStopPlaces(q, limit);
    return NextResponse.json({ count: stops.length, stops, meta: { limit } });
  } catch (error) {
    return NextResponse.json(
      { error: "Stop search failed", detail: String(error) },
      { status: 500 },
    );
  }
}
