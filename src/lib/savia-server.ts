import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { cyclePattern, fertileWindow, nextPeriodDate, averageCycle, snapshotMeta, symptomByPhase, todayISO, learnedCycle } from "@/lib/cycle";
import type { DailyLog, Flow, Intention, Mucus, SaviaProfile, SexKind, Stage, TodaySnapshot } from "@/lib/types";
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
  ask_count?: number;
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
  sex?: boolean;
  sex_kind?: string;
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
    askCount: Number(row.ask_count || 0),
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
    sex: Boolean(row.sex),
    sexKind: (row.sex_kind as SexKind) || "none",
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
    const sexRows = await sql<{ day: string; sex_kind?: string }>`
      select day, sex_kind from daily_logs
      where user_id = ${context.userId} and sex = true
      order by day desc
      limit 90
    `;
    const meta = snapshotMeta(profile, day);
    const sexMarks = sexRows.map((s) => ({
      day: String(s.day).slice(0, 10),
      kind: ((s.sex_kind as SexKind) || "unprotected") as SexKind,
    }));
    return {
      profile,
      day,
      ...meta,
      log: logRows[0] ? mapLog(logRows[0]) : null,
      recentLogs: recent.map(mapLog),
      periodStarts: starts.map((s) => String(s.start_date).slice(0, 10)),
      sexDays: sexMarks.map((s) => s.day),
      sexMarks,
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
      sex?: boolean;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const profile = await getOrCreateProfile(context.userId);
    const symptomsJson = JSON.stringify(data.symptoms);
    const mucus = data.mucus || "none";
    const paid = profile.plan === "serena" || profile.plan === "year";
    const sex = paid ? Boolean(data.sex) : false;
    const rows = await sql<LogRow>`
      insert into daily_logs (
        user_id, day, flow, mood, energy, sleep_hours, notes, symptoms, period_started, mucus, sex, updated_at
      ) values (
        ${context.userId}, ${data.day}, ${data.flow}, ${data.mood}, ${data.energy},
        ${data.sleepHours}, ${data.notes.trim()}, ${symptomsJson}::jsonb, ${data.periodStarted}, ${mucus}, ${sex}, now()
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
        sex = case when ${paid} then excluded.sex else daily_logs.sex end,
        updated_at = now()
      returning *
    `;
    if (data.periodStarted) {
      const nextLen = learnedCycle(profile.lastPeriodStart, data.day, profile.cycleLength);
      await sql`
        insert into period_starts (user_id, start_date)
        values (${context.userId}, ${data.day})
        on conflict (user_id, start_date) do nothing
      `;
      await sql`
        update savia_profiles
        set last_period_start = ${data.day}, cycle_length = ${nextLen}, updated_at = now()
        where user_id = ${context.userId}
      `;
    }
    return { ok: true as const, log: mapLog(rows[0]!) };
  });

export const toggleSex = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { day: string; kind?: SexKind }) => input)
  .handler(async ({ context, data }) => {
    const profile = await getOrCreateProfile(context.userId);
    if (profile.plan !== "serena" && profile.plan !== "year") {
      return { ok: false as const, error: "pay" as const };
    }
    const sql = await getSql();
    const existing = await sql<LogRow>`
      select * from daily_logs where user_id = ${context.userId} and day = ${data.day} limit 1
    `;
    const current = (existing[0]?.sex_kind as SexKind) || "none";
    const kind: SexKind = data.kind
      ? data.kind === current
        ? "none"
        : data.kind
      : existing[0]?.sex
        ? "none"
        : "unprotected";
    const on = kind !== "none";
    const rows = await sql<LogRow>`
      insert into daily_logs (user_id, day, sex, sex_kind, updated_at)
      values (${context.userId}, ${data.day}, ${on}, ${kind}, now())
      on conflict (user_id, day) do update set sex = ${on}, sex_kind = ${kind}, updated_at = now()
      returning *
    `;
    return { ok: true as const, log: mapLog(rows[0]!), sex: on, kind };
  });

export const getReport = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await getOrCreateProfile(context.userId);
    if (profile.plan !== "serena" && profile.plan !== "year") {
      return { ok: false as const, error: "pay" as const };
    }
    const sql = await getSql();
    const starts = await sql<{ start_date: string }>`
      select start_date from period_starts where user_id = ${context.userId} order by start_date desc limit 12
    `;
    const logs = await sql<LogRow>`
      select * from daily_logs where user_id = ${context.userId} order by day desc limit 90
    `;
    const periodStarts = starts.map((s) => String(s.start_date).slice(0, 10));
    const mapped = logs.map(mapLog);
    const avg = averageCycle(periodStarts, profile.cycleLength);
    const pattern = cyclePattern(periodStarts, profile.cycleLength);
    const meta = snapshotMeta(profile);
    const symptoms = symptomByPhase(mapped, profile.lastPeriodStart, avg, profile.periodLength);
    const sexMarks = mapped
      .filter((l) => l.sex)
      .map((l) => ({ day: l.day, kind: l.sexKind }));
    const heavyDays = mapped.filter((l) => l.flow === "heavy").length;
    const flowDays = mapped.filter((l) => l.flow !== "none").length;
    const age = profile.birthYear ? new Date().getFullYear() - profile.birthYear : null;
    return {
      ok: true as const,
      issued: todayISO(),
      profile,
      age,
      periodStarts,
      pattern,
      meta,
      fertile: fertileWindow(profile.lastPeriodStart, avg, profile.periodLength),
      symptoms,
      sexMarks,
      nextPeriod: nextPeriodDate(profile.lastPeriodStart, avg),
      heavyDays,
      flowDays,
      logCount: mapped.length,
    };
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
  cardUrl: string;
  paypalUrl: string;
};

const emptyPay: PaySettings = {
  zinli: "",
  pmPhone: "",
  pmBank: "",
  pmId: "",
  usdt: "",
  cardUrl: "",
  paypalUrl: "",
};

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
      cardUrl: data.cardUrl.trim(),
      paypalUrl: data.paypalUrl.trim(),
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

const FREE_ASKS = 3;

function isSerena(plan: string) {
  return plan === "serena" || plan === "year";
}

export const getAskStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const profile = await getOrCreateProfile(context.userId);
    const used = profile.askCount;
    const paid = isSerena(profile.plan);
    return {
      plan: profile.plan,
      paid,
      used,
      limit: FREE_ASKS,
      remaining: paid ? null : Math.max(0, FREE_ASKS - used),
    };
  });

export const claimSerena = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { email: string; plan: "serena" | "year"; note: string }) => input)
  .handler(async ({ context, data }) => {
    const mail = data.email.trim().toLowerCase();
    const email = mail.includes("@") ? mail : `cuenta-${context.userId.slice(0, 8)}@savia.app`;
    const amount = data.plan === "year" ? 39 : 4.99;
    const sql = await getSql();
    await sql`
      insert into savia_payments (email, plan, amount, note)
      values (${email}, ${data.plan}, ${amount}, ${data.note.trim()})
    `;
    await getOrCreateProfile(context.userId);
    await sql`
      update savia_profiles set plan = ${data.plan}, updated_at = now()
      where user_id = ${context.userId}
    `;
    return { ok: true as const };
  });


export type ChatTurn = { role: "user" | "assistant"; content: string };

export const askSavia = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { question: string; locale: string; history?: ChatTurn[] }) => input)
  .handler(async ({ context, data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "ai" };
    const sql = await getSql();
    const profile = await getOrCreateProfile(context.userId);
    const paid = isSerena(profile.plan);
    if (!paid && profile.askCount >= FREE_ASKS) {
      return { ok: false as const, error: "pay" as const };
    }
    const day = todayISO();
    const meta = snapshotMeta(profile, day);
    const logRows = await sql<LogRow>`
      select * from daily_logs where user_id = ${context.userId} and day = ${day} limit 1
    `;
    const log = logRows[0] ? mapLog(logRows[0]) : null;
    const lang = data.locale === "en" ? "English" : "Spanish";
    const age = profile.birthYear ? new Date().getFullYear() - profile.birthYear : "unknown";
    const history = (data.history ?? [])
      .filter((m) => m.content.trim())
      .slice(-8)
      .map((m) => ({
        role: m.role,
        content: m.content.slice(0, 1500),
      }));
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 650,
        temperature: 0.5,
        messages: [
          {
            role: "system",
            content: `You are Savia, the in-app specialist for this women's health companion.
You know menstrual cycles, ovulation, fertile windows, cervical mucus, PMS/PMDD, perimenopause, menopause, postpartum, pregnancy (food/tea caution), hormones (estrogen, progesterone, FSH, LH, cortisol), iron, sleep, and everyday food/teas that match a phase.
You teach. You do not diagnose, prescribe, or replace a clinician.
If red flags (soaking a pad/hour, fainting, pregnancy bleeding, severe one-sided pain, suicidal thoughts, fever after birth), say go to emergency care now. In Venezuela: urgencias / 911.
Be warm, concrete, short paragraphs. Prefer what to eat, rest, track, and when to see a doctor.
No scare tactics. No miracle cures. No medical doses of herbs in pregnancy.
Answer in ${lang}.

Her file (use it, don't recite it unless asked):
- Name: ${profile.displayName || "not set"}
- Age (approx): ${age}
- Season: ${profile.stage}
- Intention: ${profile.intention}
- Cycle length: ${profile.cycleLength} days, period ${profile.periodLength} days
- Last period start: ${profile.lastPeriodStart ?? "unknown"}
- Cycle day: ${meta.cycleDay ?? "n/a"}
- Phase: ${meta.phase}
- Pregnancy week: ${meta.pregnancyWeek ?? "n/a"}
- Due date: ${profile.dueDate ?? "n/a"}
- Today log: flow ${log?.flow ?? "none"}, mucus ${log?.mucus ?? "none"}, symptoms ${(log?.symptoms ?? []).join(", ") || "none"}, mood ${log?.mood ?? "n/a"}`,
          },
          ...history,
          { role: "user", content: data.question.slice(0, 2000) },
        ],
      }),
    });
    if (!res.ok) return { ok: false as const, error: "ai" };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content ?? "";
    if (!text) return { ok: false as const, error: "ai" };
    let remaining: number | null = null;
    if (!paid) {
      const next = await sql<{ ask_count: number }>`
        update savia_profiles
        set ask_count = ask_count + 1, updated_at = now()
        where user_id = ${context.userId}
        returning ask_count
      `;
      remaining = Math.max(0, FREE_ASKS - Number(next[0]?.ask_count || 0));
    }
    return { ok: true as const, text, remaining };
  });

export type AskFile = {
  displayName?: string;
  birthYear?: number | null;
  stage?: string;
  intention?: string;
  cycleLength?: number;
  periodLength?: number;
  lastPeriodStart?: string | null;
  dueDate?: string | null;
  cycleDay?: number | null;
  phase?: string;
  pregnancyWeek?: number | null;
  flow?: string;
  mucus?: string;
  symptoms?: string[];
  mood?: number | null;
};

export const askSaviaOpen = createServerFn({ method: "POST" })
  .validator((input: { question: string; locale: string; history?: ChatTurn[]; file?: AskFile }) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "ai" as const };
    const lang = data.locale === "en" ? "English" : "Spanish";
    const f = data.file || {};
    const history = (data.history ?? [])
      .filter((m) => m.content.trim())
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 650,
        temperature: 0.5,
        messages: [
          {
            role: "system",
            content: `You are Savia, the in-app specialist for this women's health companion (open beta).
You know menstrual cycles, ovulation, fertile windows, cervical mucus, PMS/PMDD, perimenopause, menopause, postpartum, pregnancy (food/tea caution), hormones, iron, sleep, and everyday food/teas that match a phase.
You teach. You do not diagnose, prescribe, or replace a clinician.
If red flags (soaking a pad/hour, fainting, pregnancy bleeding, severe one-sided pain, suicidal thoughts, fever after birth), say go to emergency care now. In Venezuela: urgencias / 911.
Be warm, concrete, short paragraphs. Answer in ${lang}.

Her file:
- Name: ${f.displayName || "not set"}
- Age: ${f.birthYear ? new Date().getFullYear() - f.birthYear : "unknown"}
- Season: ${f.stage || "cycle"}
- Intention: ${f.intention || "track"}
- Cycle length: ${f.cycleLength ?? 28}, period ${f.periodLength ?? 5}
- Last period: ${f.lastPeriodStart ?? "unknown"}
- Cycle day: ${f.cycleDay ?? "n/a"}
- Phase: ${f.phase ?? "n/a"}
- Pregnancy week: ${f.pregnancyWeek ?? "n/a"}
- Today: flow ${f.flow ?? "none"}, mucus ${f.mucus ?? "none"}, symptoms ${(f.symptoms || []).join(", ") || "none"}, mood ${f.mood ?? "n/a"}`,
          },
          ...history,
          { role: "user", content: data.question.slice(0, 2000) },
        ],
      }),
    });
    if (!res.ok) return { ok: false as const, error: "ai" as const };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content ?? "";
    if (!text) return { ok: false as const, error: "ai" as const };
    return { ok: true as const, text, remaining: null as number | null };
  });

