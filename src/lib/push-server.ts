/**
 * Web Push (server only): subscriptions, companion message per subscriber, the
 * cron runner and single sends. Imported dynamically from API routes so
 * `web-push` never reaches the client bundle.
 *
 * SENDING IS OFF BY DEFAULT: the cron only sends when PUSH_SENDING_ENABLED is
 * exactly "true". Otherwise it returns the list of what it WOULD send (dry run).
 * /api/push/test is the one exception — it only targets the requester's own
 * subscription.
 */
import { getSql } from "@/lib/db";
import { assertDevice } from "@/lib/testers";
import {
  addDaysISO,
  daysUntil,
  isConfirmedPeriodDay,
  isCycling,
  markForDate,
  predictPeriod,
  snapshotMeta,
} from "@/lib/cycle";
import { bodyKeyFor, buildNoteContext, situationFor } from "@/lib/daily-note";
import {
  companionName,
  dayInTimeZone,
  hourInTimeZone,
  pushMessage,
  safeTimeZone,
  type Lang,
  type PushMessage,
} from "@/lib/companion-messages";
import type { DailyLog, Flow, Intention, Mucus, SaviaProfile, SexKind, Stage } from "@/lib/types";

export type SubRow = {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id: string;
  display_name: string;
  timezone: string;
  preferred_hour: number;
  locale: string;
  enabled: boolean;
  last_sent_on: string | null;
  last_test_at: string | null;
};

export const QUIET_BEFORE = 7;
export const QUIET_FROM = 22;

export function sendingEnabled() {
  return (process.env.PUSH_SENDING_ENABLED || "").trim() === "true";
}

export function vapidPublicKey() {
  return (process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "").trim();
}

function vapidReady() {
  return Boolean(vapidPublicKey() && (process.env.VAPID_PRIVATE_KEY || "").trim());
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const raw = await request.text();
    if (raw.length > 8000) return null;
    const v = JSON.parse(raw) as unknown;
    return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Beta identity: device id + token (same as every other device call). */
export async function deviceFrom(body: Record<string, unknown> | null) {
  const deviceId = typeof body?.deviceId === "string" ? body.deviceId.trim().slice(0, 80) : "";
  const token = typeof body?.token === "string" ? body.token : "";
  if (!deviceId || !(await assertDevice(deviceId, token))) return null;
  return deviceId;
}

export function cleanHour(v: unknown, fallback = 9) {
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n <= 23 ? n : fallback;
}

export function cleanEndpoint(v: unknown) {
  const s = typeof v === "string" ? v.trim() : "";
  return /^https:\/\/[^\s]{10,1000}$/.test(s) ? s : "";
}

/** Timing-safe Bearer check against CRON_SECRET (missing secret → always false). */
export async function cronAuthorized(request: Request) {
  const secret = (process.env.CRON_SECRET || "").trim();
  if (!secret) return false;
  const header = request.headers.get("authorization") || "";
  const got = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const { timingSafeEqual } = await import("node:crypto");
  const a = Buffer.from(got);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

// ---------------------------------------------------------------------------
// Companion message for one subscriber (her data, her time zone)
// ---------------------------------------------------------------------------

type ProfileRow = {
  display_name: string;
  stage: string;
  cycle_length: number;
  period_length: number;
  last_period_start: string | null;
  due_date: string | null;
  intention?: string | null;
  locale?: string | null;
  onboarding_done: boolean;
};

type LogRow = {
  day: string;
  flow: string;
  mood: number | null;
  symptoms: unknown;
  period_started: boolean;
  sex?: boolean;
  sex_kind?: string;
  mucus?: string;
};

function iso(v: unknown) {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return v == null ? null : String(v).slice(0, 10);
}

function asList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v) as unknown;
      return Array.isArray(p) ? p.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function messageFor(sub: Pick<SubRow, "user_id" | "display_name" | "timezone" | "locale">, now = new Date()) {
  const sql = await getSql();
  const tz = safeTimeZone(sub.timezone);
  const day = dayInTimeZone(now, tz);
  const hour = hourInTimeZone(now, tz);
  const lang: Lang = sub.locale === "en" ? "en" : "es";
  const prow = (await sql<ProfileRow>`select * from savia_profiles where user_id = ${sub.user_id} limit 1`)[0];
  const name = companionName(prow?.display_name || sub.display_name);
  if (!prow || !prow.onboarding_done) {
    const msg = pushMessage(
      { situation: "none", bodyKey: "none", mark: null, cycleDay: null, daysToPeriod: null, intention: "track" },
      { name, hour, lang, seed: day },
    );
    return { msg, day, hour, tz, name };
  }
  const profile = {
    stage: (prow.stage as Stage) || "cycle",
    cycleLength: Number(prow.cycle_length) || 28,
    periodLength: Number(prow.period_length) || 5,
    lastPeriodStart: iso(prow.last_period_start),
    dueDate: iso(prow.due_date),
  } as SaviaProfile;
  const starts = (
    await sql<{ start_date: string }>`
      select start_date from period_starts where user_id = ${sub.user_id} order by start_date desc limit 12
    `
  ).map((r) => iso(r.start_date)!);
  const since = addDaysISO(day, -6);
  const logs: DailyLog[] = (
    await sql<LogRow>`
      select day, flow, mood, symptoms, period_started, sex, sex_kind, mucus from daily_logs
      where user_id = ${sub.user_id} and day >= ${since} and day <= ${day}
      order by day desc
    `
  ).map((r, i) => ({
    id: i,
    userId: sub.user_id,
    day: iso(r.day)!,
    flow: (r.flow as Flow) || "none",
    mood: r.mood,
    energy: null,
    sleepHours: null,
    notes: "",
    symptoms: asList(r.symptoms),
    periodStarted: Boolean(r.period_started),
    mucus: (r.mucus as Mucus) || "none",
    sex: Boolean(r.sex),
    sexKind: (r.sex_kind as SexKind) || "none",
  }));
  const cycling = isCycling(profile.stage) && Boolean(profile.lastPeriodStart);
  const meta = snapshotMeta(profile, day);
  const opts = {
    lastStart: profile.lastPeriodStart,
    cycleLength: profile.cycleLength,
    periodLength: profile.periodLength,
    periodStarts: starts,
  };
  const todayLog = logs.find((l) => l.day === day) ?? null;
  const next = cycling ? predictPeriod(profile.lastPeriodStart, starts, profile.cycleLength, profile.stage).next : null;
  const ctx = buildNoteContext({
    today: day,
    phase: cycling ? meta.phase : "none",
    cycleDay: cycling ? meta.cycleDay : null,
    mark: cycling ? markForDate(day, opts) : null,
    onPeriod: cycling && isConfirmedPeriodDay(day, { ...opts, log: todayLog }),
    nextPeriod: next,
    intention: ((prow.intention as Intention) || "track") as Intention,
    logs,
    markFor: (d) => (cycling ? markForDate(d, opts) : null),
  });
  // daysUntil() uses the server clock; recompute against her local day.
  ctx.daysToPeriod = next ? daysUntil(next, day) : null;
  const situation = situationFor(ctx);
  const msg = pushMessage(
    {
      situation,
      bodyKey: bodyKeyFor(ctx, situation),
      mark: ctx.mark,
      cycleDay: ctx.cycleDay,
      daysToPeriod: ctx.daysToPeriod,
      intention: ctx.intention,
    },
    { name, hour, lang, seed: day },
  );
  return { msg, day, hour, tz, name };
}

// ---------------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------------

export type SendResult = { ok: boolean; status?: number; gone?: boolean; error?: string };

export async function sendOne(sub: Pick<SubRow, "endpoint" | "p256dh" | "auth">, msg: PushMessage, extra: Record<string, unknown> = {}): Promise<SendResult> {
  if (!vapidReady()) return { ok: false, error: "vapid-missing" };
  const mod = await import("web-push");
  const webpush = (mod as unknown as { default?: typeof mod }).default ?? mod;
  const subject = (process.env.VAPID_SUBJECT || "mailto:ventas@anclagroupmcbo.com").trim();
  webpush.setVapidDetails(subject, vapidPublicKey(), (process.env.VAPID_PRIVATE_KEY || "").trim());
  const payload = JSON.stringify({ title: msg.title, body: msg.body, url: "/app/hoy", tag: "savia-daily", ...extra });
  try {
    const res = await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload, {
      TTL: 6 * 60 * 60,
      urgency: "normal",
      timeout: 10000,
    });
    return { ok: true, status: res.statusCode };
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    return { ok: false, status, gone: status === 404 || status === 410, error: status ? `push-${status}` : "push-failed" };
  }
}

export function maskId(s: string) {
  return s.length <= 8 ? "…" : `${s.slice(0, 4)}…${s.slice(-4)}`;
}

export type CronMode = "hourly" | "daily";

/**
 * hourly: send to subscribers whose local hour has reached their preferred hour
 *         (meant for an external scheduler hitting the endpoint every hour).
 * daily:  Vercel Hobby runs crons once a day only — send to everyone not yet
 *         messaged today, whatever their preferred hour (quiet hours respected).
 */
export async function runCron(mode: CronMode, now = new Date()) {
  const sql = await getSql();
  const live = sendingEnabled();
  const rows = await sql<SubRow>`select * from push_subscriptions where enabled = true order by id limit 2000`;
  const wouldSend: Record<string, unknown>[] = [];
  const skipped: Record<string, unknown>[] = [];
  let sent = 0;
  let failed = 0;
  for (const row of rows) {
    const tz = safeTimeZone(row.timezone);
    const localHour = hourInTimeZone(now, tz);
    const localDay = dayInTimeZone(now, tz);
    const base = { id: row.id, user: maskId(row.user_id), timezone: tz, localHour, preferredHour: row.preferred_hour };
    if (iso(row.last_sent_on) === localDay) {
      skipped.push({ ...base, reason: "already-sent-today" });
      continue;
    }
    if (localHour < QUIET_BEFORE || localHour >= QUIET_FROM) {
      skipped.push({ ...base, reason: "quiet-hours" });
      continue;
    }
    if (mode === "hourly" && localHour < row.preferred_hour) {
      skipped.push({ ...base, reason: "not-yet" });
      continue;
    }
    let built;
    try {
      built = await messageFor(row, now);
    } catch (err) {
      skipped.push({ ...base, reason: "message-error", error: String((err as Error)?.message || err).slice(0, 120) });
      continue;
    }
    const item = { ...base, name: built.name || null, title: built.msg.title, body: built.msg.body };
    if (!live) {
      wouldSend.push(item);
      continue;
    }
    const r = await sendOne(row, built.msg);
    if (r.ok) {
      sent += 1;
      await sql`update push_subscriptions set last_sent_on = ${localDay}, fail_count = 0, updated_at = now() where id = ${row.id}`;
    } else {
      failed += 1;
      if (r.gone) await sql`update push_subscriptions set enabled = false, updated_at = now() where id = ${row.id}`;
      else await sql`update push_subscriptions set fail_count = fail_count + 1, updated_at = now() where id = ${row.id}`;
    }
    wouldSend.push({ ...item, result: r.ok ? "sent" : r.error });
  }
  const summary = { mode, dryRun: !live, checked: rows.length, due: wouldSend.length, sent, failed };
  console.log("[push-cron]", JSON.stringify(summary));
  return { ok: true, ...summary, now: now.toISOString(), wouldSend, skipped };
}
