import type { ReactNode } from "react";

/**
 * Texte des détails avec numéros haïtiens cliquables (correctif audit
 * 13 nov. 2026) : « +509 3435-5603 », « 3435-5603 » et les numéros qui
 * suivent un premier numéro préfixé deviennent des liens tel:+509…
 * (tap-to-call : réserver une table est LE geste du visiteur). Les paires
 * d'années (« 2026-2027 ») ne sont jamais prises pour des numéros.
 */
function estPaireAnnees(g1: string, g2: string): boolean {
  const a = Number(g1);
  const b = Number(g2);
  return a >= 1900 && a <= 2099 && b >= 1900 && b <= 2099;
}

export function TexteDetails({ texte }: { texte: string }) {
  const morceaux: ReactNode[] = [];
  let dernier = 0;
  let cle = 0;
  for (const m of texte.matchAll(/(\+509[\s.-]?)?(\d{4}[\s.-]\d{4})/g)) {
    const [complet, prefixe, numero] = m;
    const groupes = numero.split(/[\s.-]/);
    if (!prefixe && estPaireAnnees(groupes[0], groupes[1])) continue;
    // Sans préfixe +509, un premier groupe sous 2000 n'est pas un numéro haïtien (plages de prix, quantités…).
    if (!prefixe && Number(groupes[0]) < 2000) continue;
    if (m.index > dernier) morceaux.push(texte.slice(dernier, m.index));
    const chiffres = numero.replace(/\D/g, "");
    morceaux.push(
      <a
        key={cle++}
        href={`tel:+509${chiffres}`}
        className="font-semibold whitespace-nowrap text-[var(--nuit-texte)] underline underline-offset-2"
      >
        {complet}
      </a>,
    );
    dernier = m.index + complet.length;
  }
  if (dernier < texte.length) morceaux.push(texte.slice(dernier));
  return <>{morceaux}</>;
}
