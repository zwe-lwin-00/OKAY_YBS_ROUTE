import { AppShell } from "@/components/AppShell";
import { NearbyClient } from "@/components/NearbyClient";
import { getRouteSummaries } from "@/lib/data";

export const metadata = {
  title: "Nearby stops",
};

export default async function NearbyPage() {
  const routes = await getRouteSummaries();

  return (
    <AppShell>
      <NearbyClient routes={routes} />
    </AppShell>
  );
}
