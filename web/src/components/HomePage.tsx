"use client";

import Link from "next/link";
import type { RouteSummary } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import { BrandMark } from "./BrandMark";
import { RouteRow } from "./RouteRow";
import { SearchBar } from "./SearchBar";

export function HomePage({
  routes,
  featured,
}: {
  routes: RouteSummary[];
  featured: RouteSummary[];
}) {
  const { t } = useLocale();

  return (
    <>
      <section className="animate-rise mx-auto max-w-2xl pt-4 text-center sm:pt-10 lg:max-w-none lg:text-left">
        <div className="flex justify-center lg:justify-start">
          <BrandMark size="lg" />
        </div>

        <div className="animate-rise-delay mt-8">
          <SearchBar large autofocus />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
          <Link
            href="/plan"
            className="inline-flex min-h-11 items-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink transition hover:brightness-95"
          >
            {t("trip_planner")}
          </Link>
          <Link
            href="/stops"
            className="inline-flex min-h-11 items-center rounded-full border border-line bg-white/70 px-4 text-sm font-semibold text-ink-soft transition hover:bg-white"
          >
            {t("stop_search")}
          </Link>
          <Link
            href="/nearby"
            className="inline-flex min-h-11 items-center rounded-full border border-line bg-white/70 px-4 text-sm font-semibold text-ink-soft transition hover:bg-white"
          >
            {t("nearby_stops")}
          </Link>
          <Link
            href="/routes"
            className="inline-flex min-h-11 items-center rounded-full border border-line bg-white/70 px-4 text-sm font-semibold text-ink-soft transition hover:bg-white"
          >
            {t("browse_routes", { n: routes.length })}
          </Link>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:mt-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="overflow-hidden rounded-3xl border border-line bg-white/55 px-3 backdrop-blur">
          <div className="flex items-end justify-between px-2 pb-2 pt-4">
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold">
              {t("popular_routes")}
            </h2>
            <Link href="/routes" className="text-sm font-medium text-brand">
              {t("see_all")}
            </Link>
          </div>
          {featured.map((route) => (
            <RouteRow key={route.slug} route={route} />
          ))}
        </div>

        <aside className="rounded-3xl border border-line bg-brand px-5 py-6 text-white shadow-[var(--shadow)]">
          <p className="font-[family-name:var(--font-syne)] text-xl font-bold">
            {t("built_for_phone")}
          </p>
          <p className="mm mt-2 text-sm text-white/85">{t("home_aside")}</p>
          <ul className="mt-5 space-y-2 text-sm text-white/90">
            <li>· {t("bullet_routes", { n: routes.length })}</li>
            <li>· {t("bullet_planner")}</li>
            <li>· {t("bullet_maps")}</li>
            <li>· {t("bullet_static")}</li>
          </ul>
        </aside>
      </section>
    </>
  );
}
