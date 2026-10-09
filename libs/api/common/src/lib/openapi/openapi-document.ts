import * as z from 'zod';

import {
  API_ENDPOINTS,
  apiErrorSchema,
  type EndpointContract,
} from '@starter/shared/contracts';

type JsonSchema = Record<string, unknown>;

interface OpenApiOperation {
  operationId: string;
  tags: string[];
  security?: Record<string, string[]>[];
  requestBody?: {
    required: boolean;
    content: { 'application/json': { schema: JsonSchema } };
  };
  responses: Record<
    string,
    {
      description: string;
      content?: { 'application/json': { schema: JsonSchema } };
    }
  >;
}

export interface OpenApiDocument {
  openapi: '3.0.3';
  info: { title: string; version: string };
  paths: Record<string, Record<string, OpenApiOperation>>;
  components: {
    schemas: Record<string, JsonSchema>;
    securitySchemes: Record<string, JsonSchema>;
  };
}

const toSchema = (schema: z.ZodType, io: 'input' | 'output'): JsonSchema =>
  z.toJSONSchema(schema, {
    target: 'openapi-3.0',
    io,
    unrepresentable: 'any',
  }) as JsonSchema;

const errorResponse = {
  description: 'Error',
  content: {
    'application/json': { schema: { $ref: '#/components/schemas/ApiError' } },
  },
};

function toOperation(
  group: string,
  name: string,
  endpoint: EndpointContract,
): OpenApiOperation {
  const successStatus =
    endpoint.response === null
      ? '204'
      : endpoint.method === 'POST' && name === 'register'
        ? '201'
        : '200';

  return {
    operationId: `${group}.${name}`,
    tags: [group],
    ...(endpoint.access === 'user' ? { security: [{ bearer: [] }] } : {}),
    ...(endpoint.request
      ? {
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: toSchema(endpoint.request, 'input'),
              },
            },
          },
        }
      : {}),
    responses: {
      [successStatus]: endpoint.response
        ? {
            description: 'Success',
            content: {
              'application/json': {
                schema: toSchema(endpoint.response, 'output'),
              },
            },
          }
        : { description: 'No content' },
      default: errorResponse,
    },
  };
}

/** OpenAPI document generated from the shared contract (BE-15), so it cannot drift from the code. */
export function buildOpenApiDocument(info: {
  title: string;
  version: string;
}): OpenApiDocument {
  const entries: [string, string, EndpointContract][] = [
    ...Object.entries(API_ENDPOINTS.auth).map(
      ([name, endpoint]): [string, string, EndpointContract] => [
        'auth',
        name,
        endpoint,
      ],
    ),
    ...Object.entries(API_ENDPOINTS.users).map(
      ([name, endpoint]): [string, string, EndpointContract] => [
        'users',
        name,
        endpoint,
      ],
    ),
    ...Object.entries(API_ENDPOINTS.app).map(
      ([name, endpoint]): [string, string, EndpointContract] => [
        'app',
        name,
        endpoint,
      ],
    ),
    ['health', 'status', API_ENDPOINTS.health],
  ];

  const paths = entries.reduce<OpenApiDocument['paths']>(
    (documentPaths, [group, name, endpoint]) => ({
      ...documentPaths,
      [endpoint.path]: {
        ...documentPaths[endpoint.path],
        [endpoint.method.toLowerCase()]: toOperation(group, name, endpoint),
      },
    }),
    {},
  );

  return {
    openapi: '3.0.3',
    info,
    paths,
    components: {
      schemas: { ApiError: toSchema(apiErrorSchema, 'output') },
      securitySchemes: {
        bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  };
}
