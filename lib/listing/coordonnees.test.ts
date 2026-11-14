import assert from "node:assert/strict";
import { test } from "node:test";
import { coordonneesEvenement, coordonneesVille, distanceKm, villeLaPlusProche } from "./coordonnees.ts";
import type { EvenementPublic, LieuPublic } from "./types.ts";

function ev(ville: string | null, lieuVille: string | null = null): EvenementPublic {
  const lieu: LieuPublic | null = lieuVille
    ? { id: "l", slug: "l", nom: "L", ville: lieuVille, pays: null, adresse: null, type: null, description: null, instagram: null, facebook: null, site_web: null }
    : null;
  return {
    id: "e", slug: "e", titre: "e", date_debut: "2026-11-20T00:00:00Z", date_fin: null, ville, description: null, prix: null, source: null,
    source_url: null, source_account: null, categorie: null, fuseau: "America/New_York",
    lieu, artistes: [], flyer: null, sponsored_from: null, sponsored_to: null, vues: null,
  };
}

test("coordonnées par variante de nom : le slug absorbe États, pays et parenthèses", () => {
  assert.deepEqual(coordonneesVille("Miami, Floride"), coordonneesVille("Miami"));
  assert.deepEqual(coordonneesVille("Boston, Massachusetts"), coordonneesVille("Boston"));
  assert.notEqual(coordonneesVille("Pétion-Ville"), null);
  assert.notEqual(coordonneesVille("Cap-Haïtien"), null);
  assert.notEqual(coordonneesVille("Jean Rabel"), null); // forme sans trait d'union, vue en base
  assert.equal(coordonneesVille("Ville Inexistante"), null);
  assert.equal(coordonneesVille(null), null);
});

test("distance : ordres de grandeur connus", () => {
  const pv = coordonneesVille("Pétion-Ville")!;
  const cap = coordonneesVille("Cap-Haïtien")!;
  const ny = coordonneesVille("New York")!;
  const boston = coordonneesVille("Boston")!;
  assert.equal(distanceKm(pv, pv), 0);
  const dCap = distanceKm(pv, cap);
  assert.ok(dCap > 120 && dCap < 165, `Pétion-Ville → Cap-Haïtien : ${dCap} km`);
  const dBoston = distanceKm(ny, boston);
  assert.ok(dBoston > 280 && dBoston < 335, `New York → Boston : ${dBoston} km`);
  assert.ok(distanceKm(ny, coordonneesVille("Miami")!) > distanceKm(ny, boston));
});

test("ville la plus proche d'un point : Manhattan → New York, aéroport du Cap → Cap-Haïtien", () => {
  assert.equal(villeLaPlusProche({ lat: 40.715, lng: -74.008 })?.nom, "New York");
  assert.equal(villeLaPlusProche({ lat: 19.733, lng: -72.195 })?.nom, "Cap-Haïtien");
  assert.equal(villeLaPlusProche({ lat: 18.51, lng: -72.29 })?.nom, "Pétion-Ville");
});

test("coordonnées d'un événement : la ville du lieu lié prime sur la ville de l'événement", () => {
  assert.deepEqual(coordonneesEvenement(ev("Miami", "Delmas")), coordonneesVille("Delmas"));
  assert.deepEqual(coordonneesEvenement(ev("Brooklyn")), coordonneesVille("Brooklyn"));
  assert.equal(coordonneesEvenement(ev("Ville Inexistante")), null);
  assert.equal(coordonneesEvenement(ev(null)), null);
});
