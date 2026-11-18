"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { StopPlace } from "@/lib/types";
import { useLocale } from "@/lib/i18n";

type StopPickerProps = {
  label: string;
  placeholder: string;
  value: StopPlace | null;
  onChange: (place: StopPlace | null) => void;
};

export function StopPicker({
  label,
  placeholder,
  value,
  onChange,
}: StopPickerProps) {
  const id = useId();
  const { t } = useLocale();
  const [query, setQuery] = useState(value?.name_en ?? "");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<StopPlace[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) setQuery(value.name_en);
  }, [value]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (value && q === value.name_en) return;

    const handle = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/stops/search?q=${encodeURIComponent(q)}&limit=12`,
        );
        const data = (await res.json()) as { stops: StopPlace[] };
        setResults(data.stops ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => window.clearTimeout(handle);
  }, [query, open, value]);

  const ambiguousInResults = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of results) {
      const key = s.name_en.trim().toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [results]);

  return (
    <div ref={wrapRef} className="relative">
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-soft"
      >
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-2xl border border-line bg-white/85 p-2 shadow-[var(--shadow)] backdrop-blur">
        <input
          id={id}
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (value) onChange(null);
          }}
          className="min-h-11 min-w-0 flex-1 bg-transparent px-2 text-base outline-none placeholder:text-ink-soft/70"
        />
        {value ? (
          <button
            type="button"
            className="rounded-xl px-2 py-2 text-xs font-semibold text-ink-soft"
            onClick={() => {
              onChange(null);
              setQuery("");
              setOpen(true);
            }}
          >
            {t("clear")}
          </button>
        ) : null}
      </div>

      {value ? (
        <div className="mt-1.5 space-y-1">
          <p className="mm truncate text-xs text-ink-soft">
            {value.name_mm}
            {value.road ? ` · ${value.road}` : ""}
          </p>
          {value.ambiguous ? (
            <p className="rounded-xl bg-accent/20 px-2 py-1 text-[11px] font-medium text-accent-ink">
              {value.ambiguity_hint}
            </p>
          ) : null}
        </div>
      ) : null}

      {open ? (
        <ul className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-line bg-white py-1 shadow-[var(--shadow)]">
          {loading ? (
            <li className="px-3 py-3 text-sm text-ink-soft">{t("searching")}</li>
          ) : results.length ? (
            results.map((stop) => {
              const nameKey = stop.name_en.trim().toLowerCase();
              const dupInList = (ambiguousInResults.get(nameKey) ?? 0) > 1;
              const showAmbiguous = stop.ambiguous || dupInList;
              return (
                <li key={stop.id}>
                  <button
                    type="button"
                    className="flex w-full flex-col items-start px-3 py-2.5 text-left hover:bg-brand/8"
                    onClick={() => {
                      onChange(stop);
                      setQuery(stop.name_en);
                      setOpen(false);
                    }}
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink">{stop.name_en}</span>
                      {showAmbiguous ? (
                        <span className="rounded-full bg-accent/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-ink">
                          {t("check_side")}
                        </span>
                      ) : null}
                    </span>
                    <span className="mm text-xs text-ink-soft">
                      {stop.name_mm}
                      {stop.road ? ` · ${stop.road}` : ""}
                    </span>
                    <span className="mt-0.5 text-[11px] text-ink-soft/80">
                      {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)} ·{" "}
                      {t("routes_count", { n: stop.route_count })}
                      {stop.same_name_count && stop.same_name_count > 1
                        ? ` · ${t("places_named", { n: stop.same_name_count })}`
                        : ""}
                    </span>
                  </button>
                </li>
              );
            })
          ) : (
            <li className="px-3 py-3 text-sm text-ink-soft">
              {query.trim() ? t("no_stops_found") : t("type_to_search")}
            </li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
