import assert from "node:assert/strict";
import { test } from "node:test";
import {
  altFlyer,
  creditPublic,
  doublonsProbables,
  patchMasquerFlyer,
  patchReafficherFlyer,
  ratioTexte,
  resolutionFaible,
  titresProches,
  type EvenementComparable,
} from "./flyer.ts";
import { ipInterdite, importerImageDepuisUrl, assertUrlPublique } from "./flyer-import.ts";
import { inspecterImage } from "./image.ts";
import { SaisieInvalide } from "./validation.ts";

function jpeg(width: number, height: number): Uint8Array {
  return new Uint8Array([
    0xff, 0xd8,
    0xff, 0xc0, 0x00, 0x11, 0x08,
    (height >> 8) & 255, height & 255,
    (width >> 8) & 255, width & 255,
    0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x00, 0x03, 0x11, 0x00,
    0xff, 0xd9,
  ]);
}

function copieTest(octets: Uint8Array): ArrayBuffer {
  const copie = new ArrayBuffer(octets.byteLength);
  new Uint8Array(copie).set(octets);
  return copie;
}

function png(width: number, height: number): Uint8Array {
  const octets = new Uint8Array(24);
  octets.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13], 0);
  octets.set([0x49, 0x48, 0x44, 0x52], 12);
  octets[16] = (width >>> 24) & 255;
  octets[17] = (width >>> 16) & 255;
  octets[18] = (width >>> 8) & 255;
  octets[19] = width & 255;
  octets[20] = (height >>> 24) & 255;
  octets[21] = (height >>> 16) & 255;
  octets[22] = (height >>> 8) & 255;
  octets[23] = height & 255;
  return octets;
}

const existant: EvenementComparable = {
  id: "e1",
  titre: "Bal du samedi",
  slug: "bal-du-samedi",
  date_debut: "2026-10-25T01:00:00.000Z",
  fuseau: "America/Port-au-Prince",
  venue_id: "v1",
  ville: "Pétion-Ville",
  source_url: "https://instagram.com/p/ABC/",
};

test("fichiers : png et jpeg acceptés, svg et taille refusés", () => {
  assert.deepEqual(inspecterImage(png(800, 1000), "image/png"), { mime: "image/png", width: 800, height: 1000 });
  assert.equal(inspecterImage(jpeg(1920, 1080), "image/jpeg").mime, "image/jpeg");
  assert.throws(() => inspecterImage(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>")), SaisieInvalide);
  assert.throws(() => inspecterImage(new Uint8Array(10 * 1024 * 1024 + 1)), SaisieInvalide);
  assert.equal(ratioTexte(800, 1000), "4:5");
  assert.equal(ratioTexte(1000, 1000), "1:1");
  assert.equal(ratioTexte(1920, 1080), "16:9");
  assert.equal(resolutionFaible(640, 800), true);
  assert.equal(resolutionFaible(800, 800), false);
});

test("import d'URL : hôtes privés, svg et redirections dangereuses", async () => {
  assert.equal(ipInterdite("127.0.0.1"), true);
  assert.equal(ipInterdite("10.1.2.3"), true);
  assert.equal(ipInterdite("192.168.1.9"), true);
  assert.equal(ipInterdite("169.254.169.254"), true);
  assert.equal(ipInterdite("8.8.8.8"), false);
  await assert.rejects(() => assertUrlPublique("http://127.0.0.1/flyer.jpg"), SaisieInvalide);
  await assert.rejects(() => assertUrlPublique("http://localhost/flyer.jpg"), SaisieInvalide);
  await assert.rejects(() => assertUrlPublique("file:///etc/passwd"), SaisieInvalide);
  await assert.rejects(
    () => importerImageDepuisUrl("https://cdn.exemple/a.jpg", {
      resoudre: async () => ["8.8.8.8"],
      fetch: async () => new Response(null, { status: 302, headers: { location: "http://169.254.169.254/latest" } }),
    }),
    SaisieInvalide,
  );
  await assert.rejects(
    () => importerImageDepuisUrl("https://cdn.exemple/a.svg", {
      resoudre: async () => ["8.8.8.8"],
      fetch: async () => new Response("<svg></svg>", { status: 200, headers: { "content-type": "image/svg+xml" } }),
    }),
    SaisieInvalide,
  );
  const image = await importerImageDepuisUrl("https://cdn.exemple/a.png", {
    resoudre: async () => ["8.8.8.8"],
      fetch: async () => new Response(copieTest(png(400, 500)), { status: 200, headers: { "content-type": "image/png" } }),
  });
  assert.equal(image.width, 400);
  assert.equal(image.height, 500);
});

test("doublon par URL source, et par titre date lieu", () => {
  const parUrl = doublonsProbables({
    titre: "Autre soirée",
    date_debut: "2026-11-01T21:00",
    fuseau: "America/Port-au-Prince",
    venue_id: null,
    ville: "Miami",
    source_url: "https://instagram.com/p/ABC",
  }, [existant]);
  assert.equal(parUrl.length, 1);
  const parFaits = doublonsProbables({
    titre: "Bal du samedi !",
    date_debut: "2026-10-24T21:00",
    fuseau: "America/Port-au-Prince",
    venue_id: "v1",
    ville: "Pétion-Ville",
    source_url: null,
  }, [existant]);
  assert.equal(parFaits[0]?.slug, "bal-du-samedi");
  const autreVille = doublonsProbables({
    titre: "Bal du samedi",
    date_debut: "2026-10-24T21:00",
    fuseau: "America/Port-au-Prince",
    venue_id: null,
    ville: "Miami",
    source_url: null,
  }, [existant]);
  assert.equal(autreVille.length, 0);
  assert.equal(titresProches("Bal du samedi", "bal du samedi"), true);
});

test("masquer retire l'URL publique, réafficher la reconstruit", () => {
  const masque = patchMasquerFlyer("Demande de l'organisateur", "2026-10-22T20:00:00.000Z");
  assert.equal(masque.flyer_url, null);
  assert.equal(masque.flyer_card_url, null);
  assert.equal(masque.flyer_hidden_reason, "Demande de l'organisateur");
  assert.throws(() => patchMasquerFlyer("  ", "2026-10-22T20:00:00.000Z"));
  const retour = patchReafficherFlyer("flyers/a.jpg", "https://exemple.supabase.co/storage/v1/object/public/event-flyers/flyers/a.jpg");
  assert.equal(retour.flyer_hidden_at, null);
  assert.match(retour.flyer_url, /flyers\/a.jpg$/);
  assert.throws(() => patchReafficherFlyer(null, null));
  assert.equal(altFlyer("Bal", "Yanvalou", "samedi"), "Flyer — Bal, Yanvalou, samedi");
  assert.equal(creditPublic(null, "@yanvalou", "instagram"), "@yanvalou");
  assert.equal(creditPublic(null, null, "manuel"), null);
});
