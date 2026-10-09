import { Injectable } from '@angular/core';

import { Preferences } from '@capacitor/preferences';

import type { KeyValueStorage } from './key-value-storage';

/** @capacitor/preferences: UserDefaults on iOS, SharedPreferences on Android. Not for secrets (MOB-12). */
@Injectable()
export class NativeKeyValueStorage implements KeyValueStorage {
  async get(key: string): Promise<string | null> {
    const { value } = await Preferences.get({ key });
    return value;
  }

  async set(key: string, value: string): Promise<void> {
    await Preferences.set({ key, value });
  }

  async remove(key: string): Promise<void> {
    await Preferences.remove({ key });
  }
}
