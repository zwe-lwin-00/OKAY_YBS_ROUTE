import Link from "next/link";
import type { RouteSummary } from "@/lib/types";

export function RouteRow({ route }: { route: RouteSummary }) {
  const badge =
    route.route_name.length > 4
      ? route.route_name.slice(0, 3)
      : route.route_name;

  return (
    <Link
      href={`/routes/${route.slug}`}
      className="group flex items-center gap-3 border-b border-line px-2 py-3.5 last:border-b-0 transition hover:bg-brand-soft/60 active:bg-brand-soft sm:gap-3.5 sm:px-3"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[0.8rem] bg-brand-soft text-[0.8rem] font-bold tracking-tight text-brand transition group-hover:bg-brand group-hover:text-white">
        {badge}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-[family-name:var(--font-syne)] text-[0.95rem] font-semibold tracking-tight text-ink">
            Line {route.bus_line}
          </p>
          {route.qrSupported ? (
            <span className="rounded-md bg-accent/20 px-1.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider text-accent-ink">
              QR
            </span>
          ) : null}
        </div>
        <p className="mm mt-0.5 truncate text-[0.8125rem] text-ink-soft">
          {route.line_name}
        </p>
        <p className="mt-1 text-[0.7rem] text-ink-faint">
          {route.agency} · {route.total_stops} stops
        </p>
      </div>
      <span
        className="text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-brand"
        aria-hidden
      >
        →
      </span>
    </Link>
  );
}
