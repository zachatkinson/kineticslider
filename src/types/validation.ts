/**
 * Types and interfaces for validation system
 */

/**
 * Error types for validation with codes for internationalization
 */
export enum ValidationErrorType {
  REQUIRED_PROP = 'REQUIRED_PROP',
  INVALID_TYPE = 'INVALID_TYPE',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_RANGE = 'INVALID_RANGE',
  INVALID_OPTION = 'INVALID_OPTION',
  ASYNC_VALIDATION_FAILED = 'ASYNC_VALIDATION_FAILED',
  CUSTOM_VALIDATION_FAILED = 'CUSTOM_VALIDATION_FAILED',
  SCHEMA_VALIDATION_FAILED = 'SCHEMA_VALIDATION_FAILED',
  CONSTRAINT_VALIDATION_FAILED = 'CONSTRAINT_VALIDATION_FAILED',
}

/**
 * Error codes for structured error handling
 */
export enum ValidationErrorCode {
  REQUIRED_PROP = 'E001',
  INVALID_TYPE = 'E002',
  INVALID_FORMAT = 'E003',
  INVALID_RANGE = 'E004',
  INVALID_OPTION = 'E005',
  ASYNC_VALIDATION_FAILED = 'E006',
  CUSTOM_VALIDATION_FAILED = 'E007',
  SCHEMA_VALIDATION_FAILED = 'E008',
  NETWORK_VALIDATION_FAILED = 'E009',
  CONSTRAINT_VALIDATION_FAILED = 'E010',
}

/**
 * Severity levels for validation errors
 */
export enum ValidationErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Validation error interface with improved structure for better error handling
 */
export interface ValidationError {
  type: ValidationErrorType;
  code: ValidationErrorCode;
  message: string;
  property?: string | undefined;
  value?: unknown;
  expected?: unknown;
  path?: string[] | undefined;
  severity?: ValidationErrorSeverity | undefined;
  suggestion?: string | undefined;
  locale?: string | undefined;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  metadata?: Record<string, unknown> | undefined;
}

/**
 * Validation context to enable contextual validation
 */
export interface ValidationContext {
  /** Entity being validated in a larger context */
  entity?: string;
  /** Strict mode forces validation of all fields */
  strict?: boolean;
  /** Parent object for nested validation */
  parent?: Record<string, unknown>;
  /** Custom rules to apply */
  rules?: Record<string, unknown>;
  /** Locale for error messages */
  locale?: string;
  /** Current path for nested validations */
  path?: string[];
  /** Severity level override */
  severityLevel?: ValidationErrorSeverity;
}

// Type for validator function
export type Validator<_T = unknown> = (
  value: unknown,
  context?: ValidationContext
) => ValidationResult | Promise<ValidationResult>;

// Type for async validator function
export type AsyncValidator<_T = unknown> = (
  value: unknown,
  context?: ValidationContext
) => Promise<ValidationResult>;

// Interface for cache options
export interface ValidationCacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size
}

// Cache entry with TTL support
export interface CacheEntry {
  result: ValidationResult;
  timestamp: number;
}

// Additional helper functions for schema validation
export interface SchemaValidationOptions {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  enum?: readonly unknown[];
  custom?: (value: unknown) => ValidationResult | Promise<ValidationResult>;
}

export type SchemaType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null'
  | 'any';

export interface SchemaField {
  type: SchemaType | SchemaType[];
  options?: SchemaValidationOptions;
  properties?: Record<string, SchemaField>; // For objects
  items?: SchemaField; // For arrays
  description?: string;
}

export type Schema = Record<string, SchemaField>;

/**
 * Interface for validation functions that return type guards
 */
export interface TypeGuard<_T> {
  (value: unknown, context?: ValidationContext): value is _T;
}

/**
 * Interface for async validation functions that return type guards
 */
export interface AsyncTypeGuard<_T> {
  (value: unknown, context?: ValidationContext): Promise<boolean>;
}
