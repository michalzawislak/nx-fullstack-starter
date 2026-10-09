import {
  computed,
  DestroyRef,
  effect,
  inject,
  Injectable,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { filter, firstValueFrom } from 'rxjs';

import { ApiClient, isApiErrorWithCode } from '@starter/web/core/http';
import { APP_LIFECYCLE, NETWORK_STATUS } from '@starter/web/core/platform';

import {
  API_ENDPOINTS,
  type LoginRequest,
  type RegisterRequest,
  type TokenPair,
} from '@starter/shared/contracts';

import { SKIP_AUTH } from '../interceptors/auth-context';
import { RefreshTokenStore } from './refresh-token-store';

export type SessionStatus = 'unknown' | 'authenticated' | 'anonymous';

interface SessionState {
  readonly status: SessionStatus;
  readonly accessToken: string | null;
  /** Epoch milliseconds when the access token expires. */
  readonly expiresAt: number | null;
}

const ANONYMOUS: SessionState = {
  status: 'anonymous',
  accessToken: null,
  expiresAt: null,
};

/** Refresh a little before the real expiry so requests do not race the clock. */
const EXPIRY_MARGIN_MS = 30_000;

/**
 * Session state in signals (FE-2). The access token lives only in memory; the refresh token
 * is handled by RefreshTokenStore and the API cookie. Concurrent refreshes share one request (FE-14).
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly apiClient = inject(ApiClient);
  private readonly refreshTokenStore = inject(RefreshTokenStore);
  private readonly state = signal<SessionState>({
    status: 'unknown',
    accessToken: null,
    expiresAt: null,
  });
  private refreshInFlight: Promise<boolean> | null = null;
  /** Restore failed for a reason other than an invalid token (offline): retry when back online. */
  private isRestorePending = false;

  readonly status = computed(() => this.state().status);
  readonly isAuthenticated = computed(
    () => this.state().status === 'authenticated',
  );
  readonly accessToken = computed(() => this.state().accessToken);

  constructor() {
    // MOB-6: after the app comes back from the background, refresh an expired access token.
    inject(APP_LIFECYCLE)
      .events.pipe(
        filter((event) => event.type === 'resume'),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe(() => {
        if (this.isAuthenticated() && this.isAccessTokenExpired()) {
          void this.refresh();
        }
      });

    // MOB-10: a start without network keeps the stored refresh token and restores the session later.
    const network = inject(NETWORK_STATUS);
    effect(() => {
      if (network.isOnline() && untracked(() => this.isRestorePending)) {
        this.isRestorePending = false;
        void untracked(() => this.refresh());
      }
    });
  }

  /** Restores the session at startup from the refresh token (cookie or secure storage). */
  async restore(): Promise<void> {
    if (this.state().status === 'unknown') {
      await this.refresh();
    }
  }

  async login(credentials: LoginRequest): Promise<void> {
    await this.startSession(
      await firstValueFrom(
        this.apiClient.request(API_ENDPOINTS.auth.login, credentials, {
          context: SKIP_AUTH,
        }),
      ),
    );
  }

  async register(account: RegisterRequest): Promise<void> {
    await this.startSession(
      await firstValueFrom(
        this.apiClient.request(API_ENDPOINTS.auth.register, account, {
          context: SKIP_AUTH,
        }),
      ),
    );
  }

  /** Ends the session locally even when the API call fails (offline, expired token). */
  async logout(): Promise<void> {
    const refreshToken = await this.refreshTokenStore.read();

    try {
      await firstValueFrom(
        this.apiClient.request(API_ENDPOINTS.auth.logout, { refreshToken }),
      );
    } catch {
      // The local session ends regardless.
    } finally {
      await this.endSession();
    }
  }

  /**
   * Gets a new access token. Parallel callers wait for the same request (FE-14).
   * Resolves to false on failure. Only an invalid refresh token ends the session; a network failure
   * keeps the stored token, so an offline start does not sign the user out (MOB-10).
   */
  refresh(): Promise<boolean> {
    this.refreshInFlight ??= this.performRefresh().finally(() => {
      this.refreshInFlight = null;
    });

    return this.refreshInFlight;
  }

  isAccessTokenExpired(now = Date.now()): boolean {
    const { expiresAt } = this.state();
    return expiresAt === null || now >= expiresAt - EXPIRY_MARGIN_MS;
  }

  private async performRefresh(): Promise<boolean> {
    try {
      const refreshToken = await this.refreshTokenStore.read();
      const tokenPair = await firstValueFrom(
        this.apiClient.request(
          API_ENDPOINTS.auth.refresh,
          { refreshToken },
          { context: SKIP_AUTH },
        ),
      );
      await this.startSession(tokenPair);
      return true;
    } catch (error: unknown) {
      if (isApiErrorWithCode(error, 'REFRESH_TOKEN_INVALID')) {
        await this.endSession();
      } else if (this.state().status === 'unknown') {
        this.isRestorePending = true;
        this.state.set(ANONYMOUS);
      }

      return false;
    }
  }

  private async startSession(tokenPair: TokenPair): Promise<void> {
    await this.refreshTokenStore.save(tokenPair.refreshToken);
    this.state.set({
      status: 'authenticated',
      accessToken: tokenPair.accessToken,
      expiresAt: Date.now() + tokenPair.expiresIn * 1000,
    });
  }

  private async endSession(): Promise<void> {
    await this.refreshTokenStore.clear();
    this.state.set(ANONYMOUS);
  }
}
