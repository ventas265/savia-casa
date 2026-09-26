import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPatch, toSaveInput, desireOf, draftFrom, otherSymptoms, stepSleep, suggestedSymptoms, toggle, withDesire, EMOTIONS, STEP4_IDS } from "./anotar.ts";
import { mergeLog } from "./log-merge.ts";
import { SYMPTOMS, type DailyLog } from "./types.ts";

const full: DailyLog = {
  id: 7,
  userId: "dev-1",
  day: "2026-09-26",
  flow: "light",
  mood: 2,
  energy: 5,
  sleepHours: 6.5,
  notes: "nota vieja",
  symptoms: ["cramps", "hot_flash", "libido_down"],
  periodStarted: true,
  mucus: "watery",
  sex: true,
  sexKind: "withdrawal",
};

test("anotar: untouched draft sends an empty patch and merge keeps every field", () => {
  const d = draftFrom(full);
  const patch = buildPatch(d, d);
  assert.deepEqual(patch, {});
  assert.deepEqual(mergeLog(full, full.day, patch, "dev-1"), full);
});

test("anotar: changing mood only touches mood (sex, notes, flow, mucus, energy, sleep kept)", () => {
  const init = draftFrom(full);
  const patch = buildPatch(init, { ...init, mood: 4 });
  assert.deepEqual(patch, { mood: 4 });
  const merged = mergeLog(full, full.day, patch, "dev-1");
  assert.equal(merged.mood, 4);
  assert.equal(merged.sexKind, "withdrawal");
  assert.equal(merged.sex, true);
  assert.equal(merged.notes, "nota vieja");
  assert.equal(merged.energy, 5);
  assert.equal(merged.sleepHours, 6.5);
  assert.equal(merged.periodStarted, true);
});

test("anotar: symptom toggles keep ids the UI does not show (hot_flash)", () => {
  const init = draftFrom(full);
  const next = { ...init, symptoms: toggle(init.symptoms, "headache") };
  const merged = mergeLog(full, full.day, buildPatch(init, next), "dev-1");
  assert.deepEqual(merged.symptoms.sort(), ["cramps", "headache", "hot_flash", "libido_down"].sort());
});

test("anotar: sexKind change sends sex boolean too; none clears the heart", () => {
  const init = draftFrom(full);
  const patch = buildPatch(init, { ...init, sexKind: "none" });
  assert.deepEqual(patch, { sexKind: "none", sex: false });
  const merged = mergeLog(full, full.day, patch, "dev-1");
  assert.equal(merged.sex, false);
  assert.equal(merged.sexKind, "none");
});

test("anotar: legacy sex=true without kind reads as unprotected", () => {
  assert.equal(draftFrom({ ...full, sexKind: "none", sex: true }).sexKind, "unprotected");
  assert.equal(draftFrom(null).sexKind, "none");
});

test("anotar: desire maps onto libido_up / libido_down only", () => {
  assert.equal(desireOf(["libido_down"]), "low");
  assert.deepEqual(withDesire(["cramps", "libido_down"], "high"), ["cramps", "libido_up"]);
  assert.deepEqual(withDesire(["cramps", "libido_up"], null), ["cramps"]);
});

test("anotar: every stored symptom id stays reachable in some step", () => {
  const sug = suggestedSymptoms("luteal", "headache").map((s) => s.id);
  const reach = new Set([...sug, ...otherSymptoms(sug), ...EMOTIONS.map((e) => e.id), ...STEP4_IDS]);
  for (const id of SYMPTOMS) assert.ok(reach.has(id), id);
});

test("anotar: suggestions put her repeat symptom first, 4 max, no duplicates", () => {
  const s = suggestedSymptoms("luteal", "backache");
  assert.equal(s[0]!.id, "backache");
  assert.equal(s[0]!.why, "cycle");
  assert.equal(s.length, 4);
  assert.equal(new Set(s.map((x) => x.id)).size, 4);
});

test("anotar: sleep moves in 30-minute steps within 0–14 h", () => {
  assert.equal(stepSleep(null, 1), 7.5);
  assert.equal(stepSleep(6.5, -1), 6);
  assert.equal(stepSleep(0, -1), 0);
  assert.equal(stepSleep(14, 1), 14);
});

test("anotar: save payload = old LogForm format; untouched save keeps the row intact", () => {
  const input = toSaveInput(full.day, draftFrom(full));
  assert.deepEqual(Object.keys(input).sort(), ["day", "energy", "flow", "mood", "mucus", "notes", "sex", "sexKind", "sleepHours", "symptoms"]);
  const { day: _d, ...patch } = input;
  void _d;
  assert.deepEqual(mergeLog(full, full.day, patch, "dev-1"), full);
});

test("anotar: a quick «Guardar ya» after one tap only changes that field", () => {
  const d = { ...draftFrom(full), flow: "heavy" as const };
  const { day: _d, ...patch } = toSaveInput(full.day, d);
  void _d;
  const merged = mergeLog(full, full.day, patch, "dev-1");
  assert.deepEqual({ ...merged, flow: "light" }, full);
});
