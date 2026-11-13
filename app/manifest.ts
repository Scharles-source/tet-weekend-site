import type { MetadataRoute } from "next";

/** Web app installable (Android, iOS, ordinateur) : ouvre le site en plein écran, comme une application. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Tèt Weekend",
    short_name: "Tèt Weekend",
    description: "Haitian events in Haiti and across the diaspora: bals, concerts and kompa parties.",
    lang: "en",
    start_url: "/?source=app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FBF7EF",
    theme_color: "#191410",
    categories: ["entertainment", "events", "lifestyle"],
    icons: [
      { src: "/icone-tw-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icone-tw-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icone-tw-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Tonight", short_name: "Tonight", url: "/evenements?source=app", icons: [{ src: "/icone-tw-192.png", sizes: "192x192" }] },
      { name: "Cities", short_name: "Cities", url: "/villes?source=app", icons: [{ src: "/icone-tw-192.png", sizes: "192x192" }] },
    ],
  };
}
