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
export function hasFocusFunction(value: unknown): value is { focus: () => void } {
  return value !== null && 
         typeof value === 'object' && 
         'focus' in value && 
         typeof (value as any).focus === 'function';
}

/**
 * Type guard to check if a value has an initialFocus function
 */
export function hasInitialFocusFunction(value: unknown): value is { initialFocus: () => void } {
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
 * Type guard for checking if a value is a ValidationResult
 */
export function isValidationResult(value: unknown): value is ValidationResult {
  if (!isNonNullObject(value)) return false;
  const result = value as Record<string, unknown>;
  return (
    'valid' in result &&
    'errors' in result &&
    Array.isArray(result.errors)
  );
}

/**
 * Type guard for checking if a value is a PerformanceMetrics object
 */
export function isPerformanceMetrics(value: unknown): value is PerformanceMetrics {
  if (!isNonNullObject(value)) return false;
  const metrics = value as Record<string, unknown>;
  return (
    'fps' in metrics &&
    'memoryUsage' in metrics
  );
}

/**
 * Type guard for checking if a value is an AnimationConfig
 */
export function isAnimationConfig(value: unknown): value is AnimationConfig {
  if (!isNonNullObject(value)) return false;
  const config = value as Record<string, unknown>;
  return 'target' in config;
}

/**
 * Type guard for checking if a value is a Promise
 */
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return value instanceof Promise;
}
