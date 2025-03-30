import { useEffect, useState } from 'react';

import { DEFAULT_VALIDATION_DEBOUNCE } from '../constants/validation';
import { Slide } from '../types';
import {
  FormValidationOptions,
  FormValidationState,
} from '../types/form-validation';
import {
  getFieldClass as getFieldClassName,
  getFieldError,
  hasFormCriticalErrors,
} from './form-helpers';
import {
  validateSlideWithBusinessRules,
  validateSlideWithSchema,
} from './slide-validator';
import { ValidationError, ValidationResult } from './validation';

/**
 * Hook for handling form validation with debounce
 *
 * @param formData - The form data to validate
 * @param validationFn - Optional custom validation function
 * @param options - Validation options
 * @returns Object containing validation state, result and helper functions
 */
export function useFormValidation<T>(
  formData: T,
  validationFn?: (data: T) => Promise<ValidationResult>,
  options?: FormValidationOptions
): FormValidationState<T> {
  const debounceMs = options?.debounceMs ?? DEFAULT_VALIDATION_DEBOUNCE;
  const validateOnChange = options?.validateOnChange ?? true;

  const [validationResult, setValidationResult] = useState<ValidationResult>({
    valid: true,
    errors: [],
  });
  const [validating, setValidating] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Initial validation if validateOnMount is true
  useEffect(() => {
    if (options?.validateOnMount && validationFn) {
      const validateInitial = async (): Promise<void> => {
        setValidating(true);
        try {
          const result = await validationFn(formData);
          setValidationResult(result);
        } catch (error) {
          console.error('Validation error:', error);
        } finally {
          setValidating(false);
        }
      };

      void validateInitial();
    }
  }, [options?.validateOnMount, validationFn, formData]);

  // Real-time validation as user types
  useEffect(() => {
    if (!validateOnChange || !validationFn) return;

    const timer = setTimeout(() => {
      const validateWithDebounce = async (): Promise<void> => {
        setValidating(true);
        try {
          const result = await validationFn(formData);
          setValidationResult(result);
        } catch (error) {
          console.error('Validation error:', error);
        } finally {
          setValidating(false);
        }
      };

      void validateWithDebounce();
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [formData, validationFn, debounceMs, validateOnChange]);

  // Helper to get error message for a field
  const getErrorForField = (fieldName: string): ValidationError | undefined => {
    return getFieldError(validationResult.errors, fieldName);
  };

  // Helper to get CSS class based on validation state
  const getFieldClass = (fieldName: string): string => {
    const error = getErrorForField(fieldName);
    return getFieldClassName(error, submitted);
  };

  // Helper to check if form has critical errors
  const hasCriticalErrors = (): boolean => {
    return hasFormCriticalErrors(validationResult.errors);
  };

  return {
    validationResult,
    validating,
    submitted,
    setSubmitted,
    getErrorForField,
    getFieldClass,
    hasCriticalErrors,
    setValidating,
    setValidationResult,
  };
}

// Export getFeedbackClass from form-helpers
export { getFeedbackClass } from './form-helpers';

/**
 * Hook specifically for slide form validation
 *
 * @param slide - The slide data to validate
 * @param options - Validation options
 * @returns Form validation state and helper functions
 */
export function useSlideValidation(
  slide: Slide,
  options?: FormValidationOptions
): FormValidationState<Slide> {
  const validateSlide = async (data: Slide): Promise<ValidationResult> => {
    // Start with quick schema validation
    const schemaResult = await Promise.resolve(validateSlideWithSchema(data));

    // Only run business rules if schema is valid (optimization)
    if (schemaResult.valid) {
      return await validateSlideWithBusinessRules(data);
    }

    return schemaResult;
  };

  return useFormValidation(slide, validateSlide, options);
}

/**
 * Validate form data and handle submission
 *
 * @param data - The form data to validate
 * @param validationFn - Validation function
 * @param onSuccess - Callback for successful validation
 * @param setValidating - Function to update validating state
 * @param setValidationResult - Function to update validation results
 * @param setSubmitted - Function to update submitted state
 * @returns Promise that resolves when validation completes
 */
export async function validateAndSubmit<T>(
  data: T,
  validationFn: (data: T) => Promise<ValidationResult>,
  onSuccess: (data: T) => void,
  setValidating: (state: boolean) => void,
  setValidationResult: (result: ValidationResult) => void,
  setSubmitted: (state: boolean) => void
): Promise<void> {
  setSubmitted(true);
  setValidating(true);

  // Run full validation
  const result = await validationFn(data);
  setValidationResult(result);
  setValidating(false);

  // Only proceed if valid or only has warnings
  const hasErrors = hasFormCriticalErrors(result.errors);

  if (result.valid || !hasErrors) {
    onSuccess(data);
  }
}
