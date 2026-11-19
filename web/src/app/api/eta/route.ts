import { NextResponse } from "next/server";
import { etaForPlan, liveEtaProvider } from "@/lib/eta";
import { planTrips } from "@/lib/transit-index";
import { clampWalkTransferMeters } from "@/lib/trip-estimate";

/**
 * Static ETA for a trip (or placeholder for future live feed).
 * Query: from, to, optional maxTransfers, walk, planId
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const stopId = searchParams.get("stopId");
  const maxTransfers = Number(searchParams.get("maxTransfers") ?? 2);
  const walk = Number(searchParams.get("walk") ?? 130);
  const planId = searchParams.get("planId");

  // Future live hook
  if (stopId && liveEtaProvider.getVehicleEtas) {
    const live = await liveEtaProvider.getVehicleEtas(stopId);
    if (live) {
      return NextResponse.json({ source: "live", etas: live });
    }
  }

  if (!from || !to) {
    return NextResponse.json(
      {
        error: "from and to required for static ETA (or stopId with live feed)",
        note: "No live AVL feed configured — returning static estimates only",
      },
      { status: 400 },
    );
  }

  const transfers = ([0, 1, 2, 3].includes(maxTransfers)
    ? maxTransfers
    : 2) as 0 | 1 | 2 | 3;

  const result = await planTrips(from, to, {
    maxTransfers: transfers,
    limit: 8,
    walkTransferMeters: clampWalkTransferMeters(walk),
  });
  if (!result) {
    return NextResponse.json({ error: "Unknown from/to stop" }, { status: 404 });
  }

  const plan =
    (planId ? result.plans.find((p) => p.id === planId) : null) ??
    result.plans[0];
  if (!plan) {
    return NextResponse.json({
      source: "static_estimate",
      from: result.from,
      to: result.to,
      etas: [],
      note: "No trip plans to estimate",
    });
  }

  const eta = etaForPlan(plan);
  return NextResponse.json({
    source: eta.source,
    from: result.from,
    to: result.to,
    plan_id: plan.id,
    summary: plan.summary,
    eta,
    alternatives: result.plans.slice(0, 5).map((p) => ({
      plan_id: p.id,
      summary: p.summary,
      eta: etaForPlan(p),
    })),
  });
}
