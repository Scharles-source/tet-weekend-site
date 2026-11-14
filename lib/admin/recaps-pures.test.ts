import assert from "node:assert/strict";
import { test } from "node:test";
import { compterAValider, libelleAValider, lireListeRecaps, statutRecapValide } from "./recaps-pures.ts";

test("valide les statuts", () => {
  assert.equal(statutRecapValide("a_valider"), true);
  assert.equal(statutRecapValide("publie"), true);
  assert.equal(statutRecapValide("publié"), false);
  assert.equal(statutRecapValide(null), false);
});

test("compte les récaps à valider", () => {
  assert.equal(compterAValider([{ statut: "a_valider" }, { statut: "publie" }, { statut: "a_valider" }]), 2);
  assert.equal(compterAValider([]), 0);
});

test("libellé au singulier et au pluriel", () => {
  assert.equal(libelleAValider(0), "Aucune vidéo à valider");
  assert.equal(libelleAValider(1), "1 vidéo à valider");
  assert.equal(libelleAValider(3), "3 vidéos à valider");
});

test("ignore les lignes mal formées", () => {
  const liste = lireListeRecaps([
    { id: "a", titre: "Sunset House", post_url: "https://www.instagram.com/reel/X/", statut: "publie", rang: 1 },
    { id: 3, titre: "X", post_url: "https://y", statut: "publie" },
    { id: "b", titre: "Y", post_url: "https://z", statut: "inconnu" },
    null,
  ]);
  assert.equal(liste.length, 1);
  assert.equal(liste[0].titre, "Sunset House");
  assert.equal(lireListeRecaps("pas un tableau").length, 0);
});
