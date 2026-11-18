"use client";

import { useMemo, useState } from "react";
import type { RouteSummary } from "@/lib/types";
import { filterRoutes, uniqueAgencies } from "@/lib/search";
import { useLocale } from "@/lib/i18n";
import { EmptyState } from "./EmptyState";
import { RouteRow } from "./RouteRow";

export function RoutesExplorer({
  routes,
  initialQuery = "",
}: {
  routes: RouteSummary[];
  initialQuery?: string;
}) {
  const { t } = useLocale();
  const [query, setQuery] = useState(initialQuery);
  const [qrOnly, setQrOnly] = useState(false);
  const [agency, setAgency] = useState("");
  const agencies = useMemo(() => uniqueAgencies(routes), [routes]);

  const filtered = useMemo(
    () => filterRoutes(routes, query, { qrOnly, agency: agency || undefined }),
    [routes, query, qrOnly, agency],
  );

  return (
    <div>
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-[1.25rem] border border-line bg-white/85 p-2 shadow-[var(--shadow)] backdrop-blur">
          <span className="grid h-11 w-11 place-items-center text-brand" aria-hidden>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search_routes_ph")}
            className="min-h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ink-soft/70"
            autoFocus
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-white/70 px-3 text-sm">
            <input
              type="checkbox"
              checked={qrOnly}
              onChange={(e) => setQrOnly(e.target.checked)}
              className="accent-[var(--brand)]"
            />
            QR
          </label>
          <select
            value={agency}
            onChange={(e) => setAgency(e.target.value)}
            className="min-h-11 rounded-full border border-line bg-white/70 px-3 text-sm outline-none"
          >
            <option value="">All agencies</option>
            {agencies.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-4 text-sm text-ink-soft">
        {t("routes_count", { n: filtered.length })}
      </p>

      {filtered.length ? (
        <div className="mt-2 overflow-hidden rounded-3xl border border-line bg-white/55 px-3 backdrop-blur">
          {filtered.map((route) => (
            <RouteRow key={route.slug} route={route} />
          ))}
        </div>
      ) : (
        <div className="mt-3">
          <EmptyState title={t("empty_routes")} />
        </div>
      )}
    </div>
  );
}
