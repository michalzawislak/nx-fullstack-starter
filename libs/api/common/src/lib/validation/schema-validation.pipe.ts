import { Injectable, type PipeTransform } from '@nestjs/common';

import type { z } from 'zod';

import { ApiException } from '../errors/api.exception';

const ROOT_FIELD = '_root';

type ValidationDetails = Record<string, string[]>;

/**
 * Validates a request part with a schema from libs/shared/contracts (CON-2).
 * It uses the Standard Schema interface, so it behaves like the native
 * StandardSchemaValidationPipe of NestJS 12 and can be replaced by it after the upgrade.
 */
@Injectable()
export class SchemaValidationPipe<TSchema extends z.ZodType>
  implements PipeTransform<unknown, Promise<z.output<TSchema>>>
{
  constructor(private readonly schema: TSchema) {}

  async transform(value: unknown): Promise<z.output<TSchema>> {
    const result = await this.schema['~standard'].validate(value);

    if (result.issues) {
      const details = result.issues.reduce<ValidationDetails>(
        (fields, issue) => {
          const field = issue.path
            ?.map((segment) =>
              typeof segment === 'object' ? segment.key : segment,
            )
            .join('.');
          const key = field && field.length > 0 ? String(field) : ROOT_FIELD;
          return { ...fields, [key]: [...(fields[key] ?? []), issue.message] };
        },
        {},
      );

      throw new ApiException('VALIDATION_FAILED', 'Validation failed', details);
    }

    return result.value as z.output<TSchema>;
  }
}
