/**
 * Type checking utility functions
 * 
 * Centralized location for all basic type checking functions
 */

import type { ValidationResult } from '../types/validation';
import type { PerformanceMetrics } from '../types/performance';
import type { AnimationConfig } from '../types/animation';

/**
 * Checks if a value is null or undefined
 */
export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Checks if a value is a non-null object (excluding arrays)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Checks if a value is an array
 */
export function isArray<T = unknown>(value: unknown): value is Array<T> {
  return Array.isArray(value);
}

/**
 * Checks if a value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Checks if a value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Checks if a value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Checks if a value is a function
 */
export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

/**
 * Checks if a value is empty (null, undefined, empty string, empty array, or empty object)
 */
export function isEmpty(value: unknown): boolean {
  if (isNullOrUndefined(value)) return true;
  if (isString(value)) return value.trim() === '';
  if (isArray(value)) return value.length === 0;
  if (isObject(value)) return Object.keys(value).length === 0;
  return false;
}

/**
 * Checks if a value has a specific method
 */
export function hasMethod<K extends string>(
  value: unknown,
  methodName: K
): value is { [key in K]: Function } {
  return isObject(value) && methodName in value && isFunction((value as any)[methodName]);
}

/**
 * Checks if a value is a Promise
 */
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return value instanceof Promise;
}

/**
 * Checks if a value is a Date
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Checks if a value is a valid finite number
 */
export function isFiniteNumber(value: unknown): value is number {
  return isNumber(value) && isFinite(value);
}

/**
 * Type guard for checking if a value is a ValidationResult
 */
export function isValidationResult(value: unknown): value is ValidationResult {
  if (!isObject(value)) return false;
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
  if (!isObject(value)) return false;
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
  if (!isObject(value)) return false;
  const config = value as Record<string, unknown>;
  return 'target' in config;
}

/**
 * Type guard to check if a value has a focus function
 */
export function hasFocusFunction(value: unknown): value is { focus: () => void } {
  return isObject(value) && 'focus' in value && isFunction((value as any).focus);
}

/**
 * Type guard to check if a value has an initialFocus function
 */
export function hasInitialFocusFunction(value: unknown): value is { initialFocus: () => void } {
  return isObject(value) && 'initialFocus' in value && isFunction((value as any).initialFocus);
} 