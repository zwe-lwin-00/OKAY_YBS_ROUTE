import Link from "next/link";
import { Suspense } from "react";
import { AdminEditor } from "@/components/AdminEditor";
import { isAdminUiEnabled } from "@/lib/admin-auth";

export const metadata = {
  title: "Admin · YBS data",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function AdminDisabled() {
  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 py-16">
      <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-ink">
        Admin unavailable
      </h1>
      <p className="mt-3 text-sm text-ink-soft">
        The data editor is turned off on this server. Set{" "}
        <code className="text-xs">ADMIN_UI_ENABLED=true</code> with a strong{" "}
        <code className="text-xs">ADMIN_TOKEN</code> to enable it.
      </p>
      <Link href="/" className="mt-6 inline-block text-sm font-semibold text-brand">
        ← Back to app
      </Link>
    </div>
  );
}

export default function AdminPage() {
  if (!isAdminUiEnabled()) {
    return <AdminDisabled />;
  }

  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-ink-soft">Loading admin…</div>
      }
    >
      <AdminEditor />
    </Suspense>
  );
}
