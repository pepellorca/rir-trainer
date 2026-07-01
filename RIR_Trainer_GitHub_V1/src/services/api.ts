import { Capacitor, CapacitorHttp } from '@capacitor/core';
import type { AppSettings, BootstrapData } from '../types';
import { demoBootstrap } from '../data/demo';

interface NativeApiResponse<T> {
  ok: boolean;
  data?: T;
  result?: T;
  message?: string;
}

export class ApiClient {
  constructor(private settings: () => AppSettings) {}

  async bootstrap(): Promise<BootstrapData> {
    const settings = this.settings();
    if (settings.demoMode) return structuredClone(demoBootstrap);
    this.assertConfigured(settings);
    const response = await this.request<BootstrapData>({ action: 'bootstrap' });
    return response.data ?? response.result ?? response as unknown as BootstrapData;
  }

  async write(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const settings = this.settings();
    if (settings.demoMode) {
      await new Promise(resolve => setTimeout(resolve, 180));
      return { ok: true, demo: true };
    }
    this.assertConfigured(settings);
    const response = await this.request<Record<string, unknown>>({ action: 'write', payload });
    return (response.result ?? response.data ?? response) as Record<string, unknown>;
  }

  async ping(): Promise<boolean> {
    const settings = this.settings();
    if (settings.demoMode) return true;
    this.assertConfigured(settings);
    const response = await this.request<{ pong: boolean }>({ action: 'ping' });
    return Boolean(response.ok && (response.data?.pong ?? response.result?.pong ?? true));
  }

  private assertConfigured(settings: AppSettings): void {
    if (!settings.apiUrl || !settings.apiToken) {
      throw new Error('Configura la URL y el token de la API en Ajustes.');
    }
  }

  private async request<T>(body: Record<string, unknown>): Promise<NativeApiResponse<T>> {
    const settings = this.settings();
    const data = { token: settings.apiToken, ...body };
    if (Capacitor.isNativePlatform()) {
      const response = await CapacitorHttp.post({
        url: settings.apiUrl,
        headers: { 'Content-Type': 'application/json' },
        data,
        connectTimeout: 20000,
        readTimeout: 30000,
      });
      const parsed = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      if (!parsed?.ok) throw new Error(parsed?.message || `Error de API (${response.status})`);
      return parsed as NativeApiResponse<T>;
    }

    const response = await fetch(settings.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data),
    });
    const parsed = await response.json() as NativeApiResponse<T>;
    if (!response.ok || !parsed.ok) throw new Error(parsed.message || `Error de API (${response.status})`);
    return parsed;
  }
}
