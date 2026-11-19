import Link from "next/link";
import { AppShell } from "@/components/AppShell";

export const metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <AppShell>
      <div className="surface p-6 shadow-[var(--shadow)]">
        <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-ink">
          You&apos;re offline
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Cached pages may still work. Reconnect to plan new trips or refresh
          route data.
        </p>
        <p className="mm mt-1 text-sm text-ink-soft">
          အင်တာနက် ပြတ်နေသည်။ Cache လုပ်ထားသော စာမျက်နှာများကို သုံးနိုင်သည်။
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex min-h-11 items-center rounded-2xl bg-brand px-4 text-sm font-bold text-white"
        >
          Go home
        </Link>
      </div>
    </AppShell>
  );
}
