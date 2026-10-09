import type * as z from 'zod/mini';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Who may call an endpoint (PRD section 7.1). */
export type EndpointAccess = 'public' | 'user' | 'refresh-token';

/** Any Zod schema (zod/mini in the contract; the API may also pass classic Zod schemas). */
export type ContractSchema = z.core.$ZodType;

/** Request and response contract of one endpoint (CON-1). `null` means no body. */
export interface EndpointContract {
  readonly method: HttpMethod;
  readonly path: string;
  readonly access: EndpointAccess;
  readonly request: ContractSchema | null;
  readonly response: ContractSchema | null;
}

/** Keeps the literal types of an endpoint definition. */
export function defineEndpoint<const TEndpoint extends EndpointContract>(
  endpoint: TEndpoint,
): TEndpoint {
  return endpoint;
}

/** Request body a client sends (schema input, before transforms such as email normalisation). */
export type EndpointRequest<TEndpoint extends EndpointContract> =
  TEndpoint['request'] extends ContractSchema
    ? z.input<TEndpoint['request']>
    : void;

/** Response body after parsing. */
export type EndpointResponse<TEndpoint extends EndpointContract> =
  TEndpoint['response'] extends ContractSchema
    ? z.output<TEndpoint['response']>
    : void;
