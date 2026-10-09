---
name: add-endpoint
description: Add or change an HTTP endpoint of the API end to end - Zod contract, API_ENDPOINTS entry, NestJS controller with validation, error codes and tests. Use for any new route or a change to a request or response shape.
---

# Add an API endpoint

The contract in `libs/shared/contracts` is the single source of truth (PRD section 8). Work in this order so types break at compile time on both sides when something is missing.

## 1. Contract (`libs/shared/contracts`)

1. Create or extend `src/lib/<area>/<name>.contract.ts` with the request and response schemas and their inferred types:

   ```ts
   export const createNoteRequestSchema = z.object({ title: z.string().trim().min(1).max(200) });
   export type CreateNoteRequest = z.infer<typeof createNoteRequestSchema>;
   ```

2. Add the route segment to `API_ROUTES` and the full path to `API_PATHS` in `src/lib/api/api-routes.ts`.
3. Register the endpoint in `API_ENDPOINTS` (`src/lib/api/api-endpoints.ts`) with `defineEndpoint({ method, path, access, request, response })`. `access` is `public`, `user` or `refresh-token`; GET endpoints have `request: null`, endpoints without a body in the response have `response: null`.
4. New error situation? Add the code to `ERROR_CODES` and `ERROR_CODE_STATUS` in `src/lib/errors/error-code.ts`.
5. Export new files from `src/index.ts`.
6. Tests: valid and invalid data for each schema, and update the table test in `src/lib/api/api-endpoints.spec.ts`.

Within `/v1` only additive changes are allowed: new endpoints and new optional fields (CON-5). A breaking change needs a new version and an ADR.

## 2. API (`libs/api/<module>`)

```ts
@Controller({ path: API_ROUTES.notes.controller, version: API_VERSION })
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post(API_ROUTES.notes.create)
  create(@Body(new SchemaValidationPipe(createNoteRequestSchema)) body: CreateNoteRequest, @CurrentUser() currentUser: AuthenticatedUser): Promise<Note> {
    return this.notesService.create(currentUser.userId, body);
  }
}
```

- Every route needs an access token unless it has `@Public()` (from `@starter/api/common`).
- Validate every body, query and param with `SchemaValidationPipe` and a schema from the contract.
- Throw `new ApiException('<ERROR_CODE>', 'message')` for expected errors; never return error objects by hand.
- Return types are the contract types (`Note`), never database rows. Map rows in the service.
- Set `@HttpCode(HttpStatus.OK)` on POST endpoints that do not create a resource.

## 3. Tests

- Unit tests next to the code (`*.spec.ts`, Arrange-Act-Assert) for the service logic.
- An integration test in `apps/api/src/integration/<area>.integration.spec.ts` that calls the endpoint over HTTP with `createTestApp()` and checks the status, the body against the response schema and each error code.

## 4. Verify

```sh
npx nx run-many -t lint typecheck test -p shared-contracts
npx nx affected -t lint test build
npm run test:integration
```

The OpenAPI document at `/docs` is generated from `API_ENDPOINTS`, so no extra step is needed. The PRD endpoint table (section 7.1) should list the new endpoint.
