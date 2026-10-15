import assert from "node:assert/strict";
import { test } from "node:test";
import { ACTIONS_JOB, runnerEnLigne } from "./types.ts";

test("runner en ligne si heartbeat < 2 min", () => {
  const maintenant = Date.parse("2026-10-15T18:00:00.000Z");
  assert.equal(runnerEnLigne(new Date(maintenant - 60_000).toISOString(), maintenant), true);
  assert.equal(runnerEnLigne(new Date(maintenant - 3 * 60_000).toISOString(), maintenant), false);
  assert.equal(runnerEnLigne(null, maintenant), false);
});

test("actions job alignées sur le runner", () => {
  assert.deepEqual([...ACTIONS_JOB], ["sites", "maps", "ocr", "export", "etat"]);
});
