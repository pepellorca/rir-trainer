import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export class JsonStorage {
  async get<T>(key: string, fallback: T): Promise<T> {
    try {
      if (Capacitor.isNativePlatform()) {
        const { value } = await Preferences.get({ key });
        return value ? JSON.parse(value) as T : fallback;
      }
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) as T : fallback;
    } catch {
      return fallback;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    const serialized = JSON.stringify(value);
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key, value: serialized });
      return;
    }
    localStorage.setItem(key, serialized);
  }

  async remove(key: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Preferences.remove({ key });
      return;
    }
    localStorage.removeItem(key);
  }
}

export const storage = new JsonStorage();
