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
    <div className="mx-auto max-w-2xl">
      {/* One composition: brand → search → one CTA group */}
      <section className="animate-rise pt-2 text-center sm:pt-8">
        <div className="flex justify-center">
          <BrandMark size="lg" />
        </div>

        <div className="animate-rise-delay mt-8 sm:mt-10">
          <SearchBar large autofocus />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          <Link href="/plan" className="btn-primary">
            {t("trip_planner")}
          </Link>
          <Link href="/nearby" className="btn-secondary">
            {t("nearby_stops")}
          </Link>
        </div>

        <p className="mt-4 text-[0.8rem] text-ink-faint">
          <Link href="/stops" className="underline-offset-2 hover:text-brand hover:underline">
            {t("stop_search")}
          </Link>
          <span className="mx-2 text-line-strong">·</span>
          <Link href="/routes" className="underline-offset-2 hover:text-brand hover:underline">
            {t("browse_routes", { n: routes.length })}
          </Link>
        </p>
      </section>

      <section className="animate-rise-delay mt-10 sm:mt-12">
        <div className="mb-3 flex items-baseline justify-between gap-3 px-0.5">
          <h2 className="font-[family-name:var(--font-syne)] text-base font-bold tracking-tight text-ink">
            {t("popular_routes")}
          </h2>
          <Link
            href="/routes"
            className="text-[0.8rem] font-semibold text-brand hover:text-brand-deep"
          >
            {t("see_all")}
          </Link>
        </div>

        <div className="surface overflow-hidden px-1 sm:px-2">
          {featured.map((route) => (
            <RouteRow key={route.slug} route={route} />
          ))}
        </div>

        <p className="mm mt-5 text-center text-[0.8rem] leading-relaxed text-ink-faint">
          {t("bullet_static")} · {t("bullet_routes", { n: routes.length })}
        </p>
      </section>
    </div>
  );
}
