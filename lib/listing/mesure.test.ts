import assert from "node:assert/strict";
import test from "node:test";
import { appareilDepuis, etiquetteDepuis, referrerExterne, slugEvenement, sourceDepuis } from "./mesure.ts";

test("le marqueur du lien l'emporte sur le référent", () => {
  assert.equal(sourceDepuis({ marqueur: "ig", referrer: "https://www.google.com/" }), "instagram");
  assert.equal(sourceDepuis({ marqueur: "WA" }), "whatsapp");
  assert.equal(sourceDepuis({ marqueur: "inconnu" }), "autre");
});

test("utm_source donne la source, après le marqueur et avant le référent", () => {
  assert.equal(sourceDepuis({ utmSource: "WhatsApp", referrer: "https://www.google.com/" }), "whatsapp");
  assert.equal(sourceDepuis({ utmSource: "google" }), "google");
  assert.equal(sourceDepuis({ utmSource: "partenaire-x" }), "autre");
  assert.equal(sourceDepuis({ marqueur: "ig", utmSource: "whatsapp" }), "instagram");
});

test("l'étiquette du lien est lue et nettoyée", () => {
  const e = etiquetteDepuis(new URLSearchParams("utm_source=WhatsApp&utm_medium=groupe&utm_campaign=Floride-14Nov"));
  assert.deepEqual(e, { utmSource: "whatsapp", utmMedium: "groupe", utmCampaign: "floride-14nov" });
  assert.deepEqual(etiquetteDepuis(new URLSearchParams("")), { utmSource: null, utmMedium: null, utmCampaign: null });
  assert.equal(etiquetteDepuis(new URLSearchParams("utm_campaign=%3Cscript%3E")).utmCampaign, null);
});

test("le référent gardé est extérieur au site", () => {
  assert.equal(referrerExterne("https://l.facebook.com/l.php?u=x", "tetweekend.com"), "https://l.facebook.com/l.php?u=x");
  assert.equal(referrerExterne("https://tetweekend.com/evenements", "tetweekend.com"), null);
  assert.equal(referrerExterne("pas une adresse", "tetweekend.com"), null);
  assert.equal(referrerExterne("", "tetweekend.com"), null);
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

test("appareil", () => {
  assert.equal(appareilDepuis(true), "mobile");
  assert.equal(appareilDepuis(false), "ordinateur");
  // La détection des robots est testée côté base : fonction SQL ua_est_robot (migration 20261113230000).
});
