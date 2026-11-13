import assert from "node:assert/strict";
import test from "node:test";
import { appareilDepuis, estRobot, slugEvenement, sourceDepuis } from "./mesure.ts";

test("le marqueur du lien l'emporte sur le référent", () => {
  assert.equal(sourceDepuis({ marqueur: "ig", referrer: "https://www.google.com/" }), "instagram");
  assert.equal(sourceDepuis({ marqueur: "WA" }), "whatsapp");
  assert.equal(sourceDepuis({ marqueur: "inconnu" }), "autre");
});

test("le site d'origine donne la source", () => {
  assert.equal(sourceDepuis({ referrer: "https://l.instagram.com/?u=x" }), "instagram");
  assert.equal(sourceDepuis({ referrer: "https://l.facebook.com/l.php" }), "facebook");
  assert.equal(sourceDepuis({ referrer: "https://www.google.ht/" }), "google");
  assert.equal(sourceDepuis({ referrer: "https://exemple.org/page" }), "autre");
});

test("un référent du site lui-même ne compte pas", () => {
  assert.equal(sourceDepuis({ referrer: "https://www.tetweekend.com/", hoteLocal: "www.tetweekend.com" }), "direct");
});

test("le navigateur intégré d'une application sert de repli", () => {
  assert.equal(sourceDepuis({ ua: "Mozilla/5.0 (iPhone) Instagram 320.0" }), "instagram");
  assert.equal(sourceDepuis({ ua: "Mozilla/5.0 [FBAN/FBIOS;FBAV/400]" }), "facebook");
  assert.equal(sourceDepuis({ ua: "Mozilla/5.0 Chrome/120" }), "direct");
});

test("seule une fiche d'événement donne un slug", () => {
  assert.equal(slugEvenement("/evenements/bal-kompa"), "bal-kompa");
  assert.equal(slugEvenement("/evenements/bal-kompa/calendrier"), null);
  assert.equal(slugEvenement("/evenements"), null);
  assert.equal(slugEvenement("/lieux/yanvalou"), null);
});

test("appareil et robots", () => {
  assert.equal(appareilDepuis(true), "mobile");
  assert.equal(appareilDepuis(false), "ordinateur");
  assert.equal(estRobot("Googlebot/2.1"), true);
  assert.equal(estRobot(""), true);
  assert.equal(estRobot("Mozilla/5.0 (iPhone) Safari"), false);
});
