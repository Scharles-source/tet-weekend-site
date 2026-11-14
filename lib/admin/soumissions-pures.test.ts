import assert from "node:assert/strict";
import { test } from "node:test";
import { compterNouvelles, libelleNouvelles, lireListeSoumissions, statutSoumissionValide } from "./soumissions-pures.ts";

test("valide les statuts", () => {
  assert.equal(statutSoumissionValide("traite"), true);
  assert.equal(statutSoumissionValide("traité"), false);
  assert.equal(statutSoumissionValide(null), false);
});

test("compte les nouvelles soumissions", () => {
  assert.equal(compterNouvelles([{ statut: "nouveau" }, { statut: "lu" }, { statut: "nouveau" }]), 2);
  assert.equal(compterNouvelles([]), 0);
});

test("libellé au singulier et au pluriel", () => {
  assert.equal(libelleNouvelles(0), "Aucune nouvelle soumission");
  assert.equal(libelleNouvelles(1), "1 nouvelle soumission");
  assert.equal(libelleNouvelles(3), "3 nouvelles soumissions");
});

test("ignore les lignes mal formées", () => {
  const liste = lireListeSoumissions([{ id: "a", statut: "nouveau" }, { id: 3, statut: "nouveau" }, { id: "b", statut: "inconnu" }, null]);
  assert.equal(liste.length, 1);
  assert.equal(lireListeSoumissions("pas un tableau").length, 0);
});
