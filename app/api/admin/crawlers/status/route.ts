import { lireStatut } from "@/lib/crawlers/serveur";

export const dynamic = "force-dynamic";

export function GET() {
  return lireStatut();
}
