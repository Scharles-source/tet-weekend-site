"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CalendarDays, MapPin, Building2, Users, Flame, Music } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Event } from "@/lib/types";
import {
  formatPrice,
  formatEventDate,
  getEventThumbnail,
  sanitizeFirestoreVideoUrl,
} from "@/lib/utils";

const PROJECT_ID = "tetweekend-b7f17";

interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  timestampValue?: string;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
  nullValue?: null;
}

function fromFirestore(value: FirestoreValue): unknown {
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined) return value.doubleValue;
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.timestampValue !== undefined) return value.timestampValue;
  if (value.nullValue !== undefined) return null;
  if (value.arrayValue?.values) return value.arrayValue.values.map(fromFirestore);
  if (value.mapValue?.fields) {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value.mapValue.fields)) obj[k] = fromFirestore(v);
    return obj;
  }
  return null;
}

async function fetchEvent(id: string): Promise<Event | null> {
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/events/${id}`
    );
    if (!res.ok) return null;
    const doc = await res.json();
    if (!doc.fields) return null;
    const d = doc.fields as Record<string, FirestoreValue>;
    const raw: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(d)) raw[k] = fromFirestore(v);
    return {
      id,
      title: raw.title as string ?? "Sans titre",
      description: raw.description as string,
      date: raw.date as string,
      city: raw.city as string,
      venue: raw.venue as string,
      price: raw.price,
      flyerUrl: raw.flyerUrl as string,
      videoUrl: raw.videoUrl as string,
      mediaStack: Array.isArray(raw.mediaStack) ? raw.mediaStack as Event["mediaStack"] : [],
      category: raw.category as string,
      interestedCount: typeof raw.interestedCount === "number" ? raw.interestedCount : 0,
      viewsCount: typeof raw.viewsCount === "number" ? raw.viewsCount : 0,
      goingCount: typeof raw.goingCount === "number" ? raw.goingCount : 0,
      isFeatured: !!raw.isFeatured,
      isRecurring: !!raw.isRecurring,
      recurringLabel: raw.recurringLabel as string,
      viralScore: typeof raw.viralScore === "number" ? raw.viralScore : 0,
      status: raw.status as string,
    };
  } catch {
    return null;
  }
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMedia, setActiveMedia] = useState(0);

  useEffect(() => {
    if (!id) return;
    fetchEvent(id).then((e) => {
      setEvent(e);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main style={{ paddingTop: 72 }}>
          <div style={{ maxWidth: 800, margin: "0 auto", padding: "80px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <p style={{ color: "var(--text-sec)" }}>Chargement...</p>
          </div>
        </main>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <Navbar />
        <main style={{ paddingTop: 72 }}>
          <div style={{ maxWidth: 800, margin: "0 auto", padding: "80px 32px", textAlign: "center" }}>
            <div style={{ marginBottom: 16, color: "var(--text-sec)", opacity: 0.4 }}><Music size={48} /></div>
            <p style={{ color: "var(--text-sec)", marginBottom: 24 }}>Événement introuvable.</p>
            <Link href="/events" style={{ color: "var(--blue)", textDecoration: "none", fontSize: 14 }}>
              ← Retour aux événements
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const media = event.mediaStack ?? [];
  const thumb = getEventThumbnail(media, event.flyerUrl);
  const videoUrl = sanitizeFirestoreVideoUrl(event.videoUrl);
  const currentMedia = media[activeMedia];

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 72 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px var(--page-px)" }}>

          {/* Back */}
          <Link href="/events" style={{
            color: "var(--text-sec)", textDecoration: "none", fontSize: 13,
            display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 32,
          }}>
            ← Tous les événements
          </Link>

          <div className="two-col-detail">

            {/* LEFT — Media + Info */}
            <div>
              {/* Media viewer */}
              <div style={{
                borderRadius: 20, overflow: "hidden",
                background: "var(--surface)", marginBottom: 16,
                aspectRatio: "16/9", position: "relative",
              }}>
                {currentMedia?.kind === "video" ? (
                  <video
                    src={sanitizeFirestoreVideoUrl(currentMedia.url) ?? ""}
                    controls
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (thumb || currentMedia?.url) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentMedia?.url ?? thumb ?? ""}
                    alt={event.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{
                    width: "100%", height: "100%",
                    background: "linear-gradient(135deg, #1a0a2e, #4a1060)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 72,
                  }}>
                    🎵
                  </div>
                )}

                {/* Viral badge */}
                {(event.viralScore ?? 0) > 50 && (
                  <div style={{
                    position: "absolute", top: 16, right: 16,
                    background: "rgba(10,10,12,0.85)", backdropFilter: "blur(8px)",
                    padding: "6px 14px", borderRadius: 100,
                    fontSize: 12, color: "#ff6b6b",
                    border: "1px solid rgba(255,107,107,0.3)", fontWeight: 500,
                  }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Flame size={11} /> {event.viralScore} pts</span>
                  </div>
                )}
              </div>

              {/* Media strip */}
              {media.length > 1 && (
                <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 32, scrollbarWidth: "none" }}>
                  {media.map((m, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveMedia(i)}
                      style={{
                        flexShrink: 0, width: 72, height: 48, borderRadius: 8,
                        overflow: "hidden", border: i === activeMedia
                          ? "2px solid var(--blue)"
                          : "2px solid transparent",
                        background: "var(--surface)", cursor: "pointer", padding: 0,
                      }}
                    >
                      {m.kind === "video" ? (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface2)", fontSize: 18 }}>▶</div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Title & meta */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                {event.category && (
                  <span style={{
                    background: "rgba(107,138,255,0.12)", color: "var(--blue)",
                    fontSize: 11, padding: "3px 12px", borderRadius: 100,
                    border: "1px solid rgba(107,138,255,0.25)",
                  }}>
                    {event.category}
                  </span>
                )}
                {event.isRecurring && (
                  <span style={{
                    background: "rgba(255,255,255,0.06)", color: "var(--text-sec)",
                    fontSize: 11, padding: "3px 12px", borderRadius: 100,
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}>
                    ↻ {event.recurringLabel ?? "Récurrent"}
                  </span>
                )}
              </div>

              <h1 style={{
                fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 44px)",
                fontWeight: 800, letterSpacing: "-1.5px", marginBottom: 20, lineHeight: 1.1,
              }}>
                {event.title}
              </h1>

              {event.description && (
                <p style={{ color: "var(--text-sec)", fontSize: 15, lineHeight: 1.8, marginBottom: 32 }}>
                  {event.description}
                </p>
              )}

              {videoUrl && !media.some((m) => m.kind === "video") && (
                <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 32 }}>
                  <video src={videoUrl} controls style={{ width: "100%", borderRadius: 16 }} />
                </div>
              )}

              {/* App CTA */}
              <div style={{
                background: "rgba(107,138,255,0.08)", border: "1px solid rgba(107,138,255,0.2)",
                borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
              }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                    🎟️ Obtiens ton billet sur l&apos;app
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-sec)" }}>
                    Télécharge TètWeekend pour acheter, gérer et partager tes billets.
                  </div>
                </div>
                <a
                  href="https://play.google.com/store/apps/details?id=com.haiti.tetweekend"
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    background: "var(--blue)", color: "var(--black)",
                    padding: "10px 20px", borderRadius: 10,
                    fontWeight: 600, fontSize: 13, textDecoration: "none", whiteSpace: "nowrap",
                  }}
                >
                  Google Play →
                </a>
              </div>
            </div>

            {/* RIGHT — Details card */}
            <div className="detail-sticky" style={{
              background: "var(--surface)", borderRadius: 20, padding: 28,
              border: "1px solid rgba(255,255,255,0.07)",
              position: "sticky", top: 96,
            }}>
              <div style={{
                fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800,
                color: "var(--blue)", marginBottom: 24,
              }}>
                {formatPrice(event.price)}
              </div>

              {/* Details list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
                {event.date && (
                  <DetailRow icon={<CalendarDays size={18} />} label="Date" value={formatEventDate(event.date)} />
                )}
                {event.city && (
                  <DetailRow icon={<MapPin size={18} />} label="Ville" value={event.city} />
                )}
                {event.venue && (
                  <DetailRow icon={<Building2 size={18} />} label="Lieu" value={event.venue} />
                )}
                {(event.interestedCount ?? 0) > 0 && (
                  <DetailRow icon={<Users size={18} />} label="Intéressés" value={`${event.interestedCount} personnes`} />
                )}
              </div>

              {/* CTA */}
              <a
                href="https://play.google.com/store/apps/details?id=com.haiti.tetweekend"
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: "block", textAlign: "center",
                  background: "var(--blue)", color: "var(--black)",
                  padding: "14px", borderRadius: 12,
                  fontWeight: 500, fontSize: 15, textDecoration: "none",
                  marginBottom: 12,
                }}
              >
                Obtenir mon billet →
              </a>
              <Link href="/events" style={{
                display: "block", textAlign: "center",
                color: "var(--text-sec)", fontSize: 13, textDecoration: "none",
              }}>
                ← Retour aux événements
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <span style={{ color: "var(--blue)", flexShrink: 0, marginTop: 2 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 11, color: "var(--text-sec)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}
