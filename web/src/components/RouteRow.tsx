import Link from "next/link";
import type { RouteSummary } from "@/lib/types";

export function RouteRow({ route }: { route: RouteSummary }) {
  return (
    <Link
      href={`/routes/${route.slug}`}
      className="group flex items-center gap-3 border-b border-line py-3.5 transition hover:bg-white/50 active:bg-white/70 sm:gap-4 sm:px-2"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand text-sm font-bold text-white shadow-[0_8px_20px_rgba(11,107,82,0.25)] transition group-hover:bg-brand-deep">
        {route.route_name.length > 4
          ? route.route_name.slice(0, 3)
          : route.route_name}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-[family-name:var(--font-syne)] text-base font-semibold text-ink">
            Line {route.bus_line}
          </p>
          {route.qrSupported ? (
            <span className="rounded-full bg-accent/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-ink">
              QR
            </span>
          ) : null}
        </div>
        <p className="mm mt-0.5 truncate text-sm text-ink-soft">{route.line_name}</p>
        <p className="mt-1 text-xs text-ink-soft/80">
          {route.agency} · {route.total_stops} stops
        </p>
      </div>
      <span className="text-brand transition group-hover:translate-x-0.5" aria-hidden>
        →
      </span>
    </Link>
  );
}
