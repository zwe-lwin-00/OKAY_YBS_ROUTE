"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { RecentTrip, StopPlace, TripPlan } from "@/lib/types";
import { formatDistance } from "@/lib/geo";
import { loadRecentTrips, saveRecentTrip } from "@/lib/recent-trips";
import {
  formatDuration,
  mapsWalkUrls,
  sortPlans,
  type SortMode,
} from "@/lib/trip-estimate";
import { StopPicker } from "./StopPicker";
import { TripMap } from "./TripMap";

export function TripPlanner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [from, setFrom] = useState<StopPlace | null>(null);
  const [to, setTo] = useState<StopPlace | null>(null);
  const [maxTransfers, setMaxTransfers] = useState<0 | 1 | 2>(2);
  const [sortMode, setSortMode] = useState<SortMode>("balanced");
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<TripPlan[] | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentTrip[]>([]);
  const [shareNote, setShareNote] = useState<string | null>(null);

  const canPlan = Boolean(from && to && from.id !== to.id);

  const sortedPlans = useMemo(
    () => (plans ? sortPlans(plans, sortMode) : null),
    [plans, sortMode],
  );

  const selectedPlan = useMemo(() => {
    if (!sortedPlans?.length) return null;
    return (
      sortedPlans.find((p) => p.id === selectedPlanId) ?? sortedPlans[0] ?? null
    );
  }, [sortedPlans, selectedPlanId]);

  useEffect(() => {
    setRecent(loadRecentTrips());
  }, []);

  // Restore from URL share link
  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const fromId = searchParams.get("from");
      const toId = searchParams.get("to");
      const xfer = Number(searchParams.get("xfer") ?? 2);
      const sort = searchParams.get("sort");
      if (sort === "fewer_walks" || sort === "fewer_hops" || sort === "balanced") {
        setSortMode(sort);
      }
      if ([0, 1, 2].includes(xfer)) setMaxTransfers(xfer as 0 | 1 | 2);

      try {
        if (fromId) {
          const res = await fetch(
            `/api/stops/by-id?id=${encodeURIComponent(fromId)}`,
          );
          if (res.ok) {
            const data = (await res.json()) as { stop: StopPlace };
            if (!cancelled) setFrom(data.stop);
          }
        }
        if (toId) {
          const res = await fetch(
            `/api/stops/by-id?id=${encodeURIComponent(toId)}`,
          );
          if (res.ok) {
            const data = (await res.json()) as { stop: StopPlace };
            if (!cancelled) setTo(data.stop);
          }
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
    // intentionally once on mount for shared URLs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-run when both restored from URL
  useEffect(() => {
    if (booting) return;
    const fromId = searchParams.get("from");
    const toId = searchParams.get("to");
    if (from && to && fromId && toId && from.id === fromId && to.id === toId) {
      void runPlan(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booting, from?.id, to?.id]);

  function syncUrl(nextFrom: StopPlace, nextTo: StopPlace, xfer: number, sort: SortMode) {
    const params = new URLSearchParams();
    params.set("from", nextFrom.id);
    params.set("to", nextTo.id);
    params.set("xfer", String(xfer));
    params.set("sort", sort);
    router.replace(`/plan?${params.toString()}`, { scroll: false });
  }

  async function runPlan(updateHistory = true) {
    if (!from || !to) return;
    setLoading(true);
    setError(null);
    setPlans(null);
    setSelectedPlanId(null);
    try {
      const res = await fetch(
        `/api/plan?from=${encodeURIComponent(from.id)}&to=${encodeURIComponent(to.id)}&maxTransfers=${maxTransfers}&limit=10`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Planning failed");
      const nextPlans = (data.plans ?? []) as TripPlan[];
      setPlans(nextPlans);
      if (nextPlans[0]) setSelectedPlanId(nextPlans[0].id);
      syncUrl(from, to, maxTransfers, sortMode);
      if (updateHistory) setRecent(saveRecentTrip(from, to));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Planning failed");
    } finally {
      setLoading(false);
    }
  }

  function swap() {
    setFrom(to);
    setTo(from);
    setPlans(null);
    setSelectedPlanId(null);
  }

  async function copyShareLink() {
    if (!from || !to) return;
    syncUrl(from, to, maxTransfers, sortMode);
    const url = `${window.location.origin}/plan?from=${encodeURIComponent(from.id)}&to=${encodeURIComponent(to.id)}&xfer=${maxTransfers}&sort=${sortMode}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareNote("Link copied");
    } catch {
      setShareNote(url);
    }
    window.setTimeout(() => setShareNote(null), 2500);
  }

  const transferLabel = useMemo(
    () =>
      ({
        0: "Direct only",
        1: "Up to 1 transfer",
        2: "Up to 2 transfers",
      })[maxTransfers],
    [maxTransfers],
  );

  return (
    <div>
      <div className="rounded-3xl border border-line bg-white/65 p-5 shadow-[var(--shadow)] backdrop-blur">
        <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-ink">
          Trip planner
        </h1>
        <p className="mm mt-2 text-sm text-ink-soft">
          A → B · တိုက်ရိုက် / တစ်ခါလဲ / နှစ်ခါလဲ · သွားလမ်း/ပြန်လမ်း ခွဲတွက်သည်
        </p>
        <p className="mt-1 text-xs text-ink-soft">
          Time shown is a static estimate (not live ETA). Opposite curbs are separate places.
        </p>

        <div className="mt-5 space-y-4">
          <StopPicker
            label="From"
            placeholder="Origin stop (e.g. Sule, ကျီစု)"
            value={from}
            onChange={setFrom}
          />
          <div className="flex justify-center">
            <button
              type="button"
              onClick={swap}
              className="min-h-10 rounded-full border border-line bg-white px-4 text-sm font-semibold text-brand"
            >
              Swap ↕
            </button>
          </div>
          <StopPicker
            label="To"
            placeholder="Destination stop"
            value={to}
            onChange={setTo}
          />
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Transfers · {transferLabel}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {([0, 1, 2] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setMaxTransfers(n)}
                className={`min-h-11 rounded-2xl text-sm font-semibold transition ${
                  maxTransfers === n
                    ? "bg-brand text-white"
                    : "border border-line bg-white/80 text-ink-soft"
                }`}
              >
                {n === 0 ? "Direct" : n === 1 ? "1 xfer" : "2 xfer"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Prefer
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {(
              [
                ["balanced", "Balanced time"],
                ["fewer_walks", "Fewer walks"],
                ["fewer_hops", "Fewer hops"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setSortMode(id)}
                className={`min-h-11 rounded-2xl text-sm font-semibold transition ${
                  sortMode === id
                    ? "bg-brand text-white"
                    : "border border-line bg-white/80 text-ink-soft"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={!canPlan || loading || booting}
            onClick={() => void runPlan(true)}
            className="min-h-12 flex-1 rounded-2xl bg-accent text-sm font-bold text-accent-ink transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading || booting ? "Planning…" : "Find trips"}
          </button>
          <button
            type="button"
            disabled={!canPlan}
            onClick={() => void copyShareLink()}
            className="min-h-12 rounded-2xl border border-line bg-white px-4 text-sm font-semibold text-ink-soft disabled:opacity-50"
          >
            Copy link
          </button>
        </div>
        {shareNote ? (
          <p className="mt-2 break-all text-xs text-brand">{shareNote}</p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </div>

      {recent.length ? (
        <div className="mt-4 rounded-3xl border border-line bg-white/55 p-4 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Recent
          </p>
          <ul className="mt-2 space-y-2">
            {recent.map((item) => (
              <li key={`${item.from.id}-${item.to.id}-${item.savedAt}`}>
                <button
                  type="button"
                  className="w-full rounded-2xl px-2 py-2 text-left text-sm hover:bg-brand/8"
                  onClick={() => {
                    setFrom(item.from);
                    setTo(item.to);
                    setPlans(null);
                  }}
                >
                  <span className="font-semibold text-ink">
                    {item.from.name_en}
                  </span>
                  <span className="mx-2 text-brand">→</span>
                  <span className="font-semibold text-ink">{item.to.name_en}</span>
                  <span className="mt-0.5 block text-[11px] text-ink-soft">
                    {item.from.road || item.from.name_mm} ·{" "}
                    {item.to.road || item.to.name_mm}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {sortedPlans ? (
        <div className="mt-5 space-y-3">
          <p className="text-sm text-ink-soft">
            {sortedPlans.length
              ? `${sortedPlans.length} option${sortedPlans.length === 1 ? "" : "s"} · sorted by ${
                  sortMode === "fewer_walks"
                    ? "fewer walks"
                    : sortMode === "fewer_hops"
                      ? "fewer hops"
                      : "balanced time"
                }`
              : "No trips found with these settings."}
          </p>

          {selectedPlan ? (
            <div className="overflow-hidden rounded-3xl border border-line bg-white/60 p-3 backdrop-blur">
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Selected trip map
              </p>
              <TripMap plan={selectedPlan} className="h-64 w-full sm:h-80" />
              <p className="mt-2 px-1 text-[11px] text-ink-soft">
                Solid lines = bus · dashed = walk · amber = transfer
              </p>
            </div>
          ) : null}

          {sortedPlans.map((plan) => {
            const active = selectedPlan?.id === plan.id;
            return (
              <article
                key={plan.id}
                className={`rounded-3xl border p-4 backdrop-blur transition ${
                  active
                    ? "border-brand bg-white/80 shadow-[var(--shadow)]"
                    : "border-line bg-white/60"
                }`}
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setSelectedPlanId(plan.id)}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white">
                      {plan.transfers === 0
                        ? "Direct"
                        : `${plan.transfers} transfer${plan.transfers > 1 ? "s" : ""}`}
                    </span>
                    <span className="rounded-full bg-accent/30 px-2.5 py-1 text-xs font-bold text-accent-ink">
                      {formatDuration(plan.estimated_minutes ?? 1)}
                    </span>
                    <span className="text-sm font-semibold text-ink">
                      {plan.summary}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-soft">
                    {plan.total_ride_stops} stop hops
                    {plan.total_walk_meters
                      ? ` · walk ${formatDistance(plan.total_walk_meters)}`
                      : ""}
                    {typeof plan.ride_minutes === "number"
                      ? ` · ride ~${plan.ride_minutes}m`
                      : ""}
                    {plan.walk_minutes
                      ? ` · walk ~${plan.walk_minutes}m`
                      : ""}
                    {" · estimate only"}
                  </p>
                </button>

                <ol className="mt-3 space-y-2">
                  {plan.legs.map((leg, idx) =>
                    leg.type === "ride" ? (
                      <li
                        key={`${plan.id}-ride-${idx}`}
                        className="rounded-2xl bg-brand/8 px-3 py-2.5 text-sm"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/routes/${leg.slug}`}
                            className="font-bold text-brand"
                          >
                            Line {leg.bus_line}
                          </Link>
                          <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-brand">
                            {leg.direction_label}
                          </span>
                          <span className="text-xs text-ink-soft">
                            {leg.stop_count} stops · #{leg.from_index}→#
                            {leg.to_index}
                          </span>
                        </div>
                        <p className="mt-1 text-ink">
                          {leg.from_stop.stop_name_en}
                          <span className="mx-1.5 text-brand">→</span>
                          {leg.to_stop.stop_name_en}
                        </p>
                        <p className="mm text-xs text-ink-soft">
                          {leg.from_stop.stop_name_mm} → {leg.to_stop.stop_name_mm}
                        </p>
                      </li>
                    ) : (
                      <li
                        key={`${plan.id}-walk-${idx}`}
                        className="rounded-2xl border border-dashed border-line px-3 py-2 text-sm text-ink-soft"
                      >
                        <p>
                          Walk {formatDistance(leg.distance_meters)}
                          {leg.reason === "cross_to_lane"
                            ? " to the correct lane/curb"
                            : " to transfer"}
                        </p>
                        <span className="mm block text-xs">
                          {leg.from_stop.stop_name_mm} → {leg.to_stop.stop_name_mm}
                        </span>
                        {(() => {
                          const urls = mapsWalkUrls(leg.from_stop, leg.to_stop);
                          return (
                            <span className="mt-2 flex flex-wrap gap-2">
                              <a
                                href={urls.google}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand"
                              >
                                Google Maps walk
                              </a>
                              <a
                                href={urls.apple}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand"
                              >
                                Apple Maps walk
                              </a>
                            </span>
                          );
                        })()}
                      </li>
                    ),
                  )}
                </ol>
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
