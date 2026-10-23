import { creerJob } from "@/lib/crawlers/serveur";

export const dynamic = "force-dynamic";

export function POST(requete: Request) {
  return creerJob(requete);
}
