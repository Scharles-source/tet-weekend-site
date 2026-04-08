"use client";
import Link from "next/link";
import { TrendingUp, MapPin, Ticket, Zap, Smartphone, Bell, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventCard from "@/components/EventCard";
import { apiGetEvents as getEvents, apiGetTrendingEvents as getTrendingEvents } from "@/lib/api";
import { Event } from "@/lib/types";
import { useEffect, useState } from "react";

const CONTAINER = { maxWidth: 1200, margin: "0 auto", width: "100%" } as const;

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [trending, setTrending] = useState<Event[]>([]);

  useEffect(() => {
    getEvents(8).then(setEvents);
    getTrendingEvents(5).then(setTrending);
  }, []);

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 72 }}>

        {/* ===== HERO ===== */}
        <section style={{
          position: "relative",
          minHeight: "calc(100vh - 72px)",
          display: "flex",
          alignItems: "center",
          padding: "80px var(--page-px, 32px) 60px",
          overflow: "hidden",
        }}>
          {/* Background */}
          <div style={{
            position: "absolute", inset: 0, zIndex: 0,
            background: "radial-gradient(ellipse 70% 60% at 70% 40%, rgba(107,138,255,0.1) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 20% 70%, rgba(192,57,43,0.06) 0%, transparent 60%)",
          }} />
          <div style={{
            position: "absolute", inset: 0, zIndex: 0, opacity: 0.04,
            backgroundImage: "linear-gradient(#F5F2ED 1px, transparent 1px), linear-gradient(90deg, #F5F2ED 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }} />

          <div style={{ ...CONTAINER, position: "relative", zIndex: 1 }} className="fade-up">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}
              className="hero-grid">
              {/* Left — text */}
              <div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "rgba(107,138,255,0.12)", border: "1px solid rgba(107,138,255,0.3)",
                  color: "var(--blue)", fontSize: 12, fontWeight: 500,
                  padding: "5px 14px", borderRadius: 100,
                  marginBottom: 28, letterSpacing: "0.5px", textTransform: "uppercase",
                }}>
                  <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--blue)", display: "inline-block" }} />
                  Haïti &amp; Diaspora · Nightlife
                </div>

                <h1 style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(40px, 5vw, 80px)",
                  fontWeight: 800, lineHeight: 0.95,
                  letterSpacing: "-2px", marginBottom: 28,
                }}>
                  Kote{" "}
                  <em style={{ fontStyle: "normal", color: "var(--blue)", display: "block" }}>
                    chill la ye?
                  </em>
                </h1>

                <p style={{
                  color: "var(--text-sec)", fontSize: 17, fontWeight: 300,
                  maxWidth: 480, marginBottom: 40, lineHeight: 1.7,
                }}>
                  Découvre les meilleurs événements haïtiens près de toi.
                  Concerts, soirées, festivals — ne rate plus rien.
                </p>

                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <Link href="/events" style={{
                    background: "var(--blue)", color: "var(--black)",
                    padding: "14px 32px", borderRadius: 100,
                    fontWeight: 500, fontSize: 15, textDecoration: "none",
                  }}>
                    Explorer les événements
                  </Link>
                  <Link href="/trending" style={{
                    background: "transparent", color: "var(--white)",
                    padding: "14px 32px", borderRadius: 100,
                    fontWeight: 400, fontSize: 15, textDecoration: "none",
                    border: "1px solid rgba(255,255,255,0.2)",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <TrendingUp size={16} /> Voir le trending
                  </Link>
                </div>

                {/* Stats */}
                <div style={{
                  display: "flex", gap: 48, marginTop: 64, paddingTop: 32,
                  borderTop: "1px solid rgba(255,255,255,0.07)",
                  flexWrap: "wrap",
                }}>
                  {[
                    { val: "200+", label: "Événements" },
                    { val: "12k", label: "Utilisateurs" },
                    { val: "30+", label: "Villes" },
                  ].map((s) => (
                    <div key={s.label}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 700 }}>{s.val}</div>
                      <div style={{ fontSize: 12, color: "var(--text-sec)", textTransform: "uppercase", letterSpacing: "0.8px", marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — visual */}
              <div className="hero-visual" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {events.slice(0, 3).map((e, i) => (
                  <Link key={e.id} href={`/events/${e.id}`} style={{ textDecoration: "none" }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 14,
                      background: i === 0 ? "rgba(107,138,255,0.1)" : "var(--surface)",
                      border: i === 0 ? "1px solid rgba(107,138,255,0.25)" : "1px solid rgba(255,255,255,0.05)",
                      borderRadius: 16, padding: "14px 18px",
                      opacity: 1 - i * 0.15,
                    }}>
                      {e.flyerUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={e.flyerUrl} alt={e.title} style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 48, height: 48, borderRadius: 10, background: "rgba(107,138,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <TrendingUp size={20} color="var(--blue)" />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: "var(--white)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</div>
                        <div style={{ fontSize: 12, color: "var(--text-sec)", marginTop: 2 }}>{e.city ?? ""}{e.date ? ` · ${new Date(e.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}` : ""}</div>
                      </div>
                      {i === 0 && <div style={{ fontSize: 11, color: "var(--blue)", fontWeight: 600, flexShrink: 0 }}>HOT</div>}
                    </div>
                  </Link>
                ))}
                {events.length === 0 && (
                  <div style={{ background: "var(--surface)", borderRadius: 20, padding: 40, textAlign: "center", color: "var(--text-sec)", fontSize: 14 }}>
                    Chargement des événements...
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ===== EVENTS SECTION ===== */}
        <section style={{ padding: "80px var(--page-px, 32px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={CONTAINER}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36, flexWrap: "wrap", gap: 12 }}>
              <div>
                <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "var(--blue)", fontWeight: 500, marginBottom: 8 }}>
                  À ne pas manquer
                </p>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 3vw, 40px)", fontWeight: 700, letterSpacing: "-1px" }}>
                  Événements récents
                </h2>
              </div>
              <Link href="/events" style={{ fontSize: 13, color: "var(--blue)", textDecoration: "none", whiteSpace: "nowrap" }}>
                Tout voir →
              </Link>
            </div>

            {events.length === 0 ? (
              <p style={{ color: "var(--text-sec)", fontSize: 14 }}>Aucun événement pour le moment.</p>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 20,
              }}>
                {events.map((e) => <EventCard key={e.id} event={e} />)}
              </div>
            )}
          </div>
        </section>

        {/* ===== TRENDING PREVIEW ===== */}
        {trending.length > 0 && (
          <section style={{ padding: "80px var(--page-px, 32px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={CONTAINER}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "var(--blue)", fontWeight: 500, marginBottom: 8 }}>
                    Score viral
                  </p>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(24px, 3vw, 40px)", fontWeight: 700, letterSpacing: "-1px", display: "flex", alignItems: "center", gap: 12 }}>
                    <TrendingUp size={32} color="var(--blue)" /> Trending cette semaine
                  </h2>
                </div>
                <Link href="/trending" style={{ fontSize: 13, color: "var(--blue)", textDecoration: "none", whiteSpace: "nowrap" }}>
                  Classement complet →
                </Link>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 800 }}>
                {trending.slice(0, 3).map((e, i) => {
                  const maxScore = trending[0]?.viralScore ?? 1;
                  const score = e.viralScore ?? 0;
                  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
                  return (
                    <Link key={e.id} href={`/events/${e.id}`} style={{ textDecoration: "none" }}>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 16,
                        background: "var(--surface)", borderRadius: 14, padding: "16px 20px",
                        border: "1px solid rgba(255,255,255,0.04)",
                      }}>
                        <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, color: i < 2 ? "var(--blue)" : "rgba(255,255,255,0.12)", minWidth: 36 }}>{i + 1}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: "var(--white)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</div>
                          <div style={{ fontSize: 12, color: "var(--text-sec)" }}>{e.city}</div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                          <div style={{ width: 80, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2 }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: "var(--blue)", borderRadius: 2 }} />
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-sec)" }}>{score} pts</div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ===== FEATURES ===== */}
        <section style={{ padding: "80px var(--page-px, 32px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={CONTAINER}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 64, alignItems: "start" }} className="features-grid">
              <div>
                <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "var(--blue)", fontWeight: 500, marginBottom: 16 }}>
                  Pourquoi Tèt Weekend
                </p>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 3vw, 44px)", fontWeight: 700, letterSpacing: "-1px", lineHeight: 1.1 }}>
                  Tout ce qu&apos;il faut pour ta prochaine soirée
                </h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2 }}>
                {[
                  { icon: <Zap size={18} />, title: "Trending en temps réel", desc: "Notre algorithme viral détecte les événements qui buzz dans ta ville avant tout le monde." },
                  { icon: <MapPin size={18} />, title: "Découverte locale", desc: "Soirées, concerts, festivals — filtrés par ville, date et catégorie pour la diaspora haïtienne." },
                  { icon: <Ticket size={18} />, title: "Billets intégrés", desc: "Achète tes billets directement dans l'app. Pas de redirections, pas de complications." },
                ].map((f) => (
                  <div key={f.title} style={{ background: "var(--surface)", padding: "28px 24px" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(107,138,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, color: "var(--blue)" }}>{f.icon}</div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, marginBottom: 10, letterSpacing: "-0.3px" }}>{f.title}</div>
                    <div style={{ fontSize: 14, color: "var(--text-sec)", lineHeight: 1.65 }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== APP SECTION ===== */}
        <section style={{
          padding: "80px var(--page-px, 32px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(107,138,255,0.06) 0%, transparent 70%)",
        }}>
          <div style={CONTAINER}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 64, alignItems: "center" }} className="app-grid-inner">
              <div>
                <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "var(--blue)", fontWeight: 500, marginBottom: 16 }}>
                  Application mobile
                </p>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 3.5vw, 52px)", fontWeight: 800, letterSpacing: "-2px", marginBottom: 16, lineHeight: 1.05 }}>
                  L&apos;app TètWeekend,<br />
                  <span style={{ color: "var(--blue)" }}>toujours avec toi</span>
                </h2>
                <p style={{ color: "var(--text-sec)", fontSize: 16, maxWidth: 480, lineHeight: 1.7, marginBottom: 36 }}>
                  Suis les événements en temps réel, retrouve tes amis, accède à tes billets — directement depuis ton téléphone.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
                  {[
                    { icon: <Bell size={16} />, text: "Notifications instantanées pour les événements près de toi" },
                    { icon: <Users size={16} />, text: "Vois quels amis participent aux soirées" },
                    { icon: <Ticket size={16} />, text: "Achète et gère tes billets en quelques secondes" },
                  ].map((item) => (
                    <div key={item.text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(107,138,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--blue)", flexShrink: 0 }}>
                        {item.icon}
                      </div>
                      <span style={{ fontSize: 14, color: "var(--text-sec)" }}>{item.text}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <a href="https://play.google.com/store/apps/details?id=com.haiti.tetweekend" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--blue)", color: "var(--black)", padding: "12px 24px", borderRadius: 12, fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
                    <Smartphone size={18} />
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.7, lineHeight: 1 }}>Disponible sur</div>
                      <div style={{ fontWeight: 700, lineHeight: 1.2 }}>Google Play</div>
                    </div>
                  </a>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface2)", color: "var(--text-sec)", padding: "12px 24px", borderRadius: 12, fontSize: 14, border: "1px solid rgba(255,255,255,0.07)" }}>
                    <Smartphone size={18} />
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 400, lineHeight: 1 }}>Bientôt sur</div>
                      <div style={{ fontWeight: 600, lineHeight: 1.2, color: "var(--white)" }}>App Store</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phone visual */}
              <div className="app-phone" style={{ width: 200, height: 360, background: "var(--surface)", borderRadius: 32, border: "1px solid rgba(107,138,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 80px rgba(107,138,255,0.12)" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(107,138,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "var(--blue)" }}>
                    <Smartphone size={30} />
                  </div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: "var(--white)" }}>TètWeekend</div>
                  <div style={{ fontSize: 11, color: "var(--text-sec)", marginTop: 4 }}>v2.0</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section style={{ padding: "100px var(--page-px, 32px)", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ ...CONTAINER, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(32px, 4vw, 60px)", fontWeight: 800, letterSpacing: "-2px", marginBottom: 20, maxWidth: 700 }}>
              Prêt à trouver <span style={{ color: "var(--blue)" }}>ta prochaine fèt?</span>
            </h2>
            <p style={{ color: "var(--text-sec)", fontSize: 17, marginBottom: 40, maxWidth: 500 }}>
              Rejoins des milliers d&apos;Haïtiens de la diaspora qui ne ratent plus rien.
            </p>
            <Link href="/events" style={{ background: "var(--blue)", color: "var(--black)", padding: "16px 48px", borderRadius: 100, fontWeight: 500, fontSize: 16, textDecoration: "none" }}>
              Voir tous les événements →
            </Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
