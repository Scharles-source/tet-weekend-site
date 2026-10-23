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
        className="min-h-11 w-full rounded-[14px] border border-[#EFE5D2] bg-white px-3 text-[#191410] outline-none placeholder:text-[#8A7B66]"
      />
      {filtres.length === 0 ? (
        <p className="text-sm text-[#8A7B66]">{vide}</p>
      ) : (
        filtres.map((e) => <CarteEvenement key={e.id} evenement={e} />)
      )}
    </div>
  );
}
