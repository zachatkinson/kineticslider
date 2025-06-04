/**
 * Common utility types
 */

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Required<T> = NonNullable<T>;
export type ReadOnly<T> = Readonly<T>;
export type DeepReadOnly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadOnly<T[P]> : T[P];
};

/**
 * Result type for operations that can fail
 *
 * @example Example usage
 */
export interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

/**
 * Result data type for successful operations
 * 
 * @example Basic usage with typed data
 * ```ts
 * const data: ResultData<User> = { id: '1', name: 'John' };
 * ```
 */
export type ResultData<T> = T;

/**
 * Result error type for failed operations
 * 
 * @example Basic error result
 * ```ts
 * const error: ResultError = new Error('Operation failed');
 * ```
 */
export type ResultError<E = Error> = E;

/**
 * Async state management
 *
 * @example Async state for data fetching
 * ```ts
 * const state: AsyncState<User> = {
 *   data: null,
 *   loading: true,
 *   error: null
 * };
 * ```
 */
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Loading state type
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Resource interface
 *
 * @example Resource data structure
 * ```ts
 * const resource: Resource<User> = {
 *   id: 'user-123',
 *   data: { id: '123', name: 'John' },
 *   lastUpdated: Date.now(),
 *   loading: false
 * };
 * ```
 */
export interface Resource<T> {
  id: string;
  data: T;
  lastUpdated: number;
  loading: boolean;
}

/**
 * Resource state type
 */
export type ResourceState = 'unloaded' | 'loading' | 'loaded' | 'error';

/**
 * Common application states and enums
 */
export type Status = "idle" | "loading" | "success" | "error";
export type Direction = "horizontal" | "vertical";
export type SlideTransition = "fade" | "slide" | "zoom" | "flip" | "custom";
export type AnimationEase =
  | "linear"
  | "ease"
  | "ease-in"
  | "ease-out"
  | "ease-in-out";
