import { addDaysISO, todayISO } from "@/lib/cycle";
import type { AlertKind } from "@/lib/notify";
import { requestNotify } from "@/lib/notify";

export type RemindItem = { day: string; kind: string; title: string; body: string };

export async function enableReminders() {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported" as const;
  const perm = await requestNotify();
  if (perm === "granted" && "serviceWorker" in navigator) {
    await navigator.serviceWorker.register("/savia-sw.js").catch(() => {});
  }
  return perm;
}

export async function armReminders(items: RemindItem[]) {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return false;
  if (!("Notification" in window) || Notification.permission !== "granted") return false;
  try {
    if (sessionStorage.getItem("savia.armed") === "1") {
      const cache = await caches.open("savia-remind");
      await cache.put(
        "/savia-remind-plan",
        new Response(JSON.stringify({ items }), { headers: { "content-type": "application/json" } }),
      );
      return true;
    }
    await navigator.serviceWorker.register("/savia-sw.js");
    const cache = await caches.open("savia-remind");
    await cache.put(
      "/savia-remind-plan",
      new Response(JSON.stringify({ items }), { headers: { "content-type": "application/json" } }),
    );
    const ready = await navigator.serviceWorker.ready;
    const sync = (
      ready as ServiceWorkerRegistration & {
        periodicSync?: { register: (t: string, o: { minInterval: number }) => Promise<void> };
      }
    ).periodicSync;
    if (sync) {
      await sync.register("savia-daily", { minInterval: 6 * 60 * 60 * 1000 }).catch(() => {});
    }
    sessionStorage.setItem("savia.armed", "1");
    return true;
  } catch {
    return false;
  }
}

export function remindPlan(opts: {
  nextPeriod: string | null;
  onPeriod: boolean;
  kind: AlertKind;
  titles: Record<string, { title: string; body: string }>;
}): RemindItem[] {
  const items: RemindItem[] = [];
  const t = opts.titles;
  if (opts.onPeriod && t.period) items.push({ day: todayISO(), kind: "period", ...t.period });
  if (opts.nextPeriod) {
    if (t.today) items.push({ day: opts.nextPeriod, kind: "today", ...t.today });
    if (t.tomorrow) items.push({ day: addDaysISO(opts.nextPeriod, -1), kind: "tomorrow", ...t.tomorrow });
    if (t.soon) items.push({ day: addDaysISO(opts.nextPeriod, -2), kind: "soon", ...t.soon });
  }
  if (opts.kind === "pms" && t.pms) items.push({ day: todayISO(), kind: "pms", ...t.pms });
  return items;
}
