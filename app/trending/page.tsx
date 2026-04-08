"use client";
import { useEffect, useState } from "react";
import { TrendingUp, Eye, Heart, CalendarDays, Music } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventCard from "@/components/EventCard";
import { apiGetMostViewedEvents as getMostViewedEvents, apiGetMostLikedEvents as getMostLikedEvents, apiGetWeekendEvents as getWeekendEvents, apiGetTrendingEvents as getTrendingEvents } from "@/lib/api";
import { Event } from "@/lib/types";

export default function TrendingPage() {
  const [mostViewed, setMostViewed] = useState<Event[]>([]);
  const [mostLiked, setMostLiked] = useState<Event[]>([]);
  const [weekend, setWeekend] = useState<Event[]>([]);
  const [overall, setOverall] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMostViewedEvents(3),
      getMostLikedEvents(3),
      getWeekendEvents(6),
      getTrendingEvents(10),
    ]).then(([viewed, liked, wknd, all]) => {
      setMostViewed(viewed);
      setMostLiked(liked);
      setWeekend(wknd);
      setOverall(all);
      setLoading(false);
    });
  }, []);

  const getUpcomingWeekendLabel = () => {
    const now = new Date();
    const day = now.getDay();
    const daysUntilSat = day === 0 ? 6 : (6 - day);
    const saturday = new Date(now);
    saturday.setDate(now.getDate() + daysUntilSat);
    return saturday.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  };

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 72 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px var(--page-px)" }}>

          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "var(--blue)", fontWeight: 500, marginBottom: 12 }}>
              Score viral
            </p>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 800, letterSpacing: "-2px", marginBottom: 8, display: "flex", alignItems: "center", gap: 16 }}>
              <TrendingUp size={40} color="var(--blue)" /> Trending
            </h1>
            <p style={{ color: "var(--text-sec)", fontSize: 16 }}>
              Les événements qui buzzent le plus en ce moment.
            </p>
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {[0, 1, 2].map((s) => (
                <div key={s}>
                  <div style={{ height: 20, width: 160, background: "var(--surface)", borderRadius: 8, marginBottom: 16, opacity: 0.4 }} />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{ height: 280, background: "var(--surface)", borderRadius: 16, opacity: 0.4 }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Most viewed */}
              {mostViewed.length > 0 && (
                <section style={{ marginBottom: 48 }}>
                  <SectionHeader icon={<Eye size={18} />} title="Plus vus" subtitle="Les événements les plus consultés" />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                    {mostViewed.map((e) => <EventCard key={e.id} event={e} />)}
                  </div>
                </section>
              )}

              {/* Most liked */}
              {mostLiked.length > 0 && (
                <section style={{ marginBottom: 48 }}>
                  <SectionHeader icon={<Heart size={18} />} title="Plus aimés" subtitle="Les événements avec le plus de j'aime" />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                    {mostLiked.map((e) => <EventCard key={e.id} event={e} />)}
                  </div>
                </section>
              )}

              {/* This weekend */}
              <section style={{ marginBottom: 48 }}>
                <SectionHeader
                  icon={<CalendarDays size={18} />}
                  title={`Ce weekend · ${getUpcomingWeekendLabel()}`}
                  subtitle="Événements prévus ce samedi et dimanche"
                />
                {weekend.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-sec)", fontSize: 14 }}>
                    <Music size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <p>Aucun événement ce weekend pour le moment.</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                    {weekend.map((e) => <EventCard key={e.id} event={e} />)}
                  </div>
                )}
              </section>

              {/* Overall trending */}
              {overall.length > 0 && (
                <section>
                  <SectionHeader icon={<TrendingUp size={18} />} title="Top global" subtitle="Score combiné: vues + j'aime + participation" />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                    {overall.map((e) => <EventCard key={e.id} event={e} />)}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{
        width: 36, height: 36, borderRadius: 10,
        background: "rgba(107,138,255,0.12)",
        border: "1px solid rgba(107,138,255,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--blue)", flexShrink: 0,
      }}>
        {icon}
      </span>
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, letterSpacing: "-0.4px", margin: 0 }}>
          {title}
        </h2>
        <p style={{ fontSize: 12, color: "var(--text-sec)", margin: 0 }}>{subtitle}</p>
      </div>
    </div>
  );
}
