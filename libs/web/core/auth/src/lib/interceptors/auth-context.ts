import { HttpContext, HttpContextToken } from '@angular/common/http';

/** Requests that must not carry the access token or trigger a refresh (login, register, refresh). */
export const SKIP_AUTH_TOKEN = new HttpContextToken<boolean>(() => false);

/** Marks a request that was already retried after a refresh, so it is never retried twice (FE-14). */
export const RETRIED_AFTER_REFRESH = new HttpContextToken<boolean>(() => false);

export const SKIP_AUTH = new HttpContext().set(SKIP_AUTH_TOKEN, true);
