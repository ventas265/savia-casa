/**
 * Web Push on the client: permission, subscription via public/savia-sw.js,
 * and the calls to /api/push/*. iOS only supports Web Push for web apps added
 * to the home screen (iOS 16.4+), so there we show the steps instead.
 */
import { deviceCreds } from "@/lib/savia-api";
import { localToday } from "@/lib/savia-local";

const KEY = "savia.push.v1";
export const DEFAULT_PUSH_HOUR = 9;
export const PUSH_HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

export type PushState = { enabled: boolean; hour: number; endpoint: string | null };
export type PushSupport = "ok" | "ios-install" | "ios-old" | "unsupported";

export function readPushState(): PushState {
  const empty = { enabled: false, hour: DEFAULT_PUSH_HOUR, endpoint: null };
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...empty, ...(JSON.parse(raw) as Partial<PushState>) } : empty;
  } catch {
    return empty;
  }
}

function writePushState(s: PushState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private mode */
  }
}

export function isIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && (navigator.maxTouchPoints || 0) > 1);
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function iosVersion() {
  const m = /OS (\d+)_(\d+)/.exec(navigator.userAgent || "");
  return m ? Number(m[1]) + Number(m[2]) / 100 : null;
}

export function pushSupport(): PushSupport {
  if (typeof window === "undefined") return "unsupported";
  if (isIOS()) {
    const v = iosVersion();
    if (v != null && v < 16.04) return "ios-old";
    if (!isStandalone()) return "ios-install";
  }
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return "unsupported";
  }
  return "ok";
}

function timeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Caracas";
  } catch {
    return "America/Caracas";
  }
}

function b64ToBytes(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function registration() {
  await navigator.serviceWorker.register("/savia-sw.js");
  return navigator.serviceWorker.ready;
}

async function post(path: string, body: Record<string, unknown>) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
  return { status: res.status, ok: res.ok && data.ok !== false, error: data.error };
}

export type PushResult = { ok: boolean; error?: "denied" | "unsupported" | "profile" | "server" | "rate" | string };

export async function enablePush(hour: number): Promise<PushResult> {
  if (pushSupport() !== "ok") return { ok: false, error: "unsupported" };
  const perm = await Notification.requestPermission().catch(() => "denied" as NotificationPermission);
  if (perm !== "granted") return { ok: false, error: "denied" };
  const c = await deviceCreds();
  if (!c) return { ok: false, error: "profile" };
  try {
    const keyRes = (await (await fetch("/api/push/key")).json()) as { publicKey?: string };
    if (!keyRes.publicKey) return { ok: false, error: "server" };
    const reg = await registration();
    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ??
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(keyRes.publicKey) }));
    const p = localToday().profile;
    const r = await post("/api/push/subscribe", {
      ...c,
      subscription: sub.toJSON(),
      hour,
      timezone: timeZone(),
      locale: p.locale === "en" ? "en" : "es",
      name: p.displayName,
    });
    if (!r.ok) return { ok: false, error: r.status === 401 ? "profile" : "server" };
    writePushState({ enabled: true, hour, endpoint: sub.endpoint });
    return { ok: true };
  } catch {
    return { ok: false, error: "server" };
  }
}

export async function disablePush(): Promise<PushResult> {
  const state = readPushState();
  writePushState({ ...state, enabled: false });
  try {
    const reg = await navigator.serviceWorker.getRegistration("/savia-sw.js");
    const sub = await reg?.pushManager.getSubscription();
    const endpoint = sub?.endpoint ?? state.endpoint;
    await sub?.unsubscribe().catch(() => false);
    const c = await deviceCreds();
    if (c && endpoint) await post("/api/push/unsubscribe", { ...c, endpoint });
  } catch {
    /* local state already off */
  }
  return { ok: true };
}

export async function setPushHour(hour: number): Promise<PushResult> {
  const state = readPushState();
  writePushState({ ...state, hour });
  if (!state.enabled || !state.endpoint) return { ok: true };
  const c = await deviceCreds();
  if (!c) return { ok: false, error: "profile" };
  const r = await post("/api/push/hour", { ...c, endpoint: state.endpoint, hour, timezone: timeZone() });
  return r.ok ? { ok: true } : { ok: false, error: "server" };
}

export async function sendPushTest(): Promise<PushResult> {
  const state = readPushState();
  if (!state.enabled || !state.endpoint) return { ok: false, error: "not-subscribed" };
  const c = await deviceCreds();
  if (!c) return { ok: false, error: "profile" };
  const r = await post("/api/push/test", { ...c, endpoint: state.endpoint });
  if (r.status === 429) return { ok: false, error: "rate" };
  return r.ok ? { ok: true } : { ok: false, error: r.error || "server" };
}

export function formatHour(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}
