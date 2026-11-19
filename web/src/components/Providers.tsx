"use client";

import { LocaleProvider } from "@/lib/i18n";
import { InstallPrompt } from "./InstallPrompt";
import { ServiceWorkerRegister } from "./ServiceWorkerRegister";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      {children}
      <InstallPrompt />
      <ServiceWorkerRegister />
    </LocaleProvider>
  );
}
