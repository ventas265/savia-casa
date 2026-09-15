import assert from "node:assert/strict";
import { test } from "node:test";
import { cycleDay, formatDay, fromISO, nextPeriodDate, phaseForDay, predictPeriod, todayISO, weightedCycle } from "./cycle.ts";

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
