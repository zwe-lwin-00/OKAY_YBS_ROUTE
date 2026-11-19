"use client";

import { LocaleProvider } from "@/lib/i18n";
import { InstallPrompt } from "./InstallPrompt";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      {children}
      <InstallPrompt />
    </LocaleProvider>
  );
}
