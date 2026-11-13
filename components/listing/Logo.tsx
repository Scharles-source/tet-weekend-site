import "./boutons-sombres.css";
import "./theme-clair.css";
import Link from "next/link";

/** Logo officiel, détouré, pour le fond clair du site (« logo-tw.png » reste disponible pour un fond sombre). */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" aria-label="Tèt Weekend, accueil" className="inline-flex shrink-0 items-center text-inherit no-underline">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-tw-clair.png" alt="Tèt Weekend" width={320} height={177} className={`w-auto ${compact ? "h-10" : "h-12"}`} />
    </Link>
  );
}
