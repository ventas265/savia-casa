import { test } from "node:test";
import assert from "node:assert/strict";
import { nivelConfianza, prediccion } from "./prediccion.ts";

test("nivel de confianza", () => {
  assert.equal(nivelConfianza(2, 1), "baja");
  assert.equal(nivelConfianza(4, 5), "baja");
  assert.equal(nivelConfianza(4, 2), "media");
  assert.equal(nivelConfianza(6, 1, false), "media");
  assert.equal(nivelConfianza(6, 1, true), "alta");
});

test("rango y texto", () => {
  const starts = ["2026-06-01", "2026-06-29", "2026-07-27", "2026-08-24", "2026-09-21"];
  const p = prediccion("2026-09-21", starts, 28);
  assert.equal(p.next, "2026-10-19");
  assert.ok(p.rango);
  assert.match(p.texto, /^Confianza media · basada en 4 ciclos/);
});
