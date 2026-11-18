import { getRouteBySlug, getRouteSummaries } from "./data";
import { haversineMeters } from "./geo";
import { enrichPlanEstimates } from "./trip-estimate";
import type {
  RideDirection,
  RideLeg,
  ServingRoute,
  Stop,
  StopPlace,
  TripLeg,
  TripPlan,
  WalkLeg,
} from "./types";

/** Walk between transfer points / opposite curb. */
const WALK_TRANSFER_M = 130;
/** Same stop name, likely opposite lane or nearby pole. */
const NAME_MATCH_M = 120;
/** Exact curb / same-side coordinate match. */
const COORD_MATCH_M = 55;
/** Allow a short walk from picked place to the correct boarding curb. */
const CROSS_TO_LANE_M = 75;

type IndexedStop = {
  stop: Stop;
  /** Index in the original full route stop list. */
  pos: number;
  placeKey: string;
};

type RouteSegment = {
  id: string;
  slug: string;
  bus_line: string;
  line_name: string;
  direction: RideDirection;
  direction_label: string;
  stops: IndexedStop[];
};

type PlaceAgg = {
  id: string;
  name_en: string;
  name_mm: string;
  road: string;
  latitude: number;
  longitude: number;
  nameNorm: string;
  routeSlugs: Set<string>;
};

type TransitIndex = {
  segments: RouteSegment[];
  places: PlaceAgg[];
  byId: Map<string, PlaceAgg>;
};

let indexPromise: Promise<TransitIndex> | null = null;

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function gridKey(lat: number, lng: number): string {
  // ~111m cells — transfer graph key (not lane identity)
  return `${lat.toFixed(3)}:${lng.toFixed(3)}`;
}

function placeId(nameNorm: string, lat: number, lng: number): string {
  // 4 decimals ≈ 11m — keeps opposite curbs as separate selectable places
  return `${nameNorm || "stop"}@${lat.toFixed(4)},${lng.toFixed(4)}`;
}

function isValidCoord(stop: Stop): boolean {
  return (
    Number.isFinite(stop.latitude) &&
    Number.isFinite(stop.longitude) &&
    !(stop.latitude === 0 && stop.longitude === 0)
  );
}

function directionLabel(direction: RideDirection, lineName: string): string {
  if (direction === "one_way") return "One way";
  if (direction === "outbound") {
    const m = lineName.match(/\)\s*(.+?)\s*-\s*(.+)$/);
    if (m) return `Toward ${m[2].trim()}`;
    return "Outbound (going)";
  }
  const m = lineName.match(/\)\s*(.+?)\s*-\s*(.+)$/);
  if (m) return `Toward ${m[1].trim()}`;
  return "Inbound (return)";
}

/** Farthest stop from start — typical turnaround on out-and-back YBS lists. */
function findApexIndex(stops: IndexedStop[]): number {
  const start = stops[0].stop;
  let bestI = Math.max(1, Math.floor(stops.length / 2));
  let bestD = -1;
  for (let i = 1; i < stops.length; i++) {
    const d = haversineMeters(
      start.latitude,
      start.longitude,
      stops[i].stop.latitude,
      stops[i].stop.longitude,
    );
    if (d >= bestD) {
      bestD = d;
      bestI = i;
    }
  }
  return bestI;
}

function looksLikeRoundTrip(stops: IndexedStop[]): boolean {
  if (stops.length < 8) return false;
  const first = stops[0].stop;
  const last = stops[stops.length - 1].stop;
  const endGap = haversineMeters(
    first.latitude,
    first.longitude,
    last.latitude,
    last.longitude,
  );
  if (endGap <= 350) return true;

  // Duplicate names early + late also signal go/back encoding
  const early = new Set<string>();
  const late = new Set<string>();
  const cut = Math.floor(stops.length * 0.3);
  for (let i = 0; i < cut; i++) {
    early.add(normalizeName(stops[i].stop.stop_name_en));
  }
  for (let i = stops.length - cut; i < stops.length; i++) {
    late.add(normalizeName(stops[i].stop.stop_name_en));
  }
  let shared = 0;
  for (const n of early) if (n && late.has(n)) shared += 1;
  return shared >= 3 && endGap < 2000;
}

function splitIntoSegments(
  slug: string,
  bus_line: string,
  line_name: string,
  stops: IndexedStop[],
): RouteSegment[] {
  if (stops.length < 2) return [];

  if (!looksLikeRoundTrip(stops)) {
    return [
      {
        id: `${slug}:one_way`,
        slug,
        bus_line,
        line_name,
        direction: "one_way",
        direction_label: directionLabel("one_way", line_name),
        stops,
      },
    ];
  }

  const apex = findApexIndex(stops);
  // Keep at least a few stops on each side when possible
  const apexClamped = Math.min(
    Math.max(apex, 2),
    Math.max(2, stops.length - 3),
  );

  const outbound = stops.slice(0, apexClamped + 1);
  const inbound = stops.slice(apexClamped);

  const segments: RouteSegment[] = [];
  if (outbound.length >= 2) {
    segments.push({
      id: `${slug}:outbound`,
      slug,
      bus_line,
      line_name,
      direction: "outbound",
      direction_label: directionLabel("outbound", line_name),
      stops: outbound,
    });
  }
  if (inbound.length >= 2) {
    segments.push({
      id: `${slug}:inbound`,
      slug,
      bus_line,
      line_name,
      direction: "inbound",
      direction_label: directionLabel("inbound", line_name),
      stops: inbound,
    });
  }
  return segments;
}

async function buildIndex(): Promise<TransitIndex> {
  const summaries = await getRouteSummaries();
  const segments: RouteSegment[] = [];
  const placeMap = new Map<string, PlaceAgg>();

  for (const summary of summaries) {
    const loaded = await getRouteBySlug(summary.slug);
    if (!loaded) continue;

    const indexedStops: IndexedStop[] = [];
    loaded.data.stops.forEach((stop, pos) => {
      if (!isValidCoord(stop)) return;
      const nameNorm = normalizeName(stop.stop_name_en);
      indexedStops.push({
        stop,
        pos,
        placeKey: gridKey(stop.latitude, stop.longitude),
      });

      const id = placeId(nameNorm, stop.latitude, stop.longitude);
      const existing = placeMap.get(id);
      if (existing) {
        existing.routeSlugs.add(summary.slug);
        if (!existing.name_mm && stop.stop_name_mm) {
          existing.name_mm = stop.stop_name_mm;
        }
      } else {
        placeMap.set(id, {
          id,
          name_en: stop.stop_name_en,
          name_mm: stop.stop_name_mm,
          road: stop.road,
          latitude: stop.latitude,
          longitude: stop.longitude,
          nameNorm,
          routeSlugs: new Set([summary.slug]),
        });
      }
    });

    segments.push(
      ...splitIntoSegments(
        summary.slug,
        summary.bus_line,
        summary.line_name,
        indexedStops,
      ),
    );
  }

  const places = [...placeMap.values()];
  return { segments, places, byId: new Map(places.map((p) => [p.id, p])) };
}

export async function getTransitIndex(): Promise<TransitIndex> {
  if (!indexPromise) indexPromise = buildIndex();
  return indexPromise;
}

/** Reset cached index (useful after data changes in dev). */
export function resetTransitIndex() {
  indexPromise = null;
}

function matchScore(stop: Stop, place: PlaceAgg): number | null {
  const dist = haversineMeters(
    stop.latitude,
    stop.longitude,
    place.latitude,
    place.longitude,
  );
  const sameName = normalizeName(stop.stop_name_en) === place.nameNorm;

  // Prefer same curb; allow opposite-lane same name only within tighter radius
  if (dist <= COORD_MATCH_M) return dist;
  if (sameName && dist <= NAME_MATCH_M) return dist + 40; // slight penalty vs exact curb
  return null;
}

function walkBetween(
  a: Stop,
  b: Stop,
  reason: WalkLeg["reason"] = "transfer",
): WalkLeg | null {
  const distance = haversineMeters(
    a.latitude,
    a.longitude,
    b.latitude,
    b.longitude,
  );
  if (distance <= 20) return null;
  return {
    type: "walk",
    from_stop: a,
    to_stop: b,
    distance_meters: Math.round(distance),
    reason,
  };
}

function placeAsStop(place: PlaceAgg): Stop {
  return {
    index: "0",
    stop_name_en: place.name_en,
    stop_name_mm: place.name_mm,
    road: place.road,
    latitude: place.latitude,
    longitude: place.longitude,
  };
}

function rideLeg(segment: RouteSegment, fromIdx: number, toIdx: number): RideLeg {
  const from = segment.stops[fromIdx];
  const to = segment.stops[toIdx];
  const slice = segment.stops.slice(fromIdx, toIdx + 1);
  return {
    type: "ride",
    slug: segment.slug,
    bus_line: segment.bus_line,
    line_name: segment.line_name,
    direction: segment.direction,
    direction_label: segment.direction_label,
    from_stop: from.stop,
    to_stop: to.stop,
    from_index: from.pos + 1,
    to_index: to.pos + 1,
    stop_count: toIdx - fromIdx,
    path: slice.map((s) => ({
      latitude: s.stop.latitude,
      longitude: s.stop.longitude,
    })),
  };
}

function scorePlan(transfers: number, rideStops: number, walkM: number): number {
  return transfers * 1000 + rideStops * 3 + walkM * 0.08;
}

function summarize(legs: TripLeg[], transfers: number): string {
  const rides = legs.filter((l): l is RideLeg => l.type === "ride");
  const lines = rides
    .map((r) => `${r.bus_line} (${r.direction === "inbound" ? "return" : r.direction === "outbound" ? "going" : "one-way"})`)
    .join(" → ");
  if (transfers === 0) return `Direct: ${lines}`;
  if (transfers === 1) return `1 transfer: ${lines}`;
  return `2 transfers: ${lines}`;
}

function finalize(
  transfers: 0 | 1 | 2,
  legs: TripLeg[],
  seen: Set<string>,
  out: TripPlan[],
) {
  const rides = legs.filter((l): l is RideLeg => l.type === "ride");
  if (!rides.length) return;
  const walks = legs.filter((l): l is WalkLeg => l.type === "walk");
  const total_ride_stops = rides.reduce((s, r) => s + r.stop_count, 0);
  const total_walk_meters = walks.reduce((s, w) => s + w.distance_meters, 0);
  const signature = rides
    .map(
      (r) =>
        `${r.slug}:${r.direction}:${r.from_index}-${r.to_index}`,
    )
    .join("|");
  if (seen.has(signature)) return;
  seen.add(signature);

  out.push({
    id: `${transfers}-${signature}`,
    transfers,
    score: scorePlan(transfers, total_ride_stops, total_walk_meters),
    total_ride_stops,
    total_walk_meters,
    summary: summarize(legs, transfers),
    legs,
  });
}

/** Best index on this directed segment matching a place (closest curb preferred). */
function bestMatchIndex(segment: RouteSegment, place: PlaceAgg): number | null {
  let best: { idx: number; score: number } | null = null;
  for (let i = 0; i < segment.stops.length; i++) {
    const score = matchScore(segment.stops[i].stop, place);
    if (score == null) continue;
    if (!best || score < best.score) best = { idx: i, score };
  }
  return best?.idx ?? null;
}

/**
 * Find board/alight pair on one directed segment.
 * Optional short walk from the user-selected place onto the correct curb/lane.
 */
function directOnSegment(
  segment: RouteSegment,
  from: PlaceAgg,
  to: PlaceAgg,
): { legs: TripLeg[]; hops: number } | null {
  const candidatesFrom: { idx: number; score: number }[] = [];
  const candidatesTo: { idx: number; score: number }[] = [];

  for (let i = 0; i < segment.stops.length; i++) {
    const fs = matchScore(segment.stops[i].stop, from);
    if (fs != null) candidatesFrom.push({ idx: i, score: fs });
    const ts = matchScore(segment.stops[i].stop, to);
    if (ts != null) candidatesTo.push({ idx: i, score: ts });
  }
  if (!candidatesFrom.length || !candidatesTo.length) return null;

  let best: {
    a: number;
    b: number;
    boardScore: number;
    alightScore: number;
  } | null = null;

  for (const a of candidatesFrom) {
    for (const b of candidatesTo) {
      if (b.idx <= a.idx) continue;
      const hops = b.idx - a.idx;
      if (
        !best ||
        hops < best.b - best.a ||
        (hops === best.b - best.a &&
          a.score + b.score < best.boardScore + best.alightScore)
      ) {
        best = {
          a: a.idx,
          b: b.idx,
          boardScore: a.score,
          alightScore: b.score,
        };
      }
    }
  }
  if (!best) return null;

  const legs: TripLeg[] = [];
  const boardStop = segment.stops[best.a].stop;
  const boardDist = haversineMeters(
    from.latitude,
    from.longitude,
    boardStop.latitude,
    boardStop.longitude,
  );
  if (boardDist > 20 && boardDist <= CROSS_TO_LANE_M) {
    const w = walkBetween(placeAsStop(from), boardStop, "cross_to_lane");
    if (w) legs.push(w);
  } else if (boardDist > CROSS_TO_LANE_M) {
    // Matched by name but too far for a sane curb cross — reject
    if (best.boardScore > COORD_MATCH_M) return null;
  }

  legs.push(rideLeg(segment, best.a, best.b));
  return { legs, hops: best.b - best.a };
}

type Reach = {
  segment: RouteSegment;
  fromIdx: number;
  atIdx: number;
  atStop: Stop;
  accessWalk: WalkLeg | null;
};

function buildFromReach(
  segments: RouteSegment[],
  from: PlaceAgg,
): Map<string, Reach> {
  const fromReach = new Map<string, Reach>();

  for (const segment of segments) {
    const board = bestMatchIndex(segment, from);
    if (board == null) continue;

    const boardStop = segment.stops[board].stop;
    const boardDist = haversineMeters(
      from.latitude,
      from.longitude,
      boardStop.latitude,
      boardStop.longitude,
    );
    let accessWalk: WalkLeg | null = null;
    if (boardDist > 20 && boardDist <= CROSS_TO_LANE_M) {
      accessWalk = walkBetween(placeAsStop(from), boardStop, "cross_to_lane");
    } else if (boardDist > CROSS_TO_LANE_M) {
      continue;
    }

    for (let i = board + 1; i < segment.stops.length; i++) {
      const key = segment.stops[i].placeKey;
      const hops = i - board;
      const prev = fromReach.get(key);
      if (!prev || hops < prev.atIdx - prev.fromIdx) {
        fromReach.set(key, {
          segment,
          fromIdx: board,
          atIdx: i,
          atStop: segment.stops[i].stop,
          accessWalk,
        });
      }
    }
  }

  return fromReach;
}

function buildToReach(
  segments: RouteSegment[],
  to: PlaceAgg,
): Map<string, Reach> {
  const toReach = new Map<string, Reach>();

  for (const segment of segments) {
    const alight = bestMatchIndex(segment, to);
    if (alight == null) continue;

    const alightStop = segment.stops[alight].stop;
    const alightDist = haversineMeters(
      to.latitude,
      to.longitude,
      alightStop.latitude,
      alightStop.longitude,
    );
    // Destination curb: allow short walk off the bus to selected place later in finalize if needed
    if (alightDist > CROSS_TO_LANE_M && alightDist > COORD_MATCH_M) continue;

    for (let i = 0; i < alight; i++) {
      const key = segment.stops[i].placeKey;
      const hops = alight - i;
      const prev = toReach.get(key);
      if (!prev || hops < prev.atIdx - prev.fromIdx) {
        toReach.set(key, {
          segment,
          fromIdx: i,
          atIdx: alight,
          atStop: segment.stops[i].stop,
          accessWalk: null,
        });
      }
    }
  }

  return toReach;
}

export async function searchStopPlaces(
  query: string,
  limit = 12,
): Promise<StopPlace[]> {
  const { places } = await getTransitIndex();
  const nameCounts = buildNameCounts(places);
  const q = normalizeName(query);
  if (!q) {
    return places
      .slice()
      .sort((a, b) => b.routeSlugs.size - a.routeSlugs.size)
      .slice(0, limit)
      .map((p) => toStopPlace(p, nameCounts));
  }

  const scored = places
    .map((p) => {
      const en = normalizeName(p.name_en);
      const mm = p.name_mm;
      let score = 0;
      if (en === q) score = 100;
      else if (en.startsWith(q)) score = 80;
      else if (en.includes(q)) score = 60;
      else if (mm.includes(query.trim())) score = 55;
      else if (normalizeName(p.road).includes(q)) score = 30;
      else return null;
      score += Math.min(p.routeSlugs.size, 20);
      // Slightly boost showing multiple sides of an ambiguous name together
      if ((nameCounts.get(p.nameNorm) ?? 0) > 1 && en.includes(q)) score += 5;
      return { p, score };
    })
    .filter((x): x is { p: PlaceAgg; score: number } => Boolean(x))
    .sort(
      (a, b) =>
        b.score - a.score || b.p.routeSlugs.size - a.p.routeSlugs.size,
    )
    .slice(0, limit);

  return scored.map(({ p }) => toStopPlace(p, nameCounts));
}

function toStopPlace(
  p: PlaceAgg,
  nameCounts?: Map<string, number>,
): StopPlace {
  const sameName = nameCounts?.get(p.nameNorm) ?? 1;
  const ambiguous = sameName > 1;
  return {
    id: p.id,
    name_en: p.name_en,
    name_mm: p.name_mm,
    road: p.road,
    latitude: p.latitude,
    longitude: p.longitude,
    route_count: p.routeSlugs.size,
    ambiguous,
    same_name_count: sameName,
    ambiguity_hint: ambiguous
      ? `Same name at ${sameName} places — check road / curb side`
      : undefined,
  };
}

function buildNameCounts(places: PlaceAgg[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const p of places) {
    if (!p.nameNorm) continue;
    counts.set(p.nameNorm, (counts.get(p.nameNorm) ?? 0) + 1);
  }
  return counts;
}

export async function planTrips(
  fromId: string,
  toId: string,
  maxTransfers: 0 | 1 | 2 = 2,
  limit = 8,
): Promise<{ from: StopPlace; to: StopPlace; plans: TripPlan[] } | null> {
  const index = await getTransitIndex();
  const from = index.byId.get(fromId);
  const to = index.byId.get(toId);
  if (!from || !to) return null;
  if (from.id === to.id) {
    const nameCounts = buildNameCounts(index.places);
    return {
      from: toStopPlace(from, nameCounts),
      to: toStopPlace(to, nameCounts),
      plans: [],
    };
  }

  const plans: TripPlan[] = [];
  const seen = new Set<string>();

  // --- Direct on a single directed segment (going OR return, not mixed) ---
  for (const segment of index.segments) {
    const direct = directOnSegment(segment, from, to);
    if (direct) finalize(0, direct.legs, seen, plans);
  }

  if (maxTransfers >= 1) {
    const fromReach = buildFromReach(index.segments, from);
    const toReach = buildToReach(index.segments, to);

    for (const [key, aSide] of fromReach) {
      const bSide = toReach.get(key);
      if (!bSide) continue;
      // Same physical line + same direction continuing would be direct; skip same segment
      if (aSide.segment.id === bSide.segment.id) continue;

      const transferDist = haversineMeters(
        aSide.atStop.latitude,
        aSide.atStop.longitude,
        bSide.atStop.latitude,
        bSide.atStop.longitude,
      );
      if (transferDist > WALK_TRANSFER_M) continue;

      const legs: TripLeg[] = [];
      if (aSide.accessWalk) legs.push(aSide.accessWalk);
      legs.push(rideLeg(aSide.segment, aSide.fromIdx, aSide.atIdx));
      const walk = walkBetween(aSide.atStop, bSide.atStop, "transfer");
      if (walk) legs.push(walk);
      legs.push(rideLeg(bSide.segment, bSide.fromIdx, bSide.atIdx));
      finalize(1, legs, seen, plans);
    }

    if (maxTransfers >= 2) {
      let twoTransferFound = 0;
      const TWO_TRANSFER_CAP = 40;

      for (const mid of index.segments) {
        if (twoTransferFound >= TWO_TRANSFER_CAP) break;

        const boardIdx: number[] = [];
        const alightIdx: number[] = [];
        for (let i = 0; i < mid.stops.length; i++) {
          if (fromReach.has(mid.stops[i].placeKey)) boardIdx.push(i);
          if (toReach.has(mid.stops[i].placeKey)) alightIdx.push(i);
        }
        if (!boardIdx.length || !alightIdx.length) continue;

        for (const i of boardIdx) {
          const left = fromReach.get(mid.stops[i].placeKey);
          if (!left || left.segment.id === mid.id) continue;

          const distIn = haversineMeters(
            left.atStop.latitude,
            left.atStop.longitude,
            mid.stops[i].stop.latitude,
            mid.stops[i].stop.longitude,
          );
          if (distIn > WALK_TRANSFER_M) continue;

          for (const j of alightIdx) {
            if (j <= i) continue;
            const right = toReach.get(mid.stops[j].placeKey);
            if (!right || right.segment.id === mid.id) continue;
            if (left.segment.id === right.segment.id) continue;

            const distOut = haversineMeters(
              mid.stops[j].stop.latitude,
              mid.stops[j].stop.longitude,
              right.atStop.latitude,
              right.atStop.longitude,
            );
            if (distOut > WALK_TRANSFER_M) continue;

            const legs: TripLeg[] = [];
            if (left.accessWalk) legs.push(left.accessWalk);
            legs.push(rideLeg(left.segment, left.fromIdx, left.atIdx));
            const w1 = walkBetween(left.atStop, mid.stops[i].stop, "transfer");
            if (w1) legs.push(w1);
            legs.push(rideLeg(mid, i, j));
            const w2 = walkBetween(
              mid.stops[j].stop,
              right.atStop,
              "transfer",
            );
            if (w2) legs.push(w2);
            legs.push(rideLeg(right.segment, right.fromIdx, right.atIdx));

            const before = plans.length;
            finalize(2, legs, seen, plans);
            if (plans.length > before) {
              twoTransferFound += 1;
              if (twoTransferFound >= TWO_TRANSFER_CAP) break;
            }
          }
          if (twoTransferFound >= TWO_TRANSFER_CAP) break;
        }
      }
    }
  }

  plans.sort((a, b) => a.score - b.score || a.transfers - b.transfers);

  const unique: TripPlan[] = [];
  const pairSeen = new Set<string>();
  for (const plan of plans) {
    const rides = plan.legs.filter((l): l is RideLeg => l.type === "ride");
    const pairKey = rides.map((r) => `${r.slug}:${r.direction}`).join(">");
    if (pairSeen.has(pairKey)) continue;
    pairSeen.add(pairKey);
    unique.push(enrichPlanEstimates(plan));
    if (unique.length >= limit) break;
  }

  const { places } = index;
  const nameCounts = buildNameCounts(places);

  return {
    from: toStopPlace(from, nameCounts),
    to: toStopPlace(to, nameCounts),
    plans: unique,
  };
}

export async function getPlaceById(id: string): Promise<StopPlace | null> {
  const { byId, places } = await getTransitIndex();
  const place = byId.get(id);
  if (!place) return null;
  return toStopPlace(place, buildNameCounts(places));
}

/** All catalog routes that serve a selected stop place (either curb/direction). */
export async function getRoutesServingStop(
  placeId: string,
): Promise<{ stop: StopPlace; routes: ServingRoute[] } | null> {
  const index = await getTransitIndex();
  const place = index.byId.get(placeId);
  if (!place) return null;

  const bySlug = new Map<
    string,
    {
      slug: string;
      bus_line: string;
      line_name: string;
      directions: Set<string>;
      stop_indexes: Set<number>;
    }
  >();

  for (const segment of index.segments) {
    for (const s of segment.stops) {
      if (matchScore(s.stop, place) == null) continue;
      const existing = bySlug.get(segment.slug);
      if (existing) {
        existing.directions.add(segment.direction_label);
        existing.stop_indexes.add(s.pos + 1);
      } else {
        bySlug.set(segment.slug, {
          slug: segment.slug,
          bus_line: segment.bus_line,
          line_name: segment.line_name,
          directions: new Set([segment.direction_label]),
          stop_indexes: new Set([s.pos + 1]),
        });
      }
    }
  }

  const summaries = await getRouteSummaries();
  const summaryBySlug = new Map(summaries.map((r) => [r.slug, r]));

  const routes: ServingRoute[] = [...bySlug.values()]
    .map((item) => {
      const summary = summaryBySlug.get(item.slug);
      return {
        slug: item.slug,
        bus_line: item.bus_line,
        line_name: item.line_name,
        agency: summary?.agency ?? "",
        qrSupported: summary?.qrSupported ?? false,
        total_stops: summary?.total_stops ?? 0,
        directions: [...item.directions],
        stop_indexes: [...item.stop_indexes].sort((a, b) => a - b),
      };
    })
    .sort((a, b) => {
      const na = Number(a.bus_line);
      const nb = Number(b.bus_line);
      if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
      return a.bus_line.localeCompare(b.bus_line);
    });

  return {
    stop: toStopPlace(place, buildNameCounts(index.places)),
    routes,
  };
}
