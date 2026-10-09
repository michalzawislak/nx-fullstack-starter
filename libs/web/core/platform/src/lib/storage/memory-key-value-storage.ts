import type { KeyValueStorage } from './key-value-storage';

/**
 * Storage kept in memory. Used as the web SECURE_STORAGE (secrets must not outlive the page)
 * and as the test implementation of both storage tokens (FE-11).
 */
export class MemoryKeyValueStorage implements KeyValueStorage {
  private readonly values = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.values.delete(key);
  }
}
