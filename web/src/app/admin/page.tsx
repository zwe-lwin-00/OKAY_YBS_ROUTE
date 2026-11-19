import { Suspense } from "react";
import { AdminEditor } from "@/components/AdminEditor";

export const metadata = {
  title: "Admin · YBS data",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
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
