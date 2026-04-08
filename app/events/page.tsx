"use client";
import { useEffect, useState } from "react";
import { Search, Music } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventCard from "@/components/EventCard";
import { apiGetEvents as getEvents } from "@/lib/api";
import { Event } from "@/lib/types";

const CATEGORIES = ["Tout", "Konpa", "Rasin", "Rara", "Festival", "Rap Kreyòl", "Gospel", "Dance"];

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Tout");
  const [search, setSearch] = useState("");

  useEffect(() => {
    getEvents(40).then((data) => {
      setEvents(data);
      setLoading(false);
    });
  }, []);

  const filtered = events.filter((e) => {
    const matchCat =
      activeCategory === "Tout" ||
      (e.category ?? "").toLowerCase().includes(activeCategory.toLowerCase());
    const matchSearch =
      search === "" ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.city ?? "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 72 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px var(--page-px)" }}>

          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "var(--blue)", fontWeight: 500, marginBottom: 12 }}>
              Découverte
            </p>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 800, letterSpacing: "-2px", marginBottom: 8 }}>
              Tous les événements
            </h1>
            <p style={{ color: "var(--text-sec)", fontSize: 16 }}>
              {loading ? "Chargement..." : `${events.length} événements disponibles`}
            </p>
          </div>

          {/* Search */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "var(--surface)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12, padding: "10px 16px", marginBottom: 20, maxWidth: 480,
          }}>
            <span style={{ color: "var(--text-sec)" }}><Search size={16} /></span>
            <input
              type="text"
              placeholder="Chercher un événement, une ville..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: "none", border: "none", outline: "none",
                color: "var(--white)", fontFamily: "var(--font-body)", fontSize: 14, flex: 1,
              }}
            />
          </div>

          {/* Category pills */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 36, scrollbarWidth: "none" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  flexShrink: 0, padding: "7px 18px", borderRadius: 100,
                  background: activeCategory === cat ? "var(--blue)" : "var(--surface)",
                  color: activeCategory === cat ? "var(--black)" : "var(--text-sec)",
                  border: activeCategory === cat ? "1px solid var(--blue)" : "1px solid rgba(255,255,255,0.07)",
                  fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)",
                  fontWeight: activeCategory === cat ? 500 : 400,
                  whiteSpace: "nowrap", transition: "all 0.2s",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{
                  height: 280, background: "var(--surface)", borderRadius: 16,
                  opacity: 0.4, animation: "pulse-dot 1.5s infinite",
                }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ marginBottom: 16, color: "var(--text-sec)", opacity: 0.4 }}><Music size={48} /></div>
              <p style={{ color: "var(--text-sec)", fontSize: 16 }}>Aucun événement trouvé.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {filtered.map((e) => <EventCard key={e.id} event={e} />)}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
