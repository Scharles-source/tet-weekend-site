import { NextResponse } from "next/server";

const PROJECT_ID = "tetweekend-b7f17";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone } = body as { name: string; email: string; phone?: string };

    if (!name || !email) {
      return NextResponse.json({ error: "Nom et email requis" }, { status: 400 });
    }

    // Check email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const doc = {
      fields: {
        name: { stringValue: name },
        email: { stringValue: email },
        phone: { stringValue: phone ?? "" },
        createdAt: { timestampValue: new Date().toISOString() },
        source: { stringValue: "website" },
      },
    };

    const res = await fetch(`${FIRESTORE_BASE}/beta_testers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(doc),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Firestore write error:", err);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Beta route error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
