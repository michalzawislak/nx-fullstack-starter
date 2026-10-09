import { healthStatusSchema } from './health.contract';

describe('healthStatusSchema', () => {
  it.each([
    ['an ok status', { status: 'ok', uptimeSeconds: 12 }, true],
    ['an error status', { status: 'error', uptimeSeconds: 0 }, true],
    ['an unknown status', { status: 'degraded', uptimeSeconds: 12 }, false],
    ['a negative uptime', { status: 'ok', uptimeSeconds: -1 }, false],
  ] as const)('handles %s', (_case, body, expected) => {
    // Act
    const result = healthStatusSchema.safeParse(body);

    // Assert
    expect(result.success).toBe(expected);
  });
});
