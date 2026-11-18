import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { TripPlanner } from "@/components/TripPlanner";

export const metadata = {
  title: "Trip planner",
  description:
    "Plan Yangon YBS trips with direct, 1-transfer, or 2-transfer options, maps, and shareable links",
};

function PlanFallback() {
  return (
    <div className="rounded-3xl border border-line bg-white/65 p-5 text-sm text-ink-soft">
      Loading planner…
    </div>
  );
}

export default function PlanPage() {
  return (
    <AppShell>
      <Suspense fallback={<PlanFallback />}>
        <TripPlanner />
      </Suspense>
    </AppShell>
  );
}
