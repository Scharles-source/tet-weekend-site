import Link from "next/link";
import { Gabarit } from "@/components/listing/Gabarit";
import { CATEGORIES } from "@/lib/listing/schema";

export const revalidate = 300;

export const metadata = {
  title: "Catégories — Tèt Weekend",
  description: "Bals, concerts, soirées kompa et festivals haïtiens.",
};

export default function PageCategories() {
  return (
    <Gabarit>
      <h1 className="mb-4 font-[family-name:var(--font-display)] text-3xl font-extrabold">Catégories</h1>
      <ul className="space-y-2">
        {CATEGORIES.map((c) => (
          <li key={c.slug}>
            <Link href={`/categories/${c.slug}`} className="underline">
              {c.nom}
            </Link>
          </li>
        ))}
      </ul>
    </Gabarit>
  );
}
