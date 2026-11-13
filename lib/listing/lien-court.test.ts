import assert from "node:assert/strict";
import { test } from "node:test";
import { codeCourt, estCodeCourt, lienCourt } from "./lien-court.ts";

const id = "3F2B8C1E-5a4d-4e7f-9b6a-1c2d3e4f5a6b";

test("code court : 8 caractères hexadécimaux en minuscules", () => {
  assert.equal(codeCourt(id), "3f2b8c1e");
  assert.equal(estCodeCourt("3f2b8c1e"), true);
  assert.equal(estCodeCourt("3f2b8c1"), false);
  assert.equal(estCodeCourt("zzzzzzzz"), false);
});

test("le lien court garde le nom du site visible", () => {
  assert.equal(lienCourt(id), "https://www.tetweekend.com/e/3f2b8c1e");
  assert.ok(lienCourt(id).length < 45);
});
