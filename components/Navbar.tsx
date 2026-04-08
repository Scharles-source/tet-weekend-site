"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { TrendingUp, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close menu on route change
  useEffect(() => { setOpen(false); }, [pathname]);

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
            <NavLink href="/events" active={pathname.startsWith("/events")}>Événements</NavLink>
            <NavLink href="/trending" active={pathname.startsWith("/trending")}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <TrendingUp size={14} /> Trending
              </span>
            </NavLink>
            <Link href="/events" style={{
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
            onClick={() => setOpen((v) => !v)}
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
          <MobileLink href="/" active={pathname === "/"} onClick={() => setOpen(false)}>Accueil</MobileLink>
          <MobileLink href="/events" active={pathname.startsWith("/events")} onClick={() => setOpen(false)}>Événements</MobileLink>
          <MobileLink href="/trending" active={pathname.startsWith("/trending")} onClick={() => setOpen(false)}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <TrendingUp size={15} /> Trending
            </span>
          </MobileLink>
          <Link
            href="/events"
            onClick={() => setOpen(false)}
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
