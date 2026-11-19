import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { CardSkeleton } from "@/components/Skeleton";
import { StopSearchPage } from "@/components/StopSearchPage";

export const metadata = {
  title: "Stop search",
  description: "Find every YBS bus line that passes a stop",
};

type PageProps = {
  searchParams: Promise<{ id?: string }>;
};

export default async function StopsPage({ searchParams }: PageProps) {
  const { id } = await searchParams;

  return (
    <AppShell>
      <Suspense fallback={<CardSkeleton />}>
        <StopSearchPage initialStopId={id} />
      </Suspense>
    </AppShell>
  );
}
