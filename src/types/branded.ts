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
export type ElementId = Brand<string, 'ElementId'>;

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
 * @param value - The value to brand
 * @param _brand - The brand to apply (unused)
 * @returns The branded value
 */
export function createBrandedId<T extends string>(value: string, _brand: T): Brand<string, T> {
  return value as Brand<string, T>;
}

/**
 * Helper for creating branded number types
 * @param value - The value to brand
 * @param _brand - The brand to apply (unused)
 * @returns The branded value
 */
export function createBrandedNumber<T extends string>(value: number, _brand: T): Brand<number, T> {
  return value as Brand<number, T>;
}

/**
 * Creates a branded slider ID from a string or number
 * @param value - The value to convert to a slider ID
 * @param _brand - Optional brand parameter (unused)
 * @returns The branded slider ID
 */
export function brandSliderId(value: string | number, _brand?: unknown): SliderId {
  return String(value) as SliderId;
}

/**
 * Creates a branded element ID from a string or number
 * @param value - The value to convert to an element ID
 * @param _brand - Optional brand parameter (unused)
 * @returns The branded element ID
 */
export function brandElementId(value: string | number, _brand?: unknown): ElementId {
  return String(value) as ElementId;
}
