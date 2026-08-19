import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { snapshotMeta, todayISO } from "@/lib/cycle";
import type { DailyLog, Flow, Intention, Mucus, SaviaProfile, Stage, TodaySnapshot } from "@/lib/types";
import { moneyToNumber } from "@/lib/utils";

type ProfileRow = {
  user_id: string;
  display_name: string;
  stage: string;
  birth_year: number | null;
  cycle_length: number;
  period_length: number;
  last_period_start: string | null;
  due_date: string | null;
  last_period_year: number | null;
  onboarding_done: boolean;
  locale: string;
  plan: string;
  intention?: string;
};

type LogRow = {
  id: number;
  user_id: string;
  day: string;
  flow: string;
  mood: number | null;
  energy: number | null;
  sleep_hours: unknown;
  notes: string;
  symptoms: unknown;
  period_started: boolean;
  mucus?: string;
};

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    try {
      const p = JSON.parse(value) as unknown;
      return Array.isArray(p) ? p.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mapProfile(row: ProfileRow): SaviaProfile {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    stage: (row.stage as Stage) || "cycle",
    birthYear: row.birth_year,
    cycleLength: row.cycle_length || 28,
    periodLength: row.period_length || 5,
    lastPeriodStart: row.last_period_start,
    dueDate: row.due_date,
    lastPeriodYear: row.last_period_year,
    onboardingDone: Boolean(row.onboarding_done),
    locale: row.locale || "es",
    plan: row.plan || "free",
    intention: (row.intention as Intention) || "track",
  };
}

function mapLog(row: LogRow): DailyLog {
  return {
    id: row.id,
    userId: row.user_id,
    day: String(row.day).slice(0, 10),
    flow: (row.flow as Flow) || "none",
    mood: row.mood,
    energy: row.energy,
    sleepHours: row.sleep_hours == null ? null : moneyToNumber(row.sleep_hours),
    notes: row.notes || "",
    symptoms: asStringArray(row.symptoms),
    periodStarted: Boolean(row.period_started),
    mucus: (row.mucus as Mucus) || "none",
  };
}

async function getOrCreateProfile(userId: string): Promise<SaviaProfile> {
  const sql = await getSql();
  const existing = await sql<ProfileRow>`select * from savia_profiles where user_id = ${userId} limit 1`;
  if (existing[0]) return mapProfile(existing[0]);
  const inserted = await sql<ProfileRow>`
    insert into savia_profiles (user_id) values (${userId})
    on conflict (user_id) do nothing
    returning *
  `;
  if (inserted[0]) return mapProfile(inserted[0]);
  const again = await sql<ProfileRow>`select * from savia_profiles where user_id = ${userId} limit 1`;
  return mapProfile(again[0]!);
}

export const getToday = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<TodaySnapshot> => {
    const sql = await getSql();
    const profile = await getOrCreateProfile(context.userId);
    const day = todayISO();
    const logRows = await sql<LogRow>`
      select * from daily_logs where user_id = ${context.userId} and day = ${day} limit 1
    `;
    const recent = await sql<LogRow>`
      select * from daily_logs where user_id = ${context.userId} order by day desc limit 14
    `;
    const starts = await sql<{ start_date: string }>`
      select start_date from period_starts where user_id = ${context.userId} order by start_date desc limit 12
    `;
    const meta = snapshotMeta(profile, day);
    return {
      profile,
      day,
      ...meta,
      log: logRows[0] ? mapLog(logRows[0]) : null,
      recentLogs: recent.map(mapLog),
      periodStarts: starts.map((s) => String(s.start_date).slice(0, 10)),
    };
  });

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      displayName: string;
      stage: Stage;
      birthYear: number | null;
      cycleLength: number;
      periodLength: number;
      lastPeriodStart: string | null;
      dueDate: string | null;
      lastPeriodYear: number | null;
      onboardingDone: boolean;
      locale: string;
      intention?: Intention;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await getOrCreateProfile(context.userId);
    const rows = await sql<ProfileRow>`
      update savia_profiles set
        display_name = ${data.displayName.trim()},
        stage = ${data.stage},
        birth_year = ${data.birthYear},
        cycle_length = ${data.cycleLength},
        period_length = ${data.periodLength},
        last_period_start = ${data.lastPeriodStart},
        due_date = ${data.dueDate},
        last_period_year = ${data.lastPeriodYear},
        onboarding_done = ${data.onboardingDone},
        locale = ${data.locale},
        intention = ${data.intention || "track"},
        updated_at = now()
      where user_id = ${context.userId}
      returning *
    `;
    if (data.lastPeriodStart) {
      await sql`
        insert into period_starts (user_id, start_date)
        values (${context.userId}, ${data.lastPeriodStart})
        on conflict (user_id, start_date) do nothing
      `;
    }
    return { ok: true as const, profile: mapProfile(rows[0]!) };
  });

export const saveLog = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      day: string;
      flow: Flow;
      mood: number | null;
      energy: number | null;
      sleepHours: number | null;
      notes: string;
      symptoms: string[];
      periodStarted: boolean;
      mucus?: Mucus;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await getOrCreateProfile(context.userId);
    const symptomsJson = JSON.stringify(data.symptoms);
    const mucus = data.mucus || "none";
    const rows = await sql<LogRow>`
      insert into daily_logs (
        user_id, day, flow, mood, energy, sleep_hours, notes, symptoms, period_started, mucus, updated_at
      ) values (
        ${context.userId}, ${data.day}, ${data.flow}, ${data.mood}, ${data.energy},
        ${data.sleepHours}, ${data.notes.trim()}, ${symptomsJson}::jsonb, ${data.periodStarted}, ${mucus}, now()
      )
      on conflict (user_id, day) do update set
        flow = excluded.flow,
        mood = excluded.mood,
        energy = excluded.energy,
        sleep_hours = excluded.sleep_hours,
        notes = excluded.notes,
        symptoms = excluded.symptoms,
        period_started = excluded.period_started,
        mucus = excluded.mucus,
        updated_at = now()
      returning *
    `;
    if (data.periodStarted) {
      await sql`
        insert into period_starts (user_id, start_date)
        values (${context.userId}, ${data.day})
        on conflict (user_id, start_date) do nothing
      `;
      await sql`
        update savia_profiles set last_period_start = ${data.day}, updated_at = now()
        where user_id = ${context.userId}
      `;
    }
    return { ok: true as const, log: mapLog(rows[0]!) };
  });

export const joinWaitlist = createServerFn({ method: "POST" })
  .validator((input: { email: string; plan: string }) => input)
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    if (!email.includes("@")) return { ok: false as const };
    const sql = await getSql();
    await sql`
      insert into savia_waitlist (email, plan) values (${email}, ${data.plan})
    `;
    return { ok: true as const };
  });

export type PaySettings = {
  zinli: string;
  pmPhone: string;
  pmBank: string;
  pmId: string;
  usdt: string;
};

const emptyPay: PaySettings = { zinli: "", pmPhone: "", pmBank: "", pmId: "", usdt: "" };

async function readPay(): Promise<PaySettings> {
  const sql = await getSql();
  const rows = await sql<{ key: string; value: string }>`
    select key, value from savia_settings where key in ('pay', 'zinli')
  `;
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  if (map.pay) {
    try {
      const p = JSON.parse(map.pay) as Partial<PaySettings>;
      return { ...emptyPay, ...p, zinli: (p.zinli || map.zinli || "").replace(/^@/, "") };
    } catch {
      /* fall through */
    }
  }
  return { ...emptyPay, zinli: (map.zinli || "").replace(/^@/, "") };
}

export const getPay = createServerFn({ method: "GET" }).handler(async () => readPay());

export const getZinli = createServerFn({ method: "GET" }).handler(async () => {
  const p = await readPay();
  return { handle: p.zinli };
});

export const savePay = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: PaySettings) => input)
  .handler(async ({ data }) => {
    const next: PaySettings = {
      zinli: data.zinli.trim().replace(/^@/, ""),
      pmPhone: data.pmPhone.trim(),
      pmBank: data.pmBank.trim(),
      pmId: data.pmId.trim(),
      usdt: data.usdt.trim(),
    };
    const sql = await getSql();
    await sql`
      insert into savia_settings (key, value) values ('pay', ${JSON.stringify(next)})
      on conflict (key) do update set value = excluded.value
    `;
    await sql`
      insert into savia_settings (key, value) values ('zinli', ${next.zinli})
      on conflict (key) do update set value = excluded.value
    `;
    return { ok: true as const, ...next };
  });

export const saveZinli = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { handle: string }) => input)
  .handler(async ({ data }) => {
    const current = await readPay();
    const res = await savePay({ data: { ...current, zinli: data.handle } });
    return { ok: true as const, handle: res.zinli };
  });

export const markZinliPaid = createServerFn({ method: "POST" })
  .validator((input: { email: string; plan: "serena" | "year"; note: string }) => input)
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase();
    if (!email.includes("@")) return { ok: false as const };
    const amount = data.plan === "year" ? 39 : 4.99;
    const sql = await getSql();
    await sql`
      insert into savia_payments (email, plan, amount, note)
      values (${email}, ${data.plan}, ${amount}, ${data.note.trim()})
    `;
    return { ok: true as const };
  });

export const askSavia = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { question: string; locale: string }) => input)
  .handler(async ({ context, data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "ai" };
    const profile = await getOrCreateProfile(context.userId);
    const day = todayISO();
    const meta = snapshotMeta(profile, day);
    const lang = data.locale === "en" ? "English" : "Spanish";
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 700,
        messages: [
          {
            role: "system",
            content: `You are Savia, a calm women's health companion. You teach; you do not diagnose or prescribe. Always remind to see a clinician for red flags. Life stage: ${profile.stage}. Cycle day: ${meta.cycleDay ?? "n/a"}. Phase: ${meta.phase}. Pregnancy week: ${meta.pregnancyWeek ?? "n/a"}. Answer in ${lang}. Short paragraphs. Practical: food, tea, rest, when to seek care. No scare tactics, no miracle claims.`,
          },
          { role: "user", content: data.question.slice(0, 2000) },
        ],
      }),
    });
    if (!res.ok) return { ok: false as const, error: "ai" };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content ?? "";
    if (!text) return { ok: false as const, error: "ai" };
    return { ok: true as const, text };
  });
