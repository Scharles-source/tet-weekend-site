import assert from "node:assert/strict";
import { test } from "node:test";
import {
  aReverifier,
  detecterDevise,
  extraireLignes,
  fusionnerNomPuisPrix,
  parserDatePhoto,
  parserPrix,
} from "./extraction.ts";
import { construireExport, ErreurExport, versCsv } from "./export.ts";
import { collecterVide, genererEtatMd, recalculerEtat, remplacerLignesSource } from "./etat.ts";
import { detecterAntiBot, htmlVersLignes, liensMenu } from "./html.ts";
import type { Ligne } from "./types.ts";

test("parse prix HTG et USD sans inventer", () => {
  assert.deepEqual(parserPrix("Griot complet 2 500 HTG"), {
    prix: 2500,
    devise: "HTG",
    reste: "Griot complet",
  });
  assert.deepEqual(parserPrix("Burger $15"), { prix: 15, devise: "USD", reste: "Burger" });
  assert.equal(parserPrix("Plat du jour").prix, null);
  assert.equal(detecterDevise("11 USD + taxes"), "USD");
});

test("date photo Maps et fraîcheur 12 mois", () => {
  assert.deepEqual(parserDatePhoto("Nov 2020"), { iso: "2020-11-01", brut: "Nov 2020" });
  assert.deepEqual(parserDatePhoto("15 oct. 2026"), { iso: "2026-10-15", brut: "15 oct. 2026" });
  const maintenant = new Date("2026-10-15T12:00:00-04:00");
  assert.equal(aReverifier("2020-11-01", maintenant), true);
  assert.equal(aReverifier("2026-05-01", maintenant), false);
  assert.equal(aReverifier(null, maintenant), true);
});

test("extraction propose des lignes à vérifier, jamais inventées", () => {
  const lignes = extraireLignes(
    [
      { texte: "Plats", confiance: 90 },
      { texte: "Griot TEST 12.50 USD", confiance: 88 },
      { texte: "ligne illisible xyz", confiance: 40 },
    ],
    { sourceId: "s1", sourceUrl: "https://exemple.test/menu", dateReleve: "2026-10-15" }
  );
  const griot = lignes.find((l) => l.nom.includes("Griot"));
  assert.ok(griot);
  assert.equal(griot!.prix, 12.5);
  assert.equal(griot!.devise, "USD");
  assert.equal(griot!.statut, "à vérifier");
  assert.equal(griot!.categorie, "Plats");
  const sansPrix = lignes.find((l) => l.nom.includes("illisible"));
  assert.ok(sansPrix);
  assert.equal(sansPrix!.prix, null);
  assert.ok(sansPrix!.avertissements.some((a) => /Prix/i.test(a)));
});

test("fusion nom puis prix sur deux lignes OCR", () => {
  const base = extraireLignes(
    [
      { texte: "TEST Poulet grillé", confiance: 80 },
      { texte: "845 HTG", confiance: 85 },
    ],
    { sourceId: "s", dateReleve: "2026-10-15" }
  );
  // Forcer le cas « prix seul » sur la 2e ligne
  base[1] = { ...base[1], nom: "(nom à lire)", prix: 845, devise: "HTG" };
  base[0] = { ...base[0], prix: null };
  const f = fusionnerNomPuisPrix(base);
  assert.equal(f.length, 1);
  assert.equal(f[0].prix, 845);
  assert.match(f[0].nom, /Poulet/);
});

test("export refuse les lignes non relues", () => {
  let c = collecterVide("test-resto", "TEST");
  const ligne: Ligne = {
    id: "s-l001",
    source: "s",
    nom: "TEST Plat",
    description: null,
    prix: 10,
    devise: "USD",
    categorie: "Plats",
    section: null,
    disponible: true,
    confiance: 0.9,
    texte_brut: "TEST Plat 10 USD",
    avertissements: [],
    date_releve: "2026-10-15",
    valide_du: null,
    valide_au: null,
    source_url: "https://exemple.test/m",
    statut: "à vérifier",
    verifie_le: null,
  };
  c = remplacerLignesSource(c, "s", [ligne]);
  assert.throws(() => construireExport(c), ErreurExport);

  c = {
    ...c,
    lignes: [{ ...ligne, statut: "vérifié", verifie_le: "2026-10-15" }],
  };
  c = recalculerEtat(c);
  const { lignes } = construireExport(c);
  assert.equal(lignes.length, 1);
  assert.equal(lignes[0].restaurant_slug, "test-resto");
  assert.equal(lignes[0].a_verifier, "non");
  const csv = versCsv(lignes);
  assert.match(csv, /^restaurant_slug,categorie,nom,/);
  assert.match(csv, /test-resto,Plats,TEST Plat/);
});

test("HTML : liens menu et anti-bot", () => {
  const html = `<html><body><a href="/notre-carte">Voir le menu</a><a href="/contact">Contact</a>
    <p>Griot 15 USD</p></body></html>`;
  const liens = liensMenu(html, "https://exemple.test/");
  assert.equal(liens.length, 1);
  assert.match(liens[0].href, /notre-carte/);
  assert.ok(htmlVersLignes(html).some((l) => /Griot/.test(l.texte)));
  assert.ok(detecterAntiBot("Please complete the captcha to continue"));
  assert.equal(detecterAntiBot("<p>Menu</p>"), null);
});

test("ETAT.md liste les restaurants", () => {
  const md = genererEtatMd([collecterVide("a", "Alpha"), collecterVide("b", "Beta")], {
    genereLe: "2026-10-15",
  });
  assert.match(md, /Alpha/);
  assert.match(md, /pas commencé/);
});
