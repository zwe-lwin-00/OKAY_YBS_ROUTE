import { NextResponse } from "next/server";
import { getPlaceById } from "@/lib/transit-index";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    const stop = await getPlaceById(id);
    if (!stop) {
      return NextResponse.json({ error: "Stop not found" }, { status: 404 });
    }
    return NextResponse.json({ stop });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load stop", detail: String(error) },
      { status: 500 },
    );
  }
}
