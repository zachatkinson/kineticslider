/**
 * Extended validation utilities beyond the core validation module
 */

import type {
  ValidationResult,
  ValidationError as _ValidationError
} from '../types/validation';
import { 
  ValidationErrorSeverity, 
  ValidationErrorType, 
  ValidationErrorCode,
  ValidationContext
} from '../types/validation';
import { isObject } from './type-checks';

/**
 * Create a type-guard function from a validator
 * This allows using a validator as a TypeScript type guard
 * 
 * @param validator - The validator function to convert to a type guard
 * @returns A type guard function
 */
export function createValidator<T>(validator: (value: unknown, context?: ValidationContext) => ValidationResult): (value: unknown) => value is T {
  return (value: unknown): value is T => {
    const result = validator(value, undefined);
    // Handle both sync and async validators
    if(result instanceof Promise) {
      // For async validators, we can't use as a type guard
      // so we default to false (or you could throw an error)
      return false;
    }
    return result.valid;
  };
}

/**
 * Safe access to object properties with a default value if property doesn't exist
 * 
 * @param obj - The object to get a property from
 * @param key - The key of the property to get
 * @param defaultValue - The default value to return if property doesn't exist
 * @returns The property value or the default value
 */
export function safeGet<T>(
  obj: unknown,
  key: string,
  defaultValue: T
): T {
  if (!isObject(obj)) {
    return defaultValue;
  }
  
  return (obj as Record<string, unknown>)[key] !== undefined 
    ? (obj as Record<string, unknown>)[key] as T 
    : defaultValue;
}

/**
 * Create a validation type guard from a validator
 * 
 * @param validator - The validator function
 * @returns A validation type guard function
 */
export function createValidationTypeGuard<T>(
  validator: (value: unknown) => ValidationResult | Promise<ValidationResult>
): (value: unknown) => value is T {
  return (value: unknown): value is T => {
    const result = validator(value);
    if(result instanceof Promise) {
      return false; // Cannot use async validators directly as type guards
    }
    return result.valid;
  };
}

/**
 * Create a validation error with consistent format for testing
 * 
 * @param type - Error type
 * @param message - Error message
 * @param property - Property name with error
 * @param value - Actual value
 * @param expected - Expected value
 * @param severity - Error severity
 * @param suggestion - Suggestion for fixing
 * @param locale - Locale string
 * @returns Validation error object
 */
export function _createValidationError(
  type: ValidationErrorType,
  message: string,
  property?: string,
  value?: unknown,
  expected?: unknown,
  severity: ValidationErrorSeverity = ValidationErrorSeverity.ERROR,
  suggestion?: string,
  locale?: string
): _ValidationError {
  // Special handling for test-specific error types
  if(type === 'required_prop') {
    return {
      type,
      code: 'REQUIRED_PROP' as ValidationErrorCode,
      message,
      property,
      value,
      expected,
      severity,
      suggestion,
      locale,
    };
  } else if(type === 'invalid_type') {
    return {
      type,
      code: 'INVALID_TYPE' as ValidationErrorCode,
      message,
      property,
      value,
      expected,
      severity,
      suggestion,
      locale,
    };
  }
  
  // Regular error types
  let code: ValidationErrorCode;
  switch(type) {
    case ValidationErrorType.REQUIRED:
      code = ValidationErrorCode.REQUIRED_FIELD;
      break;
    case ValidationErrorType.TYPE:
      code = ValidationErrorCode.INVALID_TYPE;
      break;
    case ValidationErrorType.FORMAT:
      code = ValidationErrorCode.INVALID_FORMAT;
      break;
    case ValidationErrorType.PATTERN:
      code = ValidationErrorCode.PATTERN_MISMATCH;
      break;
    case ValidationErrorType.RANGE:
      code = ValidationErrorCode.OUT_OF_RANGE;
      break;
    case ValidationErrorType.CUSTOM:
    default:
      code = ValidationErrorCode.CUSTOM_ERROR;
  }
  
  return {
    type,
    code,
    message,
    property,
    value,
    expected,
    severity,
    suggestion,
    locale,
  };
} 