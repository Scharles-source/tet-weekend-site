import assert from "node:assert/strict";
import { test } from "node:test";
import { lireRecapsPublics, nomPlateformeRecap, urlEmbedRecap } from "./recaps.ts";

test("lit les récaps bien formés et ignore les lignes cassées", () => {
  const liste = lireRecapsPublics([
    { id: "a", titre: "Sunset House", post_url: "https://www.instagram.com/reel/X/", post_id: "X", plateforme: "instagram", vignette_url: "https://x/y.jpg" },
    { id: "b", titre: "Sans URL" },
    { titre: "Sans id", post_url: "https://y" },
    null,
    "texte",
  ]);
  assert.equal(liste.length, 1);
  assert.equal(liste[0].titre, "Sunset House");
  assert.equal(lireRecapsPublics("pas un tableau").length, 0);
  assert.equal(lireRecapsPublics(null).length, 0);
});

test("construit l'URL d'intégration selon la plateforme", () => {
  assert.equal(urlEmbedRecap({ plateforme: "instagram", post_id: "DWMyoOmxT9i" }), "https://www.instagram.com/reel/DWMyoOmxT9i/embed");
  assert.equal(urlEmbedRecap({ plateforme: "youtube", post_id: "abc123_-X" }), "https://www.youtube-nocookie.com/embed/abc123_-X?autoplay=1&rel=0");
  assert.equal(urlEmbedRecap({ plateforme: "autre", post_id: "x" }), null);
  assert.equal(urlEmbedRecap({ plateforme: "instagram", post_id: null }), null);
  assert.equal(urlEmbedRecap({ plateforme: "instagram", post_id: "a b/c" }), null);
});

test("nomme les plateformes pour le lien de repli", () => {
  assert.equal(nomPlateformeRecap("instagram"), "Instagram");
  assert.equal(nomPlateformeRecap("youtube"), "YouTube");
  assert.equal(nomPlateformeRecap("autre"), "le post d'origine");
});
