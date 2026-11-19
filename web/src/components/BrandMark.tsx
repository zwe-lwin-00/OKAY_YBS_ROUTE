"use client";

import { useLocale } from "@/lib/i18n";

type BrandMarkProps = {
  size?: "sm" | "lg";
};

export function BrandMark({ size = "sm" }: BrandMarkProps) {
  const { t } = useLocale();
  const large = size === "lg";

  return (
    <div className={`inline-flex items-center ${large ? "gap-4" : "gap-2.5"}`}>
      <span
        className={`grid shrink-0 place-items-center rounded-[0.85rem] bg-brand text-white ${
          large ? "h-12 w-12 sm:h-14 sm:w-14" : "h-9 w-9"
        }`}
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          className={large ? "h-6 w-6 sm:h-7 sm:w-7" : "h-[1.15rem] w-[1.15rem]"}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        >
          <rect x="3.5" y="7" width="17" height="10" rx="2.4" />
          <path d="M7 17v2.2M17 17v2.2M3.5 12h17" />
          <circle cx="8" cy="14.4" r="0.95" fill="currentColor" stroke="none" />
          <circle cx="16" cy="14.4" r="0.95" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <div className="min-w-0 leading-none">
        <p
          className={`font-[family-name:var(--font-syne)] font-bold tracking-[-0.03em] text-ink ${
            large ? "text-[1.85rem] sm:text-[2.35rem]" : "text-[1.05rem]"
          }`}
        >
          YBS Finder
        </p>
        {large ? (
          <p className="mm mt-2.5 max-w-[20rem] text-[0.95rem] leading-snug text-ink-soft">
            {t("brand_tagline")}
          </p>
        ) : (
          <p className="mt-1 text-[0.7rem] font-medium tracking-wide text-ink-faint">
            {t("brand_sub")}
          </p>
        )}
      </div>
    </div>
  );
}
