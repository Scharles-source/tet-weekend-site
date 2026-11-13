import assert from "node:assert/strict";
import test from "node:test";
import {
  cheminPage,
  construireSerie,
  formaterCtr,
  formaterPosition,
  libelleAppareilSeo,
  libellePaysSeo,
  periodeSeoValide,
  totauxSeo,
} from "./search-console-pures.ts";

test("période SEO : 7, 28 ou 90 jours, 28 par défaut", () => {
  assert.equal(periodeSeoValide("7"), 7);
  assert.equal(periodeSeoValide("28"), 28);
  assert.equal(periodeSeoValide("90"), 90);
  assert.equal(periodeSeoValide("n'importe quoi"), 28);
  assert.equal(periodeSeoValide(undefined), 28);
});

test("totaux : CTR et position moyenne pondérée par les impressions", () => {
  const t = totauxSeo([
    { clics: 2, impressions: 50, position: 4 },
    { clics: 1, impressions: 50, position: 8 },
  ]);
  assert.equal(t.clics, 3);
  assert.equal(t.impressions, 100);
  assert.equal(t.ctr, 0.03);
  assert.equal(t.position, 6);
  assert.deepEqual(totauxSeo([]), { clics: 0, impressions: 0, ctr: 0, position: 0 });
});

test("série : les jours sans données sont remis à zéro", () => {
  const serie = construireSerie("2026-11-03", "2026-11-05", new Map([["2026-11-04", { clics: 1, impressions: 9 }]]));
  assert.equal(serie.length, 3);
  assert.deepEqual(
    serie.map((j) => [j.date, j.clics, j.impressions]),
    [
      ["2026-11-03", 0, 0],
      ["2026-11-04", 1, 9],
      ["2026-11-05", 0, 0],
    ],
  );
});

test("libellés et formats", () => {
  assert.equal(cheminPage("https://www.tetweekend.com/villes/boston"), "/villes/boston");
  assert.equal(cheminPage("https://www.tetweekend.com/"), "/");
  assert.equal(libellePaysSeo("HTI"), "Haïti");
  assert.equal(libellePaysSeo("usa"), "États-Unis");
  assert.equal(libellePaysSeo("XYZ"), "XYZ");
  assert.equal(libelleAppareilSeo("MOBILE"), "Téléphone");
  assert.equal(libelleAppareilSeo("DESKTOP"), "Ordinateur");
  assert.equal(formaterCtr(0.043), "4,3 %");
  assert.equal(formaterPosition(6.6), "6,6");
  assert.equal(formaterPosition(0), "–");
});
