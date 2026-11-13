import assert from "node:assert/strict";
import { test } from "node:test";
import { estTresConsulte, estUuid, libelleInteret } from "./engagement.ts";
import { preuveSociale, rangsParVille } from "./preuve.ts";
import { signauxRarete } from "./rarete.ts";

test("le nombre de « I'm in » est montré dès le premier", () => {
  assert.equal(libelleInteret(0), null);
  assert.equal(libelleInteret(null), null);
  assert.equal(libelleInteret(1), "1 in");
  assert.equal(libelleInteret(23), "23 in");
});

test("« très consulté » seulement à partir du seuil", () => {
  assert.equal(estTresConsulte(49), false);
  assert.equal(estTresConsulte(50), true);
  assert.equal(estTresConsulte(null), false);
});

test("identifiants valides uniquement", () => {
  assert.equal(estUuid("3f2b8c1e-5a4d-4e7f-9b6a-1c2d3e4f5a6b"), true);
  assert.equal(estUuid("pas-un-uuid"), false);
  assert.equal(estUuid(undefined), false);
});

test("preuve sociale : classement, puis vues du jour, puis vues cumulées, sinon rien", () => {
  assert.deepEqual(preuveSociale({ ville: "Brooklyn", rang_ville: 1, vues_jour: 340 }), { texte: "#1 trending in Brooklyn", court: "#1 in Brooklyn" });
  assert.deepEqual(preuveSociale({ vues_jour: 340, vues: 900 }), { texte: "Seen 340 times today", court: "340 seen today" });
  assert.deepEqual(preuveSociale({ vues_jour: 5, vues: 1200 }), { texte: "1.2k views", court: "1.2k views" });
  assert.equal(preuveSociale({ vues_jour: 5, vues: 20 }), null);
  assert.equal(preuveSociale({ rang_ville: 1, ville: null }), null);
});

test("classement n°1 : pas dans une ville de moins de 3 événements, pas sous les seuils, pas à égalité", () => {
  const ev = (id: string, ville: string, vues_jour: number | null, vues = 0) => ({ id, ville, vues_jour, vues });
  assert.equal(rangsParVille([ev("a", "NYC", 300), ev("b", "NYC", 100)]).size, 0);
  const rangs = rangsParVille([ev("a", "NYC", 300), ev("b", "NYC", 100), ev("c", "NYC", 5), ev("d", "Miami", 4), ev("e", "Miami", 2), ev("f", "Miami", 1)]);
  assert.equal(rangs.get("a"), 1);
  assert.equal(rangs.has("d"), false);
  assert.equal(rangsParVille([ev("a", "NYC", 300), ev("b", "NYC", 300), ev("c", "NYC", 5)]).size, 0);
  assert.equal(rangsParVille([ev("a", "NYC", null, 400), ev("b", "NYC", null, 100), ev("c", "NYC", null, 5)]).get("a"), 1);
});

test("rareté : seulement ce que l'organisateur a écrit", () => {
  assert.deepEqual(signauxRarete({ titre: "Bal Kompa", description: "Early bird tickets until Friday", prix: null }), ["Early bird"]);
  assert.deepEqual(signauxRarete({ titre: "Gala", description: "Last year's edition was sold out. Limited tickets.", prix: null }), ["Sold out last year", "Limited tickets"]);
  assert.deepEqual(signauxRarete({ titre: "Soirée", description: "Prévente jusqu'à vendredi", prix: null }), ["Early bird"]);
  assert.deepEqual(signauxRarete({ titre: "Soirée", description: "Dernières places disponibles", prix: null }), ["Limited tickets"]);
  assert.deepEqual(signauxRarete({ titre: "Concert", description: "Doors open at 9", prix: "$20" }), []);
});
