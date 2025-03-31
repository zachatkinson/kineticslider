/**
 * Branded type utility for type-safe identifiers
 */
export type Brand<K, T> = K & { __brand: T };

/**
 * Slide identifier type
 */
export type SlideId = Brand<string, 'SlideId'>;

/**
 * Slider identifier type
 */
export type SliderId = Brand<string, 'SliderId'>;

/**
 * Component identifier type
 */
export type ComponentId = Brand<string, 'ComponentId'>;

/**
 * Animation identifier type
 */
export type AnimationId = Brand<string, 'AnimationId'>;

/**
 * Gesture identifier type
 */
export type GestureId = Brand<string, 'GestureId'>;

/**
 * Session identifier type
 */
export type SessionId = Brand<string, 'SessionId'>;
