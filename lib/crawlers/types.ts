export type WatchPlatform = "instagram" | "facebook" | "eventbrite" | "website" | "rss" | "manual";

export interface WatchSource {
  id: string;
  platform: WatchPlatform;
  handle?: string | null;
  profileUrl?: string | null;
  displayName?: string | null;
  city?: string | null;
  country?: string | null;
  maxPostsPerScan: number;
}

export interface RawMedia {
  kind: "image" | "video" | "unknown";
  url?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface RawPost {
  externalId?: string | null;
  url: string;
  caption?: string | null;
  postedAt?: string | null;
  media: RawMedia[];
}

export interface ScanResult {
  posts: RawPost[];
  blockedReason?: string | null;
}

export interface CrawlProvider {
  platform: WatchPlatform;
  scan(source: WatchSource): Promise<ScanResult>;
  fetchPost?(url: string): Promise<RawPost | null>;
}
