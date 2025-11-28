import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlatformIcon } from "./platform-icon";
import { 
  Download, 
  History, 
  FileVideo, 
  FileAudio, 
  Trash2,
  Clock
} from "lucide-react";
import { 
  formatFileSize, 
  getPlatformName,
  type DownloadHistoryItem,
  type Platform 
} from "@shared/schema";

interface DownloadHistoryProps {
  items: DownloadHistoryItem[];
  onDownload: (item: DownloadHistoryItem) => void;
  onClear?: () => void;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString();
}

export function DownloadHistory({ items, onDownload, onClear }: DownloadHistoryProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5" />
            Recent Downloads
          </CardTitle>
          {onClear && items.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClear}
              className="text-muted-foreground gap-1.5"
              data-testid="button-clear-history"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {items.map((item) => {
              const platform = item.platform as Platform;
              
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover-elevate"
                  data-testid={`history-item-${item.id}`}
                >
                  {item.thumbnail ? (
                    <div className="relative flex-shrink-0 w-16 h-12 rounded overflow-hidden bg-muted">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-16 h-12 rounded bg-muted flex items-center justify-center">
                      <PlatformIcon platform={platform} size={20} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p 
                      className="text-sm font-medium truncate"
                      data-testid="text-history-title"
                    >
                      {item.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                      <PlatformIcon platform={platform} size={10} />
                      <span>{getPlatformName(platform)}</span>
                      <span>•</span>
                      <span className="uppercase">{item.format}</span>
                      {item.fileSize && (
                        <>
                          <span>•</span>
                          <span>{formatFileSize(item.fileSize)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex flex-col items-end gap-1">
                      <Badge variant="secondary" className="text-xs px-2">
                        {item.outputType === "video" ? (
                          <FileVideo className="h-3 w-3 mr-1" />
                        ) : (
                          <FileAudio className="h-3 w-3 mr-1" />
                        )}
                        {item.quality}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDownload(item)}
                      data-testid={`button-redownload-${item.id}`}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
