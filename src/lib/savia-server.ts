import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { asIsoDay, cyclePattern, fertileWindow, nextPeriodDate, averageCycle, periodDaysFromLogs, snapshotMeta, symptomByPhase, todayISO, learnedCycle } from "@/lib/cycle";
import type { DailyLog, Flow, Intention, Mucus, SaviaProfile, SexKind, Stage, TodaySnapshot } from "@/lib/types";
import { moneyToNumber } from "@/lib/utils";
import { WHOP_MONTH } from "@/lib/pay-links";
import { emergencyLine } from "@/lib/latam";
import { callName } from "@/lib/names";
import { isCompSerenaEmail } from "@/lib/serena-comps";
import { assertDevice } from "@/lib/testers";
import {
  AI_LIMITS,
  AI_MAX_TOKENS,
  askOpenSchema,
  noteOpenSchema,
  paySettingsSchema,
  paymentReportSchema,
  waitlistSchema,
} from "@/lib/input-schemas";
import type { z } from "zod";

/** Server-only helpers are imported lazily so node:crypto never reaches the client bundle. */
async function rateLimit(...args: Parameters<typeof import("@/lib/security-core").rateLimit>) {
  const m = await import("@/lib/security-core");
  return m.rateLimit(...args);
}
async function rateKey(...parts: string[]) {
  const m = await import("@/lib/security-core");
  return m.rateKey(...parts);
}

async function callerIp(): Promise<string> {
  const { clientIp } = await import("@/lib/request-ip.server");
  return clientIp();
}

/** Admin = session user whose id or email is listed in SAVIA_ADMIN_EMAILS (fails closed). */
async function isAdminUser(userId: string): Promise<boolean> {
  if (!process.env.SAVIA_ADMIN_EMAILS?.trim()) return false;
  const sql = await getSql();
  const rows = await sql<{ email: string | null }>`select email from "user" where id = ${userId} limit 1`;
  const { isAdminIdentity } = await import("@/lib/security-core");
  return isAdminIdentity({ id: userId, email: rows[0]?.email }, process.env.SAVIA_ADMIN_EMAILS);
}

function saviaPrompt(lang: string, emergency: string, file: string) {
  return `You are Grok (xAI), answering in-character as Savia IA — her close companion inside the Savia app. Same intelligence as the builder of this product; you do not hand her off to a weaker bot.
You WRITE (chat text), like a clear WhatsApp friend. You are NOT a voice/podcast assistant, NOT a coach who narrates breathing, NOT a doctor.

Spanish: NEUTRAL Latin American with tú. Written like Venezuela/Colombia/Mexico shared Spanish — NEVER Argentine or Rioplatense. Forbidden: vos, tenés, querés, podés, sos, che, pibe, laburo, “re ” as intensifier, boludo/a, “acá nomás” voseo. Use tú, te, ti, ustedes. Short WhatsApp. Warm, a little funny, honest. Never a lecture.

Stay in character as Savia IA. Do not say “I am Grok” unless she asks who is speaking; then: “Te responde Savia IA, la misma inteligencia de Grok.” Never say you are a different model or a script.
You sign off in spirit as Savia, not as a doctor and not as a billing plan.

PERSONA:
- Close companion in tú. Warm friend on WhatsApp — never a pamphlet, never horny-on-arrival, never podcast-coach monologue.
- Behavioral empathy: help with options and a useful tip. Prefer that over fake deep phrases (“te entiendo profundamente”, “te escucho”, “estoy aquí para ti”) or spoken coaching (“vamos a respirar juntas…”, “toma un momento…”).
- Whole life of a young woman: cycle, desire, protection, couple, money, body, a scare, a doctor visit.
- Product job: month clarity + chat so she can avoid accidental pregnancy. Be useful when sex, desire, condoms, Plan B, fertile days, or pregnancy risk come up — clear, warm, direct (Flo-level helpful). Not crude by default; if she wants detail or explicitness, give it without shame or lecture.
- Do NOT push pregnancy-as-goal or “try to conceive.” Fertility window = risk awareness when she might get pregnant, not a baby campaign.
- If Phase is in her file, use it when relevant. Do not invent a phase or cycle day.

SEX AND BODY (when she asks or it clearly fits):
- Desire, arousal, orgasm, pain, condoms, withdrawal myths, fertile-day risk, late period, emergency contraception — answer straight.
- Name protection options when pregnancy risk matters. Never claim calendar days are “safe unprotected sex.” Calendar ≠ contraception.
- Match her tone: soft if she is soft; more direct/detail if she asks for it. No dirty jokes unless she starts there. No moralizing.

REPLY STRUCTURE (every reply when emotion is present; otherwise skip step 1):
1) Validate in ONE short line if there is emotion.
2) Useful tip or data, easy to read on mobile — summary first; more depth only if she asks.
3) Close with ONE soft question OR invite a short choice (chips-style). Never stack 3 questions.

LENGTH AND STYLE:
- HARD MAX 8 short lines — even when she is distressed, scared, or crying. Prefer 3–6 when calm; never more than 8. First sentence answers the question. No “Hola”, no “Buenos días”, no “¿cómo estás?”, no recap of her cycle.
- If she has a call name, use it ONCE in the reply, like a friend (Clau, Isa, Pao, Andre) — not as a greeting header.
- Emojis: 0 or 1 total.
- One tip max. No eternal lists, no sermons, no bullet walls unless she asked. Never a long paragraph. Never podcast-coach monologue. Stop when the answer is done — do not pad to 8.
- Medical limits: clear and calm, without drama. No “habla con un profesional” unless a real red flag.
- Answer in ${lang}.

MUSIC (optional):
- Do not close every message with a song. Only if the moment fits (she is down, nostalgic, wants company, or the advice is already done) you may ask: “¿Quieres que te recomiende una canción?” Wait for a yes. Name a real track only if she asked for music or said yes. Never “escucha esto” as a default.

STILL HELP WITH:
- Cycle, ovulation, PMS, peri, meno, postpartum, pregnancy risk, food/teas (always when NOT to take a tea) — when she asks or it fits.
- Violence: leave to safety.
- Illness: education and red flags, NEVER a diagnosis.

HARD LIMITS:
- Do not diagnose, prescribe, or give drug or herb doses in pregnancy.
- Do not provide suicide methods. If she wants to die: stay with her, emergency now (${emergency}). Still ≤8 short lines — validate, point to help, one soft question.
- Calendar is not contraception. Never promise “días seguros” for unprotected sex. Do not invent fake song titles. Do not push music.
- Never exceed 8 lines in any reply.

If red flags, first sentence: emergency now. Emergency: ${emergency}.

CLOCK: The only date that exists is the line TODAY in her file. If she asks qué día es / what day is it, answer that line. Never invent a month. Never say March if TODAY is August.

Her file:
${file}`;
}

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
    country: "VE",
    askCount: Number(row.ask_count || 0),
  };
}

function mapLog(row: LogRow): DailyLog {
  return {
    id: row.id,
    userId: row.user_id,
    day: asIsoDay(row.day) || String(row.day).slice(0, 10),
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

export async function getOrCreateProfile(userId: string): Promise<SaviaProfile> {
  const sql = await getSql();
  const userRows = await sql<{ email: string }>`
    select email from "user" where id = ${userId} limit 1
  `;
  const isComp = isCompSerenaEmail(userRows[0]?.email);
  const existing = await sql<ProfileRow>`select * from savia_profiles where user_id = ${userId} limit 1`;
  let row = existing[0];

  if (!row) {
    const inserted = await sql<ProfileRow>`
      insert into savia_profiles (user_id) values (${userId})
      on conflict (user_id) do nothing
      returning *
    `;
    row = inserted[0];
  }
  if (!row) {
    const again = await sql<ProfileRow>`select * from savia_profiles where user_id = ${userId} limit 1`;
    row = again[0];
  }
  if (!row) throw new Error(`Profile not found for user ${userId}`);

  if (isComp && !isSerena(row.plan)) {
    const upgraded = await sql<ProfileRow>`
      update savia_profiles
      set plan = 'serena', updated_at = now()
      where user_id = ${userId}
      returning *
    `;
    if (upgraded[0]) row = upgraded[0];
  }

  return mapProfile(row);
}

export async function snapshotFor(userId: string): Promise<TodaySnapshot> {
  const sql = await getSql();
  const profile = await getOrCreateProfile(userId);
  const day = todayISO();
  const logRows = await sql<LogRow>`
    select * from daily_logs where user_id = ${userId} and day = ${day} limit 1
  `;
  const recent = await sql<LogRow>`
    select * from daily_logs where user_id = ${userId} order by day desc limit 14
  `;
  const starts = await sql<{ start_date: string }>`
    select start_date from period_starts where user_id = ${userId} order by start_date desc limit 12
  `;
  const sexRows = await sql<{ day: string; sex_kind?: string }>`
    select day, sex_kind from daily_logs
    where user_id = ${userId} and sex = true
    order by day desc
    limit 90
  `;
  const startDays = starts.map((s) => asIsoDay(s.start_date) || String(s.start_date).slice(0, 10));
  const meta = snapshotMeta(profile, day, { starts: startDays, periodDays: periodDaysFromLogs(recent.map(mapLog)) });
  const sexMarks = sexRows.map((s) => ({
    day: asIsoDay(s.day) || String(s.day).slice(0, 10),
    kind: ((s.sex_kind as SexKind) || "unprotected") as SexKind,
  }));
  return {
    profile,
    day,
    ...meta,
    log: logRows[0] ? mapLog(logRows[0]!) : null,
    recentLogs: recent.map(mapLog),
    periodStarts: starts.map((s) => asIsoDay(s.start_date) || String(s.start_date).slice(0, 10)),
    sexDays: sexMarks.map((s) => s.day),
    sexMarks,
  };
}

export const getToday = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<TodaySnapshot> => snapshotFor(context.userId));

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
      country?: string;
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
      sexKind?: SexKind;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const profile = await getOrCreateProfile(context.userId);
    const symptomsJson = JSON.stringify(data.symptoms);
    const mucus = data.mucus || "none";
    const existing = await sql<LogRow>`
      select * from daily_logs where user_id = ${context.userId} and day = ${data.day} limit 1
    `;
    let sex = Boolean(existing[0]?.sex);
    let sexKind: SexKind = (existing[0]?.sex_kind as SexKind) || "none";
    if (data.sexKind !== undefined) {
      sexKind = data.sexKind;
      sex = sexKind !== "none";
    } else if (data.sex !== undefined) {
      sex = Boolean(data.sex);
      if (!sex) sexKind = "none";
      else if (sexKind === "none") sexKind = "unprotected";
    }
    const rows = await sql<LogRow>`
      insert into daily_logs (
        user_id, day, flow, mood, energy, sleep_hours, notes, symptoms, period_started, mucus, sex, sex_kind, updated_at
      ) values (
        ${context.userId}, ${data.day}, ${data.flow}, ${data.mood}, ${data.energy},
        ${data.sleepHours}, ${data.notes.trim()}, ${symptomsJson}::jsonb, ${data.periodStarted}, ${mucus}, ${sex}, ${sexKind}, now()
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
        sex = excluded.sex,
        sex_kind = excluded.sex_kind,
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
    await getOrCreateProfile(context.userId);
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
  .validator((input: z.input<typeof waitlistSchema>) => {
    const r = waitlistSchema.safeParse(input);
    return r.success ? r.data : null;
  })
  .handler(async ({ data }) => {
    if (!data) return { ok: false as const };
    const email = data.email;
    const sql = await getSql();
    if (!(await rateLimit(sql, "waitlist", await rateKey(await callerIp()), 5, 3600))) {
      return { ok: false as const };
    }
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
  paypalEmail: string;
  binance: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
};

export const emptyPay: PaySettings = {
  zinli: "",
  pmPhone: "",
  pmBank: "",
  pmId: "",
  usdt: "",
  cardUrl: WHOP_MONTH,
  paypalUrl: "",
  paypalEmail: "",
  binance: "",
  bankName: "",
  bankAccount: "",
  bankHolder: "",
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
      return {
        ...emptyPay,
        ...p,
        zinli: (p.zinli || map.zinli || "").replace(/^@/, ""),
        pmPhone: p.pmPhone || emptyPay.pmPhone,
        pmBank: p.pmBank || emptyPay.pmBank,
        pmId: p.pmId || emptyPay.pmId,
        paypalEmail: p.paypalEmail || emptyPay.paypalEmail,
        binance: p.binance || emptyPay.binance,
      };
    } catch {
      /* fall through */
    }
  }
  return { ...emptyPay, zinli: (map.zinli || "").replace(/^@/, "") };
}

export const getPay = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => readPay());

export const getZinli = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const p = await readPay();
    return { handle: p.zinli };
  });

async function writePay(data: PaySettings): Promise<PaySettings> {
    const next: PaySettings = {
      zinli: data.zinli.trim().replace(/^@/, ""),
      pmPhone: data.pmPhone.trim(),
      pmBank: data.pmBank.trim(),
      pmId: data.pmId.trim(),
      usdt: data.usdt.trim(),
      cardUrl: data.cardUrl.trim(),
      paypalUrl: data.paypalUrl.trim(),
      paypalEmail: data.paypalEmail.trim(),
      binance: data.binance.trim(),
      bankName: data.bankName.trim() || "Banplus",
      bankAccount: data.bankAccount.trim(),
      bankHolder: data.bankHolder.trim(),
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
    return next;
}

/** Payment destinations: admin only (SAVIA_ADMIN_EMAILS). */
export const savePay = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: PaySettings) => paySettingsSchema.parse(input))
  .handler(async ({ context, data }) => {
    if (!(await isAdminUser(context.userId))) return { ok: false as const, error: "admin" as const };
    const next = await writePay(data);
    return { ok: true as const, ...next };
  });

export const saveZinli = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { handle: string }) => ({ handle: String(input?.handle ?? "").slice(0, 200) }))
  .handler(async ({ context, data }) => {
    if (!(await isAdminUser(context.userId))) return { ok: false as const, error: "admin" as const };
    const current = await readPay();
    const res = await writePay({ ...current, zinli: data.handle });
    return { ok: true as const, handle: res.zinli };
  });

/**
 * "I paid" report for manual methods (Zinli, Pago Móvil, …). Records a pending
 * payment for admin review; it NEVER changes the plan. Plans are granted only by
 * the verified Whop webhook (grantSerenaByEmail) or an admin.
 */
export const markZinliPaid = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: z.input<typeof paymentReportSchema>) => {
    const r = paymentReportSchema.safeParse(input);
    return r.success ? r.data : null;
  })
  .handler(async ({ context, data }) => {
    if (!data) return { ok: false as const };
    const email = data.email;
    const amount = data.plan === "year" ? 39 : 4.99;
    const sql = await getSql();
    if (!(await rateLimit(sql, "pay-report", await rateKey(context.userId), 5, 3600))) {
      return { ok: false as const };
    }
    await sql`
      insert into savia_payments (email, plan, amount, note)
      values (${email}, ${data.plan}, ${amount}, ${`pending: ${data.note.trim()}`})
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

export type ChatTurn = { role: "user" | "assistant"; content: string };

/**
 * One xAI chat call. grok-4.5 is a reasoning model (default effort "high"):
 * reasoning tokens count against max_tokens, so a tiny budget returns empty
 * content. Use low effort + room for reasoning; the prompt caps reply length.
 * Logs status/finish_reason/usage only — never the key or the conversation.
 */
async function callGrok(
  apiKey: string,
  messages: { role: string; content: string }[],
  opts: { maxTokens?: number; timeoutMs?: number } = {},
): Promise<string | null> {
  let res: Response;
  try {
    res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        reasoning_effort: "low",
        max_tokens: opts.maxTokens ?? 4000,
        temperature: 0.7,
        messages,
      }),
      signal: opts.timeoutMs ? AbortSignal.timeout(opts.timeoutMs) : undefined,
    });
  } catch (err) {
    console.error("[savia-ai] fetch failed:", (err as Error)?.message);
    return null;
  }
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    console.error(`[savia-ai] xAI HTTP ${res.status}: ${detail}`);
    return null;
  }
  const body = (await res.json()) as {
    choices?: { message?: { content?: string }; finish_reason?: string }[];
    usage?: unknown;
  };
  const text = body.choices?.[0]?.message?.content ?? "";
  if (!text) {
    console.error(
      `[savia-ai] empty reply finish_reason=${body.choices?.[0]?.finish_reason} usage=${JSON.stringify(body.usage)}`,
    );
    return null;
  }
  return text;
}

export const askSavia = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { question: string; locale: string; history?: ChatTurn[] }) => input)
  .handler(async ({ context, data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      console.error("[savia-ai] XAI_API_KEY is not set in this environment");
      return { ok: false as const, error: "ai" };
    }
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
    const text = await callGrok(apiKey, [
          {
            role: "system",
            content: saviaPrompt(
              lang,
              emergencyLine((profile as { country?: string }).country),
              `- Name: ${profile.displayName || "not set"}
- Call her: ${callName(profile.displayName) || "not set"}
- Age (approx): ${age}
- Season: ${profile.stage}
- Intention: ${profile.intention}
- Cycle length: ${profile.cycleLength} days, period ${profile.periodLength} days
- Last period start: ${profile.lastPeriodStart ?? "unknown"}
- Cycle day: ${meta.cycleDay ?? "n/a"}
- Phase: ${meta.phase}
- Next period: ${nextPeriodDate(profile.lastPeriodStart, profile.cycleLength) ?? "n/a"}
- Pregnancy week: ${meta.pregnancyWeek ?? "n/a"}
- Due date: ${profile.dueDate ?? "n/a"}
- Today log: flow ${log?.flow ?? "none"}, mucus ${log?.mucus ?? "none"}, symptoms ${(log?.symptoms ?? []).join(", ") || "none"}, mood ${log?.mood ?? "n/a"}`,
            ),
          },
          ...history,
          { role: "user", content: data.question.slice(0, 2000) },
        ]);
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
  callName?: string;
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
  nextPeriod?: string | null;
  country?: string;
  todayISO?: string;
  todayLabel?: string;
  flow?: string;
  mucus?: string;
  symptoms?: string[];
  mood?: number | null;
  energy?: number | null;
  sleepHours?: number | null;
  feeling?: string | null;
  userNote?: string;
  letterTitle?: string;
  song?: string;
  daysUntilPeriod?: number | null;
};

/**
 * Beta chat (no session). Requires a valid device credential, zod caps, and
 * per-device + per-IP rate limits (Postgres, savia_rate_limits).
 */
export const askSaviaOpen = createServerFn({ method: "POST" })
  .validator((input: z.input<typeof askOpenSchema>) => {
    const r = askOpenSchema.safeParse(input);
    return r.success ? r.data : null;
  })
  .handler(async ({ data }) => {
    if (!data) return { ok: false as const, error: "invalid" as const };
    if (!(await assertDevice(data.deviceId, data.token))) {
      return { ok: false as const, error: "device" as const };
    }
    const sql = await getSql();
    const ip = await rateKey(await callerIp());
    const dev = await rateKey(data.deviceId);
    const allowed =
      (await rateLimit(sql, "ai-chat-d10m", dev, AI_LIMITS.chatDevice10m, 600)) &&
      (await rateLimit(sql, "ai-chat-dday", dev, AI_LIMITS.chatDeviceDay, 86400)) &&
      (await rateLimit(sql, "ai-chat-ip10m", ip, AI_LIMITS.chatIp10m, 600));
    if (!allowed) return { ok: false as const, error: "rate" as const };
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      console.error("[savia-ai] XAI_API_KEY is not set in this environment");
      return { ok: false as const, error: "ai" as const };
    }
    const lang = data.locale === "en" ? "English" : "Spanish";
    const f = data.file || {};
    const history = (data.history ?? [])
      .filter((m) => m.content.trim())
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));
    const text = await callGrok(apiKey, [
          {
            role: "system",
            content: saviaPrompt(
              lang,
              emergencyLine(f.country),
              `- Name: ${f.displayName || "not set"}
- Call her: ${f.callName || callName(f.displayName) || "not set"}
- Country: ${f.country || "LATAM"}
- TODAY: ${f.todayLabel || "unknown"} (${f.todayISO || "n/a"})
- Age: ${f.birthYear ? new Date().getFullYear() - f.birthYear : "unknown"}
- Season: ${f.stage || "cycle"}
- Intention: ${f.intention || "track"}
- Cycle length: ${f.cycleLength ?? 28}, period ${f.periodLength ?? 5}
- Last period: ${f.lastPeriodStart ?? "unknown"}
- Cycle day: ${f.cycleDay ?? "n/a"}
- Phase: ${f.phase ?? "n/a"}
- Next period: ${f.nextPeriod ?? "n/a"}
- Pregnancy week: ${f.pregnancyWeek ?? "n/a"}
- Today: flow ${f.flow ?? "none"}, mucus ${f.mucus ?? "none"}, symptoms ${(f.symptoms || []).join(", ") || "none"}, mood ${f.mood ?? "n/a"}, energy ${f.energy ?? "n/a"}, sleep ${f.sleepHours ?? "n/a"}
- Morning feeling: ${f.feeling || "not said"}
- Her note today: ${f.userNote || "(empty)"}
- Morning letter title: ${f.letterTitle || "n/a"}
- Song of the day: ${f.song || "n/a"}
- Days until period: ${f.daysUntilPeriod ?? "n/a"}`,
            ),
          },
          ...history,
          { role: "user", content: data.question.slice(0, 2000) },
        ], { maxTokens: AI_MAX_TOKENS.chat, timeoutMs: 45000 });
    if (!text) return { ok: false as const, error: "ai" as const };
    return { ok: true as const, text, remaining: null as number | null };
  });


/**
 * Daily note from Savia (2-3 sentences). Optional: the client always has a
 * template; this only upgrades it when xAI answers. Never throws.
 */
export const saviaNoteOpen = createServerFn({ method: "POST" })
  .validator((raw: z.input<typeof noteOpenSchema>) => {
    const r = noteOpenSchema.safeParse(raw);
    if (!r.success) return null;
    const input = r.data;
    return {
      deviceId: input.deviceId,
      token: input.token,
      locale: input.locale === "en" ? "en" : "es",
      facts: String(input.facts || "").slice(0, 1200),
      draft: String(input.draft || "").slice(0, 600),
      // First name only, letters — never free text into the prompt.
      name: String(input.name || "")
        .replace(/[^\p{L}\p{M}'-]/gu, "")
        .slice(0, 24),
      greeting: String(input.greeting || "")
        .replace(/[^\p{L}\p{M}\s,.¿?¡!'-]/gu, "")
        .slice(0, 60),
      moment: input.moment === "afternoon" || input.moment === "night" ? input.moment : "morning",
    };
  })
  .handler(async ({ data }) => {
    if (!data) return { ok: false as const };
    if (!(await assertDevice(data.deviceId, data.token))) return { ok: false as const };
    const sql = await getSql();
    const allowed =
      (await rateLimit(sql, "ai-note-dh", await rateKey(data.deviceId), AI_LIMITS.noteDeviceHour, 3600)) &&
      (await rateLimit(sql, "ai-note-iph", await rateKey(await callerIp()), AI_LIMITS.noteIpHour, 3600));
    if (!allowed) return { ok: false as const };
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const };
    const lang = data.locale === "en" ? "English" : "neutral Latin American Spanish with tú (never voseo)";
    const opener = data.greeting || (data.locale === "en" ? "Hi, how are you?" : "Hola, ¿cómo estás?");
    const momentHint =
      data.moment === "night"
        ? "it is evening/night for her (ask how her day went)"
        : data.moment === "afternoon"
          ? "it is afternoon for her (ask how her day is going)"
          : "it is morning for her (ask how she woke up / slept)";
    const text = await callGrok(
      apiKey,
      [
        {
          role: "system",
          content: `You are Savia, a close friend (with a doctor's knowledge) inside a cycle-tracking app for young Latin American women. Write today's short note in ${lang}, like a friend texting her.
Rules:
- Start EXACTLY with: "${opener}" (her name + the time-of-day greeting, already correct for her time zone — do not change it${data.name ? "" : "; she has no name saved, so do not invent one"}).
- Right after it, ONE or TWO short friend-style questions about her day and how she feels (${momentHint}), e.g. "¿Cómo va tu día? ¿Cómo te sientes?". Warm and close, never clinical.
- Then ONE short cycle line using only the facts given (cycle day, phase, what she logged). Never invent data.
- Max 3–4 short sentences after the greeting, max 320 characters total. Plain text, no emoji, no lists. Do not repeat her name.
- If fertile/ovulation: it is an estimate; there is more chance of pregnancy and, if she is not trying, to protect herself more — the calendar is not contraception. Never say any day is "seguro"/"safe". Never present pregnancy as a goal or promise it.
- If unprotected sex on a fertile day in the last 5 days: calmly mention emergency contraception works best the sooner.
- Not a diagnosis. No moralizing.`,
        },
        {
          role: "user",
          content: `Facts:\n${data.facts}\n\nA template draft you may improve (keep its meaning and its opening):\n${data.draft}`,
        },
      ],
      { maxTokens: AI_MAX_TOKENS.note, timeoutMs: 12000 },
    ).catch(() => null);
    if (!text) return { ok: false as const };
    return { ok: true as const, text: text.trim() };
  });
