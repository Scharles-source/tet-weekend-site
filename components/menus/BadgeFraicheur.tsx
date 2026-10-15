export function BadgeFraicheur({ verifiee, libelle }: { verifiee: boolean; libelle: string }) {
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium " +
        (verifiee
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
          : "border-amber-400/30 bg-amber-400/10 text-amber-200")
      }
    >
      <span aria-hidden="true">{verifiee ? "✓" : "⏳"}</span>
      {libelle}
    </span>
  );
}
