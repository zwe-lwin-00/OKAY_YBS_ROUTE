import { NextResponse } from "next/server";
import { planTrips, resetTransitIndex } from "@/lib/transit-index";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const maxTransfers = Number(searchParams.get("maxTransfers") ?? 2);
  const limit = Number(searchParams.get("limit") ?? 8);
  if (searchParams.get("refresh") === "1") resetTransitIndex();

  if (!from || !to) {
    return NextResponse.json(
      { error: "from and to place ids are required" },
      { status: 400 },
    );
  }

  const transfers = ([0, 1, 2].includes(maxTransfers) ? maxTransfers : 2) as
    | 0
    | 1
    | 2;

  try {
    const result = await planTrips(
      from,
      to,
      transfers,
      Number.isFinite(limit) ? limit : 8,
    );
    if (!result) {
      return NextResponse.json({ error: "Unknown from/to stop" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Trip planning failed", detail: String(error) },
      { status: 500 },
    );
  }
}
