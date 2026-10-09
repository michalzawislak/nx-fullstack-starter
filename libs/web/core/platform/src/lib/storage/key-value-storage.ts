import { InjectionToken } from '@angular/core';

/** Asynchronous string storage (FE-10): localStorage on the web, Preferences on native. */
export interface KeyValueStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

/** Non-sensitive settings only. Tokens belong in SECURE_STORAGE (MOB-12). */
export const KEY_VALUE_STORAGE = new InjectionToken<KeyValueStorage>(
  'KEY_VALUE_STORAGE',
);

/** Secrets: memory on the web (the refresh token is an httpOnly cookie), Keychain or Keystore on native. */
export const SECURE_STORAGE = new InjectionToken<KeyValueStorage>(
  'SECURE_STORAGE',
);
