import { chargerAnnuaire } from "@/lib/listing/data";
import { fichierIcs } from "@/lib/listing/calendrier";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const charge = await chargerAnnuaire();
  if (!charge.ok) return new Response("Service indisponible", { status: 503 });
  const evenement = charge.annuaire.evenements.find((e) => e.slug === slug);
  if (!evenement) return new Response("Événement introuvable", { status: 404 });
  const page = `https://www.tetweekend.com/evenements/${evenement.slug}`;
  return new Response(fichierIcs(evenement, page), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${evenement.slug}.ics"`,
    },
  });
}
