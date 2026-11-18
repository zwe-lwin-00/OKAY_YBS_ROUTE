import { NextResponse } from "next/server";
import { getRoutesServingStop } from "@/lib/transit-index";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    const result = await getRoutesServingStop(id);
    if (!result) {
      return NextResponse.json({ error: "Stop not found" }, { status: 404 });
    }
    return NextResponse.json({
      stop: result.stop,
      route_count: result.routes.length,
      routes: result.routes,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load routes for stop", detail: String(error) },
      { status: 500 },
    );
  }
}
