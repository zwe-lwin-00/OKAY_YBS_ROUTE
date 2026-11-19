"use client";

import { useLocale } from "@/lib/i18n";

type BrandMarkProps = {
  size?: "sm" | "lg";
};

export function BrandMark({ size = "sm" }: BrandMarkProps) {
  const { t } = useLocale();
  const large = size === "lg";
  return (
    <div className="inline-flex items-center gap-3">
      <span
        className={`relative grid place-items-center rounded-2xl bg-brand text-white shadow-[0_10px_30px_rgba(11,107,82,0.35)] ${
          large ? "h-14 w-14" : "h-10 w-10"
        }`}
        aria-hidden
      >
        <span className="absolute inset-1 rounded-xl border border-white/25" />
        <svg
          viewBox="0 0 24 24"
          className={large ? "h-7 w-7" : "h-5 w-5"}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <rect x="3.5" y="7" width="17" height="10" rx="2.5" />
          <path d="M7 17v2.5M17 17v2.5M3.5 12h17" />
          <circle cx="8" cy="14.5" r="1" fill="currentColor" stroke="none" />
          <circle cx="16" cy="14.5" r="1" fill="currentColor" stroke="none" />
        </svg>
        <span className="animate-pulse-soft absolute -right-1 -top-1 h-3 w-3 rounded-full bg-accent" />
      </span>
      <div className="leading-none">
        <p
          className={`font-[family-name:var(--font-syne)] font-bold tracking-tight text-ink ${
            large ? "text-3xl sm:text-4xl" : "text-lg"
          }`}
        >
          YBS Finder
        </p>
        {large ? (
          <p className="mm mt-2 max-w-[18rem] text-sm text-ink-soft sm:text-base">
            {t("brand_tagline")}
          </p>
        ) : (
          <p className="mt-1 text-xs text-ink-soft">{t("brand_sub")}</p>
        )}
      </div>
    </div>
  );
}
