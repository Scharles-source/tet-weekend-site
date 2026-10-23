import { mettreReglages } from "@/lib/crawlers/serveur";

export const dynamic = "force-dynamic";

export function PATCH(requete: Request) {
  return mettreReglages(requete);
}
