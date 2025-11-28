import { randomUUID } from "crypto";
import type { DownloadStatus, DownloadHistoryItem, QueueItem } from "@shared/schema";

export interface IStorage {
  createDownload(download: Omit<DownloadStatus, "id" | "createdAt">): Promise<DownloadStatus>;
  getDownload(id: string): Promise<DownloadStatus | undefined>;
  updateDownload(id: string, updates: Partial<DownloadStatus>): Promise<DownloadStatus | undefined>;
  getDownloadHistory(): Promise<DownloadHistoryItem[]>;
  addToHistory(item: Omit<DownloadHistoryItem, "id" | "createdAt">): Promise<DownloadHistoryItem>;
  clearHistory(): Promise<void>;
  // Queue operations
  addToQueue(item: Omit<QueueItem, "id" | "addedAt">): Promise<QueueItem>;
  getQueue(): Promise<QueueItem[]>;
  getQueueItem(id: string): Promise<QueueItem | undefined>;
  updateQueueItem(id: string, updates: Partial<QueueItem>): Promise<QueueItem | undefined>;
  removeFromQueue(id: string): Promise<void>;
  clearQueue(): Promise<void>;
}

export class MemStorage implements IStorage {
  private downloads: Map<string, DownloadStatus>;
  private history: DownloadHistoryItem[];
  private queue: Map<string, QueueItem>;

  constructor() {
    this.downloads = new Map();
    this.history = [];
    this.queue = new Map();
  }

  async createDownload(download: Omit<DownloadStatus, "id" | "createdAt">): Promise<DownloadStatus> {
    const id = randomUUID();
    const newDownload: DownloadStatus = {
      ...download,
      id,
      createdAt: new Date().toISOString(),
    };
    this.downloads.set(id, newDownload);
    return newDownload;
  }

  async getDownload(id: string): Promise<DownloadStatus | undefined> {
    return this.downloads.get(id);
  }

  async updateDownload(id: string, updates: Partial<DownloadStatus>): Promise<DownloadStatus | undefined> {
    const download = this.downloads.get(id);
    if (!download) return undefined;

    const updated = { ...download, ...updates };
    this.downloads.set(id, updated);
    return updated;
  }

  async getDownloadHistory(): Promise<DownloadHistoryItem[]> {
    return this.history.slice(0, 20);
  }

  async addToHistory(item: Omit<DownloadHistoryItem, "id" | "createdAt">): Promise<DownloadHistoryItem> {
    const historyItem: DownloadHistoryItem = {
      ...item,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.history.unshift(historyItem);
    if (this.history.length > 50) {
      this.history = this.history.slice(0, 50);
    }
    return historyItem;
  }

  async clearHistory(): Promise<void> {
    this.history = [];
  }

  async addToQueue(item: Omit<QueueItem, "id" | "addedAt">): Promise<QueueItem> {
    const id = randomUUID();
    const queueItem: QueueItem = {
      ...item,
      id,
      addedAt: new Date().toISOString(),
    };
    this.queue.set(id, queueItem);
    return queueItem;
  }

  async getQueue(): Promise<QueueItem[]> {
    return Array.from(this.queue.values()).sort((a, b) => 
      new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime()
    );
  }

  async getQueueItem(id: string): Promise<QueueItem | undefined> {
    return this.queue.get(id);
  }

  async updateQueueItem(id: string, updates: Partial<QueueItem>): Promise<QueueItem | undefined> {
    const item = this.queue.get(id);
    if (!item) return undefined;

    const updated = { ...item, ...updates };
    this.queue.set(id, updated);
    return updated;
  }

  async removeFromQueue(id: string): Promise<void> {
    this.queue.delete(id);
  }

  async clearQueue(): Promise<void> {
    this.queue.clear();
  }
}

export const storage = new MemStorage();
