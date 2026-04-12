"use client";
import { useEffect, useState, useRef } from "react";
import {
  X, MapPin, Phone, Clock, Flame, Car, Star, ChevronRight,
  Instagram, UtensilsCrossed,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────── */
export interface MenuItem {
  name: string;
  price: string;
  desc?: string;
}
export interface MenuSection {
  title: string;
  items: MenuItem[];
}
export interface VenueData {
  id: string;
  name: string;
  shortName: string;
  logo: string;           // path dans /public
  category: string;       // ex: "Bar · Lounge · Nightlife"
  address: string;
  phone?: string;
  instagram?: string;
  hours: { day: string; time: string }[];
  ambiance: string[];     // tags ex: ["DJ", "Cocktails", "Cigars"]
  parking: string;
  menu: MenuSection[];
  description: string;
  coverColor: string;     // couleur du bandeau top
}

interface Props {
  venue: VenueData;
  onClose: () => void;
}

/* ─── Étoile review ─────────────────────────────────────── */
function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: 2,
            color: n <= (hover || value) ? "#FFD700" : "rgba(255,255,255,0.2)",
            transition: "color .15s",
          }}
        >
          <Star size={22} fill={n <= (hover || value) ? "#FFD700" : "none"} />
        </button>
      ))}
    </div>
  );
}

/* ─── Composant principal ───────────────────────────────── */
export default function VenueSheet({ venue, onClose }: Props) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [visible, setVisible] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Animate in
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // Close with animation
  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 320);
  };

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleClose();
  };

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleSubmitReview = () => {
    if (rating === 0) return;
    setSubmitted(true);
  };

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: `rgba(0,0,0,${visible ? 0.7 : 0})`,
        transition: "background .32s ease",
        display: "flex", alignItems: "flex-end",
      }}
    >
      <div
        ref={sheetRef}
        style={{
          width: "100%",
          maxHeight: "92vh",
          background: "var(--surface, #111)",
          borderRadius: "24px 24px 0 0",
          overflowY: "auto",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform .32s cubic-bezier(.32,1,.32,1)",
          maxWidth: 640,
          margin: "0 auto",
        }}
      >
        {/* ── Bandeau couleur + logo ── */}
        <div style={{
          position: "relative",
          height: 160,
          background: `linear-gradient(135deg, ${venue.coverColor} 0%, rgba(0,0,0,0.4) 100%)`,
          borderRadius: "24px 24px 0 0",
          overflow: "hidden",
        }}>
          {/* Motif overlay */}
          <div style={{
            position: "absolute", inset: 0, opacity: 0.05,
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }} />

          {/* Bouton fermer */}
          <button
            onClick={handleClose}
            style={{
              position: "absolute", top: 16, right: 16,
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(0,0,0,0.4)", border: "none",
              color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>

          {/* Handle bar */}
          <div style={{
            position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
            width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.3)",
          }} />

          {/* Logo centré */}
          <div style={{
            position: "absolute", bottom: -32, left: 24,
            width: 72, height: 72, borderRadius: "50%",
            border: "3px solid var(--surface, #111)",
            overflow: "hidden", background: "#000",
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={venue.logo} alt={venue.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </div>

        {/* ── Contenu ── */}
        <div style={{ padding: "44px 24px 32px" }}>

          {/* Nom + catégorie */}
          <div style={{ marginBottom: 4 }}>
            <h2 style={{
              fontFamily: "var(--font-display, sans-serif)",
              fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px",
              color: "var(--white, #fff)", margin: 0,
            }}>
              {venue.name}
            </h2>
            <p style={{ fontSize: 12, color: "var(--blue, #6B8AFF)", fontWeight: 500, margin: "4px 0 0", textTransform: "uppercase", letterSpacing: 1 }}>
              {venue.category}
            </p>
          </div>

          {/* Description */}
          <p style={{ fontSize: 14, color: "var(--text-sec, #999)", lineHeight: 1.65, margin: "12px 0 20px" }}>
            {venue.description}
          </p>

          {/* Tags ambiance */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
            {venue.ambiance.map((tag) => (
              <span key={tag} style={{
                background: "rgba(107,138,255,0.12)", color: "var(--blue, #6B8AFF)",
                border: "1px solid rgba(107,138,255,0.25)",
                fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 100,
              }}>
                {tag}
              </span>
            ))}
          </div>

          {/* ── Infos pratiques ── */}
          <div style={{
            background: "rgba(255,255,255,0.04)", borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.06)",
            overflow: "hidden", marginBottom: 24,
          }}>
            <InfoRow icon={<MapPin size={16} />} label="Adresse" value={venue.address} />
            {venue.phone && <InfoRow icon={<Phone size={16} />} label="Téléphone" value={venue.phone} divider />}
            <InfoRow icon={<Car size={16} />} label="Parking" value={venue.parking} divider />
            {venue.instagram && (
              <InfoRow
                icon={<Instagram size={16} />}
                label="Instagram"
                value={`@${venue.instagram}`}
                divider
                link={`https://instagram.com/${venue.instagram}`}
              />
            )}
          </div>

          {/* ── Horaires ── */}
          <SectionTitle icon={<Clock size={16} />} title="Horaires" />
          <div style={{
            background: "rgba(255,255,255,0.04)", borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.06)",
            overflow: "hidden", marginBottom: 24,
          }}>
            {venue.hours.map((h, i) => (
              <div key={h.day} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 18px",
                borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
              }}>
                <span style={{ fontSize: 14, color: "var(--text-sec, #999)" }}>{h.day}</span>
                <span style={{
                  fontSize: 13, fontWeight: 600,
                  color: h.time === "Fermé" ? "rgba(255,255,255,0.25)" : "var(--white, #fff)",
                }}>
                  {h.time}
                </span>
              </div>
            ))}
          </div>

          {/* ── Menu ── */}
          <SectionTitle icon={<UtensilsCrossed size={16} />} title="Menu & Prix" />
          <div style={{ marginBottom: 24 }}>
            {venue.menu.map((section) => (
              <div key={section.title} style={{ marginBottom: 16 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
                  textTransform: "uppercase", color: "var(--blue, #6B8AFF)",
                  marginBottom: 10, paddingLeft: 4,
                }}>
                  {section.title}
                </div>
                <div style={{
                  background: "rgba(255,255,255,0.04)", borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden",
                }}>
                  {section.items.map((item, i) => (
                    <div key={item.name} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "13px 18px",
                      borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
                      gap: 12,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--white, #fff)" }}>{item.name}</div>
                        {item.desc && <div style={{ fontSize: 12, color: "var(--text-sec, #999)", marginTop: 2 }}>{item.desc}</div>}
                      </div>
                      <div style={{
                        fontSize: 14, fontWeight: 700,
                        color: "var(--blue, #6B8AFF)", flexShrink: 0,
                        background: "rgba(107,138,255,0.1)",
                        padding: "3px 10px", borderRadius: 8,
                      }}>
                        {item.price}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── Reviews ── */}
          <SectionTitle icon={<Star size={16} />} title="Donner un avis" />
          <div style={{
            background: "rgba(255,255,255,0.04)", borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.06)",
            padding: "20px 18px", marginBottom: 32,
          }}>
            {submitted ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🙌</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--white, #fff)" }}>Merci pour ton avis !</div>
                <div style={{ fontSize: 13, color: "var(--text-sec, #999)", marginTop: 4 }}>Ton retour aide la communauté.</div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 13, color: "var(--text-sec, #999)", marginBottom: 10 }}>
                    Note ton expérience à Gecko :
                  </p>
                  <StarRating value={rating} onChange={setRating} />
                </div>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Raconte ton expérience (optionnel)..."
                  rows={3}
                  style={{
                    width: "100%", background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10, color: "var(--white, #fff)",
                    fontSize: 14, padding: "10px 14px", resize: "none",
                    fontFamily: "inherit", outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  onClick={handleSubmitReview}
                  disabled={rating === 0}
                  style={{
                    marginTop: 12, width: "100%",
                    background: rating > 0 ? "var(--blue, #6B8AFF)" : "rgba(255,255,255,0.08)",
                    color: rating > 0 ? "var(--black, #000)" : "rgba(255,255,255,0.3)",
                    border: "none", borderRadius: 10, padding: "12px",
                    fontSize: 14, fontWeight: 700, cursor: rating > 0 ? "pointer" : "not-allowed",
                    transition: "all .2s",
                  }}
                >
                  Envoyer mon avis
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────── */
function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      marginBottom: 12, color: "var(--white, #fff)",
    }}>
      <span style={{ color: "var(--blue, #6B8AFF)" }}>{icon}</span>
      <span style={{ fontFamily: "var(--font-display, sans-serif)", fontSize: 16, fontWeight: 700 }}>{title}</span>
    </div>
  );
}

function InfoRow({
  icon, label, value, divider, link,
}: {
  icon: React.ReactNode; label: string; value: string;
  divider?: boolean; link?: string;
}) {
  const content = (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "14px 18px",
      borderTop: divider ? "1px solid rgba(255,255,255,0.05)" : "none",
    }}>
      <span style={{ color: "var(--blue, #6B8AFF)", flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: "var(--text-sec, #999)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 14, color: "var(--white, #fff)", fontWeight: 500 }}>{value}</div>
      </div>
      {link && <ChevronRight size={14} color="rgba(255,255,255,0.3)" />}
    </div>
  );

  if (link) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block" }}>
        {content}
      </a>
    );
  }
  return content;
}
