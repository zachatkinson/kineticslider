/**
 * Core validation utilities
 */

import type { ValidationResult, ValidationContext, Validator, AsyncValidator, SchemaField, Schema, ValidationError } from '../types/validation';
import { ValidationErrorType, ValidationErrorCode, ValidationErrorSeverity } from '../types/validation';
import type { SliderId, ComponentId } from '../types/branded';
import { isObject } from './type-checks';
import { validateStringConstraints, validateNumberConstraints, validateRequiredFields, validateAgainstSchemaField } from './validation-helpers';
import { createSlideId, createComponentId } from './id-helpers';
import { globalValidationCache as validationCache } from './cache';
import type { CacheOptions } from './cache';
import { getFieldClass as getFieldClassByErrors, getFieldError } from './form-helpers';

// Global validation registry
const validatorRegistry = new Map<string, Validator | AsyncValidator>();

/**
 * Register a validator in the global registry
 *
 * @param name - Name to register the validator under
 * @param validator - The validator function
 */
export function registerValidator(
  name: string,
  validator: Validator | AsyncValidator
): void {
  validatorRegistry.set(name, validator);
}

/**
 * Get a validator from the registry
 *
 * @param name - Name of the validator
 * @returns The validator function or undefined if not found
 */
export function getValidator(
  name: string
): Validator | AsyncValidator | undefined {
  return validatorRegistry.get(name);
}

/**
 * Helper function to create a validation error with enhanced fields
 */
function createValidationError(
  type: ValidationErrorType,
  message: string,
  property?: string | undefined,
  value?: unknown,
  expected?: unknown,
  severity: ValidationErrorSeverity = ValidationErrorSeverity.ERROR,
  suggestion?: string | undefined,
  locale?: string | undefined
): ValidationError {
  // Map type to code
  const codeMap: Record<ValidationErrorType, ValidationErrorCode> = {
    [ValidationErrorType.REQUIRED_PROP]: ValidationErrorCode.REQUIRED_PROP,
    [ValidationErrorType.INVALID_TYPE]: ValidationErrorCode.INVALID_TYPE,
    [ValidationErrorType.INVALID_FORMAT]: ValidationErrorCode.INVALID_FORMAT,
    [ValidationErrorType.INVALID_RANGE]: ValidationErrorCode.INVALID_RANGE,
    [ValidationErrorType.INVALID_OPTION]: ValidationErrorCode.INVALID_OPTION,
    [ValidationErrorType.ASYNC_VALIDATION_FAILED]: ValidationErrorCode.ASYNC_VALIDATION_FAILED,
    [ValidationErrorType.CUSTOM_VALIDATION_FAILED]: ValidationErrorCode.CUSTOM_VALIDATION_FAILED,
    [ValidationErrorType.SCHEMA_VALIDATION_FAILED]: ValidationErrorCode.SCHEMA_VALIDATION_FAILED,
    [ValidationErrorType.CONSTRAINT_VALIDATION_FAILED]: ValidationErrorCode.CONSTRAINT_VALIDATION_FAILED,
  };

  return {
    type,
    code: codeMap[type],
    message,
    property,
    value,
    expected,
    severity,
    suggestion,
    locale,
  };
}

/**
 * Create a validator from a schema definition
 *
 * @param schema - Schema definition
 * @returns A validator function based on the schema
 */
export function createSchemaValidator<T>(schema: Schema): Validator<T> {
  return (
    value: unknown,
    context?: ValidationContext
  ): ValidationResult | Promise<ValidationResult> => {
    if (!isObject(value)) {
      return {
        valid: false,
        errors: [
          createValidationError(
            ValidationErrorType.INVALID_TYPE,
            'Value must be an object',
            undefined,
            value,
            'object',
            ValidationErrorSeverity.ERROR,
            'Provide an object value',
            context?.locale
          ),
        ],
      };
    }

    const errors: ValidationError[] = [];
    const metadata: Record<string, unknown> = {};

    // Validate each field in the schema
    const validationPromises: Promise<ValidationResult>[] = [];

    for (const [key, field] of Object.entries(schema)) {
      const propertyValue = value[key];
      // Pass context as is - it already contains path information if needed
      const result = validateAgainstSchemaField(
        propertyValue,
        field,
        key,
        context
      );

      // Handle both synchronous and asynchronous validation
      if (result instanceof Promise) {
        validationPromises.push(result);
      } else if (!result.valid) {
        errors.push(...result.errors);
      }
    }

    // If no async validations, return synchronously
    if (validationPromises.length === 0) {
      return {
        valid: errors.length === 0,
        errors,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      };
    }

    // Handle async validations
    return Promise.all(validationPromises).then((results) => {
      for (const result of results) {
        if (!result.valid) {
          errors.push(...result.errors);
        }
        if (result.metadata) {
          Object.assign(metadata, result.metadata);
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      };
    });
  };
}

/**
 * Validates error info object
 *
 * @param errorInfo - The error info to validate
 * @param context - Optional validation context
 * @returns Validation result
 */
export function validateErrorInfo(
  errorInfo: unknown,
  context?: ValidationContext
): ValidationResult {
  if (!isObject(errorInfo)) {
    return {
      valid: false,
      errors: [
        createValidationError(
          ValidationErrorType.INVALID_TYPE,
          'Error info must be an object',
          undefined,
          errorInfo,
          'object'
        ),
      ],
    };
  }

  // Required fields
  const requiredFields = [
    'name',
    'message',
    'componentStack',
    'timestamp',
    'code',
  ];
  
  const errors = validateRequiredFields(errorInfo, requiredFields, context);

  // Validate field types
  if (
    'name' in errorInfo &&
    errorInfo['name'] !== undefined &&
    typeof errorInfo['name'] !== 'string'
  ) {
    errors.push(
      createValidationError(
        ValidationErrorType.INVALID_TYPE,
        'Error name must be a string',
        'name',
        errorInfo['name'],
        'string'
      )
    );
  }

  if (
    'message' in errorInfo &&
    errorInfo['message'] !== undefined &&
    typeof errorInfo['message'] !== 'string'
  ) {
    errors.push(
      createValidationError(
        ValidationErrorType.INVALID_TYPE,
        'Error message must be a string',
        'message',
        errorInfo['message'],
        'string'
      )
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Memoize a validator to improve performance for expensive validations
 *
 * @param validator - Validator to memoize
 * @param getKey - Function to generate a cache key (defaults to JSON.stringify)
 * @param options - Cache options for TTL and size limits
 * @returns Memoized validator
 */
export function memoizeValidator<T>(
  validator: Validator<T>,
  getKey: (value: unknown, context?: ValidationContext) => string = (
    value,
    context
  ) => JSON.stringify({ value, context: context || {} }),
  options?: CacheOptions
): Validator<T> {
  return (
    value: unknown,
    context?: ValidationContext
  ): ValidationResult | Promise<ValidationResult> => {
    const key = getKey(value, context);

    const cachedResult = validationCache.get(key);
    if (cachedResult) {
      return cachedResult;
    }

    const result = validator(value, context);

    // Handle both synchronous and asynchronous validation results
    if (result instanceof Promise) {
      // For async results, wait for them and then cache
      return result.then((asyncResult) => {
        validationCache.set(key, asyncResult);
        return asyncResult;
      });
    } else {
      // For sync results, cache directly
      validationCache.set(key, result);
      return result;
    }
  };
}

/**
 * Clear the global validation cache
 */
export function clearValidationCache(): void {
  validationCache.clear();
}

/**
 * Convert a string to a SliderId branded type
 */
export function toSlideId(id: string): SliderId {
  return createSlideId(id);
}

/**
 * Convert a string to a ComponentId branded type
 */
export function toComponentId(id: string): ComponentId {
  return createComponentId(id);
}

/**
 * Compose multiple validators into a single validator
 *
 * @param validators - Array of validators to compose
 * @returns A composed validator that runs all validators
 */
export function composeValidators(...validators: Validator[]): Validator {
  return async (
    value: unknown,
    context?: ValidationContext
  ): Promise<ValidationResult> => {
    const errors: ValidationError[] = [];
    const metadata: Record<string, unknown> = {};

    for (const validator of validators) {
      const result = await Promise.resolve(validator(value, context));
      if (!result.valid) {
        errors.push(...result.errors);
      }

      // Merge metadata
      if (result.metadata) {
        Object.assign(metadata, result.metadata);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    };
  };
}

/**
 * Compose multiple async validators into a single async validator
 *
 * @param validators - Array of async validators to compose
 * @returns A composed async validator that runs all validators
 */
export function composeAsyncValidators(
  ...validators: AsyncValidator[]
): AsyncValidator {
  return async (
    value: unknown,
    context?: ValidationContext
  ): Promise<ValidationResult> => {
    const errors: ValidationError[] = [];
    const metadata: Record<string, unknown> = {};

    for (const validator of validators) {
      const result = await validator(value, context);
      if (!result.valid) {
        errors.push(...result.errors);
      }

      // Merge metadata
      if (result.metadata) {
        Object.assign(metadata, result.metadata);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    };
  };
}

/**
 * Validation utility functions
 */

/**
 * Get a field-specific error from an array of validation errors
 * 
 * @param errors - Validation errors array
 * @param fieldName - Field name to extract error for
 * @returns The validation error for the field or undefined
 */
export function getErrorForField(
  errors: ValidationResult['errors'],
  fieldName: string
): ValidationError | undefined {
  return errors.find((err) => err.property === fieldName);
}

/**
 * Get CSS class for a form field based on validation result
 * 
 * @param validationErrors - Validation errors array
 * @param fieldName - Field name to get class for
 * @returns CSS class string
 */
export function getFieldClass(
  validationErrors: ValidationResult['errors'],
  fieldName: string
): string {
  return getFieldClassByErrors(validationErrors, fieldName);
}

// Export all validation functions
export * from './validation-helpers';
