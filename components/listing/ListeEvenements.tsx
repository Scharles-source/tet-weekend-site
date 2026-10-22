"use client";

import { useMemo, useState } from "react";
import { CarteEvenement } from "@/components/listing/CarteEvenement";
import type { EvenementPublic } from "@/lib/listing/types";

export function ListeEvenements({ evenements, vide }: { evenements: EvenementPublic[]; vide: string }) {
  const [recherche, setRecherche] = useState("");
  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return evenements;
    return evenements.filter((e) => {
      const texte = [e.titre, e.ville, e.lieu?.nom, ...e.artistes.map((a) => a.nom)].filter(Boolean).join(" ").toLowerCase();
      return texte.includes(q);
    });
  }, [evenements, recherche]);

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        placeholder="Nom de l'événement, du DJ, de la ville…"
        className="min-h-11 w-full rounded-xl border border-white/15 bg-[var(--black)] px-3"
      />
      {filtres.length === 0 ? (
        <p className="text-sm text-[var(--text-sec)]">{vide}</p>
      ) : (
        filtres.map((e) => <CarteEvenement key={e.id} evenement={e} />)
      )}
    </div>
  );
}
