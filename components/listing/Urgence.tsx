"use client";

import { useSyncExternalStore } from "react";
import { urgenceDe } from "@/lib/listing/urgence";

const abonner = (rappel: () => void) => {
  const id = setInterval(rappel, 60_000);
  return () => clearInterval(id);
};
const minuteCourante = () => Math.floor(Date.now() / 60_000);

/** Pastille d'urgence réelle (compte à rebours). Rien côté serveur : l'heure vient du téléphone. */
export function Urgence({ evenement, className = "" }: { evenement: { date_debut: string; date_fin: string | null; fuseau: string }; className?: string }) {
  const minute = useSyncExternalStore(abonner, minuteCourante, () => 0);
  if (!minute) return null;
  const u = urgenceDe(evenement, new Date(minute * 60_000));
  if (!u) return null;
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${u.urgent ? "bg-[var(--accent)] text-white" : "bg-[rgba(15,12,11,0.82)] text-[var(--nuit-texte)]"} ${className}`}>
      {u.texte}
    </span>
  );
}
