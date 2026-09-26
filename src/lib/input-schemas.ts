/**
 * zod input schemas for public (no-session) server functions. Pure module so
 * node:test can check the caps. Caps are generous vs. what the app sends and
 * strict vs. abuse; handlers still slice what goes into prompts.
 */
import { z } from "zod";

const s = (max: number) => z.string().max(max);
const optS = (max: number) => z.string().max(max).nullish();
const optN = z.number().finite().nullish();

export const deviceCredsSchema = {
  deviceId: z.string().min(8).max(80),
  token: z.string().min(16).max(200),
};

export const chatTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: s(6000),
});

export const askFileSchema = z
  .object({
    displayName: optS(80),
    callName: optS(40),
    birthYear: z.number().int().min(1900).max(2100).nullish(),
    stage: optS(20),
    intention: optS(20),
    cycleLength: optN,
    periodLength: optN,
    lastPeriodStart: optS(20),
    dueDate: optS(20),
    cycleDay: optN,
    phase: optS(20),
    pregnancyWeek: optN,
    nextPeriod: optS(20),
    country: optS(4),
    todayISO: optS(20),
    todayLabel: optS(80),
    flow: optS(20),
    mucus: optS(20),
    symptoms: z.array(s(40)).max(40).nullish(),
    mood: optN,
    energy: optN,
    sleepHours: optN,
    feeling: optS(200),
    userNote: optS(2000),
    letterTitle: optS(200),
    song: optS(200),
    daysUntilPeriod: optN,
  })
  .strip();

export const askOpenSchema = z.object({
  ...deviceCredsSchema,
  question: z.string().trim().min(1).max(4000),
  locale: s(8),
  history: z.array(chatTurnSchema).max(20).optional(),
  file: askFileSchema.optional(),
});

export const noteOpenSchema = z.object({
  ...deviceCredsSchema,
  locale: s(8),
  facts: s(4000),
  draft: s(2000),
  name: s(100).optional(),
  greeting: s(200).optional(),
  moment: s(20).optional(),
});

export const waitlistSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  plan: z.enum(["serena", "year"]),
});

export const paymentReportSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  plan: z.enum(["serena", "year"]),
  note: z.string().max(300),
});

const payField = (max = 200) => z.string().max(max);
export const paySettingsSchema = z.object({
  zinli: payField(),
  pmPhone: payField(),
  pmBank: payField(),
  pmId: payField(),
  usdt: payField(),
  cardUrl: payField(500),
  paypalUrl: payField(500),
  paypalEmail: payField(),
  binance: payField(),
  bankName: payField(),
  bankAccount: payField(),
  bankHolder: payField(),
});

const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Undo / correct a period start (device credential required). */
export const removePeriodSchema = z.object({
  ...deviceCredsSchema,
  day: isoDay,
  lastPeriodStart: isoDay.nullable(),
  cycleLength: z.number().int().min(21).max(45).nullish(),
  log: z
    .object({
      flow: z.enum(["none", "spotting", "light", "medium", "heavy"]),
      mood: z.number().int().min(0).max(5).nullable(),
      energy: z.number().int().min(0).max(5).nullable(),
      sleepHours: z.number().min(0).max(24).nullable(),
      notes: z.string().max(500),
      symptoms: z.array(z.string().max(40)).max(24),
      periodStarted: z.boolean(),
      mucus: z.enum(["none", "sticky", "creamy", "eggwhite", "watery"]),
      sex: z.boolean(),
      sexKind: z.enum(["none", "protected", "unprotected", "withdrawal"]),
    })
    .nullable()
    .optional(),
});

/** Output caps for xAI calls (reasoning tokens count against these). */
export const AI_MAX_TOKENS = { chat: 2500, note: 1200 } as const;
/** Per-window request caps for the AI endpoints. */
export const AI_LIMITS = {
  chatDevice10m: 20,
  chatDeviceDay: 150,
  chatIp10m: 60,
  noteDeviceHour: 8,
  noteIpHour: 40,
} as const;
