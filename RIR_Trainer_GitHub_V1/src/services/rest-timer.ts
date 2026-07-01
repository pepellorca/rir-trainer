import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { RestTimerState } from '../types';
import { storage } from './storage';

const TIMER_KEY = 'rir.rest.timer.v8';
const NOTIFICATION_ID = 7301;

type Listener = (state: RestTimerState & { remaining: number }) => void;

const emptyState: RestTimerState = {
  active: false,
  endAt: 0,
  totalSeconds: 0,
  exerciseName: '',
  nextSetLabel: '',
  notificationId: NOTIFICATION_ID,
};

export class RestTimer {
  private state: RestTimerState = { ...emptyState };
  private interval?: number;
  private listeners = new Set<Listener>();

  async init(): Promise<void> {
    this.state = await storage.get<RestTimerState>(TIMER_KEY, { ...emptyState });
    if (this.state.active && this.remaining() <= 0) {
      await this.finish();
    } else if (this.state.active) {
      this.startTicking();
    }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.state.active && this.remaining() <= 0) void this.finish();
      this.emit();
    });
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state, remaining: this.remaining() });
    return () => this.listeners.delete(listener);
  }

  async requestPermission(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return true;
    const current = await LocalNotifications.checkPermissions();
    if (current.display === 'granted') return true;
    const requested = await LocalNotifications.requestPermissions();
    return requested.display === 'granted';
  }

  async start(seconds: number, exerciseName: string, nextSetLabel: string): Promise<void> {
    await this.cancelNotification();
    const safeSeconds = Math.max(1, Math.round(seconds));
    this.state = {
      active: true,
      endAt: Date.now() + safeSeconds * 1000,
      totalSeconds: safeSeconds,
      exerciseName,
      nextSetLabel,
      notificationId: NOTIFICATION_ID,
    };
    await storage.set(TIMER_KEY, this.state);
    this.startTicking();
    await Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
    if (Capacitor.isNativePlatform() && await this.requestPermission()) {
      await LocalNotifications.schedule({
        notifications: [{
          id: NOTIFICATION_ID,
          title: 'Descanso terminado',
          body: `${exerciseName}${nextSetLabel ? ` · ${nextSetLabel}` : ''}`,
          schedule: { at: new Date(this.state.endAt), allowWhileIdle: true },
          sound: 'rest-complete.wav',
          extra: { type: 'rest-finished' },
        }],
      }).catch(() => undefined);
    }
    this.emit();
  }

  async add(seconds: number): Promise<void> {
    if (!this.state.active) return;
    this.state.endAt += seconds * 1000;
    this.state.totalSeconds += seconds;
    await storage.set(TIMER_KEY, this.state);
    await this.start(this.remaining(), this.state.exerciseName, this.state.nextSetLabel);
  }

  async skip(): Promise<void> {
    await this.cancelNotification();
    this.state = { ...emptyState };
    await storage.set(TIMER_KEY, this.state);
    this.stopTicking();
    this.emit();
  }

  getState(): RestTimerState & { remaining: number } {
    return { ...this.state, remaining: this.remaining() };
  }

  private remaining(): number {
    return this.state.active ? Math.max(0, Math.ceil((this.state.endAt - Date.now()) / 1000)) : 0;
  }

  private startTicking(): void {
    this.stopTicking();
    this.interval = window.setInterval(() => {
      if (this.remaining() <= 0) void this.finish();
      else this.emit();
    }, 250);
  }

  private stopTicking(): void {
    if (this.interval !== undefined) window.clearInterval(this.interval);
    this.interval = undefined;
  }

  private async finish(): Promise<void> {
    this.stopTicking();
    this.state.active = false;
    await storage.set(TIMER_KEY, this.state);
    await Haptics.notification({ type: NotificationType.Success }).catch(() => undefined);
    this.emit();
  }

  private async cancelNotification(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] }).catch(() => undefined);
  }

  private emit(): void {
    const snapshot = this.getState();
    this.listeners.forEach(listener => listener(snapshot));
  }
}
