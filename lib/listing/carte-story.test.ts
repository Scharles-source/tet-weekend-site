import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { dateCarte, lieuCarte, taillePolice, typeImageOk } from "./carte-story.ts";

describe("carte story", () => {
  it("formate la date et l'heure dans le fuseau de l'événement", () => {
    const r = dateCarte("2026-11-22T03:00:00Z", "America/New_York");
    assert.equal(r.jour, "SAT NOV 21");
    assert.equal(r.heure, "10 PM");
  });
  it("réduit la police des longs titres", () => {
    assert.ok(taillePolice("Kompa") > taillePolice("Kompa Kingdom Night au Palais de Brooklyn"));
  });
  it("assemble le lieu sans trou", () => {
    assert.equal(lieuCarte("Le Palais", "Brooklyn"), "Le Palais · Brooklyn");
    assert.equal(lieuCarte(null, "Miami"), "Miami");
    assert.equal(lieuCarte(null, null), "");
  });
  it("n'accepte que PNG et JPEG", () => {
    assert.equal(typeImageOk("image/jpeg"), true);
    assert.equal(typeImageOk("image/png; charset=x"), true);
    assert.equal(typeImageOk("image/webp"), false);
    assert.equal(typeImageOk(null), false);
  });
});
