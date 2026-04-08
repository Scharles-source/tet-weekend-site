import { Event } from "./types";

async function fetchEvents(type: string, limit: number): Promise<Event[]> {
  try {
    const res = await fetch(`/api/events?type=${type}&limit=${limit}`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export const apiGetEvents = (limit = 8) => fetchEvents("recent", limit);
export const apiGetTrendingEvents = (limit = 10) => fetchEvents("trending", limit);
export const apiGetMostViewedEvents = (limit = 3) => fetchEvents("viewed", limit);
export const apiGetMostLikedEvents = (limit = 3) => fetchEvents("liked", limit);
export const apiGetWeekendEvents = (limit = 6) => fetchEvents("weekend", limit);
