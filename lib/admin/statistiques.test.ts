import assert from "node:assert/strict";
import test from "node:test";
import { evolution, libelleSource, periodeValide, pourcent } from "./statistiques-pures.ts";

test("l'évolution compare à hier à la même heure", () => {
  assert.equal(evolution(118, 100), "+18 %");
  assert.equal(evolution(80, 100), "−20 %");
  assert.equal(evolution(100, 100), "= hier");
  assert.equal(evolution(10, 0), null);
});

test("pourcentages et libellés", () => {
  assert.equal(pourcent(54, 100), 54);
  assert.equal(pourcent(1, 0), 0);
  assert.equal(libelleSource("whatsapp"), "WhatsApp");
  assert.equal(libelleSource("inconnu"), "inconnu");
});

test("période inconnue : aujourd'hui", () => {
  assert.equal(periodeValide("7j"), "7j");
  assert.equal(periodeValide("n'importe quoi"), "aujourdhui");
  assert.equal(periodeValide(undefined), "aujourdhui");
});
