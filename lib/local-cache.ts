interface CacheItem<T> {
  data: T;
  expiry: number;
}

export class LocalCache {
  private static PREFIX = 'gms_cache_';

  static set<T>(key: string, data: T, expiresInMs: number = 5 * 60 * 1000): void {
    if (typeof window === 'undefined') return;

    const item: CacheItem<T> = {
      data,
      expiry: Date.now() + expiresInMs,
    };

    try {
      localStorage.setItem(this.PREFIX + key, JSON.stringify(item));
    } catch (e) {
      console.warn('LocalStorage full or unavailable', e);
    }
  }

  static get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;

    const itemStr = localStorage.getItem(this.PREFIX + key);
    if (!itemStr) return null;

    try {
      const item: CacheItem<T> = JSON.parse(itemStr);
      if (Date.now() > item.expiry) {
        this.remove(key);
        return null;
      }
      return item.data;
    } catch (e) {
      return null;
    }
  }

  static remove(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.PREFIX + key);
  }

  static clear(): void {
    if (typeof window === 'undefined') return;
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(this.PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }
}