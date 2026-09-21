import assert from "node:assert/strict";
import { test } from "node:test";
import { asIsoDay, cycleDay, formatDay, fromISO, inDayRange, isConfirmedPeriodDay, nextPeriodDate, phaseForDay, predictPeriod, todayISO, weightedCycle } from "./cycle.ts";

test("cycle day 1 is the start", () => {
  assert.equal(cycleDay("2026-01-01", 28, "2026-01-01"), 1);
});

test("day 14 of 28 is ovulatory", () => {
  const n = cycleDay("2026-01-01", 28, "2026-01-14");
  assert.equal(phaseForDay(n, 5, 28), "ovulatory");
});

test("next period is last + length", () => {
  assert.equal(nextPeriodDate("2026-01-01", 28), "2026-01-29");
});

test("weighted cycle prefers the last gap", () => {
  assert.equal(weightedCycle(["2026-01-01", "2026-01-29", "2026-02-26", "2026-03-28"], 28), 29);
});

test("predict widens pad when peri", () => {
  const p = predictPeriod("2026-03-01", ["2026-01-01", "2026-02-10", "2026-03-01"], 28, "peri");
  assert.ok((p.pad ?? 0) >= 4);
  assert.ok(p.next);
});

test("todayISO matches local Y-M-D getters", () => {
  const d = new Date(2026, 8, 15, 1, 0, 0); // 15 Sept local
  assert.equal(todayISO(d), "2026-09-15");
});

test("fromISO keeps calendar day (no UTC midnight parse)", () => {
  const d = fromISO("2026-09-15");
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 8);
  assert.equal(d.getDate(), 15);
  assert.equal(formatDay("2026-09-15", "en"), d.toLocaleDateString("en-US", { day: "numeric", month: "short" }));
});

test("fromISO strips time suffix without shifting the day", () => {
  const d = fromISO("2026-09-15T23:00:00.000Z");
  assert.equal(todayISO(d), "2026-09-15");
});

test("asIsoDay keeps YYYY-MM-DD strings", () => {
  assert.equal(asIsoDay("2026-09-15"), "2026-09-15");
  assert.equal(asIsoDay("2026-09-15T12:00:00.000Z"), "2026-09-15");
  assert.equal(asIsoDay("nope"), null);
});

test("asIsoDay UTC-midnight Date stays on that calendar day", () => {
  const d = new Date("2026-09-15T00:00:00.000Z");
  assert.equal(asIsoDay(d), "2026-09-15");
});

test("inDayRange includes endpoints", () => {
  assert.equal(inDayRange("2026-09-20", "2026-09-18", "2026-09-22"), true);
  assert.equal(inDayRange("2026-09-18", "2026-09-18", "2026-09-22"), true);
  assert.equal(inDayRange("2026-09-22", "2026-09-18", "2026-09-22"), true);
  assert.equal(inDayRange("2026-09-17", "2026-09-18", "2026-09-22"), false);
  assert.equal(inDayRange("2026-09-20", null, "2026-09-22"), false);
});

test("predict window can include today before exact next", () => {
  // last start Mar 1, 28d → next Mar 29; with few cycles pad >= 2 → from Mar 27
  const p = predictPeriod("2026-03-01", [], 28, "cycle");
  assert.equal(p.next, "2026-03-29");
  assert.ok(p.from && p.to);
  assert.equal(inDayRange("2026-03-28", p.from, p.to), true);
  assert.equal(inDayRange("2026-03-20", p.from, p.to), false);
});

test("isConfirmedPeriodDay treats Ogino wrap as estimate, not confirmed", () => {
  // last start Aug 23 + 28 → Sept 20; on Sept 21 cycleDay wraps to 2 but no new start logged
  assert.equal(
    isConfirmedPeriodDay("2026-09-21", {
      lastStart: "2026-08-23",
      periodLength: 5,
      periodStarts: ["2026-08-23"],
    }),
    false,
  );
  assert.equal(
    isConfirmedPeriodDay("2026-08-24", {
      lastStart: "2026-08-23",
      periodLength: 5,
      periodStarts: ["2026-08-23"],
    }),
    true,
  );
  assert.equal(
    isConfirmedPeriodDay("2026-09-21", {
      lastStart: "2026-08-23",
      periodLength: 5,
      periodStarts: ["2026-08-23"],
      log: { periodStarted: true, flow: "medium" },
    }),
    true,
  );
});
