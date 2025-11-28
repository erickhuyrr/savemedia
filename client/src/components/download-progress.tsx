import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformIcon } from "./platform-icon";
import { 
  Download, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  FileVideo, 
  FileAudio,
  Clock
} from "lucide-react";
import { 
  formatFileSize, 
  formatDuration, 
  getPlatformName,
  type DownloadStatus,
  type Platform 
} from "@shared/schema";

interface DownloadProgressProps {
  download: DownloadStatus;
  onDownload?: () => void;
  onRetry?: () => void;
}

const statusConfig = {
  pending: { 
    label: "Waiting...", 
    icon: Clock, 
    color: "text-muted-foreground" 
  },
  fetching: { 
    label: "Fetching video info...", 
    icon: Loader2, 
    color: "text-primary",
    animate: true 
  },
  downloading: { 
    label: "Downloading...", 
    icon: Loader2, 
    color: "text-primary",
    animate: true 
  },
  converting: { 
    label: "Converting...", 
    icon: Loader2, 
    color: "text-primary",
    animate: true 
  },
  completed: { 
    label: "Ready to download", 
    icon: CheckCircle2, 
    color: "text-green-600 dark:text-green-500" 
  },
  error: { 
    label: "Download failed", 
    icon: XCircle, 
    color: "text-destructive" 
  },
};

export function DownloadProgress({ download, onDownload, onRetry }: DownloadProgressProps) {
  const status = statusConfig[download.status];
  const StatusIcon = status.icon;
  const platform = download.platform as Platform;

  return (
    <Card 
      className="overflow-hidden"
      data-testid={`card-download-${download.id}`}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex gap-4">
          {download.thumbnail ? (
            <div className="relative flex-shrink-0 w-24 h-24 sm:w-32 sm:h-24 rounded-md overflow-hidden bg-muted">
              <img
                src={download.thumbnail}
                alt={download.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 right-1">
                <Badge variant="secondary" className="px-1.5 py-0.5 text-xs bg-black/70 text-white border-0">
                  {download.outputType === "video" ? (
                    <FileVideo className="h-3 w-3" />
                  ) : (
                    <FileAudio className="h-3 w-3" />
                  )}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-24 rounded-md bg-muted flex items-center justify-center">
              <PlatformIcon platform={platform} size={32} />
            </div>
          )}

          <div className="flex-1 min-w-0 space-y-3">
            <div className="space-y-1">
              <h3 
                className="font-semibold text-sm sm:text-base line-clamp-2"
                data-testid="text-download-title"
              >
                {download.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <PlatformIcon platform={platform} size={12} />
                  <span>{getPlatformName(platform)}</span>
                </div>
                <span className="hidden sm:inline">•</span>
                <span className="uppercase">{download.format}</span>
                <span>•</span>
                <span>{download.quality}</span>
                {download.fileSize && (
                  <>
                    <span>•</span>
                    <span>{formatFileSize(download.fileSize)}</span>
                  </>
                )}
              </div>
            </div>

            {download.status !== "completed" && download.status !== "error" && (
              <div className="space-y-1.5">
                <Progress 
                  value={download.progress} 
                  className="h-2"
                />
                <div className="flex items-center justify-between text-xs">
                  <div className={`flex items-center gap-1.5 ${status.color}`}>
                    <StatusIcon className={`h-3.5 w-3.5 ${status.animate ? "animate-spin" : ""}`} />
                    <span>{status.label}</span>
                  </div>
                  <span className="text-muted-foreground">{download.progress}%</span>
                </div>
              </div>
            )}

            {download.status === "completed" && (
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-1.5 ${status.color}`}>
                  <StatusIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">{status.label}</span>
                </div>
                <Button 
                  size="sm" 
                  onClick={onDownload}
                  className="gap-1.5"
                  data-testid="button-download-file"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            )}

            {download.status === "error" && (
              <div className="space-y-2">
                <div className={`flex items-center gap-1.5 ${status.color}`}>
                  <StatusIcon className="h-4 w-4" />
                  <span className="text-sm">{download.error || status.label}</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={onRetry}
                  data-testid="button-retry-download"
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
