"use client";
import { useState } from "react";
import { Smartphone, X } from "lucide-react";

export default function BetaModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/beta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone }),
      });
      const data = await res.json();
      if (data.success) setDone(true);
      else setError(data.error ?? "Une erreur s'est produite.");
    } catch {
      setError("Erreur de connexion. Réessaie.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
    }} onClick={onClose}>
      <div style={{
        background: "var(--surface)", borderRadius: 24,
        padding: "36px 32px", maxWidth: 440, width: "100%",
        border: "1px solid rgba(107,138,255,0.25)",
        position: "relative",
      }} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16,
          background: "transparent", border: "none", cursor: "pointer",
          color: "var(--text-sec)", padding: 4,
        }}>
          <X size={20} />
        </button>

        {done ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
              Tu es sur la liste !
            </h3>
            <p style={{ color: "var(--text-sec)", fontSize: 14, lineHeight: 1.7 }}>
              On t&apos;envoie l&apos;accès beta dès que l&apos;app est prête. Reste à l&apos;écoute 🔥
            </p>
            <button onClick={onClose} style={{
              marginTop: 24, background: "var(--blue)", color: "var(--black)",
              padding: "12px 32px", borderRadius: 100, fontWeight: 600,
              fontSize: 14, border: "none", cursor: "pointer",
            }}>
              Fermer
            </button>
          </div>
        ) : (
          <>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: "rgba(107,138,255,0.12)", display: "flex",
              alignItems: "center", justifyContent: "center",
              marginBottom: 20, color: "var(--blue)",
            }}>
              <Smartphone size={24} />
            </div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
              Deviens testeur beta 🚀
            </h3>
            <p style={{ color: "var(--text-sec)", fontSize: 13, lineHeight: 1.7, marginBottom: 24 }}>
              Accès exclusif à l&apos;app avant tout le monde + billets VIP offerts aux premiers testeurs.
            </p>

            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                type="text"
                placeholder="Ton prénom / nom"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  background: "var(--surface2)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10, padding: "12px 16px", color: "var(--white)",
                  fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box",
                }}
              />
              <input
                type="email"
                placeholder="Ton adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  background: "var(--surface2)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10, padding: "12px 16px", color: "var(--white)",
                  fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box",
                }}
              />
              <input
                type="tel"
                placeholder="Numéro de téléphone (optionnel)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  background: "var(--surface2)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10, padding: "12px 16px", color: "var(--white)",
                  fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box",
                }}
              />
              {error && <p style={{ color: "#ff6b6b", fontSize: 13 }}>{error}</p>}
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: "var(--blue)", color: "var(--black)",
                  padding: "13px", borderRadius: 10, fontWeight: 700,
                  fontSize: 14, border: "none", cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1, marginTop: 4,
                }}
              >
                {loading ? "Envoi..." : "Je veux l'accès beta →"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
