import assert from "node:assert/strict";
import { test } from "node:test";
import { artistesDepuisDescription, lieuDepuisDescription } from "./faits.ts";
import { jsonLdEvenement } from "./jsonld.ts";
import type { EvenementPublic } from "./types.ts";

test("lieuDepuisDescription lit la ligne Lieu (séparateurs ligne, barre oblique, barre verticale)", () => {
  assert.equal(lieuDepuisDescription("Soirée.\nLieu : Punch Line Irving — Dallas"), "Punch Line Irving — Dallas");
  assert.equal(lieuDepuisDescription("Artistes : Success Jr / Lieu : Punch Line Irving — Dallas"), "Punch Line Irving — Dallas");
  assert.equal(lieuDepuisDescription("Texte. | Lieu : Parc St. Pierre"), "Parc St. Pierre");
  assert.equal(lieuDepuisDescription("Aucun fait énoncé."), null);
  assert.equal(lieuDepuisDescription(null), null);
  assert.equal(lieuDepuisDescription("Lieu : à confirmer"), null);
});

test("artistesDepuisDescription sépare et écarte les termes génériques seuls", () => {
  assert.deepEqual(artistesDepuisDescription("Artistes : Arly Larivière & Nu-Look"), ["Arly Larivière", "Nu-Look"]);
  assert.deepEqual(artistesDepuisDescription("Artistes : Animation, DJ, Jazz (Eagle Club)"), []);
  assert.deepEqual(artistesDepuisDescription("Artistes : DJ Tony Mix, Rutshelle Guillaume"), ["DJ Tony Mix", "Rutshelle Guillaume"]);
  assert.deepEqual(artistesDepuisDescription(null), []);
});

function evenement(partiel: Partial<EvenementPublic>): EvenementPublic {
  return {
    id: "1",
    slug: "test",
    titre: "Bal de Nu-Look",
    date_debut: "2026-12-26T21:00:00-05:00",
    date_fin: null,
    ville: "Pétion-Ville",
    description: null,
    prix: null,
    source: null,
    source_url: null,
    source_account: null,
    categorie: null,
    fuseau: "America/Port-au-Prince",
    lieu: null,
    artistes: [],
    flyer: null,
    sponsored_from: null,
    sponsored_to: null,
    vues: null,
    ...partiel,
  };
}

test("jsonLdEvenement : le lieu énoncé devient un Place nommé, la ville reste la localité", () => {
  const ld = jsonLdEvenement(
    evenement({ description: "Bal.\nArtistes : Arly Larivière & Nu-Look\nLieu : Karibe Hotel, Juvénat 7, Pétion-Ville" }),
    "https://www.tetweekend.com/evenements/test",
  );
  assert.deepEqual(ld.location, {
    "@type": "Place",
    name: "Karibe Hotel",
    address: { "@type": "PostalAddress", streetAddress: "Juvénat 7", addressLocality: "Pétion-Ville" },
  });
  assert.deepEqual(ld.performer, [
    { "@type": "PerformingGroup", name: "Arly Larivière" },
    { "@type": "PerformingGroup", name: "Nu-Look" },
  ]);
});

test("jsonLdEvenement : tiret cadratin, la ville en suffixe n'est pas une adresse", () => {
  const ld = jsonLdEvenement(
    evenement({ ville: "Dallas", description: "Artistes : Success Jr / Lieu : Punch Line Irving — Dallas" }),
    "https://www.tetweekend.com/evenements/test",
  );
  assert.deepEqual(ld.location, {
    "@type": "Place",
    name: "Punch Line Irving",
    address: { "@type": "PostalAddress", addressLocality: "Dallas" },
  });
});

test("jsonLdEvenement : sans fait énoncé, repli sur la ville seule", () => {
  const ld = jsonLdEvenement(evenement({ description: "Une soirée." }), "https://www.tetweekend.com/evenements/test");
  assert.deepEqual(ld.location, {
    "@type": "Place",
    name: "Pétion-Ville",
    address: { "@type": "PostalAddress", addressLocality: "Pétion-Ville" },
  });
  assert.equal(ld.performer, undefined);
});
