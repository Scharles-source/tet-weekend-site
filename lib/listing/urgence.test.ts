import assert from "node:assert/strict";
import { test } from "node:test";
import { urgenceDe } from "./urgence.ts";

const fuseau = "America/Port-au-Prince";
const maintenant = new Date("2026-11-12T15:00:00.000Z"); // 10h00 à Port-au-Prince
const ev = (date_debut: string, date_fin: string | null = null) => ({ date_debut, date_fin, fuseau });

test("dans les minutes et les heures qui viennent", () => {
  assert.deepEqual(urgenceDe(ev("2026-11-12T15:20:00.000Z"), maintenant), { texte: "Dans 20 min", urgent: true });
  assert.deepEqual(urgenceDe(ev("2026-11-12T17:30:00.000Z"), maintenant), { texte: "Dans 2 h", urgent: true });
});

test("plus tard aujourd'hui : « Ce soir », puis « Demain »", () => {
  assert.deepEqual(urgenceDe(ev("2026-11-13T03:00:00.000Z"), maintenant), { texte: "Ce soir · 22h", urgent: true });
  assert.deepEqual(urgenceDe(ev("2026-11-14T03:30:00.000Z"), maintenant), { texte: "Demain · 22h30", urgent: false });
});

test("rien de plus loin, « En cours » seulement avec une heure de fin", () => {
  assert.equal(urgenceDe(ev("2026-11-15T03:00:00.000Z"), maintenant), null);
  assert.deepEqual(urgenceDe(ev("2026-11-12T14:00:00.000Z", "2026-11-12T18:00:00.000Z"), maintenant), { texte: "En cours", urgent: true });
  assert.equal(urgenceDe(ev("2026-11-12T14:00:00.000Z"), maintenant), null);
});
