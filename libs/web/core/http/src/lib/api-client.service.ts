import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { map, type Observable } from 'rxjs';

import {
  type EndpointContract,
  type EndpointRequest,
  type EndpointResponse,
  REFRESH_TOKEN_COOKIE,
} from '@starter/shared/contracts';

import { API_CONFIG } from './api-config';

type RequestArguments<TEndpoint extends EndpointContract> =
  EndpointRequest<TEndpoint> extends void
    ? [body?: undefined, options?: ApiRequestOptions]
    : [body: EndpointRequest<TEndpoint>, options?: ApiRequestOptions];

export interface ApiRequestOptions {
  readonly context?: HttpContext;
}

/**
 * Typed client for the endpoints in API_ENDPOINTS (CON-1). Paths, methods and types come from the
 * contract; responses are parsed with the response schema, which drops unknown fields (CON-7).
 */
@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  request<TEndpoint extends EndpointContract>(
    endpoint: TEndpoint,
    ...[body, options]: RequestArguments<TEndpoint>
  ): Observable<EndpointResponse<TEndpoint>> {
    return this.http
      .request<unknown>(
        endpoint.method,
        `${this.config.baseUrl}${endpoint.path}`,
        {
          body: body ?? (endpoint.request ? {} : undefined),
          context: options?.context,
          // The web refresh token travels in an httpOnly cookie scoped to /v1/auth (BE-4);
          // credentials are needed to receive and send it, and only there.
          withCredentials: endpoint.path.startsWith(REFRESH_TOKEN_COOKIE.path),
        },
      )
      .pipe(
        map(
          (response) =>
            (endpoint.response
              ? endpoint.response.parse(response)
              : undefined) as EndpointResponse<TEndpoint>,
        ),
      );
  }
}
