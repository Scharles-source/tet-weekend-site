import assert from "node:assert/strict";
import { test } from "node:test";
import { flyerAllege } from "./image-url.ts";

const supa = "https://abc.supabase.co/storage/v1/object/public/flyers/a b.jpg";

test("passe un flyer Supabase par l'optimiseur", () => {
  assert.equal(flyerAllege(supa, 640), `/_next/image?url=${encodeURIComponent(supa)}&w=640&q=70`);
});

test("laisse intacts les autres liens et les valeurs vides", () => {
  assert.equal(flyerAllege("https://exemple.com/x.jpg", 640), "https://exemple.com/x.jpg");
  assert.equal(flyerAllege("pas une url", 640), "pas une url");
  assert.equal(flyerAllege(null, 640), undefined);
});
