import assert from "node:assert/strict";
import { test } from "node:test";
import { nomVilleCanonique, slugVille, villesDe } from "./villes.ts";
import type { Annuaire } from "./data.ts";

test("nomVilleCanonique garde la ville d'avant la virgule", () => {
  assert.equal(nomVilleCanonique("Atlanta, Géorgie"), "Atlanta");
  assert.equal(nomVilleCanonique("Atlanta"), "Atlanta");
  assert.equal(nomVilleCanonique("Port-au-Prince"), "Port-au-Prince");
  assert.equal(nomVilleCanonique("Floral Park, New York"), "Floral Park");
});

test("nomVilleCanonique retire la parenthèse finale", () => {
  assert.equal(nomVilleCanonique("Marietta, Géorgie (Atlanta)"), "Marietta");
});

test("nomVilleCanonique conserve D.C. pour Washington", () => {
  assert.equal(nomVilleCanonique("Washington, D.C."), "Washington, D.C.");
  assert.equal(nomVilleCanonique("Washington"), "Washington");
});

test("slugVille fusionne toutes les variantes d'une même ville", () => {
  assert.equal(slugVille("Atlanta, Géorgie"), slugVille("Atlanta"));
  assert.equal(slugVille("Washington, D.C."), slugVille("Washington"));
  assert.equal(slugVille("Atlanta, Géorgie"), "atlanta");
  assert.equal(slugVille("Cap-Haïtien"), "cap-haitien");
});

test("villesDe fusionne les variantes et garde l'affichage D.C.", () => {
  const annuaire = {
    lieux: [],
    evenements: [
      { ville: "Atlanta, Géorgie" },
      { ville: "Atlanta" },
      { ville: "Washington" },
      { ville: "Washington, D.C." },
      { ville: null },
    ],
  } as unknown as Pick<Annuaire, "lieux" | "evenements">;
  const villes = villesDe(annuaire);
  assert.deepEqual(villes, [
    { slug: "atlanta", nom: "Atlanta" },
    { slug: "washington", nom: "Washington, D.C." },
  ]);
});
