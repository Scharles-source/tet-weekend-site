import "./boutons-sombres.css";
import "./theme-clair.css";
import "./anti-debordement.css";
import Link from "next/link";

/** Logo officiel, variante pour fond clair (« logo-tw-clair.png » : le « Tèt » passe à l'encre, le cuivre de « WEEKEND » est assombri) — le thème public est clair depuis le 15 nov. 2026. */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" aria-label="Tèt Weekend, accueil" className="inline-flex shrink-0 items-center text-inherit no-underline">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-tw-clair.png" alt="Tèt Weekend" width={320} height={177} className={`w-auto ${compact ? "h-10" : "h-12"}`} />
    </Link>
  );
}
