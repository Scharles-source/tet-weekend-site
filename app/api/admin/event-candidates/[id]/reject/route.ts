import { rejeterCandidat } from "@/lib/crawlers/serveur";

export const dynamic = "force-dynamic";

export function POST(requete: Request, contexte: { params: Promise<{ id: string }> }) {
  return contexte.params.then(({ id }) => rejeterCandidat(id, requete));
}
