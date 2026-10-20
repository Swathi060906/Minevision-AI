import { IStorageAdapter } from './storageAdapter';

export class LocalStorageAdapter implements IStorageAdapter {
  private prefix: string;
  private memoryFallback: Map<string, string>;

  constructor(prefix = 'minevision_v3_') {
    this.prefix = prefix;
    this.memoryFallback = new Map<string, string>();
  }

  private isLocalStorageAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      const testKey = '__test_storage__';
      window.localStorage.setItem(testKey, '1');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    const fullKey = this.prefix + key;
    try {
      if (this.isLocalStorageAvailable()) {
        const raw = window.localStorage.getItem(fullKey);
        if (!raw) return null;
        return JSON.parse(raw) as T;
      } else {
        const raw = this.memoryFallback.get(fullKey);
        if (!raw) return null;
        return JSON.parse(raw) as T;
      }
    } catch (err) {
      console.warn(`[LocalStorageAdapter] Failed to read key: ${key}`, err);
      return null;
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    const fullKey = this.prefix + key;
    try {
      const serialized = JSON.stringify(value);
      if (this.isLocalStorageAvailable()) {
        window.localStorage.setItem(fullKey, serialized);
      } else {
        this.memoryFallback.set(fullKey, serialized);
      }
    } catch (err) {
      console.warn(`[LocalStorageAdapter] Failed to write key: ${key}`, err);
    }
  }

  async removeItem(key: string): Promise<void> {
    const fullKey = this.prefix + key;
    try {
      if (this.isLocalStorageAvailable()) {
        window.localStorage.removeItem(fullKey);
      } else {
        this.memoryFallback.delete(fullKey);
      }
    } catch (err) {
      console.warn(`[LocalStorageAdapter] Failed to remove key: ${key}`, err);
    }
  }

  async clear(): Promise<void> {
    try {
      if (this.isLocalStorageAvailable()) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key && key.startsWith(this.prefix)) {
            keysToRemove.push(key);
          }
        }
        for (const k of keysToRemove) {
          window.localStorage.removeItem(k);
        }
      }
      this.memoryFallback.clear();
    } catch (err) {
      console.warn('[LocalStorageAdapter] Failed to clear items', err);
    }
  }
}

export const defaultStorage = new LocalStorageAdapter();
