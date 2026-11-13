import Link from "next/link";
import { Gabarit } from "@/components/listing/Gabarit";
import { CATEGORIES } from "@/lib/listing/schema";

export const revalidate = 300;

export const metadata = {
  title: "Categories — Tèt Weekend",
  description: "Haitian bals, concerts, kompa parties and festivals.",
};

export default function PageCategories() {
  return (
    <Gabarit>
      <h1 className="mb-4 font-[family-name:var(--font-display)] text-3xl font-extrabold">Categories</h1>
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
