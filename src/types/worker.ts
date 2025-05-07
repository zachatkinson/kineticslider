/**
 * Data that can be sent to a worker
 */
export type WorkerData = unknown;

/**
 * Response from a worker
 */
export interface WorkerResponse<T = unknown> {
  result: T;
  error: Error | null;
}

/**
 * Worker configuration options
 */
export interface WorkerOptions {
  workerId: string;
  maxRetries?: number;
  timeout?: number;
} 