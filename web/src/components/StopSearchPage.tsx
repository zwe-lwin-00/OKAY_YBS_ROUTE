"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ServingRoute, StopPlace } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import { EmptyState } from "./EmptyState";
import { FavoriteStopButton } from "./FavoriteButton";
import { RouteListSkeleton } from "./Skeleton";
import { StopPicker } from "./StopPicker";

export function StopSearchPage({ initialStopId }: { initialStopId?: string }) {
  const { t } = useLocale();
  const [stop, setStop] = useState<StopPlace | null>(null);
  const [routes, setRoutes] = useState<ServingRoute[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialStopId) return;
    let cancelled = false;
    void (async () => {
      const res = await fetch(
        `/api/stops/by-id?id=${encodeURIComponent(initialStopId)}`,
      );
      if (!res.ok || cancelled) return;
      const data = (await res.json()) as { stop: StopPlace };
      if (!cancelled) setStop(data.stop);
    })();
    return () => {
      cancelled = true;
    };
  }, [initialStopId]);

  useEffect(() => {
    if (!stop) {
      setRoutes(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const res = await fetch(
          `/api/stops/routes?id=${encodeURIComponent(stop.id)}`,
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        if (!cancelled) setRoutes(data.routes ?? []);
      } catch (err) {
        if (!cancelled) {
          setRoutes([]);
          setError(err instanceof Error ? err.message : "Failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [stop]);

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-ink sm:text-3xl">
          {t("stop_search")}
        </h1>
        <p className="mm mt-1 text-sm text-ink-soft">{t("stop_search_sub")}</p>
      </div>

      <StopPicker
        label={t("nav_stops")}
        placeholder={t("search_stops_ph")}
        value={stop}
        onChange={setStop}
      />

      {!stop ? (
        <div className="mt-5">
          <EmptyState title={t("type_to_search")} />
        </div>
      ) : null}

      {stop ? (
        <div className="mt-5 rounded-3xl border border-line bg-white/65 p-4 shadow-[var(--shadow)] backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-[family-name:var(--font-syne)] text-xl font-bold">
                {stop.name_en}
              </p>
              <p className="mm text-sm text-ink-soft">{stop.name_mm}</p>
              {stop.road ? (
                <p className="mt-1 text-xs text-ink-soft">{stop.road}</p>
              ) : null}
              {stop.ambiguous ? (
                <p className="mt-2 rounded-xl bg-accent/20 px-2 py-1 text-[11px] font-medium text-accent-ink">
                  {stop.ambiguity_hint}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <FavoriteStopButton stop={stop} />
              <Link
                href={`/plan?from=${encodeURIComponent(stop.id)}`}
                className="inline-flex min-h-10 items-center rounded-full border border-line bg-white px-3 text-xs font-bold text-ink-soft"
              >
                {t("use_in_planner")}
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-5">
          <RouteListSkeleton rows={5} />
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

      {!loading && routes ? (
        <div className="mt-5">
          <p className="mb-2 text-sm text-ink-soft">
            {t("routes_through")} · {t("routes_count", { n: routes.length })}
          </p>
          {routes.length ? (
            <div className="overflow-hidden rounded-3xl border border-line bg-white/55 px-3 backdrop-blur">
              {routes.map((route) => (
                <Link
                  key={route.slug}
                  href={`/routes/${route.slug}`}
                  className="flex items-center gap-3 border-b border-line py-3.5 last:border-b-0"
                >
                  <span className="grid h-12 min-w-12 place-items-center rounded-2xl bg-brand px-2 text-sm font-bold text-white">
                    {route.bus_line.length > 4
                      ? route.bus_line.slice(0, 3)
                      : route.bus_line}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">Line {route.bus_line}</p>
                    <p className="mm truncate text-sm text-ink-soft">
                      {route.line_name}
                    </p>
                    <p className="mt-1 text-[11px] text-ink-soft">
                      {route.agency}
                      {route.qrSupported ? " · QR" : ""}
                      {" · "}
                      {route.directions.join(" / ")}
                      {" · #"}
                      {route.stop_indexes.slice(0, 4).join(", #")}
                      {route.stop_indexes.length > 4 ? "…" : ""}
                    </p>
                  </div>
                  <span className="text-brand" aria-hidden>
                    →
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title={t("no_routes_stop")} />
          )}
        </div>
      ) : null}
    </div>
  );
}
