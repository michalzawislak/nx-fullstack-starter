import { inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { ApiClient } from '@starter/web/core/http';

import { API_ENDPOINTS } from '@starter/shared/contracts';

/** GET /v1/users/me as a resource (FE-2): value, isLoading and error as signals. Call in an injection context. */
export function currentUserResource() {
  const apiClient = inject(ApiClient);
  return rxResource({
    stream: () => apiClient.request(API_ENDPOINTS.users.me),
  });
}
