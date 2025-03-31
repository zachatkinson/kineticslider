import { SlideId, SliderId } from './branded';

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
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

export function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

// Creator functions for branded types
export function createSlideId(id: string): SlideId {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid slide id');
  }
  return id as SlideId;
}

export function createSliderId(id: string): SliderId {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid slider id');
  }
  return id as SliderId;
} 