import type {
  ComponentId,
  KineticSliderProps,
  Slide,
  SlideId,
  SliderErrorInfo,
} from '../types';
import {
  AsyncValidator,
  CacheEntry,
  Schema,
  SchemaField,
  ValidationCacheOptions,
  ValidationContext,
  ValidationError,
  ValidationErrorCode,
  ValidationErrorSeverity,
  ValidationErrorType,
  ValidationResult,
  Validator,
} from '../types/validation';
import { createComponentId, createSlideId } from './id-helpers';

export {
  ValidationErrorType,
  ValidationErrorCode,
  ValidationErrorSeverity,
} from '../types/validation';

export type {
  ValidationError,
  ValidationResult,
  ValidationContext,
  Validator,
  AsyncValidator,
  TypeGuard,
  AsyncTypeGuard,
} from '../types/validation';

// Registry of custom validators
const validatorRegistry = new Map<string, Validator | AsyncValidator>();

/**
 * Register a custom validator
 *
 * @param name - Name of the validator
 * @param validator - Validator function
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

// Enhanced cache for memoized validators with TTL and size limits
class ValidationCache {
  private cache = new Map<string, CacheEntry>();
  private options: ValidationCacheOptions = {
    ttl: 5 * 60 * 1000, // 5 minutes default
    maxSize: 1000, // 1000 entries default
  };

  constructor(options?: ValidationCacheOptions) {
    if (options) {
      this.options = { ...this.options, ...options };
    }
  }

  get(key: string): ValidationResult | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check if entry has expired
    if (this.options.ttl && Date.now() - entry.timestamp > this.options.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.result;
  }

  set(key: string, result: ValidationResult): void {
    // Check if cache is at max size and remove oldest entry
    if (this.options.maxSize && this.cache.size >= this.options.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    // Ensure key is a string to avoid type errors
    const safeKey = key || '';

    this.cache.set(safeKey, {
      result,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Global validation cache with default options
const validationCache = new ValidationCache();

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
  options?: ValidationCacheOptions
): Validator<T> {
  // Create a dedicated cache for this validator if custom options are provided
  const cache = options ? new ValidationCache(options) : validationCache;

  return (
    value: unknown,
    context?: ValidationContext
  ): ValidationResult | Promise<ValidationResult> => {
    const key = getKey(value, context);

    const cachedResult = cache.get(key);
    if (cachedResult) {
      return cachedResult;
    }

    const result = validator(value, context);

    // Handle both synchronous and asynchronous validation results
    if (result instanceof Promise) {
      // For async results, wait for them and then cache
      return result.then((asyncResult) => {
        cache.set(key, asyncResult);
        return asyncResult;
      });
    } else {
      // For sync results, cache directly
      cache.set(key, result);
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
    [ValidationErrorType.ASYNC_VALIDATION_FAILED]:
      ValidationErrorCode.ASYNC_VALIDATION_FAILED,
    [ValidationErrorType.CUSTOM_VALIDATION_FAILED]:
      ValidationErrorCode.CUSTOM_VALIDATION_FAILED,
    [ValidationErrorType.SCHEMA_VALIDATION_FAILED]:
      ValidationErrorCode.SCHEMA_VALIDATION_FAILED,
    [ValidationErrorType.CONSTRAINT_VALIDATION_FAILED]:
      ValidationErrorCode.CONSTRAINT_VALIDATION_FAILED,
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
 * Convert a string to a SlideId branded type
 */
export function toSlideId(id: string): SlideId {
  return createSlideId(id);
}

/**
 * Convert a string to a ComponentId branded type
 */
export function toComponentId(id: string): ComponentId {
  return createComponentId(id);
}

/**
 * Safe type checker to validate a value is an object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Safely get a property from an object with a default value
 */
export function safeGet<T>(
  obj: Record<string, unknown> | null | undefined,
  key: string,
  defaultValue: T
): T {
  if (!obj) return defaultValue;
  const value = obj[key];
  return value !== undefined ? (value as T) : defaultValue;
}

/**
 * Validates a value against a schema field definition
 *
 * @param value - Value to validate
 * @param field - Schema field definition
 * @param context - Validation context
 * @returns Validation result
 */
function validateAgainstSchemaField(
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
    }

    // Number validations
    if (typeof value === 'number' && types.includes('number')) {
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
    }

    // Array validations
    if (Array.isArray(value) && types.includes('array')) {
      if (options.minLength !== undefined && value.length < options.minLength) {
        errors.push(
          createValidationError(
            ValidationErrorType.INVALID_RANGE,
            `${propertyPath} must contain at least ${options.minLength} items`,
            propertyPath,
            value,
            `>= ${options.minLength} items`,
            ValidationErrorSeverity.ERROR,
            `Provide an array with at least ${options.minLength} items`,
            context?.locale
          )
        );
      }

      if (options.maxLength !== undefined && value.length > options.maxLength) {
        errors.push(
          createValidationError(
            ValidationErrorType.INVALID_RANGE,
            `${propertyPath} must contain at most ${options.maxLength} items`,
            propertyPath,
            value,
            `<= ${options.maxLength} items`,
            ValidationErrorSeverity.ERROR,
            `Provide an array with at most ${options.maxLength} items`,
            context?.locale
          )
        );
      }
    }

    // Enum validations
    if (options.enum !== undefined && !options.enum.includes(value)) {
      errors.push(
        createValidationError(
          ValidationErrorType.INVALID_OPTION,
          `${propertyPath} must be one of [${options.enum.join(', ')}]`,
          propertyPath,
          value,
          options.enum.join(', '),
          ValidationErrorSeverity.ERROR,
          `Provide one of the following values: ${options.enum.join(', ')}`,
          context?.locale
        )
      );
    }

    // Custom validation
    if (options.custom) {
      const customResult = options.custom(value);

      // Handle both synchronous and asynchronous custom validators
      if (customResult instanceof Promise) {
        return customResult.then((result) => {
          if (!result.valid) {
            const customErrors = result.errors.map((error) => ({
              ...error,
              path: currentPath,
            }));

            return {
              valid: false,
              errors: [...errors, ...customErrors].map((error) => ({
                ...error,
                path: currentPath,
              })),
            };
          }

          return {
            valid: errors.length === 0,
            errors: errors.map((error) => ({ ...error, path: currentPath })),
            metadata: result.metadata,
          };
        });
      }

      if (!customResult.valid) {
        errors.push(...customResult.errors);
      }
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

  // Recursive validation for arrays
  if (Array.isArray(value) && types.includes('array') && field.items) {
    for (let i = 0; i < value.length; i++) {
      const itemResult = validateAgainstSchemaField(
        value[i],
        field.items,
        `${propertyPath}[${i}]`,
        context
      );

      // Handle asynchronous item validation
      if (itemResult instanceof Promise) {
        return itemResult.then((resolvedResult) => {
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

      if (!itemResult.valid) {
        errors.push(...itemResult.errors);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.map((error) => ({ ...error, path: currentPath })),
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
    });
  };
}

/**
 * Validates a single slide object with improved null safety and type handling
 *
 * @param slide - The slide object to validate
 * @param context - Optional validation context
 * @returns Validation result
 */
function validateSlide(
  slide: unknown,
  context?: ValidationContext
): ValidationResult {
  const errors: ValidationError[] = [];
  // not using currentPath, so disable the eslint warning

  const currentPath = context?.path || [];

  // Check if slide is an object
  if (!isObject(slide)) {
    return {
      valid: false,
      errors: [
        createValidationError(
          ValidationErrorType.INVALID_TYPE,
          'Slide must be an object',
          undefined,
          slide,
          'object'
        ),
      ],
    };
  }

  // Required fields
  const requiredFields = ['id', 'title', 'image', 'alt'];
  for (const field of requiredFields) {
    if (
      !(field in slide) ||
      slide[field] === undefined ||
      slide[field] === null
    ) {
      errors.push(
        createValidationError(
          ValidationErrorType.REQUIRED_PROP,
          `Slide ${field} is required`,
          field,
          undefined,
          'non-null value'
        )
      );
    }
  }

  // Check types with null safety
  if (
    'id' in slide &&
    slide['id'] !== undefined &&
    typeof slide['id'] !== 'string'
  ) {
    errors.push(
      createValidationError(
        ValidationErrorType.INVALID_TYPE,
        'Slide id must be a string',
        'id',
        slide['id'],
        'string'
      )
    );
  }

  if (
    'title' in slide &&
    slide['title'] !== undefined &&
    typeof slide['title'] !== 'string'
  ) {
    errors.push(
      createValidationError(
        ValidationErrorType.INVALID_TYPE,
        'Slide title must be a string',
        'title',
        slide['title'],
        'string'
      )
    );
  }

  if (
    'description' in slide &&
    slide['description'] !== undefined &&
    typeof slide['description'] !== 'string'
  ) {
    errors.push(
      createValidationError(
        ValidationErrorType.INVALID_TYPE,
        'Slide description must be a string',
        'description',
        slide['description'],
        'string'
      )
    );
  }

  if (
    'image' in slide &&
    slide['image'] !== undefined &&
    typeof slide['image'] !== 'string'
  ) {
    errors.push(
      createValidationError(
        ValidationErrorType.INVALID_TYPE,
        'Slide image must be a string URL',
        'image',
        slide['image'],
        'string'
      )
    );
  }

  if (
    'alt' in slide &&
    slide['alt'] !== undefined &&
    typeof slide['alt'] !== 'string'
  ) {
    errors.push(
      createValidationError(
        ValidationErrorType.INVALID_TYPE,
        'Slide alt text must be a string',
        'alt',
        slide['alt'],
        'string'
      )
    );
  }

  return {
    valid: errors.length === 0,
    errors: errors.map((error) => ({
      ...error,
      path: [...currentPath, error.property || ''].filter(Boolean),
    })),
  };
}

/**
 * Validates that an image URL is valid and the image exists
 *
 * @param url - URL to validate
 * @returns Promise with validation result
 */
export async function validateImageExists(
  url: unknown
): Promise<ValidationResult> {
  if (typeof url !== 'string') {
    return {
      valid: false,
      errors: [
        createValidationError(
          ValidationErrorType.INVALID_TYPE,
          'URL must be a string',
          'url',
          url,
          'string'
        ),
      ],
    };
  }

  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) {
      return {
        valid: false,
        errors: [
          createValidationError(
            ValidationErrorType.ASYNC_VALIDATION_FAILED,
            `Image URL is not accessible: ${url}`,
            'url',
            url,
            'accessible URL'
          ),
        ],
      };
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      return {
        valid: false,
        errors: [
          createValidationError(
            ValidationErrorType.INVALID_FORMAT,
            `URL does not point to an image: ${url}`,
            'url',
            url,
            'image URL'
          ),
        ],
      };
    }

    return { valid: true, errors: [] };
  } catch (error) {
    return {
      valid: false,
      errors: [
        createValidationError(
          ValidationErrorType.ASYNC_VALIDATION_FAILED,
          `Failed to validate image URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'url',
          url,
          'accessible URL'
        ),
      ],
    };
  }
}

/**
 * Validate slide image URL
 */
export const validateSlideImageUrl = memoizeValidator(
  async (slide: unknown): Promise<ValidationResult> => {
    if (!isObject(slide) || typeof slide['image'] !== 'string') {
      return {
        valid: false,
        errors: [
          createValidationError(
            ValidationErrorType.INVALID_TYPE,
            'Slide must be an object with an image URL',
            'image',
            slide,
            'object with image property'
          ),
        ],
      };
    }

    return validateImageExists(slide['image']);
  },
  (slide) => (isObject(slide) ? String(slide['image'] || '') : '')
);

/**
 * Compose validator for slide with image URL validation
 */
export const validateSlideWithUrl = composeValidators(
  validateSlide,
  (slide: unknown): ValidationResult => {
    // We just check if the 'image' property exists and is a string
    // The actual URL validation happens asynchronously
    if (!isObject(slide) || !slide['image']) {
      return {
        valid: false,
        errors: [
          createValidationError(
            ValidationErrorType.REQUIRED_PROP,
            'Slide image is required',
            'image',
            undefined,
            'string URL'
          ),
        ],
      };
    }

    if (typeof slide['image'] !== 'string') {
      return {
        valid: false,
        errors: [
          createValidationError(
            ValidationErrorType.INVALID_TYPE,
            'Slide image must be a string URL',
            'image',
            slide['image'],
            'string URL'
          ),
        ],
      };
    }

    return { valid: true, errors: [] };
  }
);

/**
 * Validates an array of slides with improved null safety and error handling
 *
 * @param slides - The slides array to validate
 * @param context - Optional validation context
 * @returns Validation result
 */
export function validateSlides(
  slides: unknown,
  context?: ValidationContext
): ValidationResult {
  const errors: ValidationError[] = [];
  const currentPath = context?.path || [];

  // Check if slides is an array
  if (!Array.isArray(slides)) {
    return {
      valid: false,
      errors: [
        createValidationError(
          ValidationErrorType.INVALID_TYPE,
          'Slides must be an array',
          undefined,
          slides,
          'array'
        ),
      ],
    };
  }

  // Check if array is empty
  if (slides.length === 0) {
    return {
      valid: false,
      errors: [
        createValidationError(
          ValidationErrorType.INVALID_RANGE,
          'Slides array cannot be empty',
          undefined,
          slides.length,
          '> 0'
        ),
      ],
    };
  }

  // Validate each slide
  slides.forEach((slide, index) => {
    const slideContext = {
      ...context,
      path: [...currentPath, `[${index}]`],
    };

    const result = validateSlide(slide, slideContext);
    if (!result.valid) {
      errors.push(
        ...result.errors.map((error) => ({
          ...error,
          message: `Slide at index ${index}: ${error.message}`,
        }))
      );
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates animation configuration with improved error handling
 *
 * @param config - The animation config to validate
 * @param context - Optional validation context
 * @returns Validation result
 */
export function validateAnimationConfig(
  config: unknown,
  context?: ValidationContext
): ValidationResult {
  const errors: ValidationError[] = [];
  const currentPath = context?.path || [];

  // Check if config is an object
  if (!isObject(config)) {
    return {
      valid: false,
      errors: [
        createValidationError(
          ValidationErrorType.INVALID_TYPE,
          'Animation config must be an object',
          undefined,
          config,
          'object'
        ),
      ],
    };
  }

  // Validate duration
  if ('duration' in config) {
    if (
      config['duration'] !== undefined &&
      typeof config['duration'] !== 'number'
    ) {
      errors.push(
        createValidationError(
          ValidationErrorType.INVALID_TYPE,
          'Animation duration must be a number',
          'duration',
          config['duration'],
          'number'
        )
      );
    } else if (
      typeof config['duration'] === 'number' &&
      config['duration'] < 0
    ) {
      errors.push(
        createValidationError(
          ValidationErrorType.INVALID_RANGE,
          'Animation duration must be positive',
          'duration',
          config['duration'],
          '>= 0'
        )
      );
    }
  }

  // Validate ease
  if (
    'ease' in config &&
    config['ease'] !== undefined &&
    typeof config['ease'] !== 'string'
  ) {
    errors.push(
      createValidationError(
        ValidationErrorType.INVALID_TYPE,
        'Animation ease must be a string',
        'ease',
        config['ease'],
        'string'
      )
    );
  }

  return {
    valid: errors.length === 0,
    errors: errors.map((error) => ({
      ...error,
      path: [...currentPath, error.property || ''].filter(Boolean),
    })),
  };
}

/**
 * Validates all KineticSlider props with improved type safety
 *
 * @param props - The props to validate
 * @param context - Optional validation context
 * @returns Validation result
 */
export function validateProps(
  props: unknown,
  context?: ValidationContext
): ValidationResult {
  const errors: ValidationError[] = [];
  const currentPath = context?.path || [];

  // Check if props is an object
  if (!isObject(props)) {
    return {
      valid: false,
      errors: [
        createValidationError(
          ValidationErrorType.INVALID_TYPE,
          'Props must be an object',
          undefined,
          props,
          'object'
        ),
      ],
    };
  }

  // Validate slides
  if (!props['slides']) {
    errors.push(
      createValidationError(
        ValidationErrorType.REQUIRED_PROP,
        'Slides prop is required',
        'slides',
        undefined,
        'array'
      )
    );
  } else {
    const slidesContext = {
      ...context,
      path: [...currentPath, 'slides'],
    };

    const slidesResult = validateSlides(props['slides'], slidesContext);
    if (!slidesResult.valid) {
      errors.push(...slidesResult.errors);
    }
  }

  // Validate initialSlide
  if (
    props['initialSlide'] !== undefined &&
    (typeof props['initialSlide'] !== 'number' ||
      props['initialSlide'] < 0 ||
      (Array.isArray(props['slides']) &&
        props['initialSlide'] >= props['slides'].length))
  ) {
    errors.push(
      createValidationError(
        ValidationErrorType.INVALID_RANGE,
        'initialSlide must be a number between 0 and slides.length - 1',
        'initialSlide',
        props['initialSlide'],
        `0 to ${Array.isArray(props['slides']) ? props['slides'].length - 1 : 'n-1'}`
      )
    );
  }

  // Validate callback functions
  if (
    props['onSlideChange'] !== undefined &&
    typeof props['onSlideChange'] !== 'function'
  ) {
    errors.push(
      createValidationError(
        ValidationErrorType.INVALID_TYPE,
        'onSlideChange must be a function',
        'onSlideChange',
        props['onSlideChange'],
        'function'
      )
    );
  }

  if (
    props['onAnimationComplete'] !== undefined &&
    typeof props['onAnimationComplete'] !== 'function'
  ) {
    errors.push(
      createValidationError(
        ValidationErrorType.INVALID_TYPE,
        'onAnimationComplete must be a function',
        'onAnimationComplete',
        props['onAnimationComplete'],
        'function'
      )
    );
  }

  // Validate animation properties
  if (props['duration'] !== undefined) {
    if (typeof props['duration'] !== 'number') {
      errors.push(
        createValidationError(
          ValidationErrorType.INVALID_TYPE,
          'Duration must be a number',
          'duration',
          props['duration'],
          'number'
        )
      );
    } else if (props['duration'] < 0) {
      errors.push(
        createValidationError(
          ValidationErrorType.INVALID_RANGE,
          'Duration must be positive',
          'duration',
          props['duration'],
          '>= 0'
        )
      );
    }
  }

  if (props['ease'] !== undefined && typeof props['ease'] !== 'string') {
    errors.push(
      createValidationError(
        ValidationErrorType.INVALID_TYPE,
        'Ease must be a string',
        'ease',
        props['ease'],
        'string'
      )
    );
  }

  return {
    valid: errors.length === 0,
    errors: errors.map((error) => ({
      ...error,
      path: [...currentPath, error.property || ''].filter(Boolean),
    })),
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
  const errors: ValidationError[] = [];
  const currentPath = context?.path || [];

  // Check if errorInfo is an object
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
  for (const field of requiredFields) {
    if (
      !(field in errorInfo) ||
      errorInfo[field] === undefined ||
      errorInfo[field] === null
    ) {
      errors.push(
        createValidationError(
          ValidationErrorType.REQUIRED_PROP,
          `Error info ${field} is required`,
          field,
          undefined,
          'non-null value'
        )
      );
    }
  }

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

  if (
    'componentStack' in errorInfo &&
    errorInfo['componentStack'] !== undefined &&
    typeof errorInfo['componentStack'] !== 'string'
  ) {
    errors.push(
      createValidationError(
        ValidationErrorType.INVALID_TYPE,
        'Component stack must be a string',
        'componentStack',
        errorInfo['componentStack'],
        'string'
      )
    );
  }

  if (
    'timestamp' in errorInfo &&
    errorInfo['timestamp'] !== undefined &&
    typeof errorInfo['timestamp'] !== 'string'
  ) {
    errors.push(
      createValidationError(
        ValidationErrorType.INVALID_TYPE,
        'Timestamp must be a string',
        'timestamp',
        errorInfo['timestamp'],
        'string'
      )
    );
  }

  if (
    'code' in errorInfo &&
    errorInfo['code'] !== undefined &&
    typeof errorInfo['code'] !== 'string'
  ) {
    errors.push(
      createValidationError(
        ValidationErrorType.INVALID_TYPE,
        'Error code must be a string',
        'code',
        errorInfo['code'],
        'string'
      )
    );
  }

  return {
    valid: errors.length === 0,
    errors: errors.map((error) => ({
      ...error,
      path: [...currentPath, error.property || ''].filter(Boolean),
    })),
  };
}

/**
 * Validates accessibility properties
 *
 * @param props - Accessibility properties to validate
 * @param context - Optional validation context
 * @returns Validation result
 */
export function validateAccessibility(
  props: unknown,
  context?: ValidationContext
): ValidationResult {
  const errors: ValidationError[] = [];
  const currentPath = context?.path || [];

  // Check if props is an object
  if (!isObject(props)) {
    return {
      valid: false,
      errors: [
        createValidationError(
          ValidationErrorType.INVALID_TYPE,
          'Accessibility props must be an object',
          undefined,
          props,
          'object'
        ),
      ],
    };
  }

  // Validate aria-label if present
  if (
    'aria-label' in props &&
    props['aria-label'] !== undefined &&
    typeof props['aria-label'] !== 'string'
  ) {
    errors.push(
      createValidationError(
        ValidationErrorType.INVALID_TYPE,
        'aria-label must be a string',
        'aria-label',
        props['aria-label'],
        'string'
      )
    );
  }

  // Validate aria-labelledby if present
  if (
    'aria-labelledby' in props &&
    props['aria-labelledby'] !== undefined &&
    typeof props['aria-labelledby'] !== 'string'
  ) {
    errors.push(
      createValidationError(
        ValidationErrorType.INVALID_TYPE,
        'aria-labelledby must be a string',
        'aria-labelledby',
        props['aria-labelledby'],
        'string'
      )
    );
  }

  // Validate tabIndex if present
  if ('tabIndex' in props) {
    if (typeof props['tabIndex'] !== 'number') {
      errors.push(
        createValidationError(
          ValidationErrorType.INVALID_TYPE,
          'tabIndex must be a number',
          'tabIndex',
          props['tabIndex'],
          'number'
        )
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.map((error) => ({
      ...error,
      path: [...currentPath, error.property || ''].filter(Boolean),
    })),
  };
}

/**
 * Validates performance configuration
 *
 * @param config - Performance configuration to validate
 * @param context - Optional validation context
 * @returns Validation result
 */
export function validatePerformanceConfig(
  config: unknown,
  context?: ValidationContext
): ValidationResult {
  const errors: ValidationError[] = [];
  const currentPath = context?.path || [];

  // Check if config is an object
  if (!isObject(config)) {
    return {
      valid: false,
      errors: [
        createValidationError(
          ValidationErrorType.INVALID_TYPE,
          'Performance config must be an object',
          undefined,
          config,
          'object'
        ),
      ],
    };
  }

  // Validate enabled flag if present
  if (
    'enabled' in config &&
    config['enabled'] !== undefined &&
    typeof config['enabled'] !== 'boolean'
  ) {
    errors.push(
      createValidationError(
        ValidationErrorType.INVALID_TYPE,
        'enabled flag must be a boolean',
        'enabled',
        config['enabled'],
        'boolean'
      )
    );
  }

  // Validate trackFPS if present
  if (
    'trackFPS' in config &&
    config['trackFPS'] !== undefined &&
    typeof config['trackFPS'] !== 'boolean'
  ) {
    errors.push(
      createValidationError(
        ValidationErrorType.INVALID_TYPE,
        'trackFPS must be a boolean',
        'trackFPS',
        config['trackFPS'],
        'boolean'
      )
    );
  }

  // Validate trackMemory if present
  if (
    'trackMemory' in config &&
    config['trackMemory'] !== undefined &&
    typeof config['trackMemory'] !== 'boolean'
  ) {
    errors.push(
      createValidationError(
        ValidationErrorType.INVALID_TYPE,
        'trackMemory must be a boolean',
        'trackMemory',
        config['trackMemory'],
        'boolean'
      )
    );
  }

  // Validate memoryTrackingInterval if present
  if ('memoryTrackingInterval' in config) {
    if (typeof config['memoryTrackingInterval'] !== 'number') {
      errors.push(
        createValidationError(
          ValidationErrorType.INVALID_TYPE,
          'memoryTrackingInterval must be a number',
          'memoryTrackingInterval',
          config['memoryTrackingInterval'],
          'number'
        )
      );
    } else if (config['memoryTrackingInterval'] < 1000) {
      errors.push(
        createValidationError(
          ValidationErrorType.INVALID_RANGE,
          'memoryTrackingInterval must be at least 1000ms',
          'memoryTrackingInterval',
          config['memoryTrackingInterval'],
          '>= 1000'
        )
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.map((error) => ({
      ...error,
      path: [...currentPath, error.property || ''].filter(Boolean),
    })),
  };
}

/**
 * Helper function to check if a value is empty
 *
 * @param value - The value to check
 * @returns True if value is considered empty
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Creates a validator function that returns boolean
 *
 * @param validator - The validation function
 * @returns A function that returns a boolean
 */
export function createValidator<T>(
  validator: (value: unknown, context?: ValidationContext) => ValidationResult
): (value: unknown, context?: ValidationContext) => value is T {
  return (value: unknown, context?: ValidationContext): value is T => {
    const result = validator(value, context);
    return result.valid;
  };
}

// Register the built-in validators
registerValidator('slide', validateSlide);
registerValidator('slides', validateSlides);
registerValidator('animationConfig', validateAnimationConfig);
registerValidator('props', validateProps);
registerValidator('errorInfo', validateErrorInfo);
registerValidator('accessibility', validateAccessibility);
registerValidator('performanceConfig', validatePerformanceConfig);

// Type guards using the validators
export const isValidSlide = createValidator<Slide>(validateSlide);
export const isValidProps = createValidator<KineticSliderProps>(validateProps);
export const isValidErrorInfo =
  createValidator<SliderErrorInfo>(validateErrorInfo);
