"use client";

import { useEffect, useState } from "react";
import type { RouteSummary, StopPlace } from "@/lib/types";
import {
  isFavoriteRoute,
  isFavoriteStop,
  toggleFavoriteRoute,
  toggleFavoriteStop,
} from "@/lib/favorites";
import { useLocale } from "@/lib/i18n";

export function FavoriteRouteButton({ route }: { route: RouteSummary }) {
  const { t } = useLocale();
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(isFavoriteRoute(route.slug));
  }, [route.slug]);

  return (
    <button
      type="button"
      onClick={() => {
        toggleFavoriteRoute(route);
        setOn(isFavoriteRoute(route.slug));
      }}
      className={`inline-flex min-h-10 items-center gap-1 rounded-full px-3 text-xs font-bold transition ${
        on ? "bg-accent text-accent-ink" : "border border-line bg-white/80 text-ink-soft"
      }`}
      aria-pressed={on}
    >
      <span aria-hidden>{on ? "★" : "☆"}</span>
      {on ? t("saved") : t("save")}
    </button>
  );
}

export function FavoriteStopButton({ stop }: { stop: StopPlace }) {
  const { t } = useLocale();
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(isFavoriteStop(stop.id));
  }, [stop.id]);

  return (
    <button
      type="button"
      onClick={() => {
        toggleFavoriteStop(stop);
        setOn(isFavoriteStop(stop.id));
      }}
      className={`inline-flex min-h-10 items-center gap-1 rounded-full px-3 text-xs font-bold transition ${
        on ? "bg-accent text-accent-ink" : "border border-line bg-white/80 text-ink-soft"
      }`}
      aria-pressed={on}
    >
      <span aria-hidden>{on ? "★" : "☆"}</span>
      {on ? t("saved") : t("save")}
    </button>
  );
}
