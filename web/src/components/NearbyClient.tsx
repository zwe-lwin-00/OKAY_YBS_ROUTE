"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import type { NearbyStop, RouteSummary } from "@/lib/types";
import { formatDistance } from "@/lib/geo";
import { useLocale } from "@/lib/i18n";
import { EmptyState } from "./EmptyState";
import { RouteListSkeleton } from "./Skeleton";

type NearbyClientProps = {
  routes: RouteSummary[];
};

export function NearbyClient({ routes }: NearbyClientProps) {
  const { t } = useLocale();
  const [status, setStatus] = useState<"idle" | "locating" | "loading" | "ready" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [results, setResults] = useState<NearbyStop[]>([]);

  const findNearby = useCallback(async (lat: number, lng: number) => {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch(
        `/api/nearby?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&radius=1200&limit=40`,
      );
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const data = (await res.json()) as { stops: NearbyStop[] };
      setResults(data.stops ?? []);
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Nearby search failed");
    }
  }, []);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("error");
      setError("Geolocation is not supported on this browser.");
      return;
    }
    setStatus("locating");
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        void findNearby(lat, lng);
      },
      (err) => {
        setStatus("error");
        setError(err.message || "Could not get your location.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  }, [findNearby]);

  const subtitle = useMemo(() => {
    if (status === "locating") return "Getting your location…";
    if (status === "loading") return `Scanning all ${routes.length} routes…`;
    if (coords) return `Near ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
    return "Uses your phone GPS — location stays in the browser request only.";
  }, [status, coords, routes.length]);

  return (
    <div>
      <div className="rounded-3xl border border-line bg-white/65 p-5 shadow-[var(--shadow)] backdrop-blur">
        <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-ink">
          {t("nearby_stops")}
        </h1>
        <p className="mm mt-2 text-sm text-ink-soft">{t("stop_search_sub")}</p>
        <p className="mt-2 text-xs text-ink-soft">{subtitle}</p>
        <button
          type="button"
          onClick={locate}
          className="mt-4 min-h-12 w-full rounded-2xl bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-deep active:scale-[0.99] sm:w-auto sm:px-6"
        >
          {status === "locating" || status === "loading"
            ? t("loading")
            : t("nearby_stops")}
        </button>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </div>

      {status === "loading" || status === "locating" ? (
        <div className="mt-5">
          <RouteListSkeleton rows={4} />
        </div>
      ) : null}

      {status === "ready" ? (
        results.length ? (
          <div className="mt-5 overflow-hidden rounded-3xl border border-line bg-white/55 px-3 backdrop-blur">
            {results.map((stop) => (
              <Link
                key={`${stop.slug}-${stop.index}-${stop.distanceMeters}`}
                href={`/routes/${stop.slug}`}
                className="flex items-start gap-3 border-b border-line py-3.5 last:border-b-0"
              >
                <span className="mt-0.5 rounded-full bg-accent/30 px-2.5 py-1 text-xs font-bold text-accent-ink">
                  {formatDistance(stop.distanceMeters)}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{stop.stop_name_en}</p>
                  <p className="mm text-sm text-ink-soft">{stop.stop_name_mm}</p>
                  <p className="mt-1 text-xs text-ink-soft">
                    Line {stop.bus_line} · {stop.line_name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState title={t("empty_nearby")} />
          </div>
        )
      ) : null}
    </div>
  );
}
