import { AppShell } from "@/components/AppShell";
import { HomePage } from "@/components/HomePage";
import { getRouteSummaries } from "@/lib/data";

export default async function Page() {
  const routes = await getRouteSummaries();
  const featured = routes.slice(0, 8);

  return (
    <AppShell>
      <HomePage routes={routes} featured={featured} />
    </AppShell>
  );
}
