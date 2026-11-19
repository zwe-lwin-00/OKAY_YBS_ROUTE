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
  const [focused, setFocused] = useState(false);
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
        className={`flex items-center gap-1 border bg-bg-elevated transition ${
          large ? "rounded-[1.15rem] p-1.5" : "rounded-[0.95rem] p-1"
        } ${
          focused
            ? "border-brand/40 shadow-[var(--shadow)]"
            : "border-line shadow-[var(--shadow-sm)]"
        }`}
      >
        <span
          className={`grid place-items-center text-ink-faint ${large ? "h-11 w-11" : "h-10 w-10"}`}
          aria-hidden
        >
          <svg
            viewBox="0 0 24 24"
            className="h-[1.15rem] w-[1.15rem]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.2-3.2" />
          </svg>
        </span>
        <input
          id="ybs-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoFocus={autofocus}
          enterKeyHint="search"
          autoComplete="off"
          placeholder={ph}
          className={`min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-faint ${
            large ? "py-2.5 text-[0.95rem] sm:text-base" : "py-2 text-sm sm:text-[0.95rem]"
          }`}
        />
        <button
          type="submit"
          className={`shrink-0 rounded-full bg-brand font-semibold text-white transition hover:bg-brand-deep active:scale-[0.98] ${
            large ? "min-h-11 px-5 text-sm" : "min-h-10 px-4 text-sm"
          }`}
        >
          {t("search")}
        </button>
      </div>
    </form>
  );
}
