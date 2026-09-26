import assert from "node:assert/strict";
import { test } from "node:test";
import {
  companionName,
  companionOpener,
  dayInTimeZone,
  greetingFor,
  greetingLine,
  hourInTimeZone,
  momentForHour,
  moodReplyText,
  pushMessage,
  safeTimeZone,
  talkOpener,
  withName,
  MOMENT_QUESTIONS,
  FEELING_QUESTIONS,
  PUSH_CYCLE_LINES,
} from "./companion-messages.ts";

test("greeting by hour: días < 12, tardes 12–18:59, noches ≥ 19", () => {
  for (const h of [0, 5, 8, 11]) assert.equal(greetingFor(h), "buenos días", `h=${h}`);
  for (const h of [12, 13, 15, 18]) assert.equal(greetingFor(h), "buenas tardes", `h=${h}`);
  for (const h of [19, 20, 23]) assert.equal(greetingFor(h), "buenas noches", `h=${h}`);
  assert.equal(momentForHour(11.99), "morning");
  assert.equal(momentForHour(24), "morning");
  assert.equal(greetingFor(15, "en"), "good afternoon");
});

test("opener with name: «Claudia, buenas tardes. ¿…? ¿…?»", () => {
  const o = companionOpener({ name: "Claudia", hour: 15, situation: "none", seed: "2026-09-26" });
  assert.equal(o.greeting, "Claudia, buenas tardes.");
  assert.equal(o.title, "Claudia, buenas tardes");
  assert.match(o.line, /^Claudia, buenas tardes\. ¿[^?]+\? ¿[^?]+\?$/);
  assert.ok(MOMENT_QUESTIONS.es.afternoon.some((q) => o.question.startsWith(q)));
  const m = companionOpener({ name: "claudia", hour: 8, seed: "x" });
  assert.match(m.line, /^Claudia, buenos días\. /);
  const n = companionOpener({ name: "Claudia", hour: 21, seed: "x" });
  assert.match(n.line, /^Claudia, buenas noches\. /);
  assert.ok(MOMENT_QUESTIONS.es.night.some((q) => n.question.startsWith(q)));
});

test("name fallback: missing / «tú» / junk → «Hola, ¿cómo estás?»", () => {
  for (const raw of [undefined, null, "", "  ", "tú", "Tu", "you", "1234", "x"]) {
    assert.equal(companionName(raw as string | null | undefined), "", String(raw));
    const o = companionOpener({ name: raw as string | null | undefined, hour: 15, situation: "period", seed: "d" });
    assert.ok(o.line.startsWith("Hola, ¿cómo estás? ¿"), o.line);
    assert.equal(o.title, "Hola");
  }
  assert.equal(companionName("  maría josé  "), "María");
  assert.equal(companionName("CLAUDIA"), "Claudia");
  assert.equal(companionName("Claudia 🌸"), "Claudia");
  // Her capitalisation is kept: initials stay, mixed case stays.
  assert.equal(companionName("QA Diseño"), "QA");
  assert.equal(companionName("McKenzie"), "McKenzie");
  assert.equal(companionName("ana"), "Ana");
  assert.equal(withName("Me encanta{,nombre}. Guardado.", ""), "Me encanta. Guardado.");
  assert.equal(withName("{Nombre, }te leo.", ""), "Te leo.");
  assert.equal(withName("{Nombre, }te leo.", "clau"), "Clau, te leo.");
});

test("time zone: same instant, different local hour/day", () => {
  const instant = new Date("2026-09-26T16:30:00Z");
  assert.equal(hourInTimeZone(instant, "America/Caracas"), 12); // UTC-4
  assert.equal(greetingFor(hourInTimeZone(instant, "America/Caracas")), "buenas tardes");
  assert.equal(hourInTimeZone(instant, "America/Mexico_City"), 10); // UTC-6
  assert.equal(greetingFor(hourInTimeZone(instant, "America/Mexico_City")), "buenos días");
  assert.equal(hourInTimeZone(instant, "Europe/Madrid"), 18); // UTC+2 (CEST)
  const late = new Date("2026-09-27T01:30:00Z");
  assert.equal(hourInTimeZone(late, "America/Caracas"), 21);
  assert.equal(greetingFor(hourInTimeZone(late, "America/Caracas")), "buenas noches");
  assert.equal(dayInTimeZone(late, "America/Caracas"), "2026-09-26");
  assert.equal(dayInTimeZone(late, "UTC"), "2026-09-27");
  // Invalid / missing zone falls back to Caracas.
  assert.equal(safeTimeZone("Not/AZone"), "America/Caracas");
  assert.equal(safeTimeZone(""), "America/Caracas");
  assert.equal(hourInTimeZone(instant, "Not/AZone"), 12);
  assert.equal(hourInTimeZone(new Date("2026-09-26T04:00:00Z"), "America/Caracas"), 0);
});

test("questions rotate by date, stable for the same date", () => {
  const same = companionOpener({ name: "Claudia", hour: 15, situation: "luteal", seed: "2026-09-26" }).line;
  assert.equal(companionOpener({ name: "Claudia", hour: 15, situation: "luteal", seed: "2026-09-26" }).line, same);
  const seen = new Set(
    Array.from({ length: 10 }, (_, i) => companionOpener({ name: "Claudia", hour: 15, situation: "luteal", seed: `2026-09-${10 + i}` }).line),
  );
  assert.ok(seen.size >= 3, `only ${seen.size} variants`);
});

test("voice rules: no 'seguro', no emoji, pushes ≤ 90-char cycle lines, fertile = estimate", () => {
  const all = [
    ...Object.values(MOMENT_QUESTIONS.es).flat(),
    ...Object.values(FEELING_QUESTIONS.es).flat(),
    ...Object.values(PUSH_CYCLE_LINES.es).flat(),
  ];
  for (const s of all) {
    assert.doesNotMatch(s, /segur/i, s);
    assert.doesNotMatch(s, /[\u{1F300}-\u{1FAFF}]/u, s);
  }
  for (const s of Object.values(PUSH_CYCLE_LINES.es).flat()) assert.ok(s.length <= 90, `${s.length} ${s}`);
  const fert = pushMessage(
    { situation: "fertile", bodyKey: "fertile", mark: "fertile", cycleDay: 12, daysToPeriod: 16, intention: "avoid" },
    { name: "Claudia", hour: 9, seed: "2026-09-26" },
  );
  assert.equal(fert.title, "Claudia, buenos días");
  assert.match(fert.body, /estimad|estimación/);
  assert.match(fert.body, /Día 12/);
  const none = pushMessage(
    { situation: "period", bodyKey: "menstrual", mark: "period", cycleDay: 2, daysToPeriod: null, intention: "track" },
    { name: "", hour: 20, seed: "2026-09-26" },
  );
  assert.equal(none.title, "Hola");
  assert.match(none.text, /^Hola, ¿cómo estás\? /);
  assert.ok(!/Hola/.test(none.body));
});

test("mood + talk replies carry the name, or read fine without it", () => {
  assert.match(moodReplyText("good", "none", "es", "d", "Claudia"), /Claudia/);
  assert.doesNotMatch(moodReplyText("bad", "prePeriod", "es", "d", ""), /,\s*\./);
  assert.match(moodReplyText("bad", "prePeriod", "es", "d", "Claudia"), /^Lo siento, Claudia\./);
  assert.match(talkOpener("es", "d", "Claudia"), /Claudia/);
  assert.match(talkOpener("es", "d", ""), /^[A-ZÁÉÍÓÚ¿]/);
});

test("greetingLine: one shared greeting with her name", () => {
  assert.equal(greetingLine(15, "QA Diseño"), "Buenas tardes, QA");
  assert.equal(greetingLine(8, "maría josé"), "Buenos días, María");
  assert.equal(greetingLine(21, ""), "Buenas noches");
  assert.equal(greetingLine(21, "vale", "en"), "Good evening, Vale");
});
