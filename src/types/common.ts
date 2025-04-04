import { SliderId } from './branded';

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
 * @example Example usage
 */
export interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

/**
 * Common application states and enums
 */
export type Status = 'idle' | 'loading' | 'success' | 'error';
export type Direction = 'horizontal' | 'vertical';
export type SlideTransition = 'fade' | 'slide' | 'zoom' | 'flip' | 'custom';
export type AnimationEase = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';

// Type Guard Pattern
/**
 * Checks if a value is an Error instance
 * @param value - The value to check
 * @returns {boolean} True if the value is an Error
 */
export function _isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Checks if a value is not null or undefined
 * @param value - The value to check
 * @returns {boolean} True if the value is neither null nor undefined
 */
export function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

/**
 * Creates a branded SliderId
 * @param id - The ID string to convert to a SliderId
 * @returns {SliderId} The branded SliderId
 */
export function _createSliderId(id: string): SliderId {
  if(!id || typeof id !== 'string') {
    throw new Error('Invalid slider id');
  }
  return id as SliderId;
}

/**
 * Type guard for SliderId
 * @param value - The value to check
 * @returns {boolean} True if the value is a valid SliderId
 */
export function _isSliderId(value: unknown): value is SliderId {
  return typeof value === 'string';
} 