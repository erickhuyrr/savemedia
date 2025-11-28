import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlatformIcon } from "./platform-icon";
import { Clock, Eye, User } from "lucide-react";
import { formatDuration, getPlatformName, type VideoInfo, type Platform } from "@shared/schema";

interface VideoInfoCardProps {
  info: VideoInfo;
}

function formatViewCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + "M";
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + "K";
  }
  return count.toString();
}

export function VideoInfoCard({ info }: VideoInfoCardProps) {
  const platform = info.platform as Platform;

  return (
    <Card data-testid="card-video-info">
      <CardContent className="p-4 sm:p-6">
        <div className="flex gap-4">
          {info.thumbnail ? (
            <div className="relative flex-shrink-0 w-32 h-24 sm:w-48 sm:h-32 rounded-lg overflow-hidden bg-muted">
              <img
                src={info.thumbnail}
                alt={info.title}
                className="w-full h-full object-cover"
              />
              {info.duration && (
                <Badge 
                  variant="secondary" 
                  className="absolute bottom-2 right-2 bg-black/80 text-white border-0 text-xs"
                >
                  {formatDuration(info.duration)}
                </Badge>
              )}
            </div>
          ) : (
            <div className="flex-shrink-0 w-32 h-24 sm:w-48 sm:h-32 rounded-lg bg-muted flex items-center justify-center">
              <PlatformIcon platform={platform} size={48} />
            </div>
          )}

          <div className="flex-1 min-w-0 space-y-3">
            <div className="space-y-2">
              <h3 
                className="font-semibold text-base sm:text-lg line-clamp-2"
                data-testid="text-video-title"
              >
                {info.title}
              </h3>
              <div className="flex items-center gap-2">
                <PlatformIcon platform={platform} size={16} />
                <span className="text-sm text-muted-foreground">
                  {getPlatformName(platform)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {info.uploader && (
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  <span>{info.uploader}</span>
                </div>
              )}
              {info.duration && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(info.duration)}</span>
                </div>
              )}
              {info.viewCount && (
                <div className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4" />
                  <span>{formatViewCount(info.viewCount)} views</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
