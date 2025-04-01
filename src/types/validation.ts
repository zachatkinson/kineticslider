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
  TYPE = 'type',
  FORMAT = 'format',
  PATTERN = 'pattern',
  RANGE = 'range',
  CUSTOM = 'custom'
}

/**
 * Validation error codes
 */
export enum ValidationErrorCode {
  REQUIRED_FIELD = 'REQUIRED_FIELD',
  INVALID_TYPE = 'INVALID_TYPE',
  INVALID_FORMAT = 'INVALID_FORMAT',
  PATTERN_MISMATCH = 'PATTERN_MISMATCH',
  OUT_OF_RANGE = 'OUT_OF_RANGE',
  CUSTOM_ERROR = 'CUSTOM_ERROR'
}

/**
 * Validation error interface with improved structure for better error handling
 */
export interface ValidationError {
  type: ValidationErrorType;
  code: ValidationErrorCode;
  message: string;
  property?: string;
  value?: unknown;
  expected?: unknown;
  path?: string[];
  severity?: ValidationErrorSeverity;
  suggestion?: string;
  locale?: string;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  metadata?: Record<string, unknown>;
}

/**
 * Schema validation options
 */
export interface SchemaValidationOptions {
  required?: boolean;
  nullable?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  minimum?: number;
  maximum?: number;
  format?: string;
  custom?: (value: unknown) => boolean;
}

/**
 * Schema types supported by the validation system
 */
export enum SchemaType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  OBJECT = 'object',
  ARRAY = 'array',
  NULL = 'null',
  ANY = 'any'
}

/**
 * Schema field definition
 */
export interface SchemaField {
  type: SchemaType | SchemaType[];
  options?: SchemaValidationOptions;
  properties?: Record<string, SchemaField>; // For objects
  items?: SchemaField; // For arrays
  description?: string;
}

/**
 * Validation context for nested validation
 */
export interface ValidationContext {
  path: string[];
  parent?: unknown;
  root?: unknown;
}

/**
 * Interface for validation functions that return type guards
 */
export interface TypeGuard<T> {
  (value: unknown, context?: ValidationContext): value is T;
}

/**
 * Interface for cache options
 */
export interface ValidationCacheOptions {
  /** Time to live in milliseconds */
  ttl?: number;
  /** Maximum cache size */
  maxSize?: number;
}

/**
 * Cache entry with TTL support
 */
export interface CacheEntry {
  result: ValidationResult;
  timestamp: number;
}

/**
 * Validation function type
 */
export type ValidationFunction<T> = (value: unknown) => ValidationResult & { value: T };

/**
 * Validation rule type
 */
export type ValidationRule = (value: unknown) => ValidationError | null;

/**
 * Validation schema type
 */
export type ValidationSchema = Record<string, SchemaField>;

// Re-export error severity from error.ts for convenience
export { ValidationErrorSeverity };
