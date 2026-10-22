import assert from "node:assert/strict";
import { test } from "node:test";
import { dansLeWeekend, estTermine, instantDepuisSaisie, intervalleWeekend, saisieDepuisInstant } from "./dates.ts";

test("heure d'Haïti : 21:00 locale = 01:00 UTC le lendemain", () => {
  assert.equal(instantDepuisSaisie("2026-10-23T21:00", "America/Port-au-Prince"), "2026-10-24T01:00:00.000Z");
  assert.equal(saisieDepuisInstant("2026-10-24T01:00:00.000Z", "America/Port-au-Prince"), "2026-10-23T21:00");
});

test("terminé seulement après la fin, ou après le début s'il n'y a pas de fin", () => {
  const maintenant = Date.parse("2026-10-24T12:00:00.000Z");
  assert.equal(estTermine({ date_debut: "2026-10-24T18:00:00.000Z", date_fin: null }, maintenant), false);
  assert.equal(estTermine({ date_debut: "2026-10-24T08:00:00.000Z", date_fin: null }, maintenant), true);
  assert.equal(
    estTermine({ date_debut: "2026-10-24T08:00:00.000Z", date_fin: "2026-10-24T20:00:00.000Z" }, maintenant),
    false,
  );
});

test("jeudi 22 oct. 2026 : le weekend va du vendredi 23 au dimanche 25, heure d'Haïti", () => {
  const jeudi = new Date("2026-10-22T15:00:00.000Z");
  const { debut, fin } = intervalleWeekend(jeudi, "America/Port-au-Prince");
  assert.equal(debut.toISOString(), "2026-10-23T04:00:00.000Z");
  assert.equal(fin.toISOString(), "2026-10-26T03:59:59.999Z");
  assert.equal(dansLeWeekend("2026-10-24T02:00:00.000Z", jeudi), true);
  assert.equal(dansLeWeekend("2026-10-22T20:00:00.000Z", jeudi), false);
});
