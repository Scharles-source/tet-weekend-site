import assert from "node:assert/strict";
import { test } from "node:test";
import { CRITERES_VIDES, estGratuit, normaliser, rechercher } from "./recherche.ts";
import type { EvenementPublic } from "./types.ts";

function evenement(partiel: Partial<EvenementPublic>): EvenementPublic {
  return {
    id: "e", slug: "e", titre: "Soirée", date_debut: "2026-11-14T02:00:00.000Z", date_fin: null, ville: null, description: null,
    prix: null, source: null, source_url: null, source_account: null, categorie: null, fuseau: "America/Port-au-Prince",
    lieu: null, artistes: [], flyer: null, sponsored_from: null, sponsored_to: null, vues: null, ...partiel,
  };
}

const maintenant = new Date("2026-11-12T22:00:00.000Z");

test("normaliser enlève accents, tirets et majuscules", () => {
  assert.equal(normaliser("Pétion-Ville"), "petion ville");
});

test("gratuit : « Entrée libre » compte, « 15 $ US » non", () => {
  assert.equal(estGratuit("Entrée libre"), true);
  assert.equal(estGratuit("15 $ US"), false);
  assert.equal(estGratuit(null), false);
});

test("la recherche trouve par titre, ville sans accent et filtre le prix", () => {
  const donnees = {
    evenements: [
      evenement({ id: "1", titre: "Nuit Kompa", ville: "Pétion-Ville", prix: "15 $ US", categorie: "soirees-kompa" }),
      evenement({ id: "2", titre: "Gran Bal", ville: "Port-au-Prince", prix: "Entrée libre", categorie: "bals" }),
    ],
    artistes: [],
    lieux: [],
  };
  assert.deepEqual(rechercher(donnees, { ...CRITERES_VIDES, q: "kompa petion" }, maintenant).evenements.map((e) => e.id), ["1"]);
  assert.deepEqual(rechercher(donnees, { ...CRITERES_VIDES, gratuit: true }, maintenant).evenements.map((e) => e.id), ["2"]);
  assert.deepEqual(rechercher(donnees, { ...CRITERES_VIDES, categorie: "bals" }, maintenant).evenements.map((e) => e.id), ["2"]);
  assert.equal(rechercher(donnees, { ...CRITERES_VIDES, q: "zzz" }, maintenant).evenements.length, 0);
});
