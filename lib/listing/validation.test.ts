import assert from "node:assert/strict";
import { test } from "node:test";
import { SaisieInvalide, statutValide, validerEvenement } from "./validation.ts";

test("statuts sans accent", () => {
  assert.equal(statutValide("publie"), "publie");
  assert.equal(statutValide("brouillon"), "brouillon");
  assert.equal(statutValide("retire"), "retire");
  assert.throws(() => statutValide("publié"), SaisieInvalide);
  assert.throws(() => statutValide("retiré"), SaisieInvalide);
});

test("événement : le prix vide reste vide, rien n'est inventé", () => {
  const e = validerEvenement({
    titre: "Bal du samedi",
    slug: "bal-du-samedi",
    date_debut: "2026-10-24T21:00",
    date_fin: "",
    ville: "Pétion-Ville",
    description: "  ",
    prix: "",
    source: "manuel",
    source_url: "",
    categorie: "bals",
    fuseau: "America/Port-au-Prince",
    a_verifier: false,
    artist_ids: [],
  });
  assert.equal(e.prix, null);
  assert.equal(e.description, null);
  assert.equal(e.source_url, null);
  assert.equal(e.date_fin, null);
  assert.equal(e.date_debut, "2026-10-25T01:00:00.000Z");
  assert.throws(() => validerEvenement({ ...e, titre: "" }), SaisieInvalide);
});

test("événement : publication refusée sans flyer, autorisée avec flyer", () => {
  const base = {
    titre: "Bal du samedi",
    slug: "bal-du-samedi",
    date_debut: "2026-10-24T21:00",
    ville: "Pétion-Ville",
    source: "manuel",
    categorie: "bals",
    fuseau: "America/Port-au-Prince",
    a_verifier: false,
    artist_ids: [],
  };
  // Brouillon sans flyer : accepté (on peut préparer, puis joindre le flyer).
  assert.equal(validerEvenement({ ...base, statut: "brouillon" }).statut, "brouillon");
  // Publié sans flyer : refusé (règle Smith, 28 oct. 2026).
  assert.throws(() => validerEvenement({ ...base, statut: "publie" }), SaisieInvalide);
  // Publié avec un flyer (URL ou fichier déposé) : accepté.
  assert.equal(validerEvenement({ ...base, statut: "publie", flyer_url: "https://exemple.com/flyer.jpg" }).statut, "publie");
  assert.equal(validerEvenement({ ...base, statut: "publie", flyer_storage_path: "flyers/abc.jpg" }).statut, "publie");
});
