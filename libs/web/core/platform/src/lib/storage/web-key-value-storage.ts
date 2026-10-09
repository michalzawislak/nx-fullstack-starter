import { DOCUMENT, inject, Injectable } from '@angular/core';

import type { KeyValueStorage } from './key-value-storage';

/** localStorage wrapper. Private browsing or disabled storage degrades to "nothing stored". */
@Injectable()
export class WebKeyValueStorage implements KeyValueStorage {
  private readonly storage = inject(DOCUMENT).defaultView?.localStorage ?? null;

  async get(key: string): Promise<string | null> {
    try {
      return this.storage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      this.storage?.setItem(key, value);
    } catch {
      // Quota exceeded or storage disabled: settings are best effort.
    }
  }

  async remove(key: string): Promise<void> {
    try {
      this.storage?.removeItem(key);
    } catch {
      // Storage disabled: nothing to remove.
    }
  }
}
