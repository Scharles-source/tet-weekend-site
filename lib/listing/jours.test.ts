import assert from "node:assert/strict";
import { test } from "node:test";
import { cleJour, grouperParJour, joursAvecEvenements, libelleGroupeJour, nomJour } from "./jours.ts";

test("cleJour : le jour d'un événement est son jour local, dans son propre fuseau", () => {
  // 3 h 30 UTC : encore la veille au soir à New York (UTC-4 en juin), déjà le matin du 15 à Auckland (UTC+12).
  assert.equal(cleJour("2026-06-15T03:30:00.000Z", "America/New_York"), "2026-06-14");
  assert.equal(cleJour("2026-06-15T03:30:00.000Z", "Pacific/Auckland"), "2026-06-15");
  // Même instant, deux fuseaux, deux jours : en UTC le 16, à New York encore le 15 au soir.
  assert.equal(cleJour("2026-11-16T01:00:00.000Z", "UTC"), "2026-11-16");
  assert.equal(cleJour("2026-11-16T01:00:00.000Z", "America/New_York"), "2026-11-15");
});

test("cleJour : sans fuseau précisé, le fuseau par défaut du site (Port-au-Prince)", () => {
  // 2 h UTC = 21 h la veille à Port-au-Prince : c'est le jour du 12, celui de « ce soir » dans periode.test.ts.
  assert.equal(cleJour("2026-11-13T02:00:00.000Z"), "2026-11-12");
});

test("nomJour : nom anglais court du jour de semaine de la clé", () => {
  assert.equal(nomJour("2026-11-14"), "Sat");
  assert.equal(nomJour("2026-11-15"), "Sun");
  assert.equal(nomJour("2026-11-16"), "Mon");
  assert.equal(nomJour("2026-11-21"), "Sat");
});

test("joursAvecEvenements : comptes exacts par jour, ordre chronologique, jour actuel marqué", () => {
  // Dimanche 15 nov. 2026, 10 h à Port-au-Prince.
  const maintenant = new Date("2026-11-15T15:00:00.000Z");
  const jours = joursAvecEvenements(
    [
      // Samedi 14 au soir à Port-au-Prince (23 h 30 locales).
      { date_debut: "2026-11-15T04:30:00.000Z", fuseau: "America/Port-au-Prince" },
      // Dimanche 15 : 13 h à Port-au-Prince, et 20 h le même jour local (1 h UTC le 16).
      { date_debut: "2026-11-15T18:00:00.000Z", fuseau: "America/Port-au-Prince" },
      { date_debut: "2026-11-16T01:00:00.000Z", fuseau: "America/Port-au-Prince" },
      // Samedi 21 au soir à Port-au-Prince.
      { date_debut: "2026-11-22T01:00:00.000Z", fuseau: "America/Port-au-Prince" },
      // Le même instant que le précédent, mais à Miami : toujours le 21 au soir.
      { date_debut: "2026-11-22T01:00:00.000Z", fuseau: "America/New_York" },
    ],
    maintenant,
  );
  assert.deepEqual(jours, [
    { cle: "2026-11-14", nom: "Sat", numero: 14, compte: 1, aujourdhui: false },
    { cle: "2026-11-15", nom: "Sun", numero: 15, compte: 2, aujourdhui: true },
    { cle: "2026-11-21", nom: "Sat", numero: 21, compte: 2, aujourdhui: false },
  ]);
});

test("joursAvecEvenements : aucun événement, aucun jour", () => {
  assert.deepEqual(joursAvecEvenements([], new Date("2026-11-15T15:00:00.000Z")), []);
});

test("grouperParJour : groupes chronologiques, ordre d'entrée conservé dans chaque jour", () => {
  // Dimanche 15 nov. 2026, 10 h à Port-au-Prince.
  const maintenant = new Date("2026-11-15T15:00:00.000Z");
  // Liste déjà triée (radial, par exemple) : le samedi 21 passe avant le
  // dimanche 15 dans l'entrée, les groupes ressortent quand même par date,
  // et dans le groupe du 15, « b » reste avant « a » comme dans l'entrée.
  const groupes = grouperParJour(
    [
      { id: "loin", date_debut: "2026-11-22T01:00:00.000Z", fuseau: "America/Port-au-Prince" },
      { id: "b", date_debut: "2026-11-15T18:00:00.000Z", fuseau: "America/Port-au-Prince" },
      { id: "a", date_debut: "2026-11-16T01:00:00.000Z", fuseau: "America/Port-au-Prince" },
    ],
    maintenant,
  );
  assert.deepEqual(
    groupes.map((g) => ({ cle: g.jour.cle, compte: g.jour.compte, ids: g.evenements.map((e) => e.id) })),
    [
      { cle: "2026-11-15", compte: 2, ids: ["b", "a"] },
      { cle: "2026-11-21", compte: 1, ids: ["loin"] },
    ],
  );
});

test("grouperParJour : aucun événement, aucun groupe", () => {
  assert.deepEqual(grouperParJour([], new Date("2026-11-15T15:00:00.000Z")), []);
});

test("libelleGroupeJour : Tonight, Tomorrow, puis « Sat, Nov 21 »", () => {
  // Dimanche 15 nov. 2026, 10 h à Port-au-Prince.
  const maintenant = new Date("2026-11-15T15:00:00.000Z");
  const jours = joursAvecEvenements(
    [
      { date_debut: "2026-11-15T18:00:00.000Z", fuseau: "America/Port-au-Prince" },
      { date_debut: "2026-11-16T18:00:00.000Z", fuseau: "America/Port-au-Prince" },
      { date_debut: "2026-11-22T01:00:00.000Z", fuseau: "America/Port-au-Prince" },
    ],
    maintenant,
  );
  assert.deepEqual(jours.map((j) => libelleGroupeJour(j, maintenant)), ["Tonight", "Tomorrow", "Sat, Nov 21"]);
});
