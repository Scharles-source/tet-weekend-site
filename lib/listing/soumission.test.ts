import assert from "node:assert/strict";
import { test } from "node:test";
import { echapperHtml, flyerValide, validerSoumission } from "./soumission.ts";

const bon = { nom: "Jean Pierre", email: "jean@exemple.com", evenement: "Bal Kompa", date: "Sat Dec 12, 9 PM", lieu: "Club X, Brooklyn" };

test("soumission complète acceptée et nettoyée", () => {
  const r = validerSoumission({ ...bon, nom: "  Jean   Pierre  ", telephone: "+1 555 0100", details: "Doors at 9\r\nTickets at the door" });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.valeur.nom, "Jean Pierre");
    assert.equal(r.valeur.details, "Doors at 9\nTickets at the door");
  }
});

test("champs obligatoires et email valide", () => {
  const r = validerSoumission({ ...bon, email: "pas-un-email", evenement: "", lieu: "x" });
  assert.equal(r.ok, false);
  if (!r.ok) assert.deepEqual(Object.keys(r.erreurs).sort(), ["email", "evenement", "lieu"]);
  assert.equal(validerSoumission({}).ok, false);
});

test("flyer : type et taille", () => {
  assert.equal(flyerValide({ type: "image/png", size: 1000 }), null);
  assert.ok(flyerValide({ type: "application/pdf", size: 1000 }));
  assert.ok(flyerValide({ type: "image/jpeg", size: 6 * 1024 * 1024 }));
  assert.ok(flyerValide({ type: "image/jpeg", size: 0 }));
});

test("le HTML des courriels est échappé", () => {
  assert.equal(echapperHtml('<b>"a" & b</b>'), "&lt;b&gt;&quot;a&quot; &amp; b&lt;/b&gt;");
});
