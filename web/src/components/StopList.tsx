"use client";

import { useMemo, useState } from "react";
import type { Stop } from "@/lib/types";
import { filterStops } from "@/lib/search";

export function StopList({ stops }: { stops: Stop[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => filterStops(stops, q), [stops, q]);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 rounded-2xl border border-line bg-bg-elevated p-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter stops (EN / မြန်မာ)"
          className="min-h-11 w-full bg-transparent px-2 text-sm outline-none placeholder:text-ink-soft/70"
        />
      </div>
      <p className="mb-2 text-xs text-ink-soft">
        Showing {filtered.length} of {stops.length} stops
      </p>
      <ol className="divide-y divide-line">
        {filtered.map((stop) => (
          <li key={`${stop.index}-${stop.stop_name_en}`} className="py-3">
            <div className="flex gap-3">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                {stop.index}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-ink">{stop.stop_name_en}</p>
                <p className="mm text-sm text-ink-soft">{stop.stop_name_mm}</p>
                {stop.road ? (
                  <p className="mt-1 text-xs text-ink-soft/80">{stop.road}</p>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ol>
      {!filtered.length ? (
        <p className="py-8 text-center text-sm text-ink-soft">No stops match.</p>
      ) : null}
    </div>
  );
}
