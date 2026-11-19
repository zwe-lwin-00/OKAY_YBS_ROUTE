import { AppShell } from "@/components/AppShell";
import { RoutesExplorer } from "@/components/RoutesExplorer";
import { RoutesPageHeader } from "@/components/RoutesPageHeader";
import { getRouteSummaries } from "@/lib/data";

export const metadata = {
  title: "All routes",
};

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function RoutesPage({ searchParams }: PageProps) {
  const { q = "" } = await searchParams;
  const routes = await getRouteSummaries();

  return (
    <AppShell>
      <RoutesPageHeader />
      <RoutesExplorer routes={routes} initialQuery={q} />
    </AppShell>
  );
}
