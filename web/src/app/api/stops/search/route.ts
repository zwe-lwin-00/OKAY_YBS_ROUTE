import { NextResponse } from "next/server";
import { searchStopPlaces } from "@/lib/transit-index";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const limit = Number(searchParams.get("limit") ?? 12);

  try {
    const stops = await searchStopPlaces(q, Number.isFinite(limit) ? limit : 12);
    return NextResponse.json({ count: stops.length, stops });
  } catch (error) {
    return NextResponse.json(
      { error: "Stop search failed", detail: String(error) },
      { status: 500 },
    );
  }
}
