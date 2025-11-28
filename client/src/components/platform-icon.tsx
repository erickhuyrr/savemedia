import { 
  SiYoutube, 
  SiTiktok, 
  SiInstagram, 
  SiX, 
  SiFacebook, 
  SiVimeo,
  SiReddit,
  SiTwitch,
  SiDailymotion,
  SiSoundcloud,
  SiPinterest,
  SiBilibili,
  SiNiconico,
  SiBandcamp,
  SiMixcloud
} from "react-icons/si";
import { Globe } from "lucide-react";
import type { Platform } from "@shared/schema";

interface PlatformIconProps {
  platform: Platform;
  size?: number;
  className?: string;
}

const GlobeIcon = ({ size, className }: { size?: number; className?: string }) => (
  <Globe size={size} className={className} />
);

const platformIcons: Record<Platform, React.ComponentType<{ size?: number; className?: string }>> = {
  youtube: SiYoutube,
  tiktok: SiTiktok,
  instagram: SiInstagram,
  twitter: SiX,
  facebook: SiFacebook,
  vimeo: SiVimeo,
  reddit: SiReddit,
  twitch: SiTwitch,
  dailymotion: SiDailymotion,
  soundcloud: SiSoundcloud,
  pinterest: SiPinterest,
  bilibili: SiBilibili,
  nicovideo: SiNiconico,
  bandcamp: SiBandcamp,
  mixcloud: SiMixcloud,
  other: GlobeIcon,
};

const platformColors: Record<Platform, string> = {
  youtube: "text-[#FF0000]",
  tiktok: "text-foreground",
  instagram: "text-[#E4405F]",
  twitter: "text-foreground",
  facebook: "text-[#1877F2]",
  vimeo: "text-[#1AB7EA]",
  reddit: "text-[#FF4500]",
  twitch: "text-[#9146FF]",
  dailymotion: "text-[#0066DC]",
  soundcloud: "text-[#FF5500]",
  pinterest: "text-[#E60023]",
  bilibili: "text-[#00A1D6]",
  nicovideo: "text-[#252525]",
  bandcamp: "text-[#1DA0C3]",
  mixcloud: "text-[#5000FF]",
  other: "text-muted-foreground",
};

export function PlatformIcon({ platform, size = 24, className = "" }: PlatformIconProps) {
  const Icon = platformIcons[platform] || Globe;
  const colorClass = platformColors[platform] || "text-muted-foreground";
  
  return (
    <Icon 
      size={size} 
      className={`${colorClass} ${className}`}
    />
  );
}
