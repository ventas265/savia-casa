import { test } from "node:test";
import assert from "node:assert/strict";
import { symptomCare } from "./symptom-care.ts";

test("symptom care covers every marked symptom once, in order", () => {
  const out = symptomCare(["cramps", "headache", "cramps", "acne"], "es");
  assert.deepEqual(out.map((c) => c.id), ["cramps", "headache", "acne"]);
  assert.match(out[0]!.text, /cólicos/);
  assert.ok(out.every((c) => c.text.length > 10));
});

test("unknown symptom still gets a safe line; english works", () => {
  const out = symptomCare(["weird_one", "bloating"], "en");
  assert.equal(out.length, 2);
  assert.match(out[0]!.text, /checked/);
  assert.match(out[1]!.text, /salt/);
});
