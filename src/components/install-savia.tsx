import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { BrandMark } from "@/components/brand-mark";

type BeforeInstall = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallSavia() {
  const { t } = useI18n();
  const [standalone, setStandalone] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstall | null>(null);
  const ios = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const navStandalone = "standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    setStandalone(media.matches || navStandalone);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstall);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (standalone) return null;

  async function install() {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") setDeferred(null);
      return;
    }
    const q = ios ? "?install=1&platform=ios" : "?install=1";
    window.location.assign(`/${q}`);
  }

  return (
    <section className="rounded-[1.6rem] bg-plum p-5 text-primary-fg shadow-card">
      <div className="flex items-center gap-3">
        <BrandMark className="size-14 rounded-2xl" />
        <div>
          <p className="font-display text-xl font-semibold leading-tight">{t.installTitle}</p>
          <p className="mt-1 text-sm opacity-90">{t.installBody}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => void install()}
        className="press mt-4 flex h-12 w-full items-center justify-center rounded-full bg-surface text-sm font-semibold text-primary"
      >
        {t.installCta}
      </button>
      <p className="mt-3 text-xs leading-relaxed opacity-80">{ios ? t.installIos : t.installAndroid}</p>
    </section>
  );
}
