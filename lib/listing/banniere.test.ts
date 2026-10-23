import assert from "node:assert/strict";
import test from "node:test";
import { choisirBanniere, estSponsorise } from "./banniere.ts";

const maintenant = Date.parse("2026-10-23T12:00:00.000Z");

function evt(partiel: Partial<Parameters<typeof choisirBanniere>[0][number]> & { id: string; date_debut: string }) {
  return {
    date_fin: null,
    sponsored_from: null,
    sponsored_to: null,
    vues: null,
    ...partiel,
  };
}

test("sponsorisé actif avant le trending, sans doublon, cinq au maximum", () => {
  const loin = "2026-12-01T20:00:00.000Z";
  const proche = "2026-10-24T02:00:00.000Z";
  const liste = choisirBanniere(
    [
      evt({ id: "passe", date_debut: "2026-10-01T20:00:00.000Z" }),
      evt({
        id: "sponsor",
        date_debut: loin,
        sponsored_from: "2026-10-01T00:00:00.000Z",
        sponsored_to: "2026-11-01T00:00:00.000Z",
        vues: 1,
      }),
      evt({ id: "vu", date_debut: proche, vues: 50 }),
      evt({ id: "autre", date_debut: "2026-10-25T02:00:00.000Z", vues: 10 }),
      evt({ id: "c", date_debut: "2026-10-26T02:00:00.000Z" }),
      evt({ id: "d", date_debut: "2026-10-27T02:00:00.000Z" }),
      evt({ id: "e", date_debut: "2026-10-28T02:00:00.000Z" }),
    ],
    maintenant,
  );
  assert.deepEqual(
    liste.map((p) => [p.evenement.id, p.sponsorise]),
    [
      ["sponsor", true],
      ["vu", false],
      ["autre", false],
      ["c", false],
      ["d", false],
    ],
  );
  assert.equal(estSponsorise(liste[0].evenement, maintenant), true);
});

test("sans colonne de vues, le trending suit la date la plus proche", () => {
  const liste = choisirBanniere(
    [
      evt({ id: "tard", date_debut: "2026-12-19T02:00:00.000Z" }),
      evt({ id: "tot", date_debut: "2026-10-24T03:00:00.000Z" }),
    ],
    maintenant,
  );
  assert.deepEqual(
    liste.map((p) => p.evenement.id),
    ["tot", "tard"],
  );
  assert.equal(liste.every((p) => !p.sponsorise), true);
});

test("un sponsoring terminé ne prend pas le badge", () => {
  const evenement = evt({
    id: "fini",
    date_debut: "2026-10-24T03:00:00.000Z",
    sponsored_from: "2026-09-01T00:00:00.000Z",
    sponsored_to: "2026-10-01T00:00:00.000Z",
  });
  assert.equal(estSponsorise(evenement, maintenant), false);
  assert.equal(choisirBanniere([evenement], maintenant)[0]?.sponsorise, false);
});
