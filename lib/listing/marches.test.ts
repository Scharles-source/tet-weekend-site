import assert from "node:assert/strict";
import { test } from "node:test";
import { evenementDuMarche, marcheParSlug } from "./marches.ts";
import type { EvenementPublic, LieuPublic } from "./types.ts";

function lieu(partiel: Partial<LieuPublic>): LieuPublic {
  return {
    id: "l", slug: "lieu", nom: "Lieu", ville: null, pays: null, adresse: null,
    type: null, description: null, instagram: null, facebook: null, site_web: null,
    ...partiel,
  };
}

function evenement(partiel: Partial<EvenementPublic>): EvenementPublic {
  return {
    id: "1", slug: "test", titre: "Test", date_debut: "2026-12-26T21:00:00-05:00",
    date_fin: null, ville: null, description: null, prix: null, source: null,
    source_url: null, source_account: null, categorie: null,
    fuseau: "America/New_York", lieu: null, artistes: [], flyer: null,
    sponsored_from: null, sponsored_to: null, vues: null,
    ...partiel,
  };
}

const ny = marcheParSlug("new-york")!;
const fl = marcheParSlug("florida")!;
const ma = marcheParSlug("massachusetts")!;
const ht = marcheParSlug("haiti")!;

test("les quatre marchés existent", () => {
  assert.ok(ny && fl && ma && ht);
  assert.equal(marcheParSlug("texas"), undefined);
});

test("appartenance par ville canonique (formes base de données comprises)", () => {
  assert.equal(evenementDuMarche(evenement({ ville: "Brooklyn, New York" }), ny), true);
  assert.equal(evenementDuMarche(evenement({ ville: "Brooklyn, New York" }), fl), false);
  assert.equal(evenementDuMarche(evenement({ ville: "Miami, Floride" }), fl), true);
  assert.equal(evenementDuMarche(evenement({ ville: "Pompano Beach, Floride" }), fl), true);
  assert.equal(evenementDuMarche(evenement({ ville: "Boston, Massachusetts" }), ma), true);
  assert.equal(evenementDuMarche(evenement({ ville: "Pétion-Ville" }), ht), true);
  assert.equal(evenementDuMarche(evenement({ ville: "Montréal" }), ny), false);
  assert.equal(evenementDuMarche(evenement({ ville: "Montréal" }), ht), false);
});

test("Haïti : le pays du lieu rattrape une ville hors liste", () => {
  const e = evenement({ ville: "Village Noailles", lieu: lieu({ ville: "Village Noailles", pays: "Haïti" }) });
  assert.equal(evenementDuMarche(e, ht), true);
  const e2 = evenement({ ville: null, lieu: lieu({ ville: "Miami", pays: "États-Unis" }) });
  assert.equal(evenementDuMarche(e2, fl), true);
  assert.equal(evenementDuMarche(e2, ht), false);
});
