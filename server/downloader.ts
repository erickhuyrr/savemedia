import { spawn, exec } from "child_process";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";
import type { VideoInfo, DownloadStatus } from "@shared/schema";
import { detectPlatform } from "@shared/schema";

const DOWNLOAD_DIR = path.join(process.cwd(), "downloads");

if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000,
  isRateLimited: (error: any) => boolean = (e) => e.message?.includes("rate") || e.message?.includes("429")
): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRateLimited(error)) throw error;
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Rate limited, retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delay);
      }
    }
  }
  throw lastError;
}

function execPromise(command: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 50 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stdout, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

export async function getVideoInfo(url: string): Promise<VideoInfo> {
  const platform = detectPlatform(url);
  
  if (platform === "pinterest") {
    return getPinterestInfo(url);
  }

  return new Promise((resolve, reject) => {
    const args = [
      url,
      "--dump-json",
      "--no-download",
      "--no-warnings",
      "-R", "5",
      "--socket-timeout", "30",
      "--no-check-certificates",
    ];

    if (platform === "instagram") {
      args.push("--extractor-args", "instagram:api_key=");
    }

    const ytdlpProcess = spawn("yt-dlp", args);
    let stdout = "";
    let stderr = "";

    ytdlpProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    ytdlpProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    ytdlpProcess.on("close", (code) => {
      if (code !== 0) {
        let errorMsg = stderr || "Failed to fetch video info";
        
        if (errorMsg.includes("rate-limit") || errorMsg.includes("429")) {
          errorMsg = "Rate limited - please try again in a few minutes";
        } else if (errorMsg.includes("Instagram")) {
          errorMsg = "Instagram content may be private or restricted. Try again later.";
        } else if (errorMsg.includes("login") || errorMsg.includes("401") || errorMsg.includes("403")) {
          errorMsg = "This content requires login or is private";
        }
        
        reject(new Error(errorMsg));
        return;
      }

      try {
        const info = JSON.parse(stdout);
        const detectedPlatform = detectPlatform(url) || info.extractor_key?.toLowerCase() || "other";
        
        resolve({
          id: info.id || randomUUID(),
          title: info.title || "Unknown Title",
          thumbnail: info.thumbnail || info.thumbnails?.[0]?.url,
          duration: info.duration,
          platform: detectedPlatform,
          uploader: info.uploader || info.channel,
          viewCount: info.view_count,
          mediaType: "video",
          formats: info.formats?.map((f: any) => ({
            formatId: f.format_id,
            ext: f.ext,
            quality: f.quality_label || f.format_note || (f.height ? `${f.height}p` : undefined),
            filesize: f.filesize || f.filesize_approx,
            hasVideo: f.vcodec !== "none",
            hasAudio: f.acodec !== "none",
          })),
        });
      } catch (error) {
        reject(new Error("Failed to parse video info"));
      }
    });

    process.on("error", (error) => {
      reject(new Error(`Failed to execute yt-dlp: ${error.message}`));
    });
  });
}

async function getPinterestInfo(url: string): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    const args = ["--dump-json", "--no-download", url];
    const process = spawn("gallery-dl", args);
    let stdout = "";
    let stderr = "";

    process.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    process.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    process.on("close", (code) => {
      if (code !== 0 && !stdout.trim()) {
        reject(new Error(stderr || "Failed to fetch Pinterest info"));
        return;
      }

      try {
        const lines = stdout.trim().split("\n").filter(l => l.trim());
        let title = "Pinterest Image";
        let imageCount = 0;
        let thumbnail = "";

        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            if (Array.isArray(entry) && entry.length > 1) {
              imageCount++;
              const info = entry[1];
              if (info?.description && title === "Pinterest Image") {
                title = info.description.substring(0, 100);
              }
              if (info?.url && !thumbnail) {
                thumbnail = info.url;
              }
            }
          } catch {}
        }

        resolve({
          id: randomUUID(),
          title: title || "Pinterest Image",
          thumbnail,
          platform: "pinterest",
          mediaType: "image",
          imageCount: Math.max(imageCount, 1),
        });
      } catch (error) {
        reject(new Error("Failed to parse Pinterest info"));
      }
    });

    process.on("error", (error) => {
      reject(new Error(`Failed to execute gallery-dl: ${error.message}`));
    });
  });
}

export interface DownloadOptions {
  url: string;
  outputType: "video" | "audio" | "image";
  format: string;
  quality: string;
  onProgress?: (progress: number, status: string, speed?: string, eta?: string) => void;
}

function sanitizeFilename(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9\s\-_]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .substring(0, 80)
    .trim() || "download";
}

async function downloadWithAria2c(
  url: string,
  outputPath: string,
  onProgress?: (progress: number, speed: string, eta: string) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(outputPath);
    const filename = path.basename(outputPath);

    const args = [
      url,
      "-d", dir,
      "-o", filename,
      "-x", "16",
      "-s", "16",
      "-k", "1M",
      "--max-connection-per-server=16",
      "--min-split-size=1M",
      "--file-allocation=none",
      "--console-log-level=notice",
      "--summary-interval=1",
      "--download-result=hide",
      "--allow-overwrite=true",
      "--auto-file-renaming=false",
      "--check-certificate=false",
    ];

    const process = spawn("aria2c", args);
    let lastProgress = 0;

    process.stdout.on("data", (data) => {
      const output = data.toString();
      
      const progressMatch = output.match(/\((\d+)%\)/);
      const speedMatch = output.match(/DL:([0-9.]+[KMGT]?i?B\/s)/);
      const etaMatch = output.match(/ETA:([0-9hms]+)/);

      if (progressMatch) {
        lastProgress = parseFloat(progressMatch[1]);
        onProgress?.(
          lastProgress,
          speedMatch?.[1] || "",
          etaMatch?.[1] || ""
        );
      }
    });

    process.stderr.on("data", (data) => {
      const output = data.toString();
      const progressMatch = output.match(/\((\d+)%\)/);
      if (progressMatch) {
        lastProgress = parseFloat(progressMatch[1]);
        onProgress?.(lastProgress, "", "");
      }
    });

    process.on("close", (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        resolve(outputPath);
      } else {
        reject(new Error("aria2c download failed"));
      }
    });

    process.on("error", (error) => {
      reject(error);
    });
  });
}

async function getDirectURL(url: string, outputType: string, format: string, quality: string): Promise<string | null> {
  try {
    const args = [url, "-g", "--no-warnings"];

    if (outputType === "audio") {
      args.push("-x", "--audio-format", format);
    } else {
      const formatStr = buildFormatString(quality, format);
      args.push("-f", formatStr);
    }

    const { stdout } = await execPromise(`yt-dlp ${args.map(a => `"${a}"`).join(" ")}`);
    const urls = stdout.trim().split("\n");
    return urls[0] || null;
  } catch {
    return null;
  }
}

function buildFormatString(quality: string, format: string): string {
  if (quality === "best") {
    return `(bestvideo+bestaudio/best)[ext=${format}]/bestvideo+bestaudio/best`;
  }
  if (quality === "worst") {
    return "worst";
  }

  const height = parseInt(quality);
  if (!isNaN(height)) {
    return `(bestvideo[height<=${height}]+bestaudio/best)[ext=${format}]/bestvideo[height<=${height}]+bestaudio/best`;
  }

  return "best";
}

async function downloadWithYtdlp(
  options: DownloadOptions,
  outputPath: string
): Promise<string> {
  const { url, outputType, format, quality, onProgress } = options;

  return new Promise((resolve, reject) => {
    const args: string[] = [url];

    args.push(
      "-R", "10",
      "--socket-timeout", "60",
      "--fragment-retries", "10",
      "--http-chunk-size", "10485760",
      "--concurrent-fragments", "8",
      "--no-warnings",
      "--progress",
      "--newline",
      "--no-check-certificates",
    );

    const platform = detectPlatform(url);
    if (platform === "instagram") {
      args.push("--extractor-args", "instagram:api_key=");
    }

    if (outputType === "audio") {
      args.push(
        "-x",
        "--audio-format", format,
        "--audio-quality", quality === "320kbps" ? "0" : 
                          quality === "256kbps" ? "1" :
                          quality === "192kbps" ? "2" :
                          quality === "128kbps" ? "4" : "6"
      );
    } else {
      const formatString = buildFormatString(quality, format);
      args.push("-f", formatString);
    }

    args.push("-o", outputPath);

    onProgress?.(0, "downloading");

    const ytdlpProcess = spawn("yt-dlp", args);
    let stderr = "";

    ytdlpProcess.stdout.on("data", (data) => {
      const output = data.toString();
      const progressMatch = output.match(/(\d+\.?\d*)%/);
      const speedMatch = output.match(/at\s+([0-9.]+[KMGT]?i?B\/s)/);
      const etaMatch = output.match(/ETA\s+([0-9:]+)/);
      
      if (progressMatch) {
        const progress = parseFloat(progressMatch[1]);
        onProgress?.(
          Math.min(progress, 99),
          "downloading",
          speedMatch?.[1],
          etaMatch?.[1]
        );
      }
    });

    ytdlpProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    ytdlpProcess.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || "Download failed"));
        return;
      }

      const finalPath = findDownloadedFile(outputPath, format);
      if (finalPath) {
        resolve(finalPath);
      } else {
        reject(new Error("Downloaded file not found"));
      }
    });

    ytdlpProcess.on("error", (error) => {
      reject(new Error(`Failed to execute yt-dlp: ${error.message}`));
    });
  });
}

async function downloadPinterest(
  url: string,
  format: string,
  onProgress?: (progress: number, status: string) => void
): Promise<{ filePath: string; title: string }> {
  const uniqueId = randomUUID().substring(0, 8);
  const tempDir = path.join(DOWNLOAD_DIR, `pinterest_${uniqueId}`);

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    const args = ["-d", tempDir, url];
    const process = spawn("gallery-dl", args);

    onProgress?.(10, "downloading");

    process.on("close", (code) => {
      if (code !== 0) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        reject(new Error("Failed to download Pinterest image"));
        return;
      }

      onProgress?.(80, "processing");

      let resultFile: string | null = null;
      const findImage = (dir: string) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            findImage(fullPath);
          } else {
            const ext = path.extname(file).toLowerCase();
            if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) {
              resultFile = fullPath;
              return;
            }
          }
        }
      };

      findImage(tempDir);

      if (!resultFile) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        reject(new Error("No image found in download"));
        return;
      }

      const ext = path.extname(resultFile);
      const filename = `pinterest_${uniqueId}${ext}`;
      const finalPath = path.join(DOWNLOAD_DIR, filename);

      try {
        fs.copyFileSync(resultFile, finalPath);
        fs.rmSync(tempDir, { recursive: true, force: true });
        
        onProgress?.(100, "completed");
        resolve({ filePath: finalPath, title: "Pinterest Image" });
      } catch (error) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        reject(error);
      }
    });

    process.on("error", (error) => {
      fs.rmSync(tempDir, { recursive: true, force: true });
      reject(error);
    });
  });
}

function findDownloadedFile(basePath: string, expectedFormat: string): string | null {
  if (fs.existsSync(basePath)) {
    return basePath;
  }

  const dir = path.dirname(basePath);
  const base = path.basename(basePath);
  const nameWithoutExt = base.replace(/\.[^.]+$/, "");

  const extensions = [expectedFormat, "mp4", "webm", "mkv", "m4a", "mp3", "opus", "ogg", "wav"];
  
  for (const ext of extensions) {
    const testPath = path.join(dir, `${nameWithoutExt}.${ext}`);
    if (fs.existsSync(testPath)) {
      return testPath;
    }
  }

  const files = fs.readdirSync(dir);
  const parts = nameWithoutExt.split("_");
  const uniqueId = parts[parts.length - 1];

  for (const file of files) {
    if (file.includes(uniqueId)) {
      return path.join(dir, file);
    }
  }

  return null;
}

export async function downloadMedia(options: DownloadOptions): Promise<{
  filePath: string;
  fileSize: number;
  title: string;
  thumbnail?: string;
}> {
  const { url, outputType, format, quality, onProgress } = options;
  const platform = detectPlatform(url);

  if (platform === "pinterest" || outputType === "image") {
    onProgress?.(5, "fetching");
    const result = await downloadPinterest(url, format, onProgress);
    const stats = fs.statSync(result.filePath);
    return {
      filePath: result.filePath,
      fileSize: stats.size,
      title: result.title,
    };
  }

  const info = await getVideoInfo(url);
  const safeTitle = sanitizeFilename(info.title);
  const uniqueId = randomUUID().substring(0, 8);
  const filename = `${safeTitle}_${uniqueId}.${format}`;
  const outputPath = path.join(DOWNLOAD_DIR, filename);

  onProgress?.(5, "downloading");

  let filePath: string;

  try {
    const directUrl = await getDirectURL(url, outputType, format, quality);
    if (directUrl && !directUrl.includes("manifest") && !directUrl.includes("m3u8")) {
      filePath = await downloadWithAria2c(directUrl, outputPath, (progress, speed, eta) => {
        onProgress?.(5 + progress * 0.9, "downloading", speed, eta);
      });
    } else {
      throw new Error("Use yt-dlp");
    }
  } catch {
    filePath = await downloadWithYtdlp(options, outputPath);
  }

  const stats = fs.statSync(filePath);
  onProgress?.(100, "completed");

  return {
    filePath,
    fileSize: stats.size,
    title: info.title,
    thumbnail: info.thumbnail,
  };
}

export function getDownloadUrl(filePath: string): string {
  const filename = path.basename(filePath);
  return `/api/files/${encodeURIComponent(filename)}`;
}

export function getFilePath(filename: string): string | null {
  const decodedFilename = decodeURIComponent(filename);
  const sanitizedFilename = path.basename(decodedFilename);
  const filePath = path.join(DOWNLOAD_DIR, sanitizedFilename);
  
  const resolvedPath = path.resolve(filePath);
  const resolvedDownloadDir = path.resolve(DOWNLOAD_DIR);
  
  if (!resolvedPath.startsWith(resolvedDownloadDir + path.sep) && resolvedPath !== resolvedDownloadDir) {
    return null;
  }
  
  return resolvedPath;
}

export function deleteOldFiles(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
  try {
    const files = fs.readdirSync(DOWNLOAD_DIR);
    const now = Date.now();

    for (const file of files) {
      const filePath = path.join(DOWNLOAD_DIR, file);
      try {
        const stats = fs.statSync(filePath);
        if (stats.isFile() && now - stats.mtimeMs > maxAgeMs) {
          fs.unlinkSync(filePath);
        }
      } catch {}
    }
  } catch (error) {
    console.error("Error cleaning up old files:", error);
  }
}

setInterval(() => deleteOldFiles(), 60 * 60 * 1000);
