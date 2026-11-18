import { NextResponse } from "next/server";
import { getRouteBySlug } from "@/lib/data";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  try {
    const result = await getRouteBySlug(slug);
    if (!result) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }
    return NextResponse.json(result.data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load route", detail: String(error) },
      { status: 500 },
    );
  }
}
