/**
 * Data that can be sent to a worker
 */
export type WorkerData = unknown;

/**
 * Response from a worker
 *
 * @example
 * ```ts
 * const response: WorkerResponse<number> = {
 *   result: 42,
 *   error: null
 * };
 * ```
 */
export interface WorkerResponse<T = unknown> {
  result: T;
  error: Error | null;
}

/**
 * Worker configuration options
 *
 * @example
 * ```ts
 * const options: WorkerOptions = {
 *   workerId: 'worker-1',
 *   maxRetries: 3,
 *   timeout: 5000
 * };
 * ```
 */
export interface WorkerOptions {
  workerId: string;
  maxRetries?: number;
  timeout?: number;
}
