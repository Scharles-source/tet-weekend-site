export interface MediaItem {
  kind: "image" | "video";
  url: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  date?: string;       // ISO string or Firestore Timestamp
  city?: string;
  venue?: string;
  price?: number | string;
  flyerUrl?: string;
  videoUrl?: string;
  mediaStack?: MediaItem[];
  category?: string;
  interestedCount?: number;
  viewsCount?: number;
  goingCount?: number;
  isFeatured?: boolean;
  isRecurring?: boolean;
  recurringLabel?: string;
  viralScore?: number;
}

export interface StackDoc {
  id: string;
  name: string;
  description?: string;
  mediaStack?: MediaItem[];
  order: number;
  autoIncludeWeek?: boolean;
  autoIncludeSponsored?: boolean;
}
