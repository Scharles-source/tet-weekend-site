import assert from "node:assert/strict";
import { test } from "node:test";
import { couleurDominante, couleurTexteSur, luminanceRelative, styleBlocDate } from "./couleur-flyer.ts";

/** Construit un échantillon RGBA à partir de triplets [r, g, b] répétés n fois. */
function echantillon(...blocs: [number, [number, number, number]][]): number[] {
  const pixels: number[] = [];
  for (const [n, [r, g, b]] of blocs) {
    for (let i = 0; i < n; i++) pixels.push(r, g, b, 255);
  }
  return pixels;
}

test("luminanceRelative : 0 pour le noir, 1 pour le blanc", () => {
  assert.equal(luminanceRelative({ r: 0, g: 0, b: 0 }), 0);
  assert.ok(Math.abs(luminanceRelative({ r: 255, g: 255, b: 255 }) - 1) < 1e-9);
});

test("couleurTexteSur : blanc sur fond sombre, encre sur fond clair", () => {
  assert.equal(couleurTexteSur({ r: 20, g: 20, b: 60 }), "#FFFFFF");
  // Le jaune vif du flyer de référence : l'encre y est bien plus lisible.
  assert.equal(couleurTexteSur({ r: 245, g: 197, b: 0 }), "#17171B");
  assert.equal(couleurTexteSur({ r: 255, g: 255, b: 255 }), "#17171B");
});

test("couleurDominante : la teinte saturée la plus présente gagne", () => {
  // Fond gris majoritaire, mais une large zone turquoise saturée : c'est elle, la couleur du flyer.
  const rgb = couleurDominante(echantillon([60, [128, 128, 128]], [40, [0, 150, 150]]));
  assert.deepEqual(rgb, { r: 0, g: 150, b: 150 });
});

test("couleurDominante : entre deux teintes saturées, la plus pesante (surface × saturation) gagne", () => {
  const rgb = couleurDominante(echantillon([10, [220, 30, 30]], [30, [30, 30, 220]]));
  assert.deepEqual(rgb, { r: 30, g: 30, b: 220 });
});

test("couleurDominante : image en niveaux de gris, moyenne simple", () => {
  const rgb = couleurDominante(echantillon([10, [100, 100, 100]], [10, [200, 200, 200]]));
  assert.deepEqual(rgb, { r: 150, g: 150, b: 150 });
});

test("couleurDominante : pixels transparents ignorés, échantillon vide = null", () => {
  assert.equal(couleurDominante([10, 20, 30, 0, 40, 50, 60, 100]), null);
  assert.equal(couleurDominante([]), null);
});

test("styleBlocDate : couleur du flyer quand elle existe, repli sombre sinon", () => {
  assert.deepEqual(styleBlocDate({ r: 245, g: 197, b: 0 }), { background: "rgb(245, 197, 0)", color: "#17171B" });
  assert.deepEqual(styleBlocDate(null), { background: "rgba(18,18,22,0.85)", color: "#FFFFFF" });
});
