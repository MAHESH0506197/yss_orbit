// yss_orbit\frontend\src\core\performance\cacheStrategy.ts
export class CacheStrategy {
  static get(key: string): any | null {
    const itemStr = sessionStorage.getItem(key);
    if (!itemStr) return null;
    try {
      const item = JSON.parse(itemStr);
      const now = new Date();
      if (now.getTime() > item.expiry) {
        sessionStorage.removeItem(key);
        return null;
      }
      return item.value;
    } catch (e) {
      return null;
    }
  }

  static set(key: string, value: any, ttlMs: number = 300000) {
    const now = new Date();
    const item = {
      value,
      expiry: now.getTime() + ttlMs,
    };
    sessionStorage.setItem(key, JSON.stringify(item));
  }

  static clear(key: string) {
    sessionStorage.removeItem(key);
  }
}
