import { Badge } from "@/components/ui/badge";
import { PlatformIcon } from "./platform-icon";
import { getPlatformName, type Platform } from "@shared/schema";

interface PlatformBadgeProps {
  platform: Platform;
  showName?: boolean;
}

export function PlatformBadge({ platform, showName = true }: PlatformBadgeProps) {
  return (
    <Badge 
      variant="secondary" 
      className="gap-1.5 px-2.5 py-1"
      data-testid={`badge-platform-${platform}`}
    >
      <PlatformIcon platform={platform} size={14} />
      {showName && (
        <span className="text-xs font-medium">{getPlatformName(platform)}</span>
      )}
    </Badge>
  );
}
