/**
 * Domain-specific type guard utility functions
 *
 * These functions help validate and narrow types at runtime for domain-specific types.
 */
import {
  AnimationId,
  ComponentId,
  GestureId,
  SessionId,
  SliderId,
} from '../types/branded';
import { Slide } from '../types/slider';
import { isObject } from './type-checks';
import type { ValidationResult } from '../types/validation';
import type { PerformanceMetrics } from '../types/performance';
import type { AnimationConfig } from '../types/animation';
import type { Focusable, InitialFocusable } from '../types/interactable';

/**
 * Checks if a value is a valid SlideId
 */
export function isSlideId(value: unknown): value is SliderId {
  return typeof value === 'string';
}

/**
 * Checks if a value is a valid ComponentId
 */
export function isComponentId(value: unknown): value is ComponentId {
  return typeof value === 'string';
}

/**
 * Checks if a value is a valid AnimationId
 */
export function isAnimationId(value: unknown): value is AnimationId {
  return typeof value === 'string';
}

/**
 * Checks if a value is a valid GestureId
 */
export function isGestureId(value: unknown): value is GestureId {
  return typeof value === 'string';
}

/**
 * Checks if a value is a valid SessionId
 */
export function isSessionId(value: unknown): value is SessionId {
  return typeof value === 'string';
}

/**
 * Type guard for validating a Slide object
 */
export function isValidSlideSchema(value: unknown): value is Slide {
  if (!isObject(value)) return false;
  
  return (
    'id' in value &&
    typeof value.id === 'string' &&
    'title' in value &&
    typeof value.title === 'string' &&
    'image' in value &&
    typeof value.image === 'string' &&
    'alt' in value &&
    typeof value.alt === 'string'
  );
}

/**
 * Type guard to check if a value has a focus function
 */
export function hasFocusFunction(value: unknown): value is Focusable {
  return value !== null && 
         typeof value === 'object' && 
         'focus' in value && 
         typeof (value as any).focus === 'function';
}

/**
 * Type guard to check if a value has an initialFocus function
 */
export function hasInitialFocusFunction(value: unknown): value is InitialFocusable {
  return value !== null && 
         typeof value === 'object' && 
         'initialFocus' in value && 
         typeof (value as any).initialFocus === 'function';
}

/**
 * Type guard for checking if a value is a non-null object
 */
export function isNonNullObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Type guard for ValidationResult objects
 * @param value Value to test
 * @returns True if the value is a ValidationResult
 */
export function isValidationResult(value: unknown): value is ValidationResult {
  return (
    isObject(value) &&
    'valid' in value &&
    typeof value.valid === 'boolean' &&
    'errors' in value &&
    Array.isArray(value.errors)
  );
}

/**
 * Type guard function to check if a value is a valid PerformanceMetrics object.
 * 
 * This function verifies that a given value conforms to the shape of the
 * PerformanceMetrics interface by checking that it:
 * 1. Is an object
 * 2. Has the required properties (fps, memoryUsage, etc.)
 * 3. Each property has the correct type
 * 
 * @param value - The value to check
 * @returns True if value is a valid PerformanceMetrics object, false otherwise
 * 
 * @example
 * ```ts
 * // Check if an API response contains valid performance metrics
 * function processMetrics(data: unknown) {
 *   if (isPerformanceMetrics(data)) {
 *     // TypeScript knows data is PerformanceMetrics here
 *     console.log(`Current FPS: ${data.fps}`);
 *     console.log(`Memory usage: ${data.memoryUsage} bytes`);
 *   } else {
 *     console.error('Invalid performance metrics data');
 *   }
 * }
 * ```
 */
export function isPerformanceMetrics(value: unknown): value is PerformanceMetrics {
  return (
    isObject(value) &&
    'fps' in value &&
    typeof value.fps === 'number' &&
    'transitionDuration' in value &&
    typeof value.transitionDuration === 'number' &&
    'gestureLatency' in value &&
    typeof value.gestureLatency === 'number' &&
    'memoryUsage' in value &&
    typeof value.memoryUsage === 'number'
  );
}

/**
 * Type guard for AnimationConfig objects
 * @param value Value to test
 * @returns True if the value is an AnimationConfig
 */
export function isAnimationConfig(value: unknown): value is AnimationConfig {
  return (
    isObject(value) &&
    'duration' in value &&
    typeof value.duration === 'number' &&
    'easing' in value &&
    typeof value.easing === 'string'
  );
}

/**
 * Type guard for checking if a value is a Promise
 */
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return value instanceof Promise;
}
