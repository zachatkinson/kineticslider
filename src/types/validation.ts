/**
 * Validation type definitions and interfaces
 * @module
 * @version 1.0.0
 */

import { ValidationErrorSeverity } from './error';

/**
 * Validation error types
 */
export enum ValidationErrorType {
  REQUIRED = 'required',
  REQUIRED_PROP = 'required_prop',
  TYPE = 'type',
  INVALID_TYPE = 'invalid_type',
  FORMAT = 'format',
  INVALID_FORMAT = 'invalid_format',
  PATTERN = 'pattern',
  RANGE = 'range',
  INVALID_RANGE = 'invalid_range',
  CUSTOM = 'custom',
  CUSTOM_VALIDATION_FAILED = 'custom_validation_failed',
  ASYNC_VALIDATION_FAILED = 'async_validation_failed',
  NETWORK_ERROR = 'network_error'
}

/**
 * Validation error codes
 */
export enum ValidationErrorCode {
  REQUIRED_FIELD = 'REQUIRED_FIELD',
  REQUIRED_PROP = 'REQUIRED_PROP',
  INVALID_TYPE = 'INVALID_TYPE',
  INVALID_FORMAT = 'INVALID_FORMAT',
  PATTERN_MISMATCH = 'PATTERN_MISMATCH',
  OUT_OF_RANGE = 'OUT_OF_RANGE',
  INVALID_RANGE = 'INVALID_RANGE',
  CUSTOM_ERROR = 'CUSTOM_ERROR',
  CUSTOM_VALIDATION_FAILED = 'CUSTOM_VALIDATION_FAILED',
  ASYNC_VALIDATION_FAILED = 'ASYNC_VALIDATION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

/**
 * Schema field types
 */
export enum SchemaType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  OBJECT = 'object',
  ARRAY = 'array',
  ANY = 'any'
}

/**
 * Branded types for type safety
 */
export type ComponentId = string & { readonly __brand: symbol };

/**
 * Schema validation options
 * @example Example usage
 */
export interface SchemaValidationOptions {
  required?: boolean;
  // String validation
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  // Number validation
  min?: number;
  max?: number;
  step?: number;
  // Custom validation
  custom?: (_value: unknown) => ValidationError | null;
  strict?: boolean;
  allowUnknownFields?: boolean;
  context?: ValidationContext;
}

/**
 * Schema field definition
 * @example Example usage
 */
export interface SchemaField {
  type: SchemaType;
  options?: SchemaValidationOptions;
  description?: string;
  properties?: Record<string, SchemaField>;
}

/**
 * Schema definition
 * @example Example usage
 */
export interface Schema {
  [key: string]: SchemaField;
}

/**
 * Validation error interface
 * @example Example usage
 */
export interface ValidationError {
  type: ValidationErrorType;
  code: ValidationErrorCode;
  message: string;
  property?: string;
  _value?: unknown;
  expected?: unknown;
  path?: string[];
  severity?: ValidationErrorSeverity;
  suggestion?: string;
  locale?: string;
  field?: string;
  details?: Record<string, unknown>;
  context?: ValidationContext;
  value?: unknown;
}

/**
 * Validation context
 * @example Example usage
 */
export interface ValidationContext {
  path?: string[];
  locale?: string;
  componentId?: ComponentId;
  [key: string]: unknown;
}

/**
 * Validation result interface
 * @example Example usage
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  metadata?: Record<string, unknown>;
  value?: unknown;
}

/**
 * Synchronous validator function type
 */
export type Validator<T = unknown> = (_value: T, context?: ValidationContext) => ValidationResult;

/**
 * Asynchronous validator function type
 */
export type AsyncValidator<T = unknown> = (_value: T, context?: ValidationContext) => Promise<ValidationResult>;

/**
 * Generic validation function type(sync or async)
 */
export type ValidationFunction<T = unknown> = Validator<T> | AsyncValidator<T>;

/**
 * Validation rule type
 */
export type ValidationRule = (_value: unknown) => ValidationError | null;

/**
 * Re-export error severity
 */
export { ValidationErrorSeverity };

/**
 * Helper type for memoization
 */
export type KeyGenerator<T> = (_value: T) => string;

/**
 * Types of validation that can be performed
 */
export enum ValidationType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  OBJECT = 'object',
  ARRAY = 'array',
}

/**
 * Base validation options interface
 * Common validation options reused across validators
 * @example
 * ```typescript
 * const options: ValidationOptions = {
 *   failFast: true,
 *   strict: true,
 *   allowUnknownFields: false,
 *   custom: (value) => {
 *     if (typeof value === 'string' && value.includes('forbidden')) {
 *       return {
 *         type: ValidationErrorType.CUSTOM,
 *         code: ValidationErrorCode.CUSTOM_ERROR,
 *         message: 'Value contains forbidden text'
 *       };
 *     }
 *     return null;
 *   },
 *   context: { locale: 'en-US' }
 * };
 * ```
 */
export interface ValidationOptions {
  /**
   * Whether to fail on first error
   */
  failFast?: boolean;
  
  /**
   * Custom validation function
   */
  custom?: (value: unknown) => ValidationError | null;
  
  /**
   * Whether to enforce strict validation rules
   */
  strict?: boolean;
  
  /**
   * Whether to allow unknown fields in objects
   */
  allowUnknownFields?: boolean;
  
  /**
   * Context information for the validation
   */
  context?: ValidationContext;
}

/**
 * Validator cache options
 * Controls the caching behavior for validation results
 * @example
 * ```typescript
 * const cacheOptions: ValidatorCacheOptions = {
 *   enabled: true,
 *   maxSize: 1000,
 *   ttl: 60000 // 1 minute cache time
 * };
 * 
 * const validatorWithCache = createCachedValidator(validator, cacheOptions);
 * ```
 */
export interface ValidatorCacheOptions {
  /**
   * Whether to enable caching
   */
  enabled?: boolean;
  
  /**
   * Maximum size of the cache
   */
  maxSize?: number;
  
  /**
   * Time to live for cache entries in milliseconds
   */
  ttl?: number;
}

/**
 * String validation options
 * Options specific to string validation
 * @example
 * ```typescript
 * const stringOptions: StringValidationOptions = {
 *   minLength: 5,
 *   maxLength: 100,
 *   pattern: /^[A-Za-z0-9\s]+$/,
 *   trim: true,
 *   message: 'Please enter a valid alphanumeric string between 5-100 characters',
 *   failFast: true
 * };
 * 
 * const result = validateString('Hello World', stringOptions);
 * ```
 */
export interface StringValidationOptions extends ValidationOptions {
  /**
   * Minimum string length
   */
  minLength?: number;
  
  /**
   * Maximum string length
   */
  maxLength?: number;
  
  /**
   * Regular expression pattern to match
   */
  pattern?: RegExp;
  
  /**
   * Whether to trim the string before validation
   */
  trim?: boolean;
  
  /**
   * Custom error message for the validation
   */
  message?: string;
}

/**
 * Number validation options
 * Options specific to number validation
 * @example
 * ```typescript
 * const numberOptions: NumberValidationOptions = {
 *   min: 0,
 *   max: 100,
 *   allowNaN: false,
 *   allowInfinity: false,
 *   integer: true,
 *   failFast: true
 * };
 * 
 * const result = validateNumber(42, numberOptions);
 * ```
 */
export interface NumberValidationOptions extends ValidationOptions {
  /**
   * Minimum value
   */
  min?: number;
  
  /**
   * Maximum value
   */
  max?: number;
  
  /**
   * Whether to allow NaN values
   */
  allowNaN?: boolean;
  
  /**
   * Whether to allow Infinity values
   */
  allowInfinity?: boolean;
  
  /**
   * Whether to require integers only
   */
  integer?: boolean;
}

/**
 * Options for validating array items
 * @example
 * ```typescript
 * const arrayOptions: ArrayValidationOptions = {
 *   minItems: 1,
 *   maxItems: 10,
 *   itemValidator: (item) => validateString(item, { minLength: 2 }),
 *   failFast: false
 * };
 * 
 * const result = validateArray(['apple', 'banana', 'cherry'], arrayOptions);
 * ```
 */
export interface ArrayValidationOptions extends ValidationOptions {
  minItems?: number;
  maxItems?: number;
  itemValidator?: Validator;
}
