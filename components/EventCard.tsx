"use client";
import Link from "next/link";
import { CalendarDays, MapPin, Flame, RefreshCw } from "lucide-react";
import { Event } from "@/lib/types";
import { formatPrice, formatEventDate, getEventThumbnail } from "@/lib/utils";

const GRADIENT_FALLBACKS = [
  "linear-gradient(135deg, #1a0a2e, #4a1060)",
  "linear-gradient(135deg, #0a1a2e, #0a4060)",
  "linear-gradient(135deg, #1a0a0a, #600a10)",
  "linear-gradient(135deg, #0a2a1a, #0a6030)",
  "linear-gradient(135deg, #1a1a0a, #4a4010)",
];

function getGradient(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return GRADIENT_FALLBACKS[Math.abs(hash) % GRADIENT_FALLBACKS.length];
}

export default function EventCard({ event }: { event: Event }) {
  const thumb = getEventThumbnail(event.mediaStack, event.flyerUrl);
  const isHot = (event.viralScore ?? 0) > 60;

  return (
    <Link href={`/events/${event.id}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          background: "var(--surface)",
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.05)",
          cursor: "pointer",
          transition: "transform 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
      >
        {/* Image / Flyer */}
        <div
          style={{
            height: 160,
            position: "relative",
            background: thumb ? undefined : getGradient(event.id),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt={event.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ opacity: 0.3 }}>
              <CalendarDays size={40} color="var(--white)" />
            </div>
          )}

          {/* Badges */}
          <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6 }}>
            {isHot && (
              <span
                style={{
                  background: "rgba(10,10,12,0.85)",
                  backdropFilter: "blur(6px)",
                  fontSize: 10,
                  padding: "3px 9px",
                  borderRadius: 100,
                  color: "#ff6b6b",
                  border: "1px solid rgba(255,107,107,0.3)",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Flame size={10} /> Hot
              </span>
            )}
            {event.isRecurring && (
              <span
                style={{
                  background: "rgba(10,10,12,0.85)",
                  backdropFilter: "blur(6px)",
                  fontSize: 10,
                  padding: "3px 9px",
                  borderRadius: 100,
                  color: "var(--blue)",
                  border: "1px solid rgba(107,138,255,0.3)",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <RefreshCw size={10} /> {event.recurringLabel ?? "Récurrent"}
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "14px 16px 0" }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "-0.3px",
              marginBottom: 6,
              color: "var(--white)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {event.title}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-sec)",
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            {event.date && (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <CalendarDays size={11} /> {formatEventDate(event.date)}
              </span>
            )}
            {event.city && (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={11} /> {event.city}
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "10px 16px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            marginTop: 12,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--blue)" }}>
            {formatPrice(event.price)}
          </span>
          {(event.interestedCount ?? 0) > 0 && (
            <span style={{ fontSize: 11, color: "var(--text-sec)" }}>
              {event.interestedCount} intéressés
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
