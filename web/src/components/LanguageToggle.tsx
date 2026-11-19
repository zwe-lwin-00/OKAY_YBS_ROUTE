"use client";

import { useLocale } from "@/lib/i18n";

export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      className="inline-flex items-center rounded-full border border-line bg-bg-elevated p-0.5 shadow-[var(--shadow-sm)]"
      role="group"
      aria-label={t("language")}
    >
      {(
        [
          ["en", "EN"],
          ["mm", "မြန်"],
        ] as const
      ).map(([code, label]) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={`min-h-8 rounded-full px-2.5 text-[0.7rem] font-bold tracking-wide transition ${
            locale === code
              ? "bg-ink text-white"
              : "text-ink-faint hover:text-ink-soft"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
