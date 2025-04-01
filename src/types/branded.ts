/**
 * Branded type utility and all branded types for the application
 */

/**
 * Branded type utility for type-safe identifiers
 */
export type Brand<K, T> = K & { __brand: T };

/**
 * Identifier types
 */
export type SliderId = Brand<string, 'SliderId'>;
export type ComponentId = Brand<string, 'ComponentId'>;
export type AnimationId = Brand<string, 'AnimationId'>;
export type GestureId = Brand<string, 'GestureId'>;
export type SessionId = Brand<string, 'SessionId'>;

/**
 * Measurement types
 */
export type FPS = Brand<number, 'FPS'>;
export type Milliseconds = Brand<number, 'Milliseconds'>;
export type ByteSize = Brand<number, 'ByteSize'>;
export type Duration = Brand<number, 'Duration'>;
export type Delay = Brand<number, 'Delay'>;
export type GestureDistance = Brand<number, 'GestureDistance'>;
export type SlideIndex = Brand<number, 'SlideIndex'>;
export type GestureVelocity = Brand<number, 'GestureVelocity'>;
export type GestureThreshold = Brand<number, 'GestureThreshold'>;

/**
 * Helper functions for creating branded types
 */
export function createBrandedId<T extends string>(value: string, brand: T): Brand<string, T> {
  return value as Brand<string, T>;
}

export function createBrandedNumber<T extends string>(value: number, brand: T): Brand<number, T> {
  return value as Brand<number, T>;
}
