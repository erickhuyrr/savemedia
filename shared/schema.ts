import { z } from "zod";

export const supportedPlatforms = [
  "youtube",
  "tiktok",
  "instagram",
  "twitter",
  "facebook",
  "vimeo",
  "reddit",
  "twitch",
  "dailymotion",
  "soundcloud",
  "pinterest",
  "bilibili",
  "nicovideo",
  "bandcamp",
  "mixcloud",
  "other",
] as const;

export type Platform = (typeof supportedPlatforms)[number];

export const videoFormats = ["mp4", "webm", "mkv"] as const;
export const audioFormats = ["mp3", "m4a", "wav", "ogg"] as const;
export const imageFormats = ["jpg", "png", "webp"] as const;
export const videoQualities = ["2160p", "1080p", "720p", "480p", "360p", "best", "worst"] as const;
export const audioQualities = ["320kbps", "256kbps", "192kbps", "128kbps", "64kbps"] as const;
export const imageQualities = ["original", "high", "medium"] as const;

export type VideoFormat = (typeof videoFormats)[number];
export type AudioFormat = (typeof audioFormats)[number];
export type ImageFormat = (typeof imageFormats)[number];
export type VideoQuality = (typeof videoQualities)[number];
export type AudioQuality = (typeof audioQualities)[number];
export type ImageQuality = (typeof imageQualities)[number];

export const downloadRequestSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  outputType: z.enum(["video", "audio", "image"]),
  format: z.string(),
  quality: z.string(),
});

export type DownloadRequest = z.infer<typeof downloadRequestSchema>;

export const videoInfoSchema = z.object({
  id: z.string(),
  title: z.string(),
  thumbnail: z.string().optional(),
  duration: z.number().optional(),
  platform: z.string(),
  uploader: z.string().optional(),
  viewCount: z.number().optional(),
  mediaType: z.enum(["video", "audio", "image", "gallery"]).optional(),
  imageCount: z.number().optional(),
  formats: z.array(z.object({
    formatId: z.string(),
    ext: z.string(),
    quality: z.string().optional(),
    filesize: z.number().optional(),
    hasVideo: z.boolean(),
    hasAudio: z.boolean(),
  })).optional(),
});

export type VideoInfo = z.infer<typeof videoInfoSchema>;

export const downloadStatusSchema = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string(),
  thumbnail: z.string().optional(),
  platform: z.string(),
  status: z.enum(["pending", "fetching", "downloading", "converting", "completed", "error"]),
  progress: z.number().min(0).max(100),
  outputType: z.enum(["video", "audio", "image"]),
  format: z.string(),
  quality: z.string(),
  fileSize: z.number().optional(),
  downloadUrl: z.string().optional(),
  error: z.string().optional(),
  createdAt: z.string(),
  speed: z.string().optional(),
  eta: z.string().optional(),
});

export type DownloadStatus = z.infer<typeof downloadStatusSchema>;

export const downloadHistoryItemSchema = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string(),
  thumbnail: z.string().optional(),
  platform: z.string(),
  outputType: z.enum(["video", "audio", "image"]),
  format: z.string(),
  quality: z.string(),
  fileSize: z.number().optional(),
  downloadUrl: z.string(),
  createdAt: z.string(),
});

export type DownloadHistoryItem = z.infer<typeof downloadHistoryItemSchema>;

export const queueItemSchema = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string().optional(),
  thumbnail: z.string().optional(),
  platform: z.string().optional(),
  outputType: z.enum(["video", "audio", "image"]),
  format: z.string(),
  quality: z.string(),
  status: z.enum(["pending", "fetching", "downloading", "converting", "completed", "error"]),
  progress: z.number().min(0).max(100),
  error: z.string().optional(),
  downloadUrl: z.string().optional(),
  fileSize: z.number().optional(),
  addedAt: z.string(),
  speed: z.string().optional(),
  eta: z.string().optional(),
});

export type QueueItem = z.infer<typeof queueItemSchema>;

export const batchDownloadRequestSchema = z.object({
  urls: z.array(z.string().url("Please enter valid URLs")),
  outputType: z.enum(["video", "audio", "image"]),
  format: z.string(),
  quality: z.string(),
});

export type BatchDownloadRequest = z.infer<typeof batchDownloadRequestSchema>;

export function detectPlatform(url: string): Platform | null {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes("youtube.com") || urlLower.includes("youtu.be")) {
    return "youtube";
  }
  if (urlLower.includes("tiktok.com")) {
    return "tiktok";
  }
  if (urlLower.includes("instagram.com")) {
    return "instagram";
  }
  if (urlLower.includes("twitter.com") || urlLower.includes("x.com")) {
    return "twitter";
  }
  if (urlLower.includes("facebook.com") || urlLower.includes("fb.watch")) {
    return "facebook";
  }
  if (urlLower.includes("vimeo.com")) {
    return "vimeo";
  }
  if (urlLower.includes("reddit.com")) {
    return "reddit";
  }
  if (urlLower.includes("twitch.tv")) {
    return "twitch";
  }
  if (urlLower.includes("dailymotion.com")) {
    return "dailymotion";
  }
  if (urlLower.includes("soundcloud.com")) {
    return "soundcloud";
  }
  if (urlLower.includes("pinterest.com") || urlLower.includes("pin.it")) {
    return "pinterest";
  }
  if (urlLower.includes("bilibili.com") || urlLower.includes("b23.tv")) {
    return "bilibili";
  }
  if (urlLower.includes("nicovideo.jp") || urlLower.includes("nico.ms")) {
    return "nicovideo";
  }
  if (urlLower.includes("bandcamp.com")) {
    return "bandcamp";
  }
  if (urlLower.includes("mixcloud.com")) {
    return "mixcloud";
  }
  
  return "other";
}

export function getPlatformName(platform: Platform): string {
  const names: Record<Platform, string> = {
    youtube: "YouTube",
    tiktok: "TikTok",
    instagram: "Instagram",
    twitter: "Twitter/X",
    facebook: "Facebook",
    vimeo: "Vimeo",
    reddit: "Reddit",
    twitch: "Twitch",
    dailymotion: "Dailymotion",
    soundcloud: "SoundCloud",
    pinterest: "Pinterest",
    bilibili: "Bilibili",
    nicovideo: "Niconico",
    bandcamp: "Bandcamp",
    mixcloud: "Mixcloud",
    other: "Other",
  };
  return names[platform];
}

export function getPlatformColor(platform: Platform): string {
  const colors: Record<Platform, string> = {
    youtube: "#FF0000",
    tiktok: "#000000",
    instagram: "#E4405F",
    twitter: "#1DA1F2",
    facebook: "#1877F2",
    vimeo: "#1AB7EA",
    reddit: "#FF4500",
    twitch: "#9146FF",
    dailymotion: "#0066DC",
    soundcloud: "#FF5500",
    pinterest: "#E60023",
    bilibili: "#00A1D6",
    nicovideo: "#252525",
    bandcamp: "#1DA0C3",
    mixcloud: "#5000FF",
    other: "#6B7280",
  };
  return colors[platform];
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return "0 B/s";
  const k = 1024;
  const sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
  return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function isPinterestUrl(url: string): boolean {
  const urlLower = url.toLowerCase();
  return urlLower.includes("pinterest.com") || urlLower.includes("pin.it");
}

export function isImageOnlyPlatform(platform: Platform): boolean {
  return platform === "pinterest";
}
