import Link from "next/link";
import { AppShell } from "@/components/AppShell";

export default function NotFound() {
  return (
    <AppShell>
      <div className="mx-auto max-w-md surface p-8 text-center">
        <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold">
          Not found
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          That route or page does not exist in the catalog.
        </p>
        <Link
          href="/routes"
          className="mt-5 inline-flex min-h-11 items-center rounded-full bg-brand px-5 text-sm font-semibold text-white"
        >
          Browse routes
        </Link>
      </div>
    </AppShell>
  );
}
