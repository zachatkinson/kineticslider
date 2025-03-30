import { slideSchema } from '../schemas/slide.schema';
import type { Slide } from '../types';
import {
  AsyncValidator,
  composeAsyncValidators,
  createSchemaValidator,
  memoizeValidator,
  ValidationErrorCode,
  ValidationErrorSeverity,
  ValidationErrorType,
  ValidationResult,
  Validator,
} from '../utils/validation';

/**
 * Create a validator for slides using our schema system
 */
export const validateSlideWithSchema: Validator<Slide> =
  createSchemaValidator(slideSchema);

/**
 * Async version of the slide validator to ensure compatible types
 */
export const asyncValidateSlide: AsyncValidator<Slide> = async (
  value,
  context
): Promise<ValidationResult> => {
  return Promise.resolve(validateSlideWithSchema(value, context));
};

/**
 * Memoized version of the schema validator for performance
 */
export const memoizedSlideValidator = memoizeValidator(
  validateSlideWithSchema,
  // Custom key generator function based on essential slide properties
  (value) => {
    if (typeof value !== 'object' || value === null) return '';
    const obj = value as Record<string, unknown>;
    return `${obj['id'] || ''}-${obj['title'] || ''}-${obj['image'] || ''}`;
  },
  // Cache options
  {
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100, // Cache up to 100 slide validations
  }
);

/**
 * Validates that all slides in an array are valid
 */
export const validateSlidesWithSchema: Validator<Slide[]> = async (
  value,
  context
) => {
  if (!Array.isArray(value)) {
    return {
      valid: false,
      errors: [
        {
          type: ValidationErrorType.INVALID_TYPE,
          code: ValidationErrorCode.INVALID_TYPE,
          message: 'Value must be an array of slides',
          expected: 'array',
          value,
          severity: ValidationErrorSeverity.ERROR,
        },
      ],
    };
  }

  if (value.length === 0) {
    return {
      valid: false,
      errors: [
        {
          type: ValidationErrorType.INVALID_RANGE,
          code: ValidationErrorCode.INVALID_RANGE,
          message: 'Slides array cannot be empty',
          expected: '> 0 slides',
          value: 0,
          severity: ValidationErrorSeverity.ERROR,
        },
      ],
    };
  }

  // Validate each slide in parallel
  const validators = value.map(
    (slide, index) => async (): Promise<ValidationResult> => {
      const result = await Promise.resolve(
        validateSlideWithSchema(slide, {
          ...context,
          path: [...(context?.path || []), `[${index}]`],
        })
      );

      if (!result.valid) {
        // Adjust error messages to include slide index
        return {
          valid: false,
          errors: result.errors.map((error) => ({
            ...error,
            message: `Slide at index ${index}: ${error.message}`,
          })),
        };
      }

      return result;
    }
  );

  // Run all validators and collect results
  const results = await Promise.all(validators.map((validator) => validator()));

  const allErrors = results
    .filter((result) => !result.valid)
    .flatMap((result) => result.errors);

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    metadata: {
      totalSlides: value.length,
      validSlides: value.length - results.filter((r) => !r.valid).length,
    },
  };
};

/**
 * Enhanced slide validation that includes extra business rules
 */
export const validateSlideWithBusinessRules: AsyncValidator<Slide> =
  composeAsyncValidators(
    asyncValidateSlide, // Use the async version to ensure types match
    async (value): Promise<ValidationResult> => {
      // Exit early if not a valid slide object
      if (typeof value !== 'object' || value === null) {
        return { valid: true, errors: [] }; // Let schema validation handle this case
      }

      const slide = value as Record<string, unknown>;
      const errors = [];

      // Business rule: Title should not be too similar to description
      if (
        typeof slide['title'] === 'string' &&
        typeof slide['description'] === 'string' &&
        slide['description'].includes(slide['title']) &&
        slide['title'].length > 5
      ) {
        errors.push({
          type: ValidationErrorType.CUSTOM_VALIDATION_FAILED,
          code: ValidationErrorCode.CUSTOM_VALIDATION_FAILED,
          message: 'Description should not simply repeat the title',
          property: 'description',
          value: slide['description'],
          expected: 'Unique content that adds value beyond the title',
          severity: ValidationErrorSeverity.WARNING, // Warning level since it's a guideline
          suggestion:
            'Make the description provide additional context or details not present in the title',
        });
      }

      // Business rule: Check image dimensions or other advanced validations
      // This would typically call an external service or API
      if (typeof slide['image'] === 'string') {
        // Example of an async business rule (mock implementation)
        // In a real app, this might check image dimensions, file size, etc.
        const imageValid = await mockImageValidation(slide['image']);

        if (!imageValid) {
          errors.push({
            type: ValidationErrorType.CUSTOM_VALIDATION_FAILED,
            code: ValidationErrorCode.CUSTOM_VALIDATION_FAILED,
            message: 'Image does not meet quality requirements',
            property: 'image',
            value: slide['image'],
            expected: 'High quality image (min 800x600)',
            severity: ValidationErrorSeverity.WARNING,
          });
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        metadata: {
          checkedBusinessRules: true,
          timestamp: new Date().toISOString(),
        },
      };
    }
  );

// Mock function for demonstration purposes
async function mockImageValidation(imageUrl: string): Promise<boolean> {
  // In a real implementation, this would check image dimensions, file size, etc.
  return !imageUrl.includes('thumbnail') && !imageUrl.includes('small');
}
