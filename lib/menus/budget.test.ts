import { test } from "node:test";
import assert from "node:assert/strict";
import { calculerBudget, tauxApplicable, type ParametresBudget } from "./budget.ts";
import { formatMontant, fraicheur, fourchettePlats, prixMinHtg } from "./format.ts";
import type { MenuItem, Restaurant } from "./types.ts";

// Taux de TEST uniquement (pas un taux réel) : sert à vérifier la conversion.
const TAUX_TEST = 131.5;

const base: ParametresBudget = {
  lignes: [],
  personnes: 1,
  devise: "HTG",
  taux: null,
  taxePct: null,
  taxeIncluse: null,
  servicePct: null,
  serviceInclus: null,
  pourboirePct: 0,
};

test("exemple imposé : HTG, taxe 10 % + service 5 % non inclus, pourboire 10 %, 2 personnes", () => {
  const r = calculerBudget({
    ...base,
    lignes: [
      { prix: 2500, devise: "HTG", quantite: 1 },
      { prix: 500, devise: "HTG", quantite: 2 },
    ],
    personnes: 2,
    taux: TAUX_TEST,
    taxePct: 10,
    taxeIncluse: false,
    servicePct: 5,
    serviceInclus: false,
    pourboirePct: 10,
  });
  assert.ok(r.ok);
  assert.equal(r.sousTotal, 3500);
  assert.equal(r.taxe, 350);
  assert.equal(r.service, 175);
  assert.equal(r.pourboire, 402.5);
  assert.equal(r.total.htg, 4427.5);
  assert.equal(r.parPersonne.htg, 2213.75);
  // 4 427,50 / 131,5 = 33,669… → 33,67 ; 2 213,75 / 131,5 = 16,834… → 16,83
  assert.equal(r.total.usd, 33.67);
  assert.equal(r.parPersonne.usd, 16.83);
  assert.equal(formatMontant(r.total.htg as number, "HTG"), "4 427,50 HTG");
  assert.equal(formatMontant(r.parPersonne.htg as number, "HTG"), "2 213,75 HTG");
  assert.equal(formatMontant(r.total.usd as number, "USD"), "33,67 $ US");
});

test("plateau mixte : 1 plat en USD + 1 plat en HTG converti au taux applicable", () => {
  const r = calculerBudget({
    ...base,
    lignes: [
      { prix: 10, devise: "USD", quantite: 1 },
      { prix: 1000, devise: "HTG", quantite: 1 },
    ],
    taux: TAUX_TEST,
  });
  assert.ok(r.ok);
  assert.equal(r.sousTotal, 2315);
  assert.equal(r.total.htg, 2315);
  assert.equal(r.total.usd, 17.6);
});

test("restaurant en USD : sous-total en USD, équivalent HTG", () => {
  const r = calculerBudget({
    ...base,
    devise: "USD",
    lignes: [
      { prix: 12.5, devise: "USD", quantite: 2 },
      { prix: 500, devise: "HTG", quantite: 1 },
    ],
    taux: 125,
  });
  assert.ok(r.ok);
  assert.equal(r.sousTotal, 29);
  assert.equal(r.total.usd, 29);
  assert.equal(r.total.htg, 3625);
});

test("taxe et service inclus : rien n'est ajouté", () => {
  const r = calculerBudget({
    ...base,
    lignes: [{ prix: 1000, devise: "HTG", quantite: 1 }],
    taxePct: 10,
    taxeIncluse: true,
    servicePct: 10,
    serviceInclus: true,
  });
  assert.ok(r.ok);
  assert.equal(r.total.htg, 1000);
  assert.equal(r.taxeAjoutee, false);
  assert.equal(r.serviceAjoute, false);
});

test("taux inconnu : HTG seul calculable, équivalent USD indisponible", () => {
  const r = calculerBudget({ ...base, lignes: [{ prix: 1000, devise: "HTG", quantite: 1 }] });
  assert.ok(r.ok);
  assert.equal(r.total.htg, 1000);
  assert.equal(r.total.usd, null);
});

test("taux inconnu + article dans l'autre devise : calcul refusé (aucun taux inventé)", () => {
  const r = calculerBudget({ ...base, lignes: [{ prix: 10, devise: "USD", quantite: 1 }] });
  assert.deepEqual(r, { ok: false, raison: "taux_manquant" });
});

test("taux applicable : utilisateur > restaurant > global, 0 = inconnu", () => {
  assert.equal(tauxApplicable(140, 130, 120), 140);
  assert.equal(tauxApplicable(null, 130, 120), 130);
  assert.equal(tauxApplicable(null, null, 120), 120);
  assert.equal(tauxApplicable(null, null, 0), null);
});

test("pas de décimales parasites", () => {
  const r = calculerBudget({
    ...base,
    lignes: [{ prix: 0.1, devise: "USD", quantite: 3 }],
    devise: "USD",
  });
  assert.ok(r.ok);
  assert.equal(r.total.usd, 0.3);
  assert.equal(formatMontant(4428, "HTG"), "4 428 HTG");
});

test("fraîcheur : ≤ 30 jours vérifiée, au-delà « en cours de vérification », date toujours visible", () => {
  const maintenant = new Date(2026, 9, 14);
  assert.equal(fraicheur("2026-10-14", maintenant).libelle, "Carte vérifiée aujourd'hui · relevé du 14/10/2026");
  assert.equal(fraicheur("2026-10-04", maintenant).libelle, "Carte vérifiée il y a 10 jours · relevé du 04/10/2026");
  const vieille = fraicheur("2026-09-01", maintenant);
  assert.equal(vieille.verifiee, false);
  assert.match(vieille.libelle, /01\/09\/2026/);
  assert.equal(fraicheur(null, maintenant).verifiee, false);
});

test("fourchette des plats + filtre budget converti en HTG", () => {
  const resto = { devise: "USD", taux_htg_usd: null } as Restaurant;
  const item = (prix: number, devise: "HTG" | "USD", categorie: MenuItem["categorie"] = "Plats") =>
    ({ categorie, prix, devise, disponible: true }) as MenuItem;
  const f = fourchettePlats(resto, [item(15, "USD"), item(25, "USD"), item(2, "USD", "Boissons")], 130);
  assert.deepEqual(f, { min: 15, max: 25, devise: "USD" });
  assert.equal(prixMinHtg(f!, 130), 1950);
  assert.equal(prixMinHtg(f!, null), null);
});
