import { Injectable } from '@angular/core';

import {
  KeychainAccess,
  SecureStorage,
} from '@aparajita/capacitor-secure-storage';
import { Preferences } from '@capacitor/preferences';

import type { KeyValueStorage } from './key-value-storage';

const KEY_PREFIX = 'starter.';

/**
 * Written to Preferences, which the OS deletes together with the app. Its absence means a fresh
 * install, so leftovers in the iOS Keychain (it survives uninstalling) are wiped (ADR-0016).
 */
export const INSTALL_MARKER_KEY = 'platform.secure-storage-installed';

/**
 * Keychain on iOS, AES-GCM with an Android Keystore key on Android (MOB-12, ADR-0016).
 * Never synchronised with iCloud and never migrated to another device.
 * Unreadable entries (a Keystore key lost after a backup restore) read as missing.
 */
@Injectable()
export class NativeSecureStorage implements KeyValueStorage {
  private ready: Promise<void> | null = null;

  async get(key: string): Promise<string | null> {
    await this.prepare();

    try {
      const value = await SecureStorage.get(key, false, false);
      return typeof value === 'string' ? value : null;
    } catch {
      await this.remove(key);
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    await this.prepare();
    await SecureStorage.set(
      key,
      value,
      false,
      false,
      KeychainAccess.whenUnlockedThisDeviceOnly,
    );
  }

  async remove(key: string): Promise<void> {
    await this.prepare();

    try {
      await SecureStorage.remove(key, false);
    } catch {
      // Nothing stored under the key, or the entry is already unreadable.
    }
  }

  private prepare(): Promise<void> {
    this.ready ??= this.initialise();
    return this.ready;
  }

  private async initialise(): Promise<void> {
    await SecureStorage.setSynchronize(false);
    await SecureStorage.setKeyPrefix(KEY_PREFIX);

    const { value: installMarker } = await Preferences.get({
      key: INSTALL_MARKER_KEY,
    });

    if (installMarker === null) {
      await SecureStorage.clear(false);
      await Preferences.set({ key: INSTALL_MARKER_KEY, value: '1' });
    }
  }
}
