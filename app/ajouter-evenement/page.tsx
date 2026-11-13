import type { Metadata } from "next";
import { FormulaireEvenement } from "@/components/listing/FormulaireEvenement";
import { Gabarit } from "@/components/listing/Gabarit";

export const metadata: Metadata = {
  title: "Become a partner — Tèt Weekend",
  description: "Throwing a Haitian party? Send us your flyer and details and we'll put it in front of the community.",
  robots: { index: false, follow: true },
};

export default function PageAjouterEvenement() {
  return (
    <Gabarit>
      <h1 className="font-[family-name:var(--font-display)] text-[32px] leading-tight font-black tracking-tight text-[var(--nuit-texte)]">Become a partner</h1>
      <p className="mt-2 mb-6 text-[15px] leading-relaxed text-[var(--nuit-texte2)]">
        Throwing a party? Send us your event details and your flyer, and we put them in front of the whole community. We review every event before publishing it.
      </p>
      <FormulaireEvenement />
    </Gabarit>
  );
}
