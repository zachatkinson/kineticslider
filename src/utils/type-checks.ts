/**
 * Type checking utility functions
 * 
 * Centralized location for all basic type checking functions
 */

import type { ValidationResult } from '../types/validation';
import type { PerformanceMetrics } from '../types/performance';
import type { AnimationConfig } from '../types/animation';
import type { Focusable, InitialFocusable } from '../types/interactable';

/**
 * Checks if a value is null or undefined
 * @param value - The value to check
 * @returns {boolean} True if the value is null or undefined
 */
export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Checks if a value is a non-null object (excluding arrays)
 * @param value - The value to check
 * @returns {boolean} True if the value is a non-null object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Checks if a value is an array
 * @param value - The value to check
 * @returns {boolean} True if the value is an array
 */
export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Checks if a value is a string
 * @param value - The value to check
 * @returns {boolean} True if the value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Checks if a value is a number
 * @param value - The value to check
 * @returns {boolean} True if the value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Checks if a value is a boolean
 * @param value - The value to check
 * @returns {boolean} True if the value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Checks if a value is a function
 * @param value - The value to check
 * @returns {boolean} True if the value is a function
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

/**
 * Checks if a value is undefined
 * @param value - The value to check
 * @returns {boolean} True if the value is undefined
 */
export function isUndefined(value: unknown): value is undefined {
  return typeof value === 'undefined';
}

/**
 * Checks if a value is null
 * @param value - The value to check
 * @returns {boolean} True if the value is null
 */
export function isNull(value: unknown): value is null {
  return value === null;
}

/**
 * Checks if a value is empty (null, undefined, empty string, empty array, or empty object)
 * @param value - The value to check
 * @returns {boolean} True if the value is empty
 */
export function isEmpty(value: unknown): boolean {
  if (isNullOrUndefined(value)) return true;
  if (isString(value)) return value.trim().length === 0;
  if (isArray(value)) return value.length === 0;
  if (isObject(value)) return Object.keys(value).length === 0;
  return false;
}

/**
 * Checks if a value has a specific method
 * @param value - The object to check
 * @param methodName - The name of the method to look for
 * @returns {boolean} True if the value has the specified method
 */
export function hasMethod<K extends string>(
  value: unknown,
  methodName: K
): value is { [key in K]: Function } {
  return isObject(value) && methodName in value && isFunction((value as Record<string, unknown>)[methodName]);
}

/**
 * Checks if a value is a promise
 * @param value - The value to check
 * @returns {boolean} True if the value is a promise
 */
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return (
    !!value &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof (value as Promise<T>).then === 'function'
  );
}

/**
 * Checks if a value is a valid date
 * @param value - The value to check
 * @returns {boolean} True if the value is a valid date
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Checks if a value is a plain object (created with {} or new Object)
 * @param value - The value to check
 * @returns {boolean} True if the value is a plain object
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!isObject(value)) return false;
  
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
}

/**
 * Checks if a value is a valid finite number
 * @param value
 * @returns {ReturnType} The return value
 */
export function _isFiniteNumber(value: unknown): value is number {
  return isNumber(value) && isFinite(value);
}

/**
 * Type guard for checking if a value is a ValidationResult
 * @param value - The value to check
 * @returns {boolean} True if the value is a validation result
 */
export function _isValidationResult(value: unknown): value is ValidationResult {
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
 * @param value
 * @returns {ReturnType} The return value
 */
export function _isPerformanceMetrics(value: unknown): value is PerformanceMetrics {
  if (!isObject(value)) return false;
  const metrics = value as Record<string, unknown>;
  return (
    'fps' in metrics &&
    'memoryUsage' in metrics
  );
}

/**
 * Type guard for checking if a value is an AnimationConfig
 * @param value
 * @returns {ReturnType} The return value
 */
export function _isAnimationConfig(value: unknown): value is AnimationConfig {
  if (!isObject(value)) return false;
  const config = value as Record<string, unknown>;
  return 'target' in config;
}

/**
 * Type guard to check if a value has a focus function
 * @param value
 * @returns {ReturnType} The return value
 */
export function _hasFocusFunction(value: unknown): value is Focusable {
  return isObject(value) && 'focus' in value && isFunction((value as Record<string, unknown>).focus);
}

/**
 * Type guard to check if a value has an initialFocus function
 * @param value
 * @returns {ReturnType} The return value
 */
export function _hasInitialFocusFunction(value: unknown): value is InitialFocusable {
  return isObject(value) && 'initialFocus' in value && isFunction((value as Record<string, unknown>).initialFocus);
} 