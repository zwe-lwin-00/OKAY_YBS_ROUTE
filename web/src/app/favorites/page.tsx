import { AppShell } from "@/components/AppShell";
import { FavoritesPage } from "@/components/FavoritesPage";

export const metadata = {
  title: "Saved",
  description: "Saved YBS lines and stops on this device",
};

export default function FavoritesRoutePage() {
  return (
    <AppShell>
      <FavoritesPage />
    </AppShell>
  );
}
