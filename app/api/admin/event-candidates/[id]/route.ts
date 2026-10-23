import { sauverCandidat } from "@/lib/crawlers/serveur";

export const dynamic = "force-dynamic";

export function PATCH(requete: Request, contexte: { params: Promise<{ id: string }> }) {
  return contexte.params.then(({ id }) => sauverCandidat(id, requete));
}
