/**
 * Core validation utilities
 */

import type {
  ValidationResult,
  ValidationContext,
  Validator,
  AsyncValidator,
  Schema,
  ValidationError,
} from "../types/validation";
import {
  ValidationErrorType,
  ValidationErrorCode,
  ValidationErrorSeverity,
  SchemaType,
} from "../types/validation";
import type { SliderId as SlideId, ComponentId } from "../types/branded";

/**
 * Helper function to convert a string to a SlideId
 *
 * @param id The string to convert
 *
 * @returns The string as a SlideId
 *
 */
export function toSlideId(id: string): SlideId {
  return id as SlideId;
}

/**
 * Helper function to convert a string to a ComponentId
 *
 * @param id The string to convert
 *
 * @returns The string as a ComponentId
 *
 */
export function toComponentId(id: string): ComponentId {
  return id as ComponentId;
}

// Cache for memoized validators
const validatorCache = new Map<string, ValidationResult>();
const validatorRegistry = new Map<string, Validator<unknown>>();

/**
 * Helper function to check if a value is empty
 *
 * @param value The value to check
 *
 * @returns True if the value is: empty, false otherwise
 *
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

/**
 * Helper function to check if a value is an object
 *
 * @param value The value to check
 *
 * @returns True if the value is an: object, false otherwise
 *
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Helper function to safely get a value from an object using dot notation
 *
 * @param obj The object to get the value from
 *
 * @param path The dot-notation path to the value
 *
 * @param defaultValue The default value to return if the path doesn't exist
 *
 * @returns The value from the object or the default value
 *
 */
export function safeGet<T>(obj: unknown, path: string, defaultValue: T): T {
  if (obj === null || obj === undefined) return defaultValue;
  if (typeof obj !== "object") return defaultValue;

  const keys = path.split(".");
  let result: unknown = obj;

  for (const key of keys) {
    if (result === null || result === undefined || typeof result !== "object") {
      return defaultValue;
    }
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return defaultValue;
    }
    if (result === undefined) {
      return defaultValue;
    }
  }

  return result as T;
}

// Type guards
/**
 *
 * @param value
 *
 * @returns {unknown} - The return value
 *
 */
export function isValidSlide(value: unknown): boolean {
  if (!isObject(value)) return false;
  const requiredFields = ["id", "title", "image", "alt"];
  return requiredFields.every(
    (field) => !isEmpty(safeGet(value, field, undefined)),
  );
}

/**
 *
 * @param value
 *
 * @returns {ReturnType} The return value
 *
 */
export function isValidProps(value: unknown): boolean {
  if (!isObject(value)) return false;
  const { slides } = value;
  if (!Array.isArray(slides) || slides.length === 0) return false;
  return slides.every(isValidSlide);
}

/**
 *
 * @param value
 *
 * @returns {ReturnType} The return value
 *
 */
export function isValidErrorInfo(value: unknown): boolean {
  if (!isObject(value)) return false;
  const requiredFields = ["name", "message", "componentStack"];
  return requiredFields.every(
    (field) => !isEmpty(safeGet(value, field, undefined)),
  );
}

// Validation error creation
/**
 *
 * @param type
 *
 * @param message
 *
 * @param property
 *
 * @param value
 *
 * @param expected
 *
 * @param severity
 *
 * @param suggestion
 *
 * @param locale
 *
 * @returns {ReturnType} The return value
 *
 */
export function createValidationError(
  type: ValidationErrorType,
  message: string,
  property?: string,
  value?: unknown,
  expected?: unknown,
  severity: ValidationErrorSeverity = ValidationErrorSeverity.ERROR,
  suggestion?: string,
  locale?: string,
): ValidationError {
  return {
    type,
    code: ValidationErrorCode[
      type.toUpperCase() as keyof typeof ValidationErrorCode
    ],
    message,
    property,
    value,
    expected,
    severity,
    suggestion,
    locale,
  };
}

// Validation functions
/**
 *
 * @param input
 *
 * @param context
 *
 * @returns {ReturnType} The return value
 *
 */
export function validateSlides(
  input: unknown,
  context?: ValidationContext,
): ValidationResult {
  // Handle both single slide and array of slides
  const slides = Array.isArray(input) ? input : [input];

  if (!Array.isArray(input) && !isObject(input)) {
    return {
      valid: false,
      errors: [
        createValidationError(
          ValidationErrorType.REQUIRED_PROP,
          "Input must be a slide object or an array of slides",
          context?.path ? context.path.join(".") : "slides",
          input,
          "object or array",
        ),
      ],
    };
  }

  if (Array.isArray(input) && input.length === 0) {
    return {
      valid: false,
      errors: [
        createValidationError(
          ValidationErrorType.INVALID_RANGE,
          "At least one slide is required",
          context?.path ? context.path.join(".") : "slides",
          input,
          "non-empty array",
        ),
      ],
    };
  }

  const errors: ValidationError[] = [];
  slides.forEach((slide, index) => {
    if (!isObject(slide)) {
      errors.push(
        createValidationError(
          ValidationErrorType.INVALID_TYPE,
          Array.isArray(input)
            ? `Slide at index ${index} must be an object`
            : "Slide must be an object",
          context
            ? [
                ...(context.path || []),
                Array.isArray(input) ? `[${index}]` : "",
              ].join(".")
            : `[${index}]`,
          slide,
          "object",
        ),
      );
      return;
    }

    const requiredFields = ["id", "title", "image", "alt"];
    requiredFields.forEach((field) => {
      if (isEmpty(safeGet(slide, field, undefined))) {
        errors.push(
          createValidationError(
            ValidationErrorType.REQUIRED_PROP,
            Array.isArray(input)
              ? `Required property '${field}' is missing at index ${index}`
              : `Required property '${field}' is missing`,
            context
              ? [
                  ...(context.path || []),
                  Array.isArray(input) ? `[${index}]` : "",
                  field,
                ].join(".")
              : `[${index}].${field}`,
            undefined,
            "non-empty value",
          ),
        );
      }
    });

    // Type validation for string fields
    const stringFields = ["id", "title", "description", "image", "alt"];
    stringFields.forEach((field) => {
      const value = safeGet(slide, field, undefined);
      if (value !== undefined && typeof value !== "string") {
        errors.push(
          createValidationError(
            ValidationErrorType.INVALID_TYPE,
            Array.isArray(input)
              ? `Property '${field}' at index ${index} must be a string`
              : `Property '${field}' must be a string`,
            context
              ? [
                  ...(context.path || []),
                  Array.isArray(input) ? `[${index}]` : "",
                  field,
                ].join(".")
              : `[${index}].${field}`,
            value,
            "string",
          ),
        );
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 *
 * @param config
 *
 * @returns {ReturnType} The return value
 *
 */
export function validateAnimationConfig(config: unknown): ValidationResult {
  if (!isObject(config)) {
    return {
      valid: false,
      errors: [
        createValidationError(
          ValidationErrorType.INVALID_TYPE,
          "Animation config must be an object",
          "animationConfig",
          config,
          "object",
        ),
      ],
    };
  }

  const errors: ValidationError[] = [];
  const { duration, ease } = config;

  if (typeof duration !== "undefined") {
    if (typeof duration !== "number" || duration <= 0) {
      errors.push(
        createValidationError(
          ValidationErrorType.INVALID_RANGE,
          "Duration must be a positive number",
          "animationConfig.duration",
          duration,
          "positive number",
        ),
      );
    }
  }

  if (typeof ease !== "undefined" && typeof ease !== "string") {
    errors.push(
      createValidationError(
        ValidationErrorType.INVALID_TYPE,
        "Ease must be a string",
        "animationConfig.ease",
        ease,
        "string",
      ),
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 *
 * @param props
 *
 * @returns {ReturnType} The return value
 *
 */
export function validateProps(props: unknown): ValidationResult {
  if (!isObject(props)) {
    return {
      valid: false,
      errors: [
        createValidationError(
          ValidationErrorType.INVALID_TYPE,
          "Props must be an object",
          "props",
          props,
          "object",
        ),
      ],
    };
  }

  const errors: ValidationError[] = [];
  const { slides, initialSlide } = props;

  if (!slides) {
    errors.push(
      createValidationError(
        ValidationErrorType.REQUIRED_PROP,
        "Slides array is required",
        "props.slides",
        slides,
        "array of slides",
      ),
    );
  } else {
    const slidesValidation = validateSlides(slides);
    if (!slidesValidation.valid) {
      errors.push(...slidesValidation.errors);
    }
  }

  if (typeof initialSlide !== "undefined") {
    // Validate initialSlide is a number
    if (typeof initialSlide !== "number") {
      errors.push(
        createValidationError(
          ValidationErrorType.INVALID_TYPE,
          "initialSlide must be a number",
          "props.initialSlide",
          initialSlide,
          "number",
        ),
      );
    } else if (Array.isArray(slides) && slides.length > 0) {
      // Validate initialSlide is within range
      if (initialSlide < 0 || initialSlide >= slides.length) {
        errors.push(
          createValidationError(
            ValidationErrorType.INVALID_RANGE,
            `initialSlide must be between 0 and ${slides.length - 1}`,
            "props.initialSlide",
            initialSlide,
            `0-${slides.length - 1}`,
          ),
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 *
 * @param errorInfo
 *
 * @returns {ReturnType} The return value
 *
 */
export function validateErrorInfo(errorInfo: unknown): ValidationResult {
  if (!isObject(errorInfo)) {
    return {
      valid: false,
      errors: [
        createValidationError(
          ValidationErrorType.INVALID_TYPE,
          "Error info must be an object",
          "errorInfo",
          errorInfo,
          "object",
        ),
      ],
    };
  }

  const errors: ValidationError[] = [];
  const requiredFields = ["type", "code", "message"];
  requiredFields.forEach((field) => {
    if (isEmpty(safeGet(errorInfo, field, undefined))) {
      errors.push(
        createValidationError(
          ValidationErrorType.REQUIRED_PROP,
          `Required property '${field}' is missing`,
          `errorInfo.${field}`,
          undefined,
          "non-empty value",
        ),
      );
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 *
 * @param props
 *
 * @returns {ReturnType} The return value
 *
 */
export function validateAccessibility(props: unknown): ValidationResult {
  if (!isObject(props)) {
    return {
      valid: false,
      errors: [
        createValidationError(
          ValidationErrorType.INVALID_TYPE,
          "Accessibility props must be an object",
          "accessibility",
          props,
          "object",
        ),
      ],
    };
  }

  const errors: ValidationError[] = [];
  const { ariaLabel, ariaLive, role } = props;

  if (typeof ariaLabel !== "undefined" && typeof ariaLabel !== "string") {
    errors.push(
      createValidationError(
        ValidationErrorType.INVALID_TYPE,
        "aria-label must be a string",
        "accessibility.ariaLabel",
        ariaLabel,
        "string",
      ),
    );
  }

  if (typeof ariaLive !== "undefined" && typeof ariaLive !== "string") {
    errors.push(
      createValidationError(
        ValidationErrorType.INVALID_TYPE,
        "aria-live must be a string",
        "accessibility.ariaLive",
        ariaLive,
        "string",
      ),
    );
  }

  if (typeof role !== "undefined" && typeof role !== "string") {
    errors.push(
      createValidationError(
        ValidationErrorType.INVALID_TYPE,
        "role must be a string",
        "accessibility.role",
        role,
        "string",
      ),
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 *
 * @param config
 *
 * @returns {ReturnType} The return value
 *
 */
export function validatePerformanceConfig(config: unknown): ValidationResult {
  if (!isObject(config)) {
    return {
      valid: false,
      errors: [
        createValidationError(
          ValidationErrorType.INVALID_TYPE,
          "Performance config must be an object",
          "performanceConfig",
          config,
          "object",
        ),
      ],
    };
  }

  const errors: ValidationError[] = [];
  const {
    memoryTrackingInterval,
    fpsTrackingInterval,
    enableMemoryTracking,
    enableFpsTracking,
  } = config;

  if (typeof memoryTrackingInterval !== "undefined") {
    if (
      typeof memoryTrackingInterval !== "number" ||
      memoryTrackingInterval < 1000
    ) {
      errors.push(
        createValidationError(
          ValidationErrorType.INVALID_RANGE,
          "Memory tracking interval must be at least 1000ms",
          "performanceConfig.memoryTrackingInterval",
          memoryTrackingInterval,
          "number >= 1000",
        ),
      );
    }
  }

  if (typeof fpsTrackingInterval !== "undefined") {
    if (typeof fpsTrackingInterval !== "number" || fpsTrackingInterval <= 0) {
      errors.push(
        createValidationError(
          ValidationErrorType.INVALID_RANGE,
          "FPS tracking interval must be a positive number",
          "performanceConfig.fpsTrackingInterval",
          fpsTrackingInterval,
          "positive number",
        ),
      );
    }
  }

  if (
    typeof enableMemoryTracking !== "undefined" &&
    typeof enableMemoryTracking !== "boolean"
  ) {
    errors.push(
      createValidationError(
        ValidationErrorType.INVALID_TYPE,
        "enableMemoryTracking must be a boolean",
        "performanceConfig.enableMemoryTracking",
        enableMemoryTracking,
        "boolean",
      ),
    );
  }

  if (
    typeof enableFpsTracking !== "undefined" &&
    typeof enableFpsTracking !== "boolean"
  ) {
    errors.push(
      createValidationError(
        ValidationErrorType.INVALID_TYPE,
        "enableFpsTracking must be a boolean",
        "performanceConfig.enableFpsTracking",
        enableFpsTracking,
        "boolean",
      ),
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 *
 * @param url
 *
 * @returns {ReturnType} The return value
 *
 */
export async function validateImageExists(
  url: string,
): Promise<ValidationResult> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return {
        valid: false,
        errors: [
          createValidationError(
            ValidationErrorType.NETWORK_ERROR,
            `Failed to load image: Not Found (${response.status} ${response.statusText})`,
            "image",
            url,
            "accessible image URL",
          ),
        ],
      };
    }

    const contentType = response.headers.get("content-type");
    if (!contentType?.startsWith("image/")) {
      return {
        valid: false,
        errors: [
          createValidationError(
            ValidationErrorType.INVALID_TYPE,
            "URL does not point to an image",
            "image",
            url,
            "image URL",
          ),
        ],
      };
    }

    return {
      valid: true,
      errors: [],
    };
  } catch (error) {
    return {
      valid: false,
      errors: [
        createValidationError(
          ValidationErrorType.NETWORK_ERROR,
          `Network error: Not Found - ${(error as Error).message}`,
          "image",
          url,
          "accessible image URL",
        ),
      ],
    };
  }
}

// Validator composition
/**
 *
 * @param {...any} validators
 *
 * @returns {ReturnType} The return value
 *
 */
export function composeValidators<T>(
  ...validators: Array<Validator<T>>
): Validator<T> {
  return (value: T, context?: ValidationContext): ValidationResult => {
    const errors: ValidationError[] = [];
    let valid = true;

    for (const validator of validators) {
      const result = validator(value, context);
      if (!result.valid) {
        valid = false;
        errors.push(...result.errors);
      }
    }

    return {
      valid,
      errors,
      metadata: { count: validators.length, total: validators.length },
    };
  };
}

/**
 *
 * @param {...any} validators
 *
 * @returns {unknown} - The return value
 *
 */
export function composeAsyncValidators<T>(
  ...validators: Array<AsyncValidator<T>>
): AsyncValidator<T> {
  return async (
    value: T,
    context?: ValidationContext,
  ): Promise<ValidationResult> => {
    const errors: ValidationError[] = [];
    let valid = true;

    for (const validator of validators) {
      const result = await validator(value, context);
      if (!result.valid) {
        valid = false;
        errors.push(...result.errors);
      }
    }

    return {
      valid,
      errors,
      metadata: { count: validators.length, total: validators.length },
    };
  };
}

// Validator memoization
/**
 *
 * @param validator
 *
 * @param keyGenerator
 *
 * @returns {unknown} - The return value
 *
 */
export function memoizeValidator<T>(
  validator: Validator<T>,
  keyGenerator?: (value: T, context?: ValidationContext) => string,
): Validator<T> {
  return (value: T, context?: ValidationContext): ValidationResult => {
    const key = keyGenerator
      ? keyGenerator(value, context)
      : JSON.stringify(value);
    const cached = validatorCache.get(key);
    if (cached) return cached;

    const result = validator(value, context);
    validatorCache.set(key, result);
    return result;
  };
}

/**
 * Clears the validation cache
 *
 * @returns {void}
 *
 */
export function clearValidationCache(): void {
  if (validatorCache.size > 0) {
    validatorCache.clear();
  }
}

// Validator registry
/**
 *
 * @param name
 *
 * @param validator
 *
 * @returns {unknown} - The return value
 *
 */
export function registerValidator<T>(
  name: string,
  validator: Validator<T>,
): void {
  validatorRegistry.set(name, validator as Validator<unknown>);
}

/**
 *
 * @param name
 *
 * @returns {unknown} - The return value
 *
 */
export function getValidator<T>(name: string): Validator<T> | undefined {
  return validatorRegistry.get(name) as Validator<T> | undefined;
}

// Schema validation
/**
 *
 * @param schema
 *
 * @returns {unknown} - The return value
 *
 */
export function createSchemaValidator<T>(schema: Schema): Validator<T> {
  return (value: unknown, context?: ValidationContext): ValidationResult => {
    if (!isObject(value)) {
      return {
        valid: false,
        errors: [
          createValidationError(
            ValidationErrorType.INVALID_TYPE,
            "Value must be an object",
            context?.path ? context.path.join(".") : undefined,
            value,
            "object",
          ),
        ],
      };
    }

    const errors: ValidationError[] = [];

    for (const [key, field] of Object.entries(schema)) {
      const fieldValue = value[key];
      const fieldPath = context?.path ? [...context.path, key] : [key];

      if (field.options?.required && isEmpty(fieldValue)) {
        errors.push(
          createValidationError(
            ValidationErrorType.REQUIRED_PROP,
            `Required property '${key}' is missing`,
            fieldPath.join("."),
            undefined,
            "non-empty value",
          ),
        );
        continue;
      }

      if (fieldValue !== undefined) {
        if (
          field.type === SchemaType.STRING &&
          typeof fieldValue !== "string"
        ) {
          errors.push(
            createValidationError(
              ValidationErrorType.INVALID_TYPE,
              `Property '${key}' must be a string`,
              fieldPath.join("."),
              fieldValue,
              "string",
            ),
          );
        } else if (
          field.type === SchemaType.NUMBER &&
          typeof fieldValue !== "number"
        ) {
          errors.push(
            createValidationError(
              ValidationErrorType.INVALID_TYPE,
              `Property '${key}' must be a number`,
              fieldPath.join("."),
              fieldValue,
              "number",
            ),
          );
        } else if (
          field.type === SchemaType.BOOLEAN &&
          typeof fieldValue !== "boolean"
        ) {
          errors.push(
            createValidationError(
              ValidationErrorType.INVALID_TYPE,
              `Property '${key}' must be a boolean`,
              fieldPath.join("."),
              fieldValue,
              "boolean",
            ),
          );
        }

        if (field.options?.custom) {
          const customError = field.options.custom(fieldValue);
          if (customError) {
            errors.push(customError);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  };
}

/**
 * Gets an error for a specific field from a collection of validation errors
 *
 * @param errors Array of validation errors
 *
 * @param fieldName Name of the field to get errors for
 *
 * @returns The first error for the field or null if no errors exist
 *
 */
export function getErrorForField(
  errors: ValidationError[],
  fieldName: string,
): ValidationError | null {
  if (!Array.isArray(errors) || errors.length === 0) return null;

  return (
    errors.find((error) => {
      // Check for exact field name match
      if (error.property === fieldName) return true;

      // Check for nested field patterns like 'slides[0].title'
      if (error.property?.includes(".")) {
        const parts = error.property.split(".");
        return parts.includes(fieldName);
      }

      // Check for array index patterns like 'slides[0]'
      if (error.property?.includes("[") && error.property?.includes("]")) {
        const baseName = error.property.split("[")[0];
        return baseName === fieldName;
      }

      return false;
    }) || null
  );
}

/**
 * Gets a CSS class name based on field validation state
 *
 * @param errors Array of validation errors
 *
 * @param fieldName Name of the field to get the class for
 *
 * @returns A CSS class name based on validation state
 *
 */
export function getFieldClass(
  errors: ValidationError[],
  fieldName: string,
): string {
  const hasError = getErrorForField(errors, fieldName) !== null;
  return hasError ? "invalid" : "valid";
}
