import Image from "next/image";

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "40px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
      }}
    >
      <div>
        <div style={{ marginBottom: 6 }}>
          <Image
            src="/logotetweekend.png"
            alt="Tèt Weekend"
            width={120}
            height={34}
            style={{ objectFit: "contain", height: 34, width: "auto" }}
          />
        </div>
        <div style={{ fontSize: 12, color: "var(--text-sec)" }}>
          La référence des événements haïtiens &amp; diaspora.
        </div>
      </div>

      <div style={{ fontSize: 12, color: "var(--text-sec)" }}>
        © {new Date().getFullYear()} Tèt Weekend. Tous droits réservés.
      </div>
    </footer>
  );
}
