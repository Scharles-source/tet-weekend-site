"use client";
import { useState } from "react";
import VenueSheet, { VenueData } from "./VenueSheet";

/* ─── Données Gecko Lounge ──────────────────────────────── */
const GECKO: VenueData = {
  id: "gecko-lounge",
  name: "Gecko Lounge Bar",
  shortName: "Gecko",
  logo: "/venues/gecko-logo.jpg",
  category: "Bar · Lounge · Nightlife",
  address: "4 Rue Richard Jules, Delmas 75, Port-au-Prince, Haïti",
  phone: "+509 3748-7777",
  instagram: "geckoloungehaiti",
  description:
    "Le spot incontournable de Delmas 75 pour ceux qui savent kote yo prale. Cocktails, cigars, bonne musique et vibes incomparables — chaque vendredi c'est Jou Gecko.",
  coverColor: "#1a2a1a",
  ambiance: ["🎵 DJ", "🍹 Cocktails", "🚬 Cigars", "🔥 Nightlife", "✨ Lounge"],
  parking: "Parking privé disponible sur place",
  hours: [
    { day: "Lundi", time: "Fermé" },
    { day: "Mardi", time: "Fermé" },
    { day: "Mercredi", time: "18h – 01h" },
    { day: "Jeudi", time: "18h – 02h" },
    { day: "Vendredi", time: "18h – 03h" },
    { day: "Samedi", time: "18h – 03h" },
    { day: "Dimanche", time: "18h – 00h" },
  ],
  menu: [
    {
      title: "Cocktails",
      items: [
        { name: "Mojito Classique", price: "500 HTG", desc: "Rhum, menthe, citron vert, sucre de canne" },
        { name: "Piña Colada", price: "550 HTG", desc: "Rhum blanc, noix de coco, ananas" },
        { name: "Passion Fruit Daiquiri", price: "600 HTG", desc: "Rhum, fruit de la passion, citron" },
        { name: "Gecko Special", price: "700 HTG", desc: "Signature cocktail maison" },
        { name: "Sex on the Beach", price: "550 HTG", desc: "Vodka, pêche, jus d'orange, grenadine" },
      ],
    },
    {
      title: "Bières & Softs",
      items: [
        { name: "Prestige (33cl)", price: "250 HTG" },
        { name: "Heineken (33cl)", price: "300 HTG" },
        { name: "Red Bull", price: "400 HTG" },
        { name: "Eau minérale", price: "150 HTG" },
        { name: "Jus naturels", price: "300 HTG", desc: "Mangue, citron, grenadine" },
      ],
    },
    {
      title: "Cigars",
      items: [
        { name: "Cigar léger", price: "500 HTG" },
        { name: "Cigar premium", price: "1 200 HTG" },
        { name: "Pack soirée (×5)", price: "2 000 HTG" },
      ],
    },
    {
      title: "Bouteilles (Bottle Service)",
      items: [
        { name: "Rhum Barbancourt 5★", price: "4 500 HTG" },
        { name: "Vodka Grey Goose", price: "9 000 HTG" },
        { name: "Hennessy VS", price: "12 000 HTG" },
        { name: "Don Julio 1942", price: "20 000 HTG" },
      ],
    },
  ],
};

/* ─── Liste des venues (extensible facilement) ──────────── */
const VENUES: VenueData[] = [GECKO];

/* ─── Composant stories ─────────────────────────────────── */
export default function VenueStories() {
  const [open, setOpen] = useState<VenueData | null>(null);

  return (
    <>
      {/* Row de stories */}
      <div style={{
        display: "flex",
        gap: 20,
        overflowX: "auto",
        paddingBottom: 8,
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}>
        {VENUES.map((venue) => (
          <button
            key={venue.id}
            onClick={() => setOpen(venue)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              flexShrink: 0, padding: 0,
            }}
          >
            {/* Anneau gradient comme Instagram */}
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
              padding: 3,
              boxShadow: "0 4px 20px rgba(220,39,67,0.35)",
            }}>
              <div style={{
                width: "100%", height: "100%", borderRadius: "50%",
                background: "var(--black, #0A0A0A)",
                padding: 2,
                overflow: "hidden",
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={venue.logo}
                  alt={venue.shortName}
                  style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                />
              </div>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 600, color: "var(--white, #fff)",
              maxWidth: 72, textAlign: "center", lineHeight: 1.2,
            }}>
              {venue.shortName}
            </span>
          </button>
        ))}
      </div>

      {/* Bottom sheet */}
      {open && <VenueSheet venue={open} onClose={() => setOpen(null)} />}
    </>
  );
}
