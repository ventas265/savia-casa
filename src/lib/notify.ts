import { todayISO } from "@/lib/cycle";

export type AlertKind = "period" | "today" | "tomorrow" | "soon" | "late" | "fertile" | "pms" | null;

export function periodAlert(left: number | null, onPeriod: boolean, phase?: string): AlertKind {
  if (onPeriod) return "period";
  if (left == null) return null;
  if (left < 0) return "late";
  if (left === 0) return "today";
  if (left === 1) return "tomorrow";
  if (left === 2) return "soon";
  if (phase === "luteal" && left >= 3 && left <= 7) return "pms";
  return null;
}

export function notifyPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function requestNotify(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return "unsupported";
  }
}

export function maybeNotify(opts: {
  kind: AlertKind;
  fertile: boolean;
  title: string;
  body: string;
}) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  const kind = opts.kind ?? (opts.fertile ? "fertile" : null);
  if (!kind) return;
  const key = `savia.notify.${todayISO()}.${kind}`;
  try {
    if (sessionStorage.getItem(key) || localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
  } catch {
    /* ignore */
  }
  try {
    new Notification(opts.title, { body: opts.body, icon: "/icon-192.png" });
  } catch {
    /* ignore */
  }
}
