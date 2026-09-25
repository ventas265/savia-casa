import assert from "node:assert/strict";
import { test } from "node:test";
import { addDaysISO } from "./cycle.ts";
import { computeInsights, insightText, learningText, phaseOfDay } from "./insights.ts";
import type { DailyLog } from "./types.ts";

const TODAY = "2026-09-25";
let id = 0;
const log = (day: string, extra: Partial<DailyLog> = {}): DailyLog => ({
  id: ++id, userId: "t", day, flow: "none", mood: null, energy: null, sleepHours: null, notes: "",
  symptoms: [], periodStarted: false, mucus: "none", sex: false, sexKind: "none", ...extra,
});

function history(gaps: number[]) {
  const starts: string[] = [];
  let s = TODAY;
  starts.unshift(addDaysISO(s, -12));
  s = starts[0]!;
  for (const g of [...gaps].reverse()) {
    s = addDaysISO(s, -g);
    starts.unshift(s);
  }
  const logs: DailyLog[] = [];
  for (const st of starts) {
    for (let i = 0; i < 5; i++) logs.push(log(addDaysISO(st, i), { flow: i < 2 ? "heavy" : "medium", periodStarted: i === 0, symptoms: i === 0 ? ["cramps"] : [] }));
    logs.push(log(addDaysISO(st, -2), { symptoms: ["headache"], mood: 2 }));
    logs.push(log(addDaysISO(st, -4), { mood: 2 }));
    logs.push(log(addDaysISO(st, 8), { mood: 5, symptoms: ["libido_up"] }));
    logs.push(log(addDaysISO(st, 9), { mood: 4, symptoms: ["libido_up"] }));
  }
  return { starts, logs };
}

test("little data: learning message, no invented insights", () => {
  const r = computeInsights({ starts: [addDaysISO(TODAY, -10)], logs: [log(TODAY, { mood: 3 })], periodLength: 5, cycleLength: 28, today: TODAY });
  assert.equal(r.items.length, 0);
  assert.deepEqual(r.learning, { periodsMore: 2, daysMore: 19 });
  assert.equal(learningText(r.learning!, "es"), "Savia está aprendiendo: anota 2 reglas y 19 días más.");
});

test("3+ cycles: learned length, regularity, period length, symptom timing, mood & desire by phase", () => {
  const { starts, logs } = history([30, 29, 30]);
  const r = computeInsights({ starts, logs, periodLength: 5, cycleLength: 28, today: TODAY });
  const ids = r.items.map((i) => i.id);
  assert.equal(ids[0], "cycleLength");
  const len = r.items.find((i) => i.id === "cycleLength");
  assert.ok(len && len.id === "cycleLength" && len.avg === 30);
  const reg = r.items.find((i) => i.id === "regularity");
  assert.ok(reg && reg.id === "regularity" && reg.regular && reg.variation === 1);
  const pl = r.items.find((i) => i.id === "periodLength");
  assert.ok(pl && pl.id === "periodLength" && pl.avg === 5);
  const sb = r.items.find((i) => i.id === "symptomBefore");
  assert.ok(sb && sb.id === "symptomBefore" && sb.symptom === "headache" && sb.days === 2);
  assert.ok(ids.includes("symptomDuring"));
  const mood = r.items.find((i) => i.id === "moodByPhase");
  assert.ok(mood && mood.id === "moodByPhase" && mood.low === "luteal");
  const des = r.items.find((i) => i.id === "desireByPhase");
  assert.ok(des && des.id === "desireByPhase" && des.phase === "follicular");
  assert.match(insightText(sb!, "es").title, /dolor de cabeza suele llegar ~2 días antes/);
  assert.match(insightText(len!, "en").detail, /Not the textbook 28/);
});

test("irregular cycles are flagged gently", () => {
  const { starts, logs } = history([24, 38, 29]);
  const r = computeInsights({ starts, logs, periodLength: 5, cycleLength: 28, today: TODAY });
  const reg = r.items.find((i) => i.id === "regularity");
  assert.ok(reg && reg.id === "regularity" && !reg.regular && reg.atypical);
  assert.match(insightText(reg!, "es").detail, /médica/);
});

test("phaseOfDay uses the real start before the day", () => {
  const starts = ["2026-08-01", "2026-08-31"];
  assert.equal(phaseOfDay("2026-08-02", starts, 5, 28), "menstrual");
  assert.equal(phaseOfDay("2026-08-25", starts, 5, 28), "luteal");
  assert.equal(phaseOfDay("2026-07-20", starts, 5, 28), "none");
});

test("symptom phrasing agrees in number", () => {
  assert.match(insightText({ id: "symptomDuring", symptom: "cramps", days: 1, cycles: 3 }, "es").title, /Los cólicos se concentran en el primer día de tu regla/);
  assert.match(insightText({ id: "symptomBefore", symptom: "headache", days: 2, cycles: 3 }, "en").title, /Headaches tend to show up/);
  assert.match(insightText({ id: "regularity", regular: true, min: 29, max: 30, variation: 1, atypical: false }, "es").detail, /1 día entre/);
});
