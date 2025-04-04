/**
 * Domain-specific type guard utility functions
 *
 * These functions help validate and narrow types at runtime for domain-specific types.
 * They provide runtime type safety for branded and domain types used throughout the application.
 * 
 * @module TypeGuards
 * @group Utilities
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
 * 
 * @group Type Guards
 * @param value - The value to check
 * @returns True if the value is a valid SlideId, false otherwise
 * 
 * @example
 * ```ts
 * if (_isSlideId(id)) {
 *   // TypeScript knows id is a SliderId here
 *   loadSlideData(id);
 * }
 * ```
 */
export function _isSlideId(value: unknown): value is SliderId {
  return typeof value === 'string';
}

/**
 * Checks if a value is a valid ComponentId
 * 
 * @group Type Guards
 * @param value - The value to check
 * @returns True if the value is a valid ComponentId, false otherwise
 * 
 * @example
 * ```ts
 * if (_isComponentId(id)) {
 *   // TypeScript knows id is a ComponentId here
 *   registerComponent(id, component);
 * }
 * ```
 */
export function _isComponentId(value: unknown): value is ComponentId {
  return typeof value === 'string';
}

/**
 * Checks if a value is a valid AnimationId
 * 
 * @group Type Guards
 * @param value - The value to check
 * @returns True if the value is a valid AnimationId, false otherwise
 * 
 * @example
 * ```ts
 * if (_isAnimationId(id)) {
 *   // TypeScript knows id is an AnimationId here
 *   playAnimation(id);
 * }
 * ```
 */
export function _isAnimationId(value: unknown): value is AnimationId {
  return typeof value === 'string';
}

/**
 * Checks if a value is a valid GestureId
 * 
 * @group Type Guards
 * @param value - The value to check
 * @returns True if the value is a valid GestureId, false otherwise
 * 
 * @example
 * ```ts
 * if (_isGestureId(id)) {
 *   // TypeScript knows id is a GestureId here
 *   attachGestureHandler(id, handler);
 * }
 * ```
 */
export function _isGestureId(value: unknown): value is GestureId {
  return typeof value === 'string';
}

/**
 * Checks if a value is a valid SessionId
 * 
 * @group Type Guards
 * @param value - The value to check
 * @returns True if the value is a valid SessionId, false otherwise
 * 
 * @example
 * ```ts
 * if (_isSessionId(id)) {
 *   // TypeScript knows id is a SessionId here
 *   resumeSession(id);
 * }
 * ```
 */
export function _isSessionId(value: unknown): value is SessionId {
  return typeof value === 'string';
}

/**
 * Type guard for validating a Slide object
 * 
 * Checks if an object has all the required properties to be considered a valid Slide.
 * 
 * @group Type Guards
 * @param value - The value to check
 * @returns True if the value is a valid Slide object, false otherwise
 * 
 * @example
 * ```ts
 * if (_isValidSlideSchema(item)) {
 *   // TypeScript knows item is a Slide here
 *   renderSlide(item);
 * }
 * ```
 */
export function _isValidSlideSchema(value: unknown): value is Slide {
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
 * 
 * Tests if an object implements the Focusable interface by checking
 * for the presence of a focus() function.
 * 
 * @group Type Guards
 * @param value - The value to check
 * @returns True if the value implements the Focusable interface, false otherwise
 * 
 * @example
 * ```ts
 * if (_hasFocusFunction(element)) {
 *   // TypeScript knows element has a focus method here
 *   element.focus();
 * }
 * ```
 */
export function _hasFocusFunction(value: unknown): value is Focusable {
  return value !== null && 
         typeof value === 'object' && 
         'focus' in value && 
         typeof (value as Record<string, unknown>).focus === 'function';
}

/**
 * Type guard to check if a value has an initialFocus function
 * 
 * Tests if an object implements the InitialFocusable interface by checking
 * for the presence of an initialFocus() function.
 * 
 * @group Type Guards
 * @param value - The value to check
 * @returns True if the value implements the InitialFocusable interface, false otherwise
 * 
 * @example
 * ```ts
 * if (_hasInitialFocusFunction(component)) {
 *   // TypeScript knows component has an initialFocus method here
 *   component.initialFocus();
 * }
 * ```
 */
export function _hasInitialFocusFunction(value: unknown): value is InitialFocusable {
  return value !== null && 
         typeof value === 'object' && 
         'initialFocus' in value && 
         typeof (value as Record<string, unknown>).initialFocus === 'function';
}

/**
 * Type guard for checking if a value is a non-null object
 * 
 * Verifies that a value is both of type 'object' and not null.
 * 
 * @group Type Guards
 * @param value - The value to check
 * @returns True if the value is a non-null object, false otherwise
 * 
 * @example
 * ```ts
 * if (_isNonNullObject(data)) {
 *   // TypeScript knows data is a Record<string, unknown> here
 *   const keys = Object.keys(data);
 * }
 * ```
 */
export function _isNonNullObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Type guard for ValidationResult objects
 * 
 * Verifies that an object conforms to the ValidationResult interface
 * by checking for the required properties and their types.
 * 
 * @group Type Guards
 * @param value - The value to check
 * @returns True if the value is a ValidationResult object, false otherwise
 * 
 * @example
 * ```ts
 * if (_isValidationResult(result)) {
 *   // TypeScript knows result is a ValidationResult here
 *   if (result.valid) {
 *     proceed();
 *   } else {
 *     displayErrors(result.errors);
 *   }
 * }
 * ```
 */
export function _isValidationResult(value: unknown): value is ValidationResult {
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
 * @group Type Guards
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
 * 
 * Verifies that an object conforms to the AnimationConfig interface
 * by checking for the required properties and their types.
 * 
 * @group Type Guards
 * @param value - The value to check
 * @returns True if the value is an AnimationConfig object, false otherwise
 * 
 * @example
 * ```ts
 * if (_isAnimationConfig(config)) {
 *   // TypeScript knows config is an AnimationConfig here
 *   gsap.to(element, {
 *     duration: config.duration,
 *     ease: config.easing,
 *   });
 * }
 * ```
 */
export function _isAnimationConfig(value: unknown): value is AnimationConfig {
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
 * 
 * @group Type Guards
 * @typeParam T - The type of the Promise's resolved value
 * @param value - The value to check
 * @returns True if the value is a Promise, false otherwise
 * 
 * @example
 * ```ts
 * if (isPromise(result)) {
 *   // TypeScript knows result is a Promise here
 *   result.then(data => {
 *     processData(data);
 *   });
 * } else {
 *   // Handle synchronous case
 *   processData(result);
 * }
 * ```
 */
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return value instanceof Promise;
}
