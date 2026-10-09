import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import {
  type ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';

import { provideRouter, withComponentInputBinding } from '@angular/router';

import { authInterceptor, provideAuth } from '@starter/web/core/auth';
import {
  apiErrorInterceptor,
  appHeadersInterceptor,
  appVersionInterceptor,
  provideApiConfig,
} from '@starter/web/core/http';
import {
  detectAppPlatform,
  provideNativeShell,
  providePlatform,
} from '@starter/web/core/platform';

import { environment } from '../environments/environment';

import { appRoutes } from './app.routes';
import { resolveApiBaseUrl } from './resolve-api-base-url';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes, withComponentInputBinding()),
    // Order matters: appVersionInterceptor and authInterceptor must see errors already mapped by apiErrorInterceptor.
    provideHttpClient(
      withFetch(),
      withInterceptors([
        appHeadersInterceptor,
        appVersionInterceptor,
        authInterceptor,
        apiErrorInterceptor,
      ]),
    ),
    providePlatform(),
    // Back button, deep links, keyboard, status bar and splash screen on iOS and Android (PRD 6.4).
    provideNativeShell(),
    provideApiConfig({
      baseUrl: resolveApiBaseUrl(environment, detectAppPlatform()),
      appVersion: environment.appVersion,
    }),
    provideAuth(),
  ],
};
