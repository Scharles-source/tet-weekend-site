import { formatIcs } from "./dates.ts";
import type { EvenementPublic } from "./types.ts";

function echapper(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function lieuTexte(e: EvenementPublic): string {
  return [e.lieu?.nom, e.lieu?.adresse, e.ville ?? e.lieu?.ville].filter(Boolean).join(", ");
}

export function lienGoogleAgenda(e: EvenementPublic, pageUrl: string): string {
  const debut = formatIcs(e.date_debut);
  const fin = formatIcs(e.date_fin ?? e.date_debut);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.titre,
    dates: `${debut}/${fin}`,
  });
  const details = [e.description, pageUrl].filter(Boolean).join("\n");
  if (details) params.set("details", details);
  const lieu = lieuTexte(e);
  if (lieu) params.set("location", lieu);
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function fichierIcs(e: EvenementPublic, pageUrl: string): string {
  const lignes = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tet Weekend//Listing//FR",
    "BEGIN:VEVENT",
    `UID:${e.id}@tetweekend.com`,
    `DTSTAMP:${formatIcs(new Date().toISOString())}`,
    `DTSTART:${formatIcs(e.date_debut)}`,
  ];
  if (e.date_fin) lignes.push(`DTEND:${formatIcs(e.date_fin)}`);
  lignes.push(`SUMMARY:${echapper(e.titre)}`);
  const lieu = lieuTexte(e);
  if (lieu) lignes.push(`LOCATION:${echapper(lieu)}`);
  if (e.description) lignes.push(`DESCRIPTION:${echapper(e.description)}`);
  lignes.push(`URL:${pageUrl}`, "END:VEVENT", "END:VCALENDAR");
  return `${lignes.join("\r\n")}\r\n`;
}
