import assert from "node:assert/strict";
import { test } from "node:test";
import { dansLaPeriode } from "./periode.ts";

test("jeudi 12 nov. 2026, 17h à Port-au-Prince : ce soir, demain et le week-end sont distincts", () => {
  const maintenant = new Date("2026-11-12T22:00:00.000Z");
  assert.equal(dansLaPeriode("2026-11-13T02:00:00.000Z", "ce-soir", maintenant), true);
  assert.equal(dansLaPeriode("2026-11-13T02:00:00.000Z", "demain", maintenant), false);
  assert.equal(dansLaPeriode("2026-11-14T02:00:00.000Z", "demain", maintenant), true);
  assert.equal(dansLaPeriode("2026-11-14T02:00:00.000Z", "ce-weekend", maintenant), true);
  assert.equal(dansLaPeriode("2026-11-20T02:00:00.000Z", "tout", maintenant), true);
});
