import { Injectable } from '@nestjs/common';

import { hash, verify } from '@node-rs/argon2';

/**
 * Argon2id (the library default) with the OWASP minimum parameters: 19 MiB memory, 2 iterations (BE-5).
 */
const ARGON2_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

@Injectable()
export class PasswordHasherService {
  /** Hash of a random password, verified when the email is unknown so login timing does not reveal accounts. */
  private readonly dummyHash = hash(
    'dummy-password-for-timing',
    ARGON2_OPTIONS,
  );

  hash(password: string): Promise<string> {
    return hash(password, ARGON2_OPTIONS);
  }

  async verify(
    passwordHash: string | null,
    password: string,
  ): Promise<boolean> {
    const hashToCheck = passwordHash ?? (await this.dummyHash);
    const isValid = await verify(hashToCheck, password);
    return passwordHash !== null && isValid;
  }
}
