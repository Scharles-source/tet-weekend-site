import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  Timestamp,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import { Event, StackDoc } from "./types";

function safeString(val: unknown): string | undefined {
  if (typeof val === "string") return val;
  return undefined;
}

function toDateString(val: unknown): string | undefined {
  if (!val) return undefined;
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === "string") return val;
  return undefined;
}

export async function getEvents(limitCount = 20): Promise<Event[]> {
  try {
    const q = query(
      collection(db, "events"),
      where("status", "==", "ACTIVE"),
      orderBy("date", "desc"),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        title: safeString(d.title) ?? "Sans titre",
        description: safeString(d.description),
        date: toDateString(d.date),
        city: safeString(d.city),
        venue: safeString(d.venue),
        price: d.price,
        flyerUrl: safeString(d.flyerUrl),
        videoUrl: safeString(d.videoUrl),
        mediaStack: Array.isArray(d.mediaStack) ? d.mediaStack : [],
        category: safeString(d.category),
        interestedCount: typeof d.interestedCount === "number" ? d.interestedCount : 0,
        viewsCount: typeof d.viewsCount === "number" ? d.viewsCount : 0,
        goingCount: typeof d.goingCount === "number" ? d.goingCount : 0,
        isFeatured: !!d.isFeatured,
        isRecurring: !!d.isRecurring,
        recurringLabel: safeString(d.recurringLabel),
        viralScore: typeof d.viralScore === "number" ? d.viralScore : 0,
      };
    });
  } catch {
    return [];
  }
}

function mapEvent(doc: QueryDocumentSnapshot<DocumentData>): Event {
  const d = doc.data();
  return {
    id: doc.id,
    title: safeString(d.title) ?? "Sans titre",
    description: safeString(d.description),
    date: toDateString(d.date),
    city: safeString(d.city),
    venue: safeString(d.venue),
    flyerUrl: safeString(d.flyerUrl),
    videoUrl: safeString(d.videoUrl),
    mediaStack: Array.isArray(d.mediaStack) ? d.mediaStack : [],
    category: safeString(d.category),
    interestedCount: typeof d.interestedCount === "number" ? d.interestedCount : 0,
    viewsCount: typeof d.viewsCount === "number" ? d.viewsCount : 0,
    goingCount: typeof d.goingCount === "number" ? d.goingCount : 0,
    isFeatured: !!d.isFeatured,
    isRecurring: !!d.isRecurring,
    recurringLabel: safeString(d.recurringLabel),
    viralScore: typeof d.viralScore === "number" ? d.viralScore : 0,
    price: d.price,
  };
}

export async function getTrendingEvents(limitCount = 10): Promise<Event[]> {
  try {
    const q = query(
      collection(db, "events"),
      where("status", "==", "ACTIVE"),
      limit(Math.max(limitCount * 5, 50))
    );
    const snap = await getDocs(q);
    const all = snap.docs.map(mapEvent);
    return all
      .sort((a, b) => {
        const scoreA = (a.viewsCount ?? 0) * 2 + (a.interestedCount ?? 0) * 1.5 + (a.goingCount ?? 0);
        const scoreB = (b.viewsCount ?? 0) * 2 + (b.interestedCount ?? 0) * 1.5 + (b.goingCount ?? 0);
        return scoreB - scoreA;
      })
      .slice(0, limitCount);
  } catch {
    return [];
  }
}

export async function getMostViewedEvents(limitCount = 3): Promise<Event[]> {
  try {
    const q = query(
      collection(db, "events"),
      where("status", "==", "ACTIVE"),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(mapEvent)
      .sort((a, b) => (b.viewsCount ?? 0) - (a.viewsCount ?? 0))
      .slice(0, limitCount);
  } catch {
    return [];
  }
}

export async function getMostLikedEvents(limitCount = 3): Promise<Event[]> {
  try {
    const q = query(
      collection(db, "events"),
      where("status", "==", "ACTIVE"),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map(mapEvent)
      .sort((a, b) => (b.interestedCount ?? 0) - (a.interestedCount ?? 0))
      .slice(0, limitCount);
  } catch {
    return [];
  }
}

export async function getWeekendEvents(limitCount = 6): Promise<Event[]> {
  try {
    const now = new Date();
    const day = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const daysUntilSat = day === 0 ? 6 : (6 - day);
    const saturday = new Date(now);
    saturday.setDate(now.getDate() + daysUntilSat);
    saturday.setHours(0, 0, 0, 0);
    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);
    sunday.setHours(23, 59, 59, 999);

    const constraints: QueryConstraint[] = [
      where("status", "==", "ACTIVE"),
      where("date", ">=", Timestamp.fromDate(saturday)),
      where("date", "<=", Timestamp.fromDate(sunday)),
      orderBy("date", "asc"),
      limit(limitCount),
    ];
    const q = query(collection(db, "events"), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map(mapEvent);
  } catch {
    return [];
  }
}

export async function getStacks(): Promise<StackDoc[]> {
  try {
    const q = query(collection(db, "stacks"), orderBy("order"));
    const snap = await getDocs(q);
    const list = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        name: safeString(d.name) ?? "",
        description: safeString(d.description),
        mediaStack: Array.isArray(d.mediaStack) ? d.mediaStack : [],
        order: typeof d.order === "number" ? d.order : 0,
        autoIncludeWeek: d.autoIncludeWeek !== false,
        autoIncludeSponsored: !!d.autoIncludeSponsored,
      };
    });
    return list.sort((a, b) => {
      const c = a.order - b.order;
      return c !== 0 ? c : a.id.localeCompare(b.id);
    });
  } catch {
    return [];
  }
}
