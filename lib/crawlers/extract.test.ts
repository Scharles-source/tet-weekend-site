import assert from "node:assert/strict";
import test from "node:test";
import { instantDepuisSaisie } from "../listing/dates.ts";
import {
  detectDuplicate,
  empreinteSha256,
  extractPrice,
  matchVenue,
  normalizeEventKey,
  normalizePostUrl,
  parseEventDateTime,
} from "./extract.ts";

const REF = new Date("2026-10-22T12:00:00.000Z");
const TZ = "America/Port-au-Prince";

test("dates écrites en français, anglais et créole", () => {
  const fr = parseEventDateTime("samedi 24 octobre 2026 à 21h", REF, TZ);
  assert.equal(fr?.startsAt, instantDepuisSaisie("2026-10-24T21:00", TZ));
  assert.equal(fr?.heureManquante, false);

  const num = parseEventDateTime("24/10/2026", REF, TZ);
  assert.equal(num?.dateTexte, "2026-10-24");
  assert.equal(num?.startsAt, null);

  const en = parseEventDateTime("Oct 24, 2026 8h PM", REF, TZ);
  assert.equal(en?.startsAt, instantDepuisSaisie("2026-10-24T20:00", TZ));

  const ht = parseEventDateTime("24 oktòb 2026", REF, TZ);
  assert.equal(ht?.dateTexte, "2026-10-24");
  assert.equal(parseEventDateTime("samedi prochain", REF, TZ), null);

  const plage = parseEventDateTime("du 24 au 25 octobre 2026 à 21h", REF, TZ);
  assert.equal(plage?.endsAt, instantDepuisSaisie("2026-10-25T21:00", TZ));
});

test("prix seulement s'il est écrit", () => {
  assert.deepEqual(extractPrice("Entrée gratuite"), { priceText: "Gratuit", isFree: true });
  assert.equal(extractPrice("billets 30 $ US à La Lorraine").priceText?.includes("30"), true);
  assert.deepEqual(extractPrice("soirée au Yanvalou"), {});
});

test("URL, empreinte et lieu", () => {
  assert.equal(
    normalizePostUrl("HTTPS://Instagram.com/p/ABC/?utm=1#x"),
    "https://instagram.com/p/ABC?utm=1",
  );
  assert.equal(empreinteSha256(new Uint8Array([1, 2, 3])).length, 64);
  const lieu = matchVenue("AKUNA au Do Kay ce soir", [{ id: "v1", nom: "Do Kay", ville: "Pétion-Ville" }]);
  assert.equal(lieu?.id, "v1");
  assert.equal(normalizeEventKey({ title: "AKUNA", startsAt: "2026-10-24", venue: "Do Kay", city: "Pétion-Ville" }).includes("akuna"), true);
});

test("doublon par URL, média ou titre", () => {
  const url = detectDuplicate(
    { url: "https://instagram.com/p/ABC/", title: "Autre" },
    [{ id: "e1", sourceUrl: "https://www.instagram.com/p/ABC", table: "event" }],
  );
  assert.equal(url?.kind, "url");
  const media = detectDuplicate(
    { mediaSha256: "abc", url: "https://exemple.com/a" },
    [{ id: "c1", mediaSha256: "abc", table: "candidate", sourceUrl: "https://exemple.com/b" }],
  );
  assert.equal(media?.kind, "media");
  assert.equal(
    detectDuplicate(
      { title: "Bal du samedi", startsAt: "2026-10-25T01:00:00.000Z", city: "Pétion-Ville", timezone: TZ },
      [{ id: "e2", title: "Bal du samedi", startsAt: "2026-10-25T01:00:00.000Z", city: "Cap-Haïtien", table: "event" }],
    ),
    null,
  );
});
