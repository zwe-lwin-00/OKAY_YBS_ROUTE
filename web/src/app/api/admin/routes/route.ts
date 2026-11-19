import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getRouteSummaries } from "@/lib/data";

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const routes = await getRouteSummaries();
  return NextResponse.json({ routes });
}
