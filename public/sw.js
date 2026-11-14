/* Service worker de Tèt Weekend.
   1) Sert la page « hors ligne » quand il n'y a plus de réseau.
   2) Garde en cache les fichiers qui ne changent pas (scripts/styles versionnés et flyers réduits) : sur une
      connexion lente, les visites suivantes ne les retéléchargent pas.
   Il ne met en cache aucune page d'événement (les infos doivent toujours être fraîches),
   et laisse passer l'admin et l'API sans y toucher. */
const VERSION = "tw-v2";
const IMAGES = "tw-img-v1";
const HORS_LIGNE = "/hors-ligne";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.add(HORS_LIGNE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cles) => Promise.all(cles.filter((c) => c !== VERSION && c !== IMAGES).map((c) => caches.delete(c)))).then(() => self.clients.claim()),
  );
});

async function dabordCache(req, nom) {
  const cache = await caches.open(nom);
  const trouve = await cache.match(req);
  if (trouve) return trouve;
  const rep = await fetch(req);
  if (rep.ok) cache.put(req, rep.clone());
  return rep;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/ad/") || url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/")) return;

  // Fichiers versionnés (le nom change à chaque modification) et flyers réduits : cache d'abord.
  if (url.pathname.startsWith("/_next/static/") || url.pathname === "/_next/image") {
    event.respondWith(dabordCache(req, url.pathname === "/_next/image" ? IMAGES : VERSION).catch(() => Response.error()));
    return;
  }

  if (req.mode !== "navigate") return;
  event.respondWith(fetch(req).catch(() => caches.match(HORS_LIGNE).then((r) => r || Response.error())));
});
