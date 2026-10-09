import * as z from 'zod/mini';

import { ApiException } from '../errors/api.exception';
import { SchemaValidationPipe } from './schema-validation.pipe';

const schema = z.object({
  email: z.pipe(z.string().check(z.trim(), z.toLowerCase()), z.email()),
  profile: z.object({ age: z.int().check(z.gte(18)) }),
});

describe('SchemaValidationPipe', () => {
  it('returns the parsed value including transforms', async () => {
    // Arrange
    const pipe = new SchemaValidationPipe(schema);

    // Act
    const value = await pipe.transform({
      email: ' Jane@Example.com ',
      profile: { age: 30 },
      extra: true,
    });

    // Assert
    expect(value).toEqual({ email: 'jane@example.com', profile: { age: 30 } });
  });

  it('throws VALIDATION_FAILED with messages grouped by field path', async () => {
    // Arrange
    const pipe = new SchemaValidationPipe(schema);

    // Act
    const error = await pipe
      .transform({ email: 'nope', profile: { age: 12 } })
      .catch((caught: unknown) => caught);

    // Assert
    expect(error).toBeInstanceOf(ApiException);
    const apiError = (error as ApiException).toApiError();
    expect(apiError.errorCode).toBe('VALIDATION_FAILED');
    expect(Object.keys(apiError.details ?? {}).sort()).toEqual([
      'email',
      'profile.age',
    ]);
  });

  it('reports a non-object body under _root', async () => {
    // Arrange
    const pipe = new SchemaValidationPipe(schema);

    // Act
    const error = (await pipe
      .transform('text')
      .catch((caught: unknown) => caught)) as ApiException;

    // Assert
    expect(error.toApiError().details).toHaveProperty('_root');
  });
});
