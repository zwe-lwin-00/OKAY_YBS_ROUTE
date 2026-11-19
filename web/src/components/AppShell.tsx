"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/i18n";
import { BrandMark } from "./BrandMark";
import { LanguageToggle } from "./LanguageToggle";

function NavIcon({ name, active }: { name: string; active: boolean }) {
  const stroke = active ? "var(--brand)" : "currentColor";
  const common = {
    viewBox: "0 0 24 24",
    className: "h-[1.15rem] w-[1.15rem]",
    fill: "none",
    stroke,
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" />
        </svg>
      );
    case "plan":
      return (
        <svg {...common}>
          <circle cx="6.5" cy="6.5" r="2.2" />
          <circle cx="17.5" cy="17.5" r="2.2" />
          <path d="M8.3 8.3 15.7 15.7" />
        </svg>
      );
    case "stops":
      return (
        <svg {...common}>
          <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z" />
          <circle cx="12" cy="11" r="2" />
        </svg>
      );
    case "routes":
      return (
        <svg {...common}>
          <path d="M4 7h10a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h11" />
          <path d="M18 7v0M6 19v0" />
        </svg>
      );
    case "fav":
      return (
        <svg {...common}>
          <path d="M12 18.2 6.8 21l1-5.8L3.5 10.8l5.9-.8L12 4.8l2.6 5.2 5.9.8-4.3 4.4 1 5.8z" />
        </svg>
      );
    default:
      return null;
  }
}

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
    { href: "/", label: t("nav_home"), icon: "home" },
    { href: "/plan", label: t("nav_plan"), icon: "plan" },
    { href: "/stops", label: t("nav_stops"), icon: "stops" },
    { href: "/routes", label: t("nav_routes"), icon: "routes" },
    { href: "/favorites", label: t("nav_fav"), icon: "fav" },
  ];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 pb-[calc(5.25rem+env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pb-12 sm:pt-5 lg:px-8">
      <header className="mb-5 flex items-center justify-between gap-3 sm:mb-7">
        <Link href="/" className="min-w-0 rounded-xl">
          <BrandMark size={compactBrand ? "sm" : "sm"} />
        </Link>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <nav
            className="hidden items-center gap-0.5 rounded-full border border-line bg-bg-elevated p-1 shadow-[var(--shadow-sm)] lg:flex"
            aria-label="Primary"
          >
            {nav.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3.5 py-2 text-[0.8125rem] font-semibold tracking-tight transition ${
                    active
                      ? "bg-brand text-white"
                      : "text-ink-soft hover:bg-brand-soft hover:text-brand"
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

      <footer className="mt-12 hidden border-t border-line pt-4 text-xs text-ink-faint md:block">
        {t("footer_note")}
      </footer>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg-elevated/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 backdrop-blur-md lg:hidden"
        aria-label="Primary"
      >
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {nav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-xl text-[0.65rem] font-semibold tracking-wide transition ${
                    active ? "text-brand" : "text-ink-faint"
                  }`}
                >
                  <NavIcon name={item.icon} active={active} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
