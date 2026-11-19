import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { FavoriteRouteButton } from "@/components/FavoriteButton";
import { RouteMap } from "@/components/RouteMap";
import { StopList } from "@/components/StopList";
import { getRouteBySlug } from "@/lib/data";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const result = await getRouteBySlug(slug);
  if (!result) return { title: "Route not found" };
  return {
    title: `Line ${result.summary.bus_line}`,
    description: result.summary.line_name,
  };
}

export default async function RouteDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await getRouteBySlug(slug);
  if (!result) notFound();

  const { summary, data } = result;
  const first = data.stops[0];
  const last = data.stops[data.stops.length - 1];

  return (
    <AppShell>
      <div className="mb-4">
        <Link href="/routes" className="text-sm font-medium text-brand">
          ← All routes
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
        <section className="rounded-3xl border border-line bg-white/65 p-5 shadow-[var(--shadow)] backdrop-blur">
          <div className="flex flex-wrap items-start gap-3">
            <span className="grid h-14 min-w-14 place-items-center rounded-2xl bg-brand px-3 text-lg font-bold text-white">
              {summary.route_name}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-ink">
                Line {summary.bus_line}
              </h1>
              <p className="mm mt-1 text-sm text-ink-soft">{summary.line_name}</p>
            </div>
            <FavoriteRouteButton route={summary} />
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-soft">Agency</dt>
              <dd className="mt-1 font-semibold">{summary.agency}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-soft">Stops</dt>
              <dd className="mt-1 font-semibold">{data.stops.length}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-soft">QR</dt>
              <dd className="mt-1 font-semibold">
                {summary.qrSupported ? "Supported" : "Not available"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-soft">Type</dt>
              <dd className="mt-1 font-semibold capitalize">{summary.route_type}</dd>
            </div>
          </dl>

          {first && last ? (
            <p className="mt-4 rounded-2xl bg-brand/8 px-3 py-3 text-sm text-ink-soft">
              <span className="font-semibold text-ink">{first.stop_name_en}</span>
              <span className="mx-2 text-brand">→</span>
              <span className="font-semibold text-ink">{last.stop_name_en}</span>
            </p>
          ) : null}

          <div className="mt-6 lg:hidden">
            <RouteMap stops={data.stops} className="h-72 w-full" />
          </div>

          <div className="mt-6">
            <h2 className="mb-2 font-[family-name:var(--font-syne)] text-lg font-bold">
              Stops
            </h2>
            <StopList stops={data.stops} />
          </div>
        </section>

        <aside className="hidden lg:sticky lg:top-4 lg:block">
          <RouteMap stops={data.stops} className="h-[min(70vh,640px)] w-full" />
          <p className="mt-3 text-xs text-ink-soft">
            Map shows ordered stops. Ends highlighted in amber.
          </p>
        </aside>
      </div>
    </AppShell>
  );
}
