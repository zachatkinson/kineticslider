/**
 * Validation helper functions
 * 
 * Utility functions to assist with validation operations
 * @returns {ReturnType} The return value
 */

import { ValidationError, ValidationErrorType, ValidationErrorCode, ValidationErrorSeverity, SchemaType, SchemaValidationOptions, ComponentId } from '../types/validation';
import { SliderId } from '../types/branded';
import type { ValidationContext, SchemaField } from '../types/validation';
import { isObject } from './type-checks';
import type { ValidationResult } from '../types/validation';
import type { Slide } from '../types/slider';
import { _validateSlideWithBusinessRules as validateSlideWithBusinessRules } from './slide-validator';
import { debounce } from './debounce';

/**
 * Helper function to create a validation error with enhanced fields
 * @param type
 * @param message
 * @param field
 * @param details
 * @param expected
 * @param severity
 * @param suggestion
 * @param locale
 * @returns {ValidationError} - The return value
 */
export function createValidationError(
  type: ValidationErrorType,
  message: string,
  field?: string,
  details?: Record<string, unknown>,
  expected?: unknown,
  severity?: ValidationErrorSeverity,
  suggestion?: string,
  locale?: string
): ValidationError {
  return {
    type,
    code: ValidationErrorCode[type.toUpperCase() as keyof typeof ValidationErrorCode],
    message,
    field,
    details,
    expected,
    severity,
    suggestion,
    locale
  };
}

/**
 * Helper function to check if a value is empty
 * @param value
 * @returns {boolean} The return value
 */
export function _isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Helper function to safely get a value from an object by path
 * @param obj
 * @param key
 * @param defaultValue
 * @returns {T} The return value
 */
export function safeGet<T>(obj: Record<string, unknown> | null | undefined, key: string, defaultValue: T): T {
  if (!obj) return defaultValue;
  return (obj[key] as T) ?? defaultValue;
}

/**
 * Helper function to convert a string to a branded SliderId
 * @param id
 * @returns {SliderId} - The return value
 */
export function _toSlideId(id: string): SliderId {
  return id as SliderId;
}

/**
 * Helper function to convert a string to a branded ComponentId
 * @param id
 * @returns {ComponentId} The return value
 */
export function _toComponentId(id: string): ComponentId {
  return id as ComponentId;
}

/**
 * Helper function to validate string constraints
 * @param value
 * @param constraints
 * @returns {ValidationError | null} The return value
 */
export function validateStringConstraints(
  value: string,
  constraints: SchemaValidationOptions
): ValidationError | null {
  if(constraints.minLength !== undefined && value.length < constraints.minLength) {
    return createValidationError(ValidationErrorType.INVALID_RANGE,
      `String must be at least ${constraints.minLength} characters long`,
      undefined,
      { value, constraints }
    );
  }

  if(constraints.maxLength !== undefined && value.length > constraints.maxLength) {
    return createValidationError(ValidationErrorType.INVALID_RANGE,
      `String must be at most ${constraints.maxLength} characters long`,
      undefined,
      { value, constraints }
    );
  }

  if (constraints.pattern && !constraints.pattern.test(value)) {
    return createValidationError(
      ValidationErrorType.INVALID_FORMAT,
      'String does not match required pattern',
      undefined,
      { value, constraints }
    );
  }

  return null;
}

/**
 * Helper function to validate number constraints
 * @param value
 * @param constraints
 * @returns {ValidationError | null} The return value
 */
export function validateNumberConstraints(
  value: number,
  constraints: SchemaValidationOptions
): ValidationError | null {
  if(constraints.min !== undefined && value < constraints.min) {
    return createValidationError(ValidationErrorType.INVALID_RANGE,
      `Number must be at least ${constraints.min}`,
      undefined,
      { value, constraints }
    );
  }

  if(constraints.max !== undefined && value > constraints.max) {
    return createValidationError(ValidationErrorType.INVALID_RANGE,
      `Number must be at most ${constraints.max}`,
      undefined,
      { value, constraints }
    );
  }

  if(constraints.step !== undefined && value % constraints.step !== 0) {
    return createValidationError(ValidationErrorType.INVALID_RANGE,
      `Number must be a multiple of ${constraints.step}`,
      undefined,
      { value, constraints }
    );
  }

  return null;
}

/**
 * Helper function to validate required fields
 * @param obj
 * @param requiredFields
 * @returns {ValidationError[]} The return value
 */
export function _validateRequiredFields(
  obj: Record<string, unknown>,
  requiredFields: string[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  for(const field of requiredFields) {
    if (!(field in obj) || obj[field] === undefined) {
      errors.push(
        createValidationError(ValidationErrorType.REQUIRED_PROP,
          `Required field '${field}' is missing`,
          field,
          undefined
        )
      );
    }
  }

  return errors;
}

// For deep path traversal
let _currentPath = '';

/**
 * Validates a value against a schema field definition
 *
 * @param value - Value to validate
 * @param field - Schema field definition
 * @param propertyPath
 * @param context - Validation context
 * @returns Validation result
 */
export function validateAgainstSchemaField(
  value: unknown,
  field: SchemaField,
  propertyPath: string,
  context?: ValidationContext
): ValidationResult | Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  _currentPath = [...(context?.path || []), propertyPath].filter(Boolean).join('.');

  // Check required constraint if value is undefined or null
  if ((value === undefined || value === null) && field.options?.required) {
    return {
      valid: false,
      errors: [
        createValidationError(ValidationErrorType.REQUIRED_PROP,
          `${_currentPath} is required`,
          _currentPath,
          { value },
          'non-null value',
          ValidationErrorSeverity.ERROR,
          `Provide a value for ${_currentPath}`,
          context?.locale
        )
      ]
    };
  }

  // If value is undefined and not required, it's valid
  if(value === undefined) {
    return { valid: true, errors: [] };
  }

  // Type validation
  const types = Array.isArray(field.type) ? field.type : [field.type];

  // Check if value matches any of the allowed types
  const typeValid = types.some((type) => {
    switch(type) {
      case SchemaType.STRING:
        return typeof value === 'string';
      case SchemaType.NUMBER:
        return typeof value === 'number';
      case SchemaType.BOOLEAN:
        return typeof value === 'boolean';
      case SchemaType.OBJECT:
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case SchemaType.ARRAY:
        return Array.isArray(value);
      case 'null':
        return value === null;
      case SchemaType.ANY:
        return true;
      default:
        return false;
    }
  });

  if(!typeValid && value !== null) {
    errors.push(createValidationError(
      ValidationErrorType.INVALID_TYPE,
      `Expected ${_currentPath} to be of type ${types.join(' | ')}`,
      _currentPath,
      { value, expectedTypes: types },
      types.join(' | '),
      ValidationErrorSeverity.ERROR,
      `Ensure ${_currentPath} is of the correct type`,
      context?.locale
    ));
    return { valid: false, errors };
  }

  // If no options to check, it's valid
  if(!field.options) {
    return { valid: errors.length === 0, errors };
  }

  const options = field.options;

  // Check string-specific constraints if value is a string
  if(typeof value === 'string' && options) {
    const stringErrors = validateStringConstraints(value, options);
    if(stringErrors) {
      // Update the field path
      stringErrors.field = _currentPath;
      errors.push(stringErrors);
    }
  }

  // Check number-specific constraints if value is a number
  if(typeof value === 'number' && options) {
    const numberErrors = validateNumberConstraints(value, options);
    if(numberErrors) {
      // Update the field path
      numberErrors.field = _currentPath;
      errors.push(numberErrors);
    }
  }

  // For objects, validate nested fields
  if(typeof value === 'object' && value !== null && !Array.isArray(value) && field.properties) {
    const promises: Promise<ValidationResult>[] = [];
    for(const [childKey, childField] of Object.entries(field.properties)) {
      const childValue = (value as Record<string, unknown>)[childKey];
      const childPath = `${_currentPath}.${childKey}`;
      
      const nestedResult = validateAgainstSchemaField(childValue, childField, childPath, context);
      if(nestedResult instanceof Promise) {
        promises.push(nestedResult.then((resolvedResult) => {
          if(!resolvedResult.valid) {
            errors.push(...resolvedResult.errors);
          }
          return resolvedResult;
        }));
      } else if(!nestedResult.valid) {
        errors.push(...nestedResult.errors);
      }
    }

    if(promises.length > 0) {
      return Promise.all(promises).then(() => ({
        valid: errors.length === 0,
        errors
      }));
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates a slide object against business rules
 * @param data
 * @returns {Promise<ValidationResult>} Promise with validation result
 */
export async function _validateSlide(data: Slide): Promise<ValidationResult> {
  return validateSlideWithBusinessRules(data);
}

/**
 * Validates form data using an async validation function
 * 
 * @param formData Form data to validate
 * @param validationFn Validation function
 * @param setValidating Function to set validating state
 * @param setValidationResult Function to set validation result
 */
export async function validateFormData<T>(
  formData: T,
  validationFn: (data: T) => Promise<ValidationResult>,
  setValidating: (validating: boolean) => void,
  setValidationResult: (result: ValidationResult) => void
): Promise<void> {
  setValidating(true);
  try {
    const result = await validationFn(formData);
    setValidationResult(result);
  } catch(error) {
    console.error('Validation error:', error);
    setValidationResult({
      valid: false,
      errors: [
        createValidationError(
          ValidationErrorType.ASYNC_VALIDATION_FAILED,
          'Validation failed unexpectedly',
          undefined,
          { error }
        )
      ]
    });
  } finally {
    setValidating(false);
  }
}

/**
 * Creates a debounced validator function
 * 
 * @param validateFn Validation function to debounce
 * @param debounceMs Debounce time in milliseconds
 * @returns Debounced validation function
 */
export function createDebouncedValidator<T>(
  validateFn: (data: T) => Promise<void>,
  debounceMs: number
): (data: T) => void {
  // Use type assertion to match the debounce function's expected type
  return debounce(validateFn as (...args: unknown[]) => unknown, debounceMs) as (data: T) => void;
}

/**
 * Gets a validation error for a specific field
 * 
 * @param errors Validation errors
 * @param fieldName Field name to find error for
 * @returns ValidationError or undefined if not found
 */
export function _getErrorForField(
  errors: ValidationResult['errors'],
  fieldName: string
): ValidationError | undefined {
  return errors.find(error => error.property === fieldName);
}

/**
 * Checks if a value is a valid slide object
 * 
 * @param value Value to check
 * @returns True if value is a valid slide
 */
export function isValidSlide(value: unknown): boolean {
  if (!isObject(value)) return false;
  
  // Add your slide validation logic here
  return true;
}

/**
 * Checks if a value has valid props
 * 
 * @param value Value to check
 * @returns True if value has valid props
 */
export function _isValidProps(value: unknown): boolean {
  if (!isObject(value)) return false;
  
  // Add your props validation logic here
  return true;
}

/**
 * Checks if a value is valid error info
 * 
 * @param value Value to check
 * @returns True if value is valid error info
 */
export function _isValidErrorInfo(value: unknown): boolean {
  if (!isObject(value)) return false;
  
  // Add your error info validation logic here
  return true;
} 