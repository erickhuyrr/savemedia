import { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/header";
import { UrlInput } from "@/components/url-input";
import { FormatSelector } from "@/components/format-selector";
import { VideoInfoCard } from "@/components/video-info-card";
import { DownloadProgress } from "@/components/download-progress";
import { DownloadHistory } from "@/components/download-history";
import { BatchUrlInput } from "@/components/batch-url-input";
import { DownloadQueue } from "@/components/download-queue";
import { FeatureCards } from "@/components/feature-cards";
import { SupportedPlatforms } from "@/components/supported-platforms";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { VideoInfo, DownloadStatus, DownloadHistoryItem, QueueItem } from "@shared/schema";
import { detectPlatform, isPinterestUrl } from "@shared/schema";
import { Link2, ListPlus, Mail, Instagram, Facebook } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"single" | "batch">("single");
  const [url, setUrl] = useState("");
  const [batchUrls, setBatchUrls] = useState<string[]>([]);
  const [outputType, setOutputType] = useState<"video" | "audio" | "image">("video");
  const [format, setFormat] = useState("mp4");
  const [quality, setQuality] = useState("1080p");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [currentDownload, setCurrentDownload] = useState<DownloadStatus | null>(null);
  const [isQueueProcessing, setIsQueueProcessing] = useState(false);
  const [showImageOption, setShowImageOption] = useState(false);

  const { data: history = [] } = useQuery<DownloadHistoryItem[]>({
    queryKey: ["/api/downloads/history"],
  });

  const { data: queue = [], refetch: refetchQueue } = useQuery<QueueItem[]>({
    queryKey: ["/api/queue"],
    refetchInterval: isQueueProcessing ? 1000 : false,
  });

  const fetchInfoMutation = useMutation({
    mutationFn: async (videoUrl: string) => {
      const response = await apiRequest("POST", "/api/video/info", { url: videoUrl });
      return response.json() as Promise<VideoInfo>;
    },
    onSuccess: (data) => {
      setVideoInfo(data);
      if (data.mediaType === "image" || data.platform === "pinterest") {
        setOutputType("image");
        setFormat("jpg");
        setQuality("original");
        setShowImageOption(true);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to fetch video info",
        description: error.message || "Please check the URL and try again.",
        variant: "destructive",
      });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/download", {
        url,
        outputType,
        format,
        quality,
      });
      return response.json() as Promise<DownloadStatus>;
    },
    onSuccess: (data) => {
      setCurrentDownload(data);
      pollDownloadStatus(data.id);
    },
    onError: (error: Error) => {
      toast({
        title: "Download failed",
        description: error.message || "An error occurred while starting the download.",
        variant: "destructive",
      });
    },
  });

  const pollDownloadStatus = useCallback(async (downloadId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/download/${downloadId}/status`);
        if (!response.ok) throw new Error("Failed to fetch status");
        
        const status = await response.json() as DownloadStatus;
        setCurrentDownload(status);

        if (status.status === "completed") {
          queryClient.invalidateQueries({ queryKey: ["/api/downloads/history"] });
          toast({
            title: "Download ready!",
            description: "Your file is ready to download.",
          });
        } else if (status.status === "error") {
          toast({
            title: "Download failed",
            description: status.error || "An error occurred during download.",
            variant: "destructive",
          });
        } else {
          setTimeout(poll, 1000);
        }
      } catch (error) {
        console.error("Error polling status:", error);
      }
    };

    poll();
  }, [toast]);

  const handleSubmit = () => {
    if (!url) return;
    
    if (!videoInfo) {
      fetchInfoMutation.mutate(url);
    } else {
      downloadMutation.mutate();
    }
  };

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (newUrl !== url) {
      setVideoInfo(null);
      setCurrentDownload(null);
      
      if (isPinterestUrl(newUrl)) {
        setShowImageOption(true);
        setOutputType("image");
        setFormat("jpg");
        setQuality("original");
      } else {
        setShowImageOption(false);
        if (outputType === "image") {
          setOutputType("video");
          setFormat("mp4");
          setQuality("1080p");
        }
      }
    }
  };

  const handleOutputTypeChange = (type: "video" | "audio" | "image") => {
    setOutputType(type);
    if (type === "video") {
      setFormat("mp4");
      setQuality("1080p");
    } else if (type === "audio") {
      setFormat("mp3");
      setQuality("320kbps");
    } else {
      setFormat("jpg");
      setQuality("original");
    }
  };

  const handleDownloadFile = () => {
    if (currentDownload?.downloadUrl) {
      window.open(currentDownload.downloadUrl, "_blank");
    }
  };

  const handleRetry = () => {
    setCurrentDownload(null);
    downloadMutation.mutate();
  };

  const handleHistoryDownload = (item: DownloadHistoryItem) => {
    window.open(item.downloadUrl, "_blank");
  };

  const handleClearHistory = async () => {
    try {
      await apiRequest("DELETE", "/api/downloads/history");
      queryClient.invalidateQueries({ queryKey: ["/api/downloads/history"] });
      toast({
        title: "History cleared",
        description: "Your download history has been cleared.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear history.",
        variant: "destructive",
      });
    }
  };

  const addToQueueMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/queue/add", {
        urls: batchUrls,
        outputType,
        format,
        quality,
      });
      return response.json() as Promise<QueueItem[]>;
    },
    onSuccess: () => {
      setBatchUrls([]);
      refetchQueue();
      toast({
        title: "Added to queue",
        description: `${batchUrls.length} URL(s) added to the download queue.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add to queue",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const startQueueMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/queue/start");
      return response.json();
    },
    onSuccess: () => {
      setIsQueueProcessing(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to start queue",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStartQueue = () => {
    startQueueMutation.mutate();
  };

  const handleClearQueue = async () => {
    try {
      await apiRequest("DELETE", "/api/queue");
      queryClient.invalidateQueries({ queryKey: ["/api/queue"] });
      toast({
        title: "Queue cleared",
        description: "All items have been removed from the queue.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear queue.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFromQueue = async (id: string) => {
    try {
      await apiRequest("DELETE", `/api/queue/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/queue"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item from queue.",
        variant: "destructive",
      });
    }
  };

  const handleQueueItemDownload = (item: QueueItem) => {
    if (item.downloadUrl) {
      window.open(item.downloadUrl, "_blank");
    }
  };

  const handleAddToQueue = () => {
    if (batchUrls.length > 0) {
      addToQueueMutation.mutate();
    }
  };

  useEffect(() => {
    if (isQueueProcessing && queue.length > 0) {
      const hasProcessing = queue.some(item => 
        ["pending", "fetching", "downloading", "converting"].includes(item.status)
      );
      if (!hasProcessing) {
        setIsQueueProcessing(false);
        queryClient.invalidateQueries({ queryKey: ["/api/downloads/history"] });
        const completedCount = queue.filter(i => i.status === "completed").length;
        if (completedCount > 0) {
          toast({
            title: "Queue complete",
            description: `${completedCount} download(s) ready.`,
          });
        }
      }
    }
  }, [queue, isQueueProcessing, toast]);

  const isLoading = fetchInfoMutation.isPending || downloadMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto max-w-4xl px-4 py-8 space-y-12">
        <section className="text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            Download Videos, Audio & Images
            <br />
            <span className="text-primary">From Anywhere</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Free online downloader supporting YouTube, TikTok, Instagram, Twitter, 
            Facebook, Pinterest, and 1000+ more platforms.
          </p>
        </section>

        <Card>
          <CardContent className="p-6 sm:p-8 space-y-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "single" | "batch")}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="single" className="flex items-center gap-2" data-testid="tab-single">
                  <Link2 className="h-4 w-4" />
                  Single URL
                </TabsTrigger>
                <TabsTrigger value="batch" className="flex items-center gap-2" data-testid="tab-batch">
                  <ListPlus className="h-4 w-4" />
                  Batch Download
                </TabsTrigger>
              </TabsList>

              <TabsContent value="single" className="space-y-6 mt-0">
                <UrlInput
                  value={url}
                  onChange={handleUrlChange}
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                  disabled={downloadMutation.isPending}
                />

                {videoInfo && (
                  <>
                    <Separator />
                    <VideoInfoCard info={videoInfo} />
                  </>
                )}

                {(videoInfo || url) && (
                  <>
                    <Separator />
                    <FormatSelector
                      outputType={outputType}
                      format={format}
                      quality={quality}
                      onOutputTypeChange={handleOutputTypeChange}
                      onFormatChange={setFormat}
                      onQualityChange={setQuality}
                      disabled={downloadMutation.isPending}
                      showImageOption={showImageOption}
                    />
                  </>
                )}
              </TabsContent>

              <TabsContent value="batch" className="space-y-6 mt-0">
                <BatchUrlInput
                  urls={batchUrls}
                  onChange={setBatchUrls}
                  onAddToQueue={handleAddToQueue}
                  disabled={addToQueueMutation.isPending}
                  isAddingToQueue={addToQueueMutation.isPending}
                />

                {batchUrls.length > 0 && (
                  <>
                    <Separator />
                    <FormatSelector
                      outputType={outputType}
                      format={format}
                      quality={quality}
                      onOutputTypeChange={handleOutputTypeChange}
                      onFormatChange={setFormat}
                      onQualityChange={setQuality}
                      disabled={addToQueueMutation.isPending}
                      showImageOption={showImageOption}
                    />
                    <Separator />
                    <Button
                      onClick={handleAddToQueue}
                      disabled={addToQueueMutation.isPending || batchUrls.length === 0}
                      className="w-full"
                      data-testid="button-submit-batch"
                    >
                      {addToQueueMutation.isPending ? (
                        <>Processing...</>
                      ) : (
                        <>Add {batchUrls.length} URL{batchUrls.length !== 1 ? "s" : ""} to Queue</>
                      )}
                    </Button>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {queue.length > 0 && (
          <DownloadQueue
            items={queue}
            onStartQueue={handleStartQueue}
            onClearQueue={handleClearQueue}
            onRemoveItem={handleRemoveFromQueue}
            onDownload={handleQueueItemDownload}
            isProcessing={isQueueProcessing || startQueueMutation.isPending}
          />
        )}

        {currentDownload && (
          <DownloadProgress
            download={currentDownload}
            onDownload={handleDownloadFile}
            onRetry={handleRetry}
          />
        )}

        {history.length > 0 && (
          <DownloadHistory
            items={history}
            onDownload={handleHistoryDownload}
            onClear={handleClearHistory}
          />
        )}

        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Why Choose SaveMedia?</h2>
            <p className="text-muted-foreground">
              The fastest and easiest way to download videos, audio, and images
            </p>
          </div>
          <FeatureCards />
        </section>

        <SupportedPlatforms />

        <footer className="space-y-12 py-12 border-t">
          <div className="flex justify-center items-center gap-8">
            {/* Instagram */}
            <a 
              href="https://instagram.com/erickyy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-3 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 hover:scale-110 transition-transform hover:shadow-lg"
              title="Instagram"
            >
              <Instagram className="h-6 w-6 text-white" />
            </a>

            {/* Facebook */}
            <a 
              href="https://facebook.com/search/people/?q=asmit%20adk" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-3 rounded-full bg-blue-600 hover:scale-110 transition-transform hover:shadow-lg"
              title="Facebook"
            >
              <Facebook className="h-6 w-6 text-white" />
            </a>

            {/* Email */}
            <a 
              href="mailto:asmitadk2007@gmail.com"
              className="p-3 rounded-full bg-red-500 hover:scale-110 transition-transform hover:shadow-lg"
              title="Email"
            >
              <Mail className="h-6 w-6 text-white" />
            </a>
          </div>

          <div className="text-center text-sm text-muted-foreground space-y-4">
            <p>
              SaveMedia is a free tool for downloading publicly available content.
              <br />
              Please respect copyright and only download content you have the right to access.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
