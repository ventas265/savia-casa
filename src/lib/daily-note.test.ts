import assert from "node:assert/strict";
import { test } from "node:test";
import { acceptAiNote, buildDailyNote, buildNoteContext, moodReply, situationFor, type NoteCtx } from "./daily-note.ts";
import type { DailyLog } from "./types.ts";

const base: NoteCtx = {
  phase: "follicular", cycleDay: 8, mark: "quiet", onPeriod: false, daysToPeriod: 20, intention: "avoid",
  symptoms: [], lowMood: false, goodMood: false, pain: false, desireUp: false, desireDown: false, riskySexRecent: false, sexRecent: false,
};
const log = (day: string, extra: Partial<DailyLog> = {}): DailyLog => ({
  id: 1, userId: "t", day, flow: "none", mood: null, energy: null, sleepHours: null, notes: "",
  symptoms: [], periodStarted: false, mucus: "none", sex: false, sexKind: "none", ...extra,
});

test("period + cramps opens with the heavier check-in", () => {
  const c = { ...base, phase: "menstrual" as const, onPeriod: true, pain: true, cycleDay: 2 };
  assert.equal(situationFor(c), "periodPain");
  const n = buildDailyNote(c, "es", "2026-09-25", { name: "Claudia", hour: 15 });
  assert.match(n.checkIn, /^Claudia, buenas tardes\. /);
  assert.ok(/dolor|descansar|llevas/.test(n.checkIn), n.checkIn);
  assert.equal(n.lines[0], n.checkIn);
  assert.ok(n.lines.length >= 2 && n.lines.length <= 3);
  assert.match(n.lines[1]!, /Día 2/);
});

test("fertile note: more chance + protect, never 'safe'", () => {
  for (const seed of ["a", "b", "c", "d", "e"]) {
    const n = buildDailyNote({ ...base, mark: "fertile", cycleDay: 12 }, "es", seed);
    assert.match(n.text, /más chance/);
    assert.match(n.text, /cuídate más/);
    assert.doesNotMatch(n.text, /segur/i);
    const e = buildDailyNote({ ...base, mark: "peak", cycleDay: 14 }, "en", seed);
    assert.match(e.text, /highest chance/);
    assert.doesNotMatch(e.text, /\bsafe\b/i);
  }
});

test("rotates by date but is stable for the same date", () => {
  const a = buildDailyNote(base, "es", "2026-09-25").text;
  assert.equal(buildDailyNote(base, "es", "2026-09-25").text, a);
  const seen = new Set(["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-05", "2026-09-06"].map((d) => buildDailyNote(base, "es", d).text));
  assert.ok(seen.size >= 2);
});

test("low mood yesterday is acknowledged first", () => {
  const c = buildNoteContext({
    today: "2026-09-25", phase: "luteal", cycleDay: 20, mark: "quiet", onPeriod: false, nextPeriod: "2026-10-03", intention: "track",
    logs: [log("2026-09-24", { mood: 1 })],
  });
  assert.equal(situationFor(c), "lowMood");
  assert.match(buildDailyNote(c, "es", "x", { hour: 9 }).checkIn, /ánimo|sientes|contarme/);
});

test("risky sex on a fertile day in last 5 days adds the emergency line", () => {
  const c = buildNoteContext({
    today: "2026-09-25", phase: "follicular", cycleDay: 13, mark: "fertile", onPeriod: false, nextPeriod: null, intention: "avoid",
    logs: [log("2026-09-23", { sex: true, sexKind: "unprotected" })],
    markFor: () => "fertile",
  });
  assert.ok(c.riskySexRecent);
  assert.match(buildDailyNote(c, "es", "x").text, /emergencia funciona mejor cuanto antes/);
  const protectedOnly = buildNoteContext({
    today: "2026-09-25", phase: "follicular", cycleDay: 13, mark: "fertile", onPeriod: false, nextPeriod: null, intention: "avoid",
    logs: [log("2026-09-23", { sex: true, sexKind: "protected" })],
    markFor: () => "fertile",
  });
  assert.ok(!protectedOnly.riskySexRecent);
});

test("pre-period and mood replies", () => {
  assert.equal(situationFor({ ...base, phase: "luteal", daysToPeriod: 2 }), "prePeriod");
  assert.match(moodReply("bad", "prePeriod", "es", "x"), /no es tu culpa/);
  assert.ok(moodReply("good", "none", "en", "x").length > 10);
});

test("AI note guard rejects 'safe' wording, emoji and bad lengths", () => {
  assert.equal(acceptAiNote("Hoy es un día seguro para ti, no pasa nada con nada."), null);
  assert.equal(acceptAiNote("corto"), null);
  assert.equal(acceptAiNote("¿Qué tal tu día? 🌸 Hoy es día 3 de tu ciclo, descansa."), null);
  assert.equal(acceptAiNote("¿Qué tal tu día? Hoy es día 3 de tu ciclo: descansa y toma agua."), "¿Qué tal tu día? Hoy es día 3 de tu ciclo: descansa y toma agua.");
});

test("note opens with name + greeting + question; no name → «Hola, ¿cómo estás?»", () => {
  const n = buildDailyNote(base, "es", "2026-09-26", { name: "Claudia", hour: 15 });
  assert.match(n.lines[0]!, /^Claudia, buenas tardes\. ¿[^?]+\? ¿[^?]+\?$/);
  assert.match(n.lines[1]!, /Día 8/);
  assert.equal(n.opener.greeting, "Claudia, buenas tardes.");
  const m = buildDailyNote(base, "es", "2026-09-26", { name: "Claudia", hour: 7 });
  assert.match(m.checkIn, /^Claudia, buenos días\./);
  const e = buildDailyNote(base, "es", "2026-09-26", { name: "Claudia", hour: 19 });
  assert.match(e.checkIn, /^Claudia, buenas noches\./);
  const anon = buildDailyNote(base, "es", "2026-09-26", { name: "tú", hour: 15 });
  assert.match(anon.checkIn, /^Hola, ¿cómo estás\? /);
});

test("mood reply uses the name", () => {
  assert.match(moodReply("meh", "luteal", "es", "x", "Claudia"), /Anotado, Claudia\./);
  assert.match(moodReply("meh", "luteal", "es", "x"), /^Anotado\./);
});

test("AI note must open with the expected greeting", () => {
  const ok = "Claudia, buenas tardes. ¿Cómo va tu día? Día 8: tu energía suele ir subiendo estos días.";
  assert.equal(acceptAiNote(ok, "Claudia, buenas tardes."), ok);
  assert.equal(acceptAiNote("¿Qué tal tu día? Hoy es día 3 de tu ciclo: descansa y toma agua.", "Claudia, buenas tardes."), null);
  assert.equal(acceptAiNote("Hola, ¿cómo estás? ¿Cómo va tu día? Día 3 de tu ciclo: descansa.", "Hola, ¿cómo estás?")?.startsWith("Hola"), true);
});
