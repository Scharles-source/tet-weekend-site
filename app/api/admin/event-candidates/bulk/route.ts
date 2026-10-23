import { traiterLot } from "@/lib/crawlers/serveur";

export const dynamic = "force-dynamic";

export function POST(requete: Request) {
  return traiterLot(requete);
}
