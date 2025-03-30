/**
 * Common type patterns for KineticSlider based on cursor rules
 */

// Branded Types Pattern
export type Brand<K, T> = K & { __brand: T };
export type SlideId = Brand<string, 'SlideId'>;
export type SliderId = Brand<string, 'SliderId'>;

// Utility Types Pattern
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Required<T> = NonNullable<T>;
export type ReadOnly<T> = Readonly<T>;
export type DeepReadOnly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadOnly<T[P]> : T[P];
};

// Result Type Pattern for Error Handling
export interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

// Common Union Types
export type Status = 'idle' | 'loading' | 'success' | 'error';
export type Direction = 'horizontal' | 'vertical';
export type SlideTransition = 'fade' | 'slide' | 'zoom' | 'flip' | 'custom';
export type AnimationEase = 
  | 'power1.in' | 'power1.out' | 'power1.inOut'
  | 'power2.in' | 'power2.out' | 'power2.inOut'
  | 'power3.in' | 'power3.out' | 'power3.inOut'
  | 'power4.in' | 'power4.out' | 'power4.inOut'
  | 'elastic.in' | 'elastic.out' | 'elastic.inOut'
  | 'back.in' | 'back.out' | 'back.inOut'
  | 'bounce.in' | 'bounce.out' | 'bounce.inOut'
  | 'circ.in' | 'circ.out' | 'circ.inOut'
  | 'expo.in' | 'expo.out' | 'expo.inOut'
  | 'sine.in' | 'sine.out' | 'sine.inOut';

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