import { NextResponse } from "next/server";
import { getRouteSummaries } from "@/lib/data";

export async function GET() {
  try {
    const routes = await getRouteSummaries();
    return NextResponse.json({ route_count: routes.length, routes });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load catalog", detail: String(error) },
      { status: 500 },
    );
  }
}
