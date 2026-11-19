"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useLocale } from "@/lib/i18n";

type SearchBarProps = {
  initialQuery?: string;
  placeholder?: string;
  autofocus?: boolean;
  large?: boolean;
};

export function SearchBar({
  initialQuery = "",
  placeholder,
  autofocus = false,
  large = false,
}: SearchBarProps) {
  const router = useRouter();
  const { t } = useLocale();
  const [query, setQuery] = useState(initialQuery);
  const ph = placeholder ?? t("search_routes_ph");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/routes?q=${encodeURIComponent(q)}` : "/routes");
  }

  return (
    <form onSubmit={onSubmit} className="w-full" role="search">
      <label className="sr-only" htmlFor="ybs-search">
        {t("search")}
      </label>
      <div
        className={`flex items-center gap-2 border border-line bg-white/85 shadow-[var(--shadow)] backdrop-blur ${
          large ? "rounded-[1.4rem] p-2" : "rounded-2xl p-1.5"
        }`}
      >
        <span
          className={`grid place-items-center text-brand ${large ? "h-12 w-12" : "h-10 w-10"}`}
          aria-hidden
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
        </span>
        <input
          id="ybs-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus={autofocus}
          enterKeyHint="search"
          autoComplete="off"
          placeholder={ph}
          className={`min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-soft/70 ${
            large ? "text-base sm:text-lg" : "text-sm sm:text-base"
          }`}
        />
        <button
          type="submit"
          className={`shrink-0 rounded-xl bg-brand font-semibold text-white transition hover:bg-brand-deep active:scale-[0.98] ${
            large ? "min-h-12 px-5 text-sm sm:px-6" : "min-h-10 px-4 text-sm"
          }`}
        >
          {t("search")}
        </button>
      </div>
    </form>
  );
}
