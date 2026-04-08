import Link from "next/link";
import { Music2 } from "lucide-react";
import { Event } from "@/lib/types";
import { formatPrice, formatEventDate } from "@/lib/utils";

export default function TrendingRow({
  event,
  rank,
  maxScore,
}: {
  event: Event;
  rank: number;
  maxScore: number;
}) {
  const score = event.viralScore ?? 0;
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const isTop = rank <= 2;

  return (
    <Link href={`/events/${event.id}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          background: "var(--surface)",
          borderRadius: 14,
          padding: "14px 16px",
          cursor: "pointer",
          transition: "background 0.2s",
          border: "1px solid rgba(255,255,255,0.04)",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface2)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface)")}
      >
        {/* Rank */}
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 800,
            color: isTop ? "var(--blue)" : "rgba(255,255,255,0.1)",
            minWidth: 32,
            letterSpacing: "-1px",
          }}
        >
          {rank}
        </div>

        {/* Icon */}
        <div style={{ color: "var(--text-sec)", opacity: 0.6 }}>
          <Music2 size={22} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "-0.3px",
              marginBottom: 3,
              color: "var(--white)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {event.title}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-sec)" }}>
            {[event.city, event.date ? formatEventDate(event.date) : null, formatPrice(event.price)]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>

        {/* Score bar */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <div
            style={{
              width: 60,
              height: 4,
              background: "rgba(255,255,255,0.08)",
              borderRadius: 2,
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: "100%",
                background: "var(--blue)",
                borderRadius: 2,
              }}
            />
          </div>
          <div style={{ fontSize: 10, color: "var(--text-sec)" }}>{score} pts</div>
        </div>
      </div>
    </Link>
  );
}
