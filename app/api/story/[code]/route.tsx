import { ImageResponse } from "next/og";
import { chargerAnnuaire } from "@/lib/listing/data";
import { dateCarte, lieuCarte, taillePolice, typeImageOk } from "@/lib/listing/carte-story";
import { codeCourt, estCodeCourt } from "@/lib/listing/lien-court";

export const revalidate = 3600;

const MAX_OCTETS = 4_000_000;
const ENTETES = { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" };

/** Flyer en data URL (PNG/JPEG, 4 Mo max) ; null si absent, trop lourd, lent ou d'un autre format. */
async function flyerEnDonnees(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!r.ok || !typeImageOk(r.headers.get("content-type"))) return null;
    const buf = await r.arrayBuffer();
    if (buf.byteLength === 0 || buf.byteLength > MAX_OCTETS) return null;
    const type = (r.headers.get("content-type") ?? "image/jpeg").split(";")[0].trim();
    return `data:${type};base64,${Buffer.from(buf).toString("base64")}`;
  } catch {
    return null;
  }
}

/** Carte verticale 1080×1920 pour une story Instagram ou un statut WhatsApp : flyer, date, « I'm in », lien. */
export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code: brut } = await params;
  const code = brut.toLowerCase();
  if (!estCodeCourt(code)) return new Response("Not found", { status: 404 });
  const charge = await chargerAnnuaire();
  if (!charge.ok) return new Response("Unavailable", { status: 503 });
  const e = charge.annuaire.evenements.find((x) => codeCourt(x.id) === code);
  if (!e) return new Response("Not found", { status: 404 });

  const flyer = await flyerEnDonnees(e.flyer ? e.flyer.cardUrl || e.flyer.publicUrl : null);
  const { jour, heure } = dateCarte(e.date_debut, e.fuseau);
  const lieu = lieuCarte(e.lieu?.nom, e.ville);

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1920,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          background: "#191410",
          backgroundImage: "radial-gradient(ellipse 120% 40% at 50% 38%, rgba(166,52,70,0.6), rgba(25,20,16,0))",
          color: "#FFF7EF",
          fontWeight: 700,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginTop: 270 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: "#A63446", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, fontWeight: 800 }}>T</div>
          <div style={{ marginLeft: 20, fontSize: 46, fontWeight: 800 }}>Tèt Weekend</div>
        </div>

        <div
          style={{
            marginTop: 60,
            width: 667,
            height: 890,
            display: "flex",
            transform: "rotate(-2.5deg)",
            borderRadius: 36,
            overflow: "hidden",
            boxShadow: "0 60px 120px rgba(0,0,0,0.6)",
            background: "linear-gradient(165deg, #3b0f1c 0%, #A63446 55%, #f08a3c 100%)",
          }}
        >
          {flyer ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={flyer} alt="" width={667} height={890} style={{ width: 667, height: 890, objectFit: "cover" }} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 48, width: 667, height: 890 }}>
              <div style={{ fontSize: taillePolice(e.titre), fontWeight: 800, lineHeight: 1, textTransform: "uppercase" }}>{e.titre}</div>
            </div>
          )}
        </div>

        <div
          style={{
            position: "absolute",
            top: 1140,
            left: 96,
            display: "flex",
            alignItems: "center",
            transform: "rotate(-4deg)",
            background: "#FFF7EF",
            color: "#191410",
            padding: "26px 44px 26px 32px",
            borderRadius: 999,
            boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
          }}
        >
          <svg width="60" height="60" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="12" fill="#1f9d55" />
            <path d="M7 12.5l3.2 3.2L17 8.8" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <div style={{ marginLeft: 20, fontSize: 64, fontWeight: 800 }}>I&apos;m in</div>
        </div>

        <div style={{ position: "absolute", top: 1345, left: 60, right: 60, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ fontSize: 84, fontWeight: 800, letterSpacing: 1 }}>{`${jour} · ${heure}`}</div>
          {lieu ? <div style={{ marginTop: 14, fontSize: 40, color: "#F1C9B8", fontWeight: 600 }}>{lieu}</div> : null}
        </div>

        <div style={{ position: "absolute", bottom: 390, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", background: "#A63446", padding: "26px 52px", borderRadius: 999, fontSize: 44, fontWeight: 800 }}>{`tetweekend.com/e/${code}`}</div>
          <div style={{ marginTop: 26, fontSize: 32, color: "#E8B9A8", letterSpacing: 4, textTransform: "uppercase", fontWeight: 700 }}>Where the party at?</div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920, headers: ENTETES },
  );
}
