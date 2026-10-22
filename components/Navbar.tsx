"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [cheminOuvert, setCheminOuvert] = useState<string | null>(null);
  const open = cheminOuvert === pathname;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Le menu se ferme tout seul quand la route change : il n'est ouvert que pour le chemin courant.

  return (
    <>
      <nav style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px var(--page-px, 32px)",
        background: "rgba(10,10,12,0.88)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(107,138,255,0.12)",
      }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <Image
            src="/logotetweekend.png"
            alt="Tèt Weekend"
            width={140}
            height={40}
            style={{ objectFit: "contain", height: 38, width: "auto" }}
            priority
          />
        </Link>

        {/* Desktop links */}
        {!isMobile && (
          <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
            <NavLink href="/" active={pathname === "/"}>Accueil</NavLink>
            <NavLink href="/evenements" active={pathname.startsWith("/evenements")}>Événements</NavLink>
            <NavLink href="/lieux" active={pathname.startsWith("/lieux")}>Lieux</NavLink>
            <NavLink href="/artistes" active={pathname.startsWith("/artistes")}>Artistes</NavLink>
            <Link href="/evenements" style={{
              background: "var(--blue)", color: "var(--black)",
              padding: "8px 20px", borderRadius: 100,
              fontWeight: 500, fontSize: 14, textDecoration: "none",
            }}>
              Explorer
            </Link>
          </div>
        )}

        {/* Mobile hamburger */}
        {isMobile && (
          <button
            onClick={() => setCheminOuvert(open ? null : pathname)}
            aria-label="Menu"
            style={{
              background: "none", border: "none", color: "var(--white)",
              cursor: "pointer", padding: 6, display: "flex",
              alignItems: "center", justifyContent: "center", borderRadius: 8,
            }}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        )}
      </nav>

      {/* Mobile dropdown menu */}
      {isMobile && open && (
        <div style={{
          position: "fixed",
          top: 65, left: 0, right: 0,
          background: "rgba(10,10,12,0.97)",
          backdropFilter: "blur(20px)",
          zIndex: 99,
          display: "flex",
          flexDirection: "column",
          borderBottom: "1px solid rgba(107,138,255,0.15)",
          paddingBottom: 16,
        }}>
          <MobileLink href="/" active={pathname === "/"} onClick={() => setCheminOuvert(null)}>Accueil</MobileLink>
          <MobileLink href="/evenements" active={pathname.startsWith("/evenements")} onClick={() => setCheminOuvert(null)}>Événements</MobileLink>
          <MobileLink href="/lieux" active={pathname.startsWith("/lieux")} onClick={() => setCheminOuvert(null)}>Lieux</MobileLink>
          <MobileLink href="/artistes" active={pathname.startsWith("/artistes")} onClick={() => setCheminOuvert(null)}>Artistes</MobileLink>
          <Link
            href="/evenements"
            onClick={() => setCheminOuvert(null)}
            style={{
              margin: "12px 20px 0",
              background: "var(--blue)", color: "var(--black)",
              padding: "13px 24px", borderRadius: 100,
              fontWeight: 600, fontSize: 15, textDecoration: "none",
              textAlign: "center",
            }}
          >
            Explorer →
          </Link>
        </div>
      )}
    </>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} style={{
      color: active ? "var(--white)" : "var(--text-sec)",
      textDecoration: "none", fontSize: 14, fontWeight: 400, transition: "color 0.2s",
    }}>
      {children}
    </Link>
  );
}

function MobileLink({ href, active, onClick, children }: { href: string; active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={onClick} style={{
      display: "block",
      padding: "15px 24px",
      color: active ? "var(--white)" : "var(--text-sec)",
      textDecoration: "none",
      fontSize: 16,
      borderBottom: "1px solid rgba(255,255,255,0.04)",
      fontWeight: active ? 500 : 400,
    }}>
      {children}
    </Link>
  );
}
