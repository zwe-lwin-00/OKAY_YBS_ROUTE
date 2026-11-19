"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { RouteSummary, StopPlace } from "@/lib/types";
import {
  loadFavoriteRoutes,
  loadFavoriteStops,
  toggleFavoriteRoute,
  toggleFavoriteStop,
} from "@/lib/favorites";
import { useLocale } from "@/lib/i18n";
import { EmptyState } from "./EmptyState";
import { RouteRow } from "./RouteRow";

export function FavoritesPage() {
  const { t } = useLocale();
  const [routes, setRoutes] = useState<RouteSummary[]>([]);
  const [stops, setStops] = useState<StopPlace[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRoutes(loadFavoriteRoutes());
    setStops(loadFavoriteStops());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <p className="text-sm text-ink-soft">{t("loading")}</p>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-ink sm:text-3xl">
          {t("favorites")}
        </h1>
        <p className="mm mt-1 text-sm text-ink-soft">{t("favorites_sub")}</p>
      </div>

      <section className="mb-8">
        <h2 className="mb-2 font-[family-name:var(--font-syne)] text-lg font-bold">
          {t("fav_routes")}
        </h2>
        {routes.length ? (
          <div className="overflow-hidden surface-quiet px-3 backdrop-blur">
            {routes.map((route) => (
              <div key={route.slug} className="relative">
                <RouteRow route={route} />
                <button
                  type="button"
                  className="absolute right-2 top-3 rounded-full bg-white/90 px-2 py-1 text-xs font-bold text-ink-soft"
                  onClick={() => setRoutes(toggleFavoriteRoute(route))}
                >
                  ★
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={t("no_fav_routes")}
            action={
              <Link
                href="/routes"
                className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white"
              >
                {t("nav_routes")}
              </Link>
            }
          />
        )}
      </section>

      <section>
        <h2 className="mb-2 font-[family-name:var(--font-syne)] text-lg font-bold">
          {t("fav_stops")}
        </h2>
        {stops.length ? (
          <div className="overflow-hidden surface-quiet px-3 backdrop-blur">
            {stops.map((stop) => (
              <div
                key={stop.id}
                className="flex items-start gap-3 border-b border-line py-3 last:border-b-0"
              >
                <Link href={`/stops?id=${encodeURIComponent(stop.id)}`} className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{stop.name_en}</p>
                  <p className="mm text-sm text-ink-soft">{stop.name_mm}</p>
                  {stop.road ? (
                    <p className="mt-1 text-xs text-ink-soft">{stop.road}</p>
                  ) : null}
                </Link>
                <button
                  type="button"
                  className="rounded-full bg-white px-2 py-1 text-xs font-bold text-ink-soft"
                  onClick={() => setStops(toggleFavoriteStop(stop))}
                >
                  ★
                </button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={t("no_fav_stops")}
            action={
              <Link
                href="/stops"
                className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white"
              >
                {t("nav_stops")}
              </Link>
            }
          />
        )}
      </section>
    </div>
  );
}
