import assert from "node:assert/strict";
import { test } from "node:test";
import { SaisieInvalide, statutValide, validerArticle } from "./validation.ts";

test("statuts sans accent", () => {
  assert.equal(statutValide("publie"), "publie");
  assert.equal(statutValide("brouillon"), "brouillon");
  assert.equal(statutValide("retire"), "retire");
  assert.throws(() => statutValide("publié"), SaisieInvalide);
  assert.throws(() => statutValide("retiré"), SaisieInvalide);
});

test("article : champs vides restent vides, prix obligatoire", () => {
  const a = validerArticle({
    restaurant_id: "abc",
    categorie: "Plats",
    nom: "Griot",
    description: "  ",
    prix: "12,50",
    devise: "USD",
    disponible: true,
    source_url: "",
    date_releve: "",
    a_verifier: false,
  });
  assert.equal(a.description, null);
  assert.equal(a.source_url, null);
  assert.equal(a.date_releve, null);
  assert.equal(a.prix, 12.5);
  assert.throws(() => validerArticle({ ...a, prix: "" }), SaisieInvalide);
});
