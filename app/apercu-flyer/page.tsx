import { notFound } from "next/navigation";
import { Gabarit } from "@/components/listing/Gabarit";
import { ApercuFlyers } from "@/components/listing/ApercuFlyers";

export const dynamic = "force-dynamic";

export default function PageApercuFlyer() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <Gabarit>
      <ApercuFlyers />
    </Gabarit>
  );
}
