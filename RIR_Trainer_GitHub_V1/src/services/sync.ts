import { Network } from '@capacitor/network';
import type { SyncJob } from '../types';
import { storage } from './storage';
import type { ApiClient } from './api';

const QUEUE_KEY = 'rir.sync.queue.v8';

type Listener = (state: SyncState) => void;

export interface SyncState {
  connected: boolean;
  syncing: boolean;
  pending: number;
  failed: number;
  lastSyncedAt?: string;
}

export class SyncQueue {
  private jobs: SyncJob[] = [];
  private syncing = false;
  private connected = true;
  private listeners = new Set<Listener>();
  private lastSyncedAt?: string;

  constructor(private api: ApiClient) {}

  async init(): Promise<void> {
    this.jobs = await storage.get<SyncJob[]>(QUEUE_KEY, []);
    const status = await Network.getStatus().catch(() => ({ connected: navigator.onLine }));
    this.connected = status.connected;
    await Network.addListener('networkStatusChange', statusChange => {
      this.connected = statusChange.connected;
      this.emit();
      if (this.connected) void this.flush();
    }).catch(() => undefined);
    window.addEventListener('online', () => { this.connected = true; this.emit(); void this.flush(); });
    window.addEventListener('offline', () => { this.connected = false; this.emit(); });
    if (this.connected) void this.flush();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state());
    return () => this.listeners.delete(listener);
  }

  state(): SyncState {
    return {
      connected: this.connected,
      syncing: this.syncing,
      pending: this.jobs.length,
      failed: this.jobs.filter(job => job.state === 'failed').length,
      lastSyncedAt: this.lastSyncedAt,
    };
  }

  async enqueue(payload: Record<string, unknown>, id?: string): Promise<void> {
    const job: SyncJob = {
      id: id ?? crypto.randomUUID(),
      payload,
      createdAt: new Date().toISOString(),
      attempts: 0,
      state: 'pending',
    };
    const existing = this.jobs.findIndex(item => item.id === job.id);
    if (existing >= 0) this.jobs[existing] = job;
    else this.jobs.push(job);
    await this.persist();
    this.emit();
    if (this.connected) void this.flush();
  }

  async flush(): Promise<void> {
    if (!this.connected || this.syncing || !this.jobs.length) return;
    this.syncing = true;
    this.emit();
    try {
      const remaining: SyncJob[] = [];
      for (const job of this.jobs) {
        try {
          job.state = 'syncing';
          job.attempts += 1;
          await this.api.write(job.payload);
          this.lastSyncedAt = new Date().toISOString();
        } catch (error) {
          job.state = job.attempts >= 4 ? 'failed' : 'pending';
          job.lastError = error instanceof Error ? error.message : String(error);
          remaining.push(job);
          if (!this.connected) break;
        }
      }
      this.jobs = remaining;
      await this.persist();
    } finally {
      this.syncing = false;
      this.emit();
    }
  }

  async retryAll(): Promise<void> {
    this.jobs.forEach(job => { job.state = 'pending'; job.attempts = 0; delete job.lastError; });
    await this.persist();
    await this.flush();
  }

  private async persist(): Promise<void> {
    await storage.set(QUEUE_KEY, this.jobs);
  }

  private emit(): void {
    const current = this.state();
    this.listeners.forEach(listener => listener(current));
  }
}
