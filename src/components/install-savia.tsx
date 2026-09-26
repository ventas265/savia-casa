import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { BrandMark } from "@/components/brand-mark";

type BeforeInstall = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function inAppBrowser() {
  if (typeof navigator === "undefined") return false;
  return /WhatsApp|FBAN|FBAV|Instagram|Line\/|Twitter|wv\)/i.test(navigator.userAgent);
}

export function InstallSavia() {
  const { t } = useI18n();
  const [standalone, setStandalone] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstall | null>(null);
  // UA checks run after mount: the server can't know the phone (hydration #418).
  const [ios, setIos] = useState(false);
  const [trapped, setTrapped] = useState(false);

  useEffect(() => {
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setTrapped(inAppBrowser());
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
    }
  }

  return (
    <section className="rounded-[1.6rem] card-hot p-5">
      <div className="flex items-center gap-3">
        <BrandMark className="size-14 rounded-2xl" />
        <div>
          <p className="font-display text-xl font-semibold leading-tight">
            {trapped ? t.installInAppTitle : t.installTitle}
          </p>
          <p className="mt-1 text-sm opacity-90">{trapped ? t.installInApp : ios ? t.installIos : t.installAndroid}</p>
        </div>
      </div>
      {deferred && !trapped ? (
        <button
          type="button"
          onClick={() => void install()}
          className="press mt-4 flex h-12 w-full items-center justify-center rounded-full bg-white text-sm font-semibold text-[#130d12]"
        >
          {t.installCta}
        </button>
      ) : null}
    </section>
  );
}
