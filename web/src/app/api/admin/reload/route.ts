import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { clearDataCaches } from "@/lib/data";
import { resetTransitIndex } from "@/lib/transit-index";

export async function POST(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  clearDataCaches();
  resetTransitIndex();
  return NextResponse.json({ ok: true });
}
