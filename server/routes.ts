import type { Express } from "express";
import { createServer, type Server } from "http";
import * as path from "path";
import * as fs from "fs";
import { storage } from "./storage";
import { getVideoInfo, downloadMedia, getDownloadUrl, getFilePath } from "./downloader";
import { downloadRequestSchema, batchDownloadRequestSchema, detectPlatform } from "@shared/schema";
import { z } from "zod";

const DOWNLOAD_DIR = path.join(process.cwd(), "downloads");

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/video/info", async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "URL is required" });
      }

      const info = await getVideoInfo(url);
      res.json(info);
    } catch (error) {
      console.error("Error fetching video info:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch video info" 
      });
    }
  });

  app.post("/api/download", async (req, res) => {
    try {
      const result = downloadRequestSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: result.error.errors 
        });
      }

      const { url, outputType, format, quality } = result.data;
      const platform = detectPlatform(url) || "unknown";

      const download = await storage.createDownload({
        url,
        title: "Fetching...",
        platform,
        status: "fetching",
        progress: 0,
        outputType,
        format,
        quality,
      });

      res.json(download);

      (async () => {
        try {
          await storage.updateDownload(download.id, {
            status: "downloading",
            progress: 5,
          });

          const result = await downloadMedia({
            url,
            outputType,
            format,
            quality,
            onProgress: async (progress, status, speed, eta) => {
              await storage.updateDownload(download.id, {
                progress: Math.min(progress, 95),
                status: status === "completed" ? "converting" : "downloading",
                speed: speed || undefined,
                eta: eta || undefined,
              });
            },
          });

          const downloadUrl = getDownloadUrl(result.filePath);

          await storage.updateDownload(download.id, {
            status: "completed",
            progress: 100,
            title: result.title,
            thumbnail: result.thumbnail,
            fileSize: result.fileSize,
            downloadUrl,
          });

          await storage.addToHistory({
            url,
            title: result.title,
            thumbnail: result.thumbnail,
            platform,
            outputType,
            format,
            quality,
            fileSize: result.fileSize,
            downloadUrl,
          });

        } catch (error) {
          console.error("Download error:", error);
          await storage.updateDownload(download.id, {
            status: "error",
            error: error instanceof Error ? error.message : "Download failed",
          });
        }
      })();

    } catch (error) {
      console.error("Error starting download:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to start download" 
      });
    }
  });

  app.get("/api/download/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const download = await storage.getDownload(id);

      if (!download) {
        return res.status(404).json({ error: "Download not found" });
      }

      res.json(download);
    } catch (error) {
      console.error("Error fetching download status:", error);
      res.status(500).json({ error: "Failed to fetch download status" });
    }
  });

  app.get("/api/downloads/history", async (req, res) => {
    try {
      const history = await storage.getDownloadHistory();
      res.json(history);
    } catch (error) {
      console.error("Error fetching download history:", error);
      res.status(500).json({ error: "Failed to fetch download history" });
    }
  });

  app.delete("/api/downloads/history", async (req, res) => {
    try {
      await storage.clearHistory();
      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing history:", error);
      res.status(500).json({ error: "Failed to clear history" });
    }
  });

  app.get("/api/files/:filename", (req, res) => {
    try {
      const { filename } = req.params;
      const filePath = getFilePath(filename);

      if (!filePath) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found" });
      }

      const stats = fs.statSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const safeFilename = path.basename(filePath);
      
      const mimeTypes: Record<string, string> = {
        ".mp4": "video/mp4",
        ".webm": "video/webm",
        ".mkv": "video/x-matroska",
        ".mp3": "audio/mpeg",
        ".m4a": "audio/mp4",
        ".wav": "audio/wav",
        ".ogg": "audio/ogg",
        ".opus": "audio/opus",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
      };

      res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
      res.setHeader("Content-Length", stats.size);
      res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
      res.setHeader("Cache-Control", "private, max-age=3600");

      const stream = fs.createReadStream(filePath);
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to stream file" });
        }
      });
      stream.pipe(res);
    } catch (error) {
      console.error("Error serving file:", error);
      res.status(500).json({ error: "Failed to serve file" });
    }
  });

  // Queue endpoints
  app.get("/api/queue", async (req, res) => {
    try {
      const queue = await storage.getQueue();
      res.json(queue);
    } catch (error) {
      console.error("Error fetching queue:", error);
      res.status(500).json({ error: "Failed to fetch queue" });
    }
  });

  app.post("/api/queue/add", async (req, res) => {
    try {
      const result = batchDownloadRequestSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: result.error.errors 
        });
      }

      const { urls, outputType, format, quality } = result.data;
      const queueItems = [];

      for (const url of urls) {
        const platform = detectPlatform(url) || "unknown";
        const item = await storage.addToQueue({
          url,
          platform,
          outputType,
          format,
          quality,
          status: "pending",
          progress: 0,
        });
        queueItems.push(item);
      }

      res.json(queueItems);
    } catch (error) {
      console.error("Error adding to queue:", error);
      res.status(500).json({ error: "Failed to add to queue" });
    }
  });

  app.get("/api/queue/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const item = await storage.getQueueItem(id);

      if (!item) {
        return res.status(404).json({ error: "Queue item not found" });
      }

      res.json(item);
    } catch (error) {
      console.error("Error fetching queue item:", error);
      res.status(500).json({ error: "Failed to fetch queue item" });
    }
  });

  app.delete("/api/queue/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.removeFromQueue(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing from queue:", error);
      res.status(500).json({ error: "Failed to remove from queue" });
    }
  });

  app.delete("/api/queue", async (req, res) => {
    try {
      await storage.clearQueue();
      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing queue:", error);
      res.status(500).json({ error: "Failed to clear queue" });
    }
  });

  app.post("/api/queue/start", async (req, res) => {
    try {
      const queue = await storage.getQueue();
      const pendingItems = queue.filter(item => item.status === "pending");

      if (pendingItems.length === 0) {
        return res.json({ message: "No pending items in queue" });
      }

      res.json({ message: `Processing ${pendingItems.length} items`, count: pendingItems.length });

      // Process queue items sequentially with a small concurrency limit
      const processItem = async (item: typeof pendingItems[0]) => {
        try {
          await storage.updateQueueItem(item.id, {
            status: "fetching",
            progress: 5,
          });

          const result = await downloadMedia({
            url: item.url,
            outputType: item.outputType,
            format: item.format,
            quality: item.quality,
            onProgress: async (progress, status, speed, eta) => {
              await storage.updateQueueItem(item.id, {
                progress: Math.min(progress, 95),
                status: status === "completed" ? "converting" : "downloading",
                speed: speed || undefined,
                eta: eta || undefined,
              });
            },
          });

          const downloadUrl = getDownloadUrl(result.filePath);

          await storage.updateQueueItem(item.id, {
            status: "completed",
            progress: 100,
            title: result.title,
            thumbnail: result.thumbnail,
            fileSize: result.fileSize,
            downloadUrl,
          });

          await storage.addToHistory({
            url: item.url,
            title: result.title,
            thumbnail: result.thumbnail,
            platform: item.platform || "unknown",
            outputType: item.outputType,
            format: item.format,
            quality: item.quality,
            fileSize: result.fileSize,
            downloadUrl,
          });

        } catch (error) {
          console.error(`Error processing queue item ${item.id}:`, error);
          await storage.updateQueueItem(item.id, {
            status: "error",
            error: error instanceof Error ? error.message : "Download failed",
          });
        }
      };

      // Process up to 2 items concurrently
      const concurrencyLimit = 2;
      for (let i = 0; i < pendingItems.length; i += concurrencyLimit) {
        const batch = pendingItems.slice(i, i + concurrencyLimit);
        await Promise.all(batch.map(processItem));
      }

    } catch (error) {
      console.error("Error starting queue:", error);
      res.status(500).json({ error: "Failed to start queue processing" });
    }
  });

  return httpServer;
}
