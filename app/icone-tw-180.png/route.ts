import { icone, reponsePng } from "@/lib/images-marque";

export const dynamic = "force-static";

export async function GET() {
  return reponsePng(await icone(180));
}
