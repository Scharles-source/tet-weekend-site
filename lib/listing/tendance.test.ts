import assert from "node:assert/strict";
import { test } from "node:test";
import { tendances } from "./tendance.ts";

const ev = (id: string, vues: number | null, date = "2026-11-20T22:00:00Z") => ({ id, vues, date_debut: date });

test("tendances : classées par vues décroissantes, plafonnées", () => {
  const liste = [ev("a", 5), ev("b", 90), ev("c", 12), ev("d", 40)];
  assert.deepEqual(tendances(liste, 3).map((e) => e.id), ["b", "d", "c"]);
});

test("tendances : à égalité, le plus proche dans le temps d'abord", () => {
  const liste = [ev("a", 10, "2026-12-01T22:00:00Z"), ev("b", 10, "2026-11-20T22:00:00Z"), ev("c", 10, "2026-11-25T22:00:00Z")];
  assert.deepEqual(tendances(liste).map((e) => e.id), ["b", "c", "a"]);
});

test("tendances : rien tant que moins de 3 événements ont été vus", () => {
  assert.deepEqual(tendances([ev("a", 50), ev("b", 3), ev("c", 0), ev("d", null)]), []);
  assert.equal(tendances([ev("a", 1), ev("b", 1), ev("c", 1)]).length, 3);
});
