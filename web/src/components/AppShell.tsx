"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/i18n";
import { BrandMark } from "./BrandMark";
import { LanguageToggle } from "./LanguageToggle";

export function AppShell({
  children,
  compactBrand = false,
}: {
  children: React.ReactNode;
  compactBrand?: boolean;
}) {
  const { t } = useLocale();
  const pathname = usePathname();

  const nav = [
    { href: "/", label: t("nav_home") },
    { href: "/plan", label: t("nav_plan") },
    { href: "/stops", label: t("nav_stops") },
    { href: "/routes", label: t("nav_routes") },
    { href: "/favorites", label: t("nav_fav") },
  ];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-10 lg:px-8">
      <header className="mb-6 flex items-center justify-between gap-3">
        <Link href="/" className="min-w-0">
          <BrandMark size={compactBrand ? "sm" : "sm"} />
        </Link>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <nav className="hidden items-center gap-1 rounded-full border border-line bg-white/60 p-1 backdrop-blur lg:flex">
            {nav.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-brand text-white"
                      : "text-ink-soft hover:bg-brand hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-10 hidden border-t border-line pt-4 text-xs text-ink-soft md:block">
        {t("footer_note")}
      </footer>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/90 px-1 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur lg:hidden"
        aria-label="Primary"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5 gap-0.5">
          {nav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex min-h-12 flex-col items-center justify-center rounded-2xl text-[11px] font-semibold transition ${
                    active
                      ? "bg-brand/10 text-brand"
                      : "text-ink-soft active:bg-brand/10 active:text-brand"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
