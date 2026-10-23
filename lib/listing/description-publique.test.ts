import assert from "node:assert/strict";
import { test } from "node:test";
import { descriptionPublique } from "./data.ts";

test("retire le post d'origine recopié dans la description", () => {
  const akuna = "Présenté par Guinness / Epik Event (affiche : https://www.instagram.com/p/DeskJjTJFYc/).";
  assert.equal(descriptionPublique(akuna), "Présenté par Guinness / Epik Event.");
  const legacy = "relayée par @colmixmadada (https://www.instagram.com/p/DexmuRhBBFU/).";
  assert.equal(descriptionPublique(legacy), "relayée par @colmixmadada.");
  assert.equal(descriptionPublique("Soirée du vendredi, sans lien."), "Soirée du vendredi, sans lien.");
  assert.equal(descriptionPublique(null), null);
});
