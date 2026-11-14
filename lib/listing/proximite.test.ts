import assert from "node:assert/strict";
import { test } from "node:test";
import { codePays, etiquettePosition, nombreProches, pointDeReference, pointExact, POSITION_DEFAUT, positionDepuisEntetes, positionDepuisVille, positionDetecteeFiable, rangProximite, trierParDistance, trierParProximite, villeDuCatalogue } from "./proximite.ts";
import { coordonneesVille } from "./coordonnees.ts";
import type { EvenementPublic } from "./types.ts";

function ev(id: string, ville: string | null, pays: string | null = null): EvenementPublic {
  return {
    id, slug: id, titre: id, date_debut: "2026-11-20T00:00:00Z", date_fin: null, ville, description: null, prix: null, source: null,
    source_url: null, source_account: null, categorie: null, fuseau: "America/New_York",
    lieu: pays ? { id: "l", slug: "l", nom: "L", ville, pays, adresse: null, type: null, description: null, instagram: null, facebook: null, site_web: null } : null,
    artistes: [], flyer: null, sponsored_from: null, sponsored_to: null, vues: null,
  };
}

const brooklyn = { ville: "Brooklyn", region: "NY", pays: "US" };
const atlanta = { ville: "Atlanta", region: "GA", pays: "US" };
const montreal = { ville: null, region: "QC", pays: "CA" };
const haiti = { ville: "Port-au-Prince", region: "OUEST", pays: "HT" };

test("normalise les pays", () => {
  assert.equal(codePays("Haïti"), "HT");
  assert.equal(codePays("United States"), "US");
  assert.equal(codePays("Canada"), "CA");
  assert.equal(codePays(null), null);
});

test("Brooklyn : sa ville d'abord, puis New York, puis les États-Unis, puis le reste", () => {
  assert.equal(rangProximite(ev("a", "Brooklyn"), brooklyn), 0);
  assert.equal(rangProximite(ev("b", "Queens"), brooklyn), 1);
  assert.equal(rangProximite(ev("c", "Miami"), brooklyn), 2);
  assert.equal(rangProximite(ev("d", "Port-au-Prince", "Haïti"), brooklyn), 3);
});

test("Haïti : tous les événements d'Haïti avant les autres", () => {
  assert.equal(rangProximite(ev("a", "Pétion-Ville", "Haïti"), haiti), 1);
  assert.equal(rangProximite(ev("b", "Brooklyn"), haiti), 3);
});

test("le New Jersey fait partie de la zone de New York", () => {
  assert.equal(rangProximite(ev("a", "Elizabeth, New Jersey"), brooklyn), 1);
  assert.equal(rangProximite(ev("b", "Elizabeth"), { ville: "Newark", region: "NJ", pays: "US" }), 1);
});

test("Atlanta : Stone Mountain est dans sa zone ; Montréal : par la province", () => {
  assert.equal(rangProximite(ev("a", "Stone Mountain, Géorgie (Atlanta)"), atlanta), 1);
  assert.equal(rangProximite(ev("b", "Montréal, Québec"), montreal), 1);
  assert.equal(rangProximite(ev("c", "Miami"), montreal), 3);
});

test("États sans zone : la ville seule, puis le pays", () => {
  const inconnu = { ville: "Denver", region: "CO", pays: "US" };
  assert.equal(rangProximite(ev("a", "Denver"), inconnu), 0);
  assert.equal(rangProximite(ev("b", "Brooklyn"), inconnu), 2);
});

test("tri stable : l'ordre par date est conservé à rang égal", () => {
  const liste = [ev("miami", "Miami"), ev("brooklyn", "Brooklyn"), ev("queens", "Queens"), ev("boston", "Boston")];
  const tri = trierParProximite(liste, brooklyn).map((e) => e.id);
  assert.deepEqual(tri.slice(0, 2), ["brooklyn", "queens"]);
  assert.deepEqual(tri.slice(2), ["miami", "boston"]);
});

test("sans position, rien ne bouge", () => {
  const liste = [ev("a", "Miami"), ev("b", "Brooklyn")];
  assert.deepEqual(trierParProximite(liste, null), liste);
});

test("compte les événements proches", () => {
  const liste = [ev("a", "Brooklyn"), ev("b", "Queens"), ev("c", "Miami")];
  assert.equal(nombreProches(liste, brooklyn), 2);
  assert.equal(nombreProches([ev("c", "Miami")], brooklyn), 0);
});

test("ville choisie : le pays vient des événements de cette ville", () => {
  const p = positionDepuisVille("Miami", [ev("a", "Miami")]);
  assert.equal(p.pays, "US");
  assert.equal(etiquettePosition(p), "Miami");
  assert.equal(etiquettePosition({ ville: null, region: null, pays: "HT" }), "Haiti");
});

test("position par défaut : Pétion-Ville, cœur du catalogue (correctif audit 13 nov. 2026)", () => {
  assert.equal(POSITION_DEFAUT.pays, "HT");
  assert.equal(etiquettePosition(POSITION_DEFAUT), "Pétion-Ville");
  assert.equal(rangProximite(ev("a", "Pétion-Ville"), POSITION_DEFAUT), 0);
  assert.equal(rangProximite(ev("b", "Cap-Haïtien"), POSITION_DEFAUT), 1);
  assert.equal(rangProximite(ev("c", "Brooklyn"), POSITION_DEFAUT), 3);
});

test("ville détectée hors catalogue : retirée, la zone et le pays restent (cas « Clifton »)", () => {
  const villes = ["Brooklyn", "Pétion-Ville", "Miami"];
  assert.equal(villeDuCatalogue("Clifton", villes), false);
  assert.equal(villeDuCatalogue("Brooklyn", villes), true);
  assert.equal(villeDuCatalogue("Newark", villes), true); // ville d'une zone connue
  const fiable = positionDetecteeFiable({ ville: "Clifton", region: "NJ", pays: "US" }, villes);
  assert.equal(fiable.ville, null);
  assert.equal(fiable.region, "NJ");
  assert.equal(fiable.pays, "US");
  // Le tri par zone continue de fonctionner sans la ville approximative.
  assert.equal(rangProximite(ev("a", "Brooklyn"), fiable), 1);
  const inchangee = positionDetecteeFiable({ ville: "Brooklyn", region: "NY", pays: "US" }, villes);
  assert.equal(inchangee.ville, "Brooklyn");
});

test("tri radial depuis New York : Brooklyn, puis Boston, puis Miami, puis Haïti", () => {
  const point = pointDeReference(positionDepuisVille("New York", []));
  assert.deepEqual(point, coordonneesVille("New York"));
  const liste = [ev("miami", "Miami"), ev("pv", "Pétion-Ville", "Haïti"), ev("boston", "Boston"), ev("brooklyn", "Brooklyn")];
  assert.deepEqual(trierParDistance(liste, point).map((e) => e.id), ["brooklyn", "boston", "miami", "pv"]);
});

test("tri radial depuis le Cap-Haïtien : le Cap d'abord, puis le Nord, puis le reste", () => {
  const point = pointDeReference(positionDepuisVille("Cap-Haïtien", []));
  const liste = [ev("miami", "Miami"), ev("pv", "Port-au-Prince", "Haïti"), ev("gonaives", "Gonaïves", "Haïti"), ev("cap", "Cap-Haïtien", "Haïti")];
  assert.deepEqual(trierParDistance(liste, point).map((e) => e.id), ["cap", "gonaives", "pv", "miami"]);
});

test("tri radial : stable à distance égale, et les villes hors catalogue ferment la marche", () => {
  const point = coordonneesVille("Brooklyn");
  const liste = [ev("loin", "Ville Inexistante"), ev("b1", "Brooklyn"), ev("b2", "Brooklyn"), ev("queens", "Queens")];
  assert.deepEqual(trierParDistance(liste, point).map((e) => e.id), ["b1", "b2", "queens", "loin"]);
  const liste2 = [ev("a", "Miami"), ev("b", "Brooklyn")];
  assert.deepEqual(trierParDistance(liste2, null), liste2); // sans point, rien ne bouge
});

test("sélection du point : le point exact prime sur la ville, qui prime sur la zone, qui prime sur le pays", () => {
  // Point exact fourni par le réseau : il gagne, même si la ville dit autre chose.
  assert.deepEqual(pointDeReference({ ville: "Miami", region: "FL", pays: "US", lat: 40.7, lng: -74.0 }), { lat: 40.7, lng: -74.0 });
  // Ville au catalogue : ses coordonnées.
  assert.deepEqual(pointDeReference({ ville: "Boston", region: "MA", pays: "US" }), coordonneesVille("Boston"));
  // Région seule : l'ancre de la zone (NY → New York).
  assert.deepEqual(pointDeReference({ ville: null, region: "NY", pays: "US" }), coordonneesVille("New York"));
  // Pays à zone unique : Haïti → Pétion-Ville.
  assert.deepEqual(pointDeReference({ ville: null, region: null, pays: "HT" }), coordonneesVille("Pétion-Ville"));
  // Rien d'exploitable : pas de point, l'ordre par date reste.
  assert.equal(pointDeReference({ ville: null, region: "CO", pays: "US" }), null);
  assert.equal(pointDeReference(null), null);
  // La position par défaut et la ville choisie portent leurs coordonnées.
  assert.deepEqual(pointDeReference(POSITION_DEFAUT), coordonneesVille("Pétion-Ville"));
  assert.deepEqual(pointExact(positionDepuisVille("Miami", [])), coordonneesVille("Miami"));
});

test("position détectée avec point exact : l'étiquette prend la ville du catalogue la plus proche", () => {
  const villes = ["Brooklyn", "Pétion-Ville", "Miami"];
  // « Clifton » annoncé par le réseau, mais le point est à Manhattan : l'étiquette devient New York, le point reste.
  const fiable = positionDetecteeFiable({ ville: "Clifton", region: "NJ", pays: "US", lat: 40.723, lng: -74.002 }, villes);
  assert.equal(fiable.ville, "New York");
  assert.deepEqual(pointExact(fiable), { lat: 40.723, lng: -74.002 });
  // Point loin de toute ville du catalogue (Denver) : pas d'étiquette ville, mais le point trie quand même.
  const denver = positionDetecteeFiable({ ville: "Denver", region: "CO", pays: "US", lat: 39.74, lng: -104.99 }, villes);
  assert.equal(denver.ville, null);
  assert.deepEqual(pointDeReference(denver), { lat: 39.74, lng: -104.99 });
  // Ville détectée au catalogue : inchangée, point conservé.
  const brooklyn = positionDetecteeFiable({ ville: "Brooklyn", region: "NY", pays: "US", lat: 40.68, lng: -73.95 }, villes);
  assert.equal(brooklyn.ville, "Brooklyn");
});

test("en-têtes Vercel : ville décodée, point exact lu et borné", () => {
  const h = new Headers({
    "x-vercel-ip-city": "Cap-Ha%C3%AFtien",
    "x-vercel-ip-country-region": "NORD",
    "x-vercel-ip-country": "HT",
    "x-vercel-ip-latitude": "19.76",
    "x-vercel-ip-longitude": "-72.20",
  });
  const p = positionDepuisEntetes(h);
  assert.equal(p.ville, "Cap-Haïtien");
  assert.equal(p.region, "NORD");
  assert.equal(p.pays, "HT");
  assert.deepEqual(pointExact(p), { lat: 19.76, lng: -72.2 });
  const invalide = positionDepuisEntetes(new Headers({ "x-vercel-ip-latitude": "abc", "x-vercel-ip-longitude": "999" }));
  assert.equal(pointExact(invalide), null);
  assert.equal(pointExact(positionDepuisEntetes(new Headers())), null);
});
