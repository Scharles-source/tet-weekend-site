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
