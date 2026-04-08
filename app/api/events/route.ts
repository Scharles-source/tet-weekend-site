import { NextResponse } from "next/server";
import { getEvents, getTrendingEvents, getMostViewedEvents, getMostLikedEvents, getWeekendEvents } from "@/lib/firestore";

export const revalidate = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "recent";
  const limit = parseInt(searchParams.get("limit") ?? "8");

  try {
    let data;
    switch (type) {
      case "trending":  data = await getTrendingEvents(limit); break;
      case "viewed":    data = await getMostViewedEvents(limit); break;
      case "liked":     data = await getMostLikedEvents(limit); break;
      case "weekend":   data = await getWeekendEvents(limit); break;
      default:          data = await getEvents(limit); break;
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("API events error:", e);
    return NextResponse.json([], { status: 500 });
  }
}
