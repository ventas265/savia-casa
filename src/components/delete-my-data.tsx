import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { deleteMyData } from "@/lib/delete-device";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function readCreds(): { deviceId: string; token: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const deviceId = window.localStorage.getItem("savia.device") || "";
    const token = window.localStorage.getItem("savia.token") || "";
    if (deviceId.length < 8 || token.length < 16) return null;
    return { deviceId, token };
  } catch {
    return null;
  }
}

/** Drop this browser's Savia copies. Does not create a device id. */
async function clearThisBrowser() {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        try {
          const sub = await reg.pushManager.getSubscription();
          await sub?.unsubscribe();
        } catch {
          /* already gone */
        }
      }
    }
  } catch {
    /* ignore */
  }
  try {
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n.startsWith("savia")).map((n) => caches.delete(n)));
    }
  } catch {
    /* ignore */
  }
  try {
    const { authClient } = await import("@/lib/auth/client");
    await authClient.signOut();
  } catch {
    /* no session */
  }
  try {
    const drop: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith("savia.") || k.startsWith("savia-"))) drop.push(k);
    }
    for (const k of drop) localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
  try {
    const drop: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && (k.startsWith("savia.") || k.startsWith("savia-") || k === "grok-auth.bearer-token")) drop.push(k);
    }
    for (const k of drop) sessionStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}

export function DeleteMyData() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const ready = word.trim().toUpperCase() === t.wipeWord;

  async function confirm() {
    if (!ready || busy) return;
    setBusy(true);
    setErr("");
    const creds = readCreds();
    if (!creds) {
      setErr(t.wipeFail);
      setBusy(false);
      return;
    }
    try {
      const res = await deleteMyData({ data: creds });
      if (!res.ok) {
        setErr(t.wipeFail);
        setBusy(false);
        return;
      }
      await clearThisBrowser();
      window.location.assign("/");
    } catch {
      setErr(t.wipeFail);
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 rounded-[22px] border border-[rgb(242_66_126/0.35)] p-5" data-testid="delete-my-data">
      <h2 className="font-display text-lg font-semibold tracking-[-0.02em]">{t.wipeTitle}</h2>
      <p className="mt-2 text-sm leading-relaxed text-soft">{t.wipeBody}</p>
      {!open ? (
        <Button type="button" variant="danger" className="mt-4" onClick={() => setOpen(true)} data-testid="delete-open">
          {t.wipeTitle}
        </Button>
      ) : (
        <div className="mt-4 space-y-3" data-testid="delete-confirm">
          <p className="text-sm leading-relaxed">{t.wipeAsk}</p>
          <Input
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder={t.wipePlaceholder}
            autoComplete="off"
            autoCapitalize="characters"
            aria-label={t.wipePlaceholder}
            data-testid="delete-word"
          />
          {err ? <p className="text-sm text-[#ffb0cc]">{err}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="danger" disabled={!ready || busy} onClick={() => void confirm()} data-testid="delete-go">
              {t.wipeConfirm}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => {
                setOpen(false);
                setWord("");
                setErr("");
              }}
            >
              {t.wipeCancel}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
