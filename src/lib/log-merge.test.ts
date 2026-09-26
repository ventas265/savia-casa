import assert from "node:assert/strict";
import { test } from "node:test";
import { mergeLog } from "./log-merge.ts";
import type { DailyLog } from "./types.ts";

const UUID = "4e20d81b-0725-4b46-b3e7-526a2a2b96cb";
const day = "2026-09-26";
const existing: DailyLog = {
  id: 7,
  userId: UUID,
  day,
  flow: "none",
  mood: 4,
  energy: null,
  sleepHours: 7,
  notes: "nota",
  symptoms: ["cramps", "headache"],
  periodStarted: false,
  mucus: "creamy",
  sex: true,
  sexKind: "protected",
};

test("registering a period keeps the day's symptoms, mood and hearts", () => {
  const m = mergeLog(existing, day, { periodStarted: true, flow: "medium" }, UUID);
  assert.deepEqual(m.symptoms, ["cramps", "headache"]);
  assert.equal(m.flow, "medium");
  assert.equal(m.periodStarted, true);
  assert.equal(m.mood, 4);
  assert.equal(m.notes, "nota");
  assert.equal(m.mucus, "creamy");
  assert.equal(m.sexKind, "protected");
});

test("quick symptom popup adds without removing", () => {
  const m = mergeLog(existing, day, { addSymptoms: ["bloating", "cramps"] }, UUID);
  assert.deepEqual(m.symptoms, ["cramps", "headache", "bloating"]);
  assert.equal(m.flow, "none");
});

test("full editor can replace the list (deselect)", () => {
  const m = mergeLog(existing, day, { symptoms: ["headache"] }, UUID);
  assert.deepEqual(m.symptoms, ["headache"]);
});

test("owner id stays the device UUID, never «beta»", () => {
  assert.equal(mergeLog(existing, day, { mood: 2 }, "beta").userId, UUID);
  assert.equal(mergeLog({ ...existing, userId: "beta" }, day, { mood: 2 }, UUID).userId, UUID);
  assert.equal(mergeLog(null, day, { mood: 2 }, UUID).userId, UUID);
});

test("new day defaults: no mucus picked, no flow", () => {
  const m = mergeLog(null, day, { addSymptoms: ["acne"] }, UUID);
  assert.equal(m.mucus, "none");
  assert.equal(m.flow, "none");
  assert.equal(m.periodStarted, false);
  assert.equal(m.sexKind, "none");
});
