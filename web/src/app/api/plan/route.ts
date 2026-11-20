import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { planTrips, resetTransitIndex } from "@/lib/transit-index";
import { clampWalkTransferMeters } from "@/lib/trip-estimate";

/** Hard cap — prevents planner CPU/memory DoS via huge limit=. */
export const PLAN_LIMIT_MAX = 20;
export const PLAN_LIMIT_DEFAULT = 8;

function clampPlanLimit(raw: number): number {
  if (!Number.isFinite(raw)) return PLAN_LIMIT_DEFAULT;
  return Math.min(PLAN_LIMIT_MAX, Math.max(1, Math.floor(raw)));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const maxTransfers = Number(searchParams.get("maxTransfers") ?? 2);
  const limit = clampPlanLimit(Number(searchParams.get("limit") ?? PLAN_LIMIT_DEFAULT));
  const walk = Number(searchParams.get("walk") ?? 130);

  // Index rebuild is admin-only (was public refresh=1 → cache stampede).
  if (searchParams.get("refresh") === "1") {
    const denied = requireAdmin(request);
    if (denied) return denied;
    resetTransitIndex();
  }

  if (!from || !to) {
    return NextResponse.json(
      { error: "from and to place ids are required" },
      { status: 400 },
    );
  }

  const transfers = ([0, 1, 2, 3].includes(maxTransfers)
    ? maxTransfers
    : 2) as 0 | 1 | 2 | 3;

  try {
    const result = await planTrips(from, to, {
      maxTransfers: transfers,
      limit,
      walkTransferMeters: clampWalkTransferMeters(walk),
    });
    if (!result) {
      return NextResponse.json({ error: "Unknown from/to stop" }, { status: 404 });
    }
    return NextResponse.json({
      ...result,
      meta: {
        maxTransfers: transfers,
        walkTransferMeters: clampWalkTransferMeters(walk),
        limit,
        limitMax: PLAN_LIMIT_MAX,
        eta: "static_estimate",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Trip planning failed", detail: String(error) },
      { status: 500 },
    );
  }
}
