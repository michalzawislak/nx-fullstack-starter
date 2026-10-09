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
  provideApiConfig,
} from '@starter/web/core/http';
import { providePlatform } from '@starter/web/core/platform';

import { environment } from '../environments/environment';

import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes, withComponentInputBinding()),
    // Order matters: authInterceptor must see errors already mapped by apiErrorInterceptor.
    provideHttpClient(
      withFetch(),
      withInterceptors([
        appHeadersInterceptor,
        authInterceptor,
        apiErrorInterceptor,
      ]),
    ),
    providePlatform(),
    provideApiConfig({
      baseUrl: environment.apiBaseUrl,
      appVersion: environment.appVersion,
    }),
    provideAuth(),
  ],
};
