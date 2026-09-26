import assert from "node:assert/strict";
import { test } from "node:test";
import {
  confidenceLabel,
  cycleLengthIfStarted,
  dayInfo,
  effectiveCycle,
  formatRange,
  isNewPeriodStart,
  predictionLabel,
  predictRange,
  snapshotMeta,
  upcomingFertile,
} from "./cycle.ts";
import type { SaviaProfile } from "./types.ts";

const base = { cycleLength: 28, periodLength: 5 };

// --- prediction range + confidence -----------------------------------------

test("range: one known period = low confidence, ±3 days, «1 ciclo»", () => {
  const p = predictRange("2026-09-20", ["2026-09-20"], 28);
  assert.equal(p.next, "2026-10-18");
  assert.equal(p.from, "2026-10-15");
  assert.equal(p.to, "2026-10-21");
  assert.equal(p.confidence, "low");
  assert.equal(p.cycles, 1);
  assert.equal(predictionLabel(p, "es"), "15–21 oct · confianza baja, 1 ciclo");
});

test("range: learns the average of her logged cycles (not the default)", () => {
  // gaps 30, 31, 29 → avg 30
  const starts = ["2026-06-01", "2026-07-01", "2026-08-01", "2026-08-30"];
  const p = predictRange("2026-08-30", starts, 28);
  assert.equal(p.len, 30);
  assert.equal(p.next, "2026-09-29");
  assert.equal(effectiveCycle(starts, 28), 30);
});

test("confidence grows with regular cycles and drops with spread", () => {
  const regular = ["2026-01-01", "2026-01-29", "2026-02-26", "2026-03-26", "2026-04-23"]; // 4 × 28
  const r = predictRange(null, regular, 28);
  assert.equal(r.n, 4);
  assert.equal(r.confidence, "high");
  assert.equal(r.pad, 1);
  const two = predictRange(null, regular.slice(0, 3), 28);
  assert.equal(two.confidence, "medium");
  const messy = ["2026-01-01", "2026-01-24", "2026-03-01", "2026-03-26", "2026-05-01"]; // 23, 36, 25, 36
  const m = predictRange(null, messy, 28);
  assert.equal(m.confidence, "low");
  assert.ok(m.pad >= 4, `pad ${m.pad}`);
  assert.equal(confidenceLabel(r, "es"), "confianza alta, 5 ciclos");
});

test("range across months formats both months", () => {
  assert.equal(formatRange("2026-10-28", "2026-11-03", "es"), "28 oct – 3 nov");
  assert.equal(formatRange("2026-10-15", "2026-10-21", "en"), "15–21 Oct");
});

test("short cycle warning uses the closest earlier start", () => {
  assert.equal(cycleLengthIfStarted("2026-09-26", ["2026-09-20", "2026-08-20"]), 6);
  assert.equal(cycleLengthIfStarted("2026-09-26", []), null);
});

// --- phase / day computation -------------------------------------------------

test("predicted period today never becomes menstruation (no wrap, asks instead)", () => {
  // last start Aug 29 + 28 → expected Sep 26 (today)
  const i = dayInfo("2026-09-26", { lastStart: "2026-08-29", ...base, periodStarts: ["2026-08-29"], today: "2026-09-26" });
  assert.equal(i.cycleDay, 29);
  assert.notEqual(i.phase, "menstrual");
  assert.equal(i.confirmed, false);
  const late = dayInfo("2026-09-30", { lastStart: "2026-08-29", ...base, today: "2026-09-30" });
  assert.equal(late.cycleDay, 33);
  assert.equal(late.late, true);
  assert.equal(late.mark, null);
});

test("phase follows period duration: day 7 of a 5-day period is follicular, not «periodo»", () => {
  const i = dayInfo("2026-09-26", { lastStart: "2026-09-20", ...base, today: "2026-09-26" });
  assert.equal(i.cycleDay, 7);
  assert.equal(i.phase, "follicular");
  assert.equal(i.confirmed, false);
  assert.notEqual(i.mark, "period");
  const d3 = dayInfo("2026-09-22", { lastStart: "2026-09-20", ...base, today: "2026-09-26" });
  assert.equal(d3.phase, "menstrual");
  assert.equal(d3.mark, "period");
  assert.equal(d3.confirmed, true);
});

test("logged bleeding = period and menstrual phase together (never «Regla» + Folicular)", () => {
  const i = dayInfo("2026-09-26", {
    lastStart: "2026-09-20",
    ...base,
    periodLength: 5,
    periodDays: ["2026-09-26"],
    today: "2026-09-26",
  });
  assert.equal(i.mark, "period");
  assert.equal(i.phase, "menstrual");
});

test("no fertile marks in the past without data", () => {
  // before her first known start
  const before = dayInfo("2026-09-05", { lastStart: "2026-09-20", ...base, today: "2026-09-26" });
  assert.equal(before.mark, null);
  assert.equal(before.cycleDay, null);
  // a finished cycle between two starts uses its real length
  const past = dayInfo("2026-08-26", {
    lastStart: "2026-09-20",
    ...base,
    periodStarts: ["2026-08-20", "2026-09-20"],
    today: "2026-09-26",
  });
  assert.equal(past.cycleDay, 7);
  assert.equal(past.projected, false);
});

test("future days are projected (dotted) and wrap into the next cycle", () => {
  const f = dayInfo("2026-10-18", { lastStart: "2026-09-20", ...base, today: "2026-09-26" });
  assert.equal(f.projected, true);
  assert.equal(f.mark, "period");
  assert.equal(f.confirmed, false);
  const fert = dayInfo("2026-10-04", { lastStart: "2026-09-20", ...base, today: "2026-09-26" });
  assert.equal(fert.projected, true);
  assert.ok(fert.mark === "fertile" || fert.mark === "peak");
  const win = upcomingFertile({ lastStart: "2026-09-20", ...base, today: "2026-09-26" });
  assert.ok(win && win.start >= "2026-09-26");
});

test("snapshotMeta uses the same rules as the calendar", () => {
  const profile = {
    userId: "u",
    displayName: "QA",
    stage: "cycle",
    birthYear: null,
    cycleLength: 28,
    periodLength: 5,
    lastPeriodStart: "2026-08-29",
    dueDate: null,
    lastPeriodYear: null,
    onboardingDone: true,
    locale: "es",
    plan: "beta",
    intention: "avoid",
    country: "VE",
    askCount: 0,
  } satisfies SaviaProfile;
  const m = snapshotMeta(profile, "2026-09-27", { starts: ["2026-08-29"] });
  assert.equal(m.cycleDay, 30);
  assert.equal(m.phase, "luteal");
});

test("a bleeding day right after a start is not a new start", () => {
  assert.equal(isNewPeriodStart("2026-09-22", ["2026-09-20"], 5), false);
  assert.equal(isNewPeriodStart("2026-10-17", ["2026-09-20"], 5), true);
});
