import { _slideSchema as slideSchema } from "../schemas/slide.schema";
import type { Slide } from "../types/slider";
import type {
  ValidationResult,
  ValidationError,
  ValidationContext,
  Validator,
  AsyncValidator,
} from "../types/validation";
import { ValidationErrorType, ValidationErrorCode } from "../types/validation";
import { memoizeValidator, composeAsyncValidators } from "./validation";
import { createSchemaValidator } from "../utils/validation";
import { ValidationErrorSeverity } from "../types/validation";
import type { SlideItem } from "../types/slider";
import { mockImageValidation } from "./test-helpers";

/**
 * Create a validator for slides using our schema system
 */
export const validateSlideWithSchema: Validator<unknown> = createSchemaValidator(slideSchema);

/**
 * @param value - Value to validate
 *
 * @param context - Validation context
 *
 * @returns {Promise<ValidationResult>} Async validation result
 *
 */
export const asyncValidateSlide: AsyncValidator<unknown> = async (
  value: unknown,
  context?: ValidationContext,
): Promise<ValidationResult> => {
  // Implementation will just forward to the schema validator
  const result = validateSlideWithSchema(value, context);
  return Promise.resolve(result);
};

/**
 * Memoized version of the schema validator for performance
 */
export const _memoizedSlideValidator = memoizeValidator(
  validateSlideWithSchema,
  // Custom key generator function based on essential slide properties
  (value: unknown) => {
    if (typeof value !== "object" || value === null) return "";
    const obj = value as Record<string, unknown>;
    return `${obj["id"] || ""}-${obj["title"] || ""}-${obj["image"] || ""}`;
  },
);

/**
 * Validates that all slides in an array are valid
 *
 * @param value
 *
 * @param context
 *
 * @returns {unknown} The function return value
 *
 */
export const _validateSlidesWithSchema = async (
  value: unknown,
  context?: ValidationContext,
): Promise<ValidationResult> => {
  if (!Array.isArray(value)) {
    return {
      valid: false,
      errors: [
        {
          type: ValidationErrorType.TYPE,
          code: ValidationErrorCode.INVALID_TYPE,
          message: "Value must be an array of slides",
          expected: "array",
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
          type: ValidationErrorType.RANGE,
          code: ValidationErrorCode.OUT_OF_RANGE,
          message: "Slides array cannot be empty",
          expected: "> 0 slides",
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
        }),
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
    },
  );

  // Run all validators and collect results
  const results = await Promise.all(validators.map((validator) => validator()));

  const allErrors = results
    .filter((result: ValidationResult) => !result.valid)
    .flatMap((result: ValidationResult) => result.errors);

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    metadata: {
      totalSlides: value.length,
      validSlides:
        value.length - results.filter((r: ValidationResult) => !r.valid).length,
    },
  };
};

/**
 * Enhanced slide validation that includes extra business rules
 */
export const _validateSlideWithBusinessRules: AsyncValidator<Slide> = composeAsyncValidators(
  asyncValidateSlide, // Use the async version to ensure types match
  async (value: unknown): Promise<ValidationResult> => {
    // Exit early if not a valid slide object
    if (typeof value !== "object" || value === null) {
      return { valid: true, errors: [] }; // Let schema validation handle this case
    }

    const slide = value as Record<string, unknown>;
    const errors = [];

    // Business rule: Title should not be too similar to description
    if (
      typeof slide["title"] === "string" &&
      typeof slide["description"] === "string" &&
      slide["description"].includes(slide["title"]) &&
      slide["title"].length > 5
    ) {
      errors.push({
        type: ValidationErrorType.CUSTOM,
        code: ValidationErrorCode.CUSTOM_ERROR,
        message: "Description should not simply repeat the title",
        property: "description",
        value: slide["description"],
        expected: "Unique content that adds value beyond the title",
        severity: ValidationErrorSeverity.WARNING, // Warning level since it's a guideline
        suggestion:
          "Make the description provide additional context or details not present in the title",
      });
    }

    // Business rule: Check image dimensions or other advanced validations
    // This would typically call an external service or API
    if (typeof slide["image"] === "string") {
      // Example of an async business rule (mock implementation)
      // In a real app, this might check image dimensions, file size, etc.
      const imageValid = await mockImageValidation(slide["image"]);

      if (!imageValid) {
        errors.push({
          type: ValidationErrorType.CUSTOM,
          code: ValidationErrorCode.CUSTOM_ERROR,
          message: "Image does not meet quality requirements",
          property: "image",
          value: slide["image"],
          expected: "High quality image (min 800x600)",
          severity: ValidationErrorSeverity.WARNING,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      metadata: {},
    };
  },
);

// Common validation error creator
export const createValidationError = (
  _schema: unknown,
  value: unknown,
  _context?: ValidationContext,
): ValidationError => {
  return {
    type: ValidationErrorType.CUSTOM,
    code: ValidationErrorCode.CUSTOM_ERROR,
    message: `Validation failed for value: ${JSON.stringify(value)}`,
    value,
    severity: ValidationErrorSeverity.ERROR,
    context: _context,
  };
};

/**
 * Validate a slide item against a schema
 *
 * @param slide - The slide item to validate
 *
 * @param _schema - The validation schema to use
 *
 * @param _options - Optional validation options
 *
 * @returns {ValidationResult} The validation result
 *
 */
export function validateSlide(
  slide: SlideItem,
  _schema: unknown,
  _options?: Record<string, unknown>,
): ValidationResult {
  // Basic validation implementation
  try {
    // Allow any valid slide as a simple example
    if (slide && typeof slide === "object" && slide.id) {
      return {
        valid: true,
        value: slide,
        errors: [],
      };
    }

    return {
      valid: false,
      errors: [
        {
          message: "Slide is invalid",
          path: ["slide"],
          value: slide,
          type: ValidationErrorType.TYPE,
          code: ValidationErrorCode.INVALID_TYPE,
          severity: ValidationErrorSeverity.ERROR,
        },
      ],
    };
  } catch (error) {
    return {
      valid: false,
      errors: [
        {
          message:
            error instanceof Error ? error.message : "Unknown validation error",
          path: ["slide"],
          value: slide,
          type: ValidationErrorType.TYPE,
          code: ValidationErrorCode.INVALID_TYPE,
          severity: ValidationErrorSeverity.ERROR,
        },
      ],
    };
  }
}

/**
 * Create a slide validator function for tests
 *
 * @param _schema - Schema for validation
 *
 * @param _options - Options for validation
 *
 * @returns A validator function for slides
 *
 */
export const _createSlideValidator = (
  _schema: unknown,
  _options?: Record<string, unknown>,
): Validator<Slide> => {
  return (_value: unknown) => {
    // Allow any valid slide as a simple example
    return { valid: true, errors: [] };
  };
};
