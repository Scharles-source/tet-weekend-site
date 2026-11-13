import assert from "node:assert/strict";
import { test } from "node:test";
import { estTresConsulte, estUuid, libelleInteret } from "./engagement.ts";

test("aucun chiffre sous le seuil", () => {
  assert.equal(libelleInteret(0), null);
  assert.equal(libelleInteret(9), null);
  assert.equal(libelleInteret(null), null);
  assert.equal(libelleInteret(23), "23 people going");
});

test("« très consulté » seulement à partir du seuil", () => {
  assert.equal(estTresConsulte(49), false);
  assert.equal(estTresConsulte(50), true);
  assert.equal(estTresConsulte(null), false);
});

test("identifiants valides uniquement", () => {
  assert.equal(estUuid("3f2b8c1e-5a4d-4e7f-9b6a-1c2d3e4f5a6b"), true);
  assert.equal(estUuid("pas-un-uuid"), false);
  assert.equal(estUuid(undefined), false);
});
