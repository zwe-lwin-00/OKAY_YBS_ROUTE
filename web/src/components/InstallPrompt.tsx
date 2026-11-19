"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "ybs-finder-install-dismissed";

export function InstallPrompt() {
  const { t } = useLocale();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem(DISMISS_KEY) === "1") return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      ("standalone" in navigator &&
        Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    if (isStandalone) return;

    const ua = window.navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);

    function onBip(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", onBip);

    if (isIos && isSafari) {
      const timer = window.setTimeout(() => {
        setIosHint(true);
        setVisible(true);
      }, 2500);
      return () => {
        window.removeEventListener("beforeinstallprompt", onBip);
        window.clearTimeout(timer);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  if (!visible) return null;

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setVisible(false);
    setDeferred(null);
  }

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-50 px-3 md:bottom-4">
      <div className="surface mx-auto flex max-w-lg items-start gap-3 p-4 shadow-[var(--shadow)]">
        <div className="min-w-0 flex-1">
          <p className="font-[family-name:var(--font-syne)] font-bold tracking-tight text-ink">
            {t("install_title")}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            {iosHint ? t("install_ios") : t("install_body")}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          {deferred ? (
            <button
              type="button"
              onClick={() => void install()}
              className="btn-primary min-h-10 px-3"
            >
              {t("install_cta")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={dismiss}
            className="btn-secondary min-h-10 px-3 text-xs"
          >
            {t("install_dismiss")}
          </button>
        </div>
      </div>
    </div>
  );
}
