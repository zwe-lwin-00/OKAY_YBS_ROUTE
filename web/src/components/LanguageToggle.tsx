"use client";

import { useLocale } from "@/lib/i18n";

export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div
      className="inline-flex items-center rounded-full border border-line bg-white/70 p-1"
      role="group"
      aria-label={t("language")}
    >
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`min-h-9 rounded-full px-3 text-xs font-bold transition ${
          locale === "en" ? "bg-brand text-white" : "text-ink-soft"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale("mm")}
        className={`min-h-9 rounded-full px-3 text-xs font-bold transition ${
          locale === "mm" ? "bg-brand text-white" : "text-ink-soft"
        }`}
      >
        မြန်
      </button>
    </div>
  );
}
