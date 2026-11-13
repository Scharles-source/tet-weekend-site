/* Service worker de Tèt Weekend : sert la page « hors ligne » quand il n'y a plus de réseau.
   Il ne met en cache aucune page d'événement (les infos doivent toujours être fraîches),
   et laisse passer l'admin et l'API sans y toucher. */
const VERSION = "tw-v1";
const HORS_LIGNE = "/hors-ligne";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.add(HORS_LIGNE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cles) => Promise.all(cles.filter((c) => c !== VERSION).map((c) => caches.delete(c)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.mode !== "navigate") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/ad/") || url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/")) return;
  event.respondWith(fetch(req).catch(() => caches.match(HORS_LIGNE).then((r) => r || Response.error())));
});
