/**
 * Validation helper functions
 * 
 * Utility functions to assist with validation operations
 */

import { ValidationError, ValidationErrorType, ValidationErrorCode, ValidationErrorSeverity } from '../types/validation';
import type { ValidationContext, SchemaField } from '../types/validation';
import { isObject } from './type-checks';
import type { ValidationResult } from '../types/validation';
import type { Slide } from '../types/slider';
import { validateSlideWithBusinessRules } from './slide-validator';
import { debounce } from './common';

/**
 * Helper function to create a validation error with enhanced fields
 */
export function createValidationError(
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
 * Helper function to validate string constraints
 */
export function validateStringConstraints(
  value: string,
  propertyPath: string,
  options: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  },
  context?: ValidationContext
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (options.minLength !== undefined && value.length < options.minLength) {
    errors.push(
      createValidationError(
        ValidationErrorType.INVALID_RANGE,
        `${propertyPath} must be at least ${options.minLength} characters`,
        propertyPath,
        value,
        `>= ${options.minLength} characters`,
        ValidationErrorSeverity.ERROR,
        `Provide a longer string with at least ${options.minLength} characters`,
        context?.locale
      )
    );
  }

  if (options.maxLength !== undefined && value.length > options.maxLength) {
    errors.push(
      createValidationError(
        ValidationErrorType.INVALID_RANGE,
        `${propertyPath} must be at most ${options.maxLength} characters`,
        propertyPath,
        value,
        `<= ${options.maxLength} characters`,
        ValidationErrorSeverity.ERROR,
        `Provide a shorter string with at most ${options.maxLength} characters`,
        context?.locale
      )
    );
  }

  if (options.pattern && !options.pattern.test(value)) {
    errors.push(
      createValidationError(
        ValidationErrorType.INVALID_FORMAT,
        `${propertyPath} does not match required pattern`,
        propertyPath,
        value,
        options.pattern.toString(),
        ValidationErrorSeverity.ERROR,
        `Provide a string that matches the pattern ${options.pattern.toString()}`,
        context?.locale
      )
    );
  }

  return errors;
}

/**
 * Helper function to validate number constraints
 */
export function validateNumberConstraints(
  value: number,
  propertyPath: string,
  options: {
    min?: number;
    max?: number;
  },
  context?: ValidationContext
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (options.min !== undefined && value < options.min) {
    errors.push(
      createValidationError(
        ValidationErrorType.INVALID_RANGE,
        `${propertyPath} must be at least ${options.min}`,
        propertyPath,
        value,
        `>= ${options.min}`,
        ValidationErrorSeverity.ERROR,
        `Provide a number greater than or equal to ${options.min}`,
        context?.locale
      )
    );
  }

  if (options.max !== undefined && value > options.max) {
    errors.push(
      createValidationError(
        ValidationErrorType.INVALID_RANGE,
        `${propertyPath} must be at most ${options.max}`,
        propertyPath,
        value,
        `<= ${options.max}`,
        ValidationErrorSeverity.ERROR,
        `Provide a number less than or equal to ${options.max}`,
        context?.locale
      )
    );
  }

  return errors;
}

/**
 * Helper function to validate required fields in an object
 */
export function validateRequiredFields(
  value: unknown,
  requiredFields: string[],
  context?: ValidationContext
): ValidationError[] {
  if (!isObject(value)) return [];
  
  const errors: ValidationError[] = [];
  
  for (const field of requiredFields) {
    if (!(field in value) || value[field] === undefined || value[field] === null) {
      errors.push(
        createValidationError(
          ValidationErrorType.REQUIRED_PROP,
          `${field} is required`,
          field,
          undefined,
          'non-null value',
          ValidationErrorSeverity.ERROR,
          `Provide a value for ${field}`,
          context?.locale
        )
      );
    }
  }
  
  return errors;
}

/**
 * Validates a value against a schema field definition
 *
 * @param value - Value to validate
 * @param field - Schema field definition
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
  const currentPath = [...(context?.path || []), propertyPath].filter(Boolean);

  // Check required constraint if value is undefined or null
  if ((value === undefined || value === null) && field.options?.required) {
    return {
      valid: false,
      errors: [
        createValidationError(
          ValidationErrorType.REQUIRED_PROP,
          `${propertyPath} is required`,
          propertyPath,
          value,
          'non-null value',
          ValidationErrorSeverity.ERROR,
          `Provide a value for ${propertyPath}`,
          context?.locale
        ),
      ],
    };
  }

  // If value is undefined and not required, it's valid
  if (value === undefined) {
    return { valid: true, errors: [] };
  }

  // Type validation
  const types = Array.isArray(field.type) ? field.type : [field.type];

  // Check if value matches any of the allowed types
  const typeValid = types.some((type) => {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return isObject(value);
      case 'array':
        return Array.isArray(value);
      case 'null':
        return value === null;
      case 'any':
        return true;
      default:
        return false;
    }
  });

  if (!typeValid && value !== null) {
    errors.push(
      createValidationError(
        ValidationErrorType.INVALID_TYPE,
        `${propertyPath} must be of type ${types.join(' or ')}`,
        propertyPath,
        value,
        types.join(' or '),
        ValidationErrorSeverity.ERROR,
        `Provide a value of type ${types.join(' or ')}`,
        context?.locale
      )
    );

    // If type is not valid, don't continue with other validations
    return {
      valid: false,
      errors: errors.map((error) => ({ ...error, path: currentPath })),
    };
  }

  // Validate constraints if type is valid
  const options = field.options;
  if (options) {
    // String validations
    if (typeof value === 'string' && types.includes('string')) {
      const stringErrors = validateStringConstraints(
        value,
        propertyPath,
        {
          minLength: options.minLength,
          maxLength: options.maxLength,
          pattern: options.pattern,
        },
        context
      );
      errors.push(...stringErrors);
    }

    // Number validations
    if (typeof value === 'number' && types.includes('number')) {
      const numberErrors = validateNumberConstraints(
        value,
        propertyPath,
        {
          min: options.min,
          max: options.max,
        },
        context
      );
      errors.push(...numberErrors);
    }
  }

  // Recursive validation for objects
  if (isObject(value) && types.includes('object') && field.properties) {
    for (const [key, nestedField] of Object.entries(field.properties)) {
      if (key in value || nestedField.options?.required) {
        const nestedValue = value[key];
        const nestedResult = validateAgainstSchemaField(
          nestedValue,
          nestedField,
          `${propertyPath}.${key}`,
          context
        );

        // Handle asynchronous nested validation
        if (nestedResult instanceof Promise) {
          return nestedResult.then((resolvedResult) => {
            if (!resolvedResult.valid) {
              return {
                valid: false,
                errors: [...errors, ...resolvedResult.errors].map((error) => ({
                  ...error,
                  path: currentPath.concat(error.path || []),
                })),
              };
            }

            return {
              valid: errors.length === 0,
              errors: errors.map((error) => ({ ...error, path: currentPath })),
              metadata: resolvedResult.metadata,
            };
          });
        }

        if (!nestedResult.valid) {
          errors.push(...nestedResult.errors);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.map((error) => ({ ...error, path: currentPath })),
  };
}

/**
 * Validates a slide using business rules
 */
export async function validateSlide(data: Slide): Promise<ValidationResult> {
  return validateSlideWithBusinessRules(data);
}

/**
 * Validate form data with debounce handling
 * @param formData Data to validate
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
  } catch (error) {
    console.error('Validation error:', error);
    setValidationResult({
      valid: false,
      errors: [
        createValidationError(
          ValidationErrorType.CUSTOM_VALIDATION_FAILED,
          'Validation failed unexpectedly',
          undefined,
          undefined,
          undefined,
          ValidationErrorSeverity.ERROR
        )
      ]
    });
  } finally {
    setValidating(false);
  }
}

/**
 * Create a debounced validation function
 * @param validateFn Function to validate form data
 * @param debounceMs Debounce timeout in milliseconds
 * @returns Debounced validation function
 */
export function createDebouncedValidator<T>(
  validateFn: (data: T) => Promise<void>,
  debounceMs: number
): (data: T) => void {
  return debounce(validateFn, debounceMs);
}

/**
 * Get error for a specific field from validation result
 * @param errors - Validation errors array
 * @param fieldName - Field name to get error for
 * @returns Validation error for the field if found
 */
export function getErrorForField(
  errors: ValidationResult['errors'],
  fieldName: string
): ValidationError | undefined {
  return errors.find(error => error.property === fieldName);
} 