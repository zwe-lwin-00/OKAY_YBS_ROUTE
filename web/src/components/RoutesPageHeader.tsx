"use client";

import { useLocale } from "@/lib/i18n";

export function RoutesPageHeader() {
  const { t } = useLocale();
  return (
    <div className="mb-5">
      <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-ink sm:text-3xl">
        {t("all_routes")}
      </h1>
      <p className="mm mt-1 text-sm text-ink-soft">{t("all_routes_sub")}</p>
    </div>
  );
}
