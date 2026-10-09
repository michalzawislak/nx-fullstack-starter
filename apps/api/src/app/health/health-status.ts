/**
 * Response of GET /health.
 * Moves to libs/shared/contracts in step 4; the database check is added in step 5.
 */
export interface HealthStatus {
  status: 'ok';
  uptimeSeconds: number;
}
