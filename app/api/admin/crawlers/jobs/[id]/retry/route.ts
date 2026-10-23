import { reessayerJobHttp } from "@/lib/crawlers/serveur";

export const dynamic = "force-dynamic";

export function POST(_requete: Request, contexte: { params: Promise<{ id: string }> }) {
  return contexte.params.then(({ id }) => reessayerJobHttp(id));
}
