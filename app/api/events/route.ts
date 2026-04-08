import { NextResponse } from "next/server";

const PROJECT_ID = "tetweekend-b7f17";
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;

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

interface EventDoc {
  id: string | undefined;
  title: string;
  description: string;
  date: string;
  city: string;
  venue: string;
  price: unknown;
  flyerUrl: string;
  videoUrl: string;
  mediaStack: unknown[];
  category: string;
  interestedCount: number;
  viewsCount: number;
  goingCount: number;
  isFeatured: boolean;
  isRecurring: boolean;
  recurringLabel: string;
  viralScore: number;
  status: string;
}

async function queryEvents(limitCount: number, orderField = "date", extraFilter?: object): Promise<EventDoc[]> {
  const whereClause = extraFilter ?? {
    fieldFilter: {
      field: { fieldPath: "status" },
      op: "EQUAL",
      value: { stringValue: "ACTIVE" },
    },
  };

  const body = {
    structuredQuery: {
      from: [{ collectionId: "events" }],
      where: whereClause,
      orderBy: [{ field: { fieldPath: orderField }, direction: "DESCENDING" }],
      limit: limitCount,
    },
  };

  const res = await fetch(FIRESTORE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Firestore REST error:", err);
    return [];
  }

  const rows = await res.json();
  return rows
    .filter((r: { document?: { name: string; fields: Record<string, FirestoreValue> } }) => r.document)
    .map((r: { document: { name: string; fields: Record<string, FirestoreValue> } }) => {
      const d = r.document.fields;
      const id = r.document.name.split("/").pop();
      const raw: Record<string, unknown> = { id };
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
        mediaStack: Array.isArray(raw.mediaStack) ? raw.mediaStack : [],
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
    });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "recent";
  const limit = parseInt(searchParams.get("limit") ?? "8");

  try {
    let events = await queryEvents(50);

    switch (type) {
      case "trending":
        events = events
          .sort((a, b) => ((b.viewsCount??0)*2 + (b.interestedCount??0)*1.5 + (b.goingCount??0)) - ((a.viewsCount??0)*2 + (a.interestedCount??0)*1.5 + (a.goingCount??0)))
          .slice(0, limit);
        break;
      case "viewed":
        events = events.sort((a, b) => (b.viewsCount??0) - (a.viewsCount??0)).slice(0, limit);
        break;
      case "liked":
        events = events.sort((a, b) => (b.interestedCount??0) - (a.interestedCount??0)).slice(0, limit);
        break;
      case "weekend": {
        const now = new Date();
        const day = now.getDay();
        const daysUntilSat = day === 0 ? 6 : (6 - day);
        const saturday = new Date(now);
        saturday.setDate(now.getDate() + daysUntilSat);
        saturday.setHours(0,0,0,0);
        const sunday = new Date(saturday);
        sunday.setDate(saturday.getDate() + 1);
        sunday.setHours(23,59,59,999);
        events = events.filter(e => {
          if (!e.date) return false;
          const d = new Date(e.date);
          return d >= saturday && d <= sunday;
        }).slice(0, limit);
        break;
      }
      default:
        events = events.sort((a, b) => {
          if (!a.date) return 1;
          if (!b.date) return -1;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }).slice(0, limit);
    }

    return NextResponse.json(events, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (e) {
    console.error("API events error:", e);
    return NextResponse.json([], { status: 500 });
  }
}
