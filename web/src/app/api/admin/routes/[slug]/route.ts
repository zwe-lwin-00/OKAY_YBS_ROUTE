import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { getRouteBySlug, writeRouteData } from "@/lib/data";
import { resetTransitIndex } from "@/lib/transit-index";

type Ctx = { params: Promise<{ slug: string }> };

const stopSchema = z.object({
  index: z.string(),
  stop_name_en: z.string(),
  stop_name_mm: z.string(),
  road: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  direction: z
    .enum(["outbound", "inbound", "one_way", "turnaround"])
    .optional(),
  lane: z
    .enum(["unspecified", "right", "left", "center", "shared"])
    .optional(),
  opposite_stop_index: z.string().optional(),
});

const fareSchema = z
  .object({
    currency: z.string().optional(),
    amount_min: z.number().nullable().optional(),
    amount_max: z.number().nullable().optional(),
    notes: z.string().optional(),
    source: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .optional();

const scheduleSchema = z
  .object({
    first_departure: z.string().nullable().optional(),
    last_departure: z.string().nullable().optional(),
    headway_minutes: z.number().nullable().optional(),
    days: z.array(z.string()).optional(),
    notes: z.string().optional(),
    source: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .optional();

const routeSchema = z.object({
  bus_line: z.string(),
  route_info: z.record(z.string(), z.string()),
  stops: z.array(stopSchema).min(1),
  fare: fareSchema,
  schedule: scheduleSchema,
  direction_meta: z
    .object({
      pattern: z.enum(["out_and_back", "one_way"]),
      apex_index: z.number().optional(),
      outbound_label: z.string().optional(),
      inbound_label: z.string().optional(),
      one_way_label: z.string().optional(),
    })
    .optional(),
});

export async function GET(request: Request, ctx: Ctx) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { slug } = await ctx.params;
  const loaded = await getRouteBySlug(slug);
  if (!loaded) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(loaded);
}

export async function PUT(request: Request, ctx: Ctx) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { slug } = await ctx.params;
  const existing = await getRouteBySlug(slug);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = routeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", detail: parsed.error.flatten() },
      { status: 400 },
    );
  }

  await writeRouteData(slug, parsed.data as typeof existing.data);
  resetTransitIndex();
  return NextResponse.json({ ok: true, slug });
}
