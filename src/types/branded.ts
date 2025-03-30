/**
 * Branded type definitions for type safety
 *
 * These types create nominal typing using branding to ensure
 * type safety when working with string IDs and other primitives.
 */

// Base branded type
export type Brand<K, T> = K & { __brand: T };

// Specific branded types
export type SlideId = Brand<string, 'SlideId'>;
export type ComponentId = Brand<string, 'ComponentId'>;
export type AnimationId = Brand<string, 'AnimationId'>;
export type GestureId = Brand<string, 'GestureId'>;
export type SessionId = Brand<string, 'SessionId'>;
