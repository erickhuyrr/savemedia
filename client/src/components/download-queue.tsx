import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ListOrdered, 
  Play, 
  Trash2, 
  Download, 
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import type { QueueItem } from "@shared/schema";
import { detectPlatform, formatFileSize } from "@shared/schema";
import { PlatformIcon } from "./platform-icon";

interface DownloadQueueProps {
  items: QueueItem[];
  onStartQueue: () => void;
  onClearQueue: () => void;
  onRemoveItem: (id: string) => void;
  onDownload: (item: QueueItem) => void;
  isProcessing: boolean;
}

function getStatusColor(status: QueueItem["status"]): string {
  switch (status) {
    case "completed":
      return "text-green-500";
    case "error":
      return "text-red-500";
    case "downloading":
    case "fetching":
    case "converting":
      return "text-blue-500";
    default:
      return "text-muted-foreground";
  }
}

function getStatusIcon(status: QueueItem["status"]) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "error":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case "downloading":
    case "fetching":
    case "converting":
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    default:
      return null;
  }
}

function getStatusLabel(status: QueueItem["status"]): string {
  switch (status) {
    case "pending":
      return "Waiting";
    case "fetching":
      return "Fetching info...";
    case "downloading":
      return "Downloading...";
    case "converting":
      return "Converting...";
    case "completed":
      return "Ready";
    case "error":
      return "Failed";
    default:
      return status;
  }
}

export function DownloadQueue({
  items,
  onStartQueue,
  onClearQueue,
  onRemoveItem,
  onDownload,
  isProcessing,
}: DownloadQueueProps) {
  const pendingCount = items.filter(i => i.status === "pending").length;
  const completedCount = items.filter(i => i.status === "completed").length;
  const processingCount = items.filter(i => 
    ["fetching", "downloading", "converting"].includes(i.status)
  ).length;
  const errorCount = items.filter(i => i.status === "error").length;

  if (items.length === 0) {
    return null;
  }

  return (
    <Card data-testid="card-download-queue">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <ListOrdered className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Download Queue</CardTitle>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">
              {pendingCount} pending
            </Badge>
            {processingCount > 0 && (
              <Badge variant="default">
                {processingCount} processing
              </Badge>
            )}
            {completedCount > 0 && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                {completedCount} ready
              </Badge>
            )}
            {errorCount > 0 && (
              <Badge variant="destructive">
                {errorCount} failed
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={onStartQueue}
            disabled={pendingCount === 0 || isProcessing}
            data-testid="button-start-queue"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Downloads ({pendingCount})
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={onClearQueue}
            disabled={isProcessing}
            data-testid="button-clear-queue"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {items.map((item) => {
            const platform = item.platform ? detectPlatform(item.url) || item.platform : detectPlatform(item.url);
            const isActive = ["fetching", "downloading", "converting"].includes(item.status);
            
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border"
                data-testid={`queue-item-${item.id}`}
              >
                {item.thumbnail ? (
                  <div className="relative flex-shrink-0 w-16 h-12 rounded overflow-hidden bg-muted">
                    <img
                      src={item.thumbnail}
                      alt={item.title || "Video thumbnail"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-16 h-12 rounded bg-muted flex items-center justify-center">
                    {platform && <PlatformIcon platform={platform as any} size={24} />}
                  </div>
                )}

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {item.title || item.url}
                    </span>
                    {getStatusIcon(item.status)}
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className={getStatusColor(item.status)}>
                      {getStatusLabel(item.status)}
                    </span>
                    <span>{item.format.toUpperCase()}</span>
                    <span>{item.quality}</span>
                    {item.fileSize && (
                      <span>{formatFileSize(item.fileSize)}</span>
                    )}
                  </div>

                  {isActive && item.progress > 0 && (
                    <Progress value={item.progress} className="h-1" />
                  )}

                  {item.status === "error" && item.error && (
                    <p className="text-xs text-red-500 truncate">
                      {item.error}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {item.status === "completed" && item.downloadUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDownload(item)}
                      data-testid={`button-download-${item.id}`}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveItem(item.id)}
                    disabled={isActive}
                    data-testid={`button-remove-${item.id}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
