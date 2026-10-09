import { inject, Injectable } from '@angular/core';

import { PLATFORM_INFO, SECURE_STORAGE } from '@starter/web/core/platform';

const REFRESH_TOKEN_KEY = 'auth.refresh-token';

/**
 * Where the refresh token lives (BE-4, MOB-12): in SECURE_STORAGE on native apps;
 * on the web the API keeps it in an httpOnly cookie, so there is nothing to store.
 */
@Injectable({ providedIn: 'root' })
export class RefreshTokenStore {
  private readonly secureStorage = inject(SECURE_STORAGE);
  private readonly platformInfo = inject(PLATFORM_INFO);

  async read(): Promise<string | undefined> {
    if (!this.platformInfo.isNative()) {
      return undefined;
    }

    return (await this.secureStorage.get(REFRESH_TOKEN_KEY)) ?? undefined;
  }

  async save(refreshToken: string | undefined): Promise<void> {
    if (this.platformInfo.isNative() && refreshToken) {
      await this.secureStorage.set(REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  async clear(): Promise<void> {
    await this.secureStorage.remove(REFRESH_TOKEN_KEY);
  }
}
