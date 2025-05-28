import { useState } from "react";
import type { ValidationError, ValidationResult } from "../../types/validation";
import { getFieldClass, getErrorForField } from "../../utils/validation";
import type { SlideValidationOptions } from "../../types/hooks";

/**
 * Custom hook for slide validation
 *
 * @param data The data to validate
 *
 * @param _options Validation options
 *
 * @returns Validation state and utility functions
 *
 */
export function useSlideValidation(
  data: unknown,
  _options: SlideValidationOptions = {},
): {
  validationResult: ValidationResult;
  validating: boolean;
  submitted: boolean;
  setSubmitted: React.Dispatch<React.SetStateAction<boolean>>;
  getErrorForField: (fieldName: string) => ValidationError | null;
  getFieldClass: (fieldName: string) => string;
  setValidating: React.Dispatch<React.SetStateAction<boolean>>;
  setValidationResult: React.Dispatch<React.SetStateAction<ValidationResult>>;
} {
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    valid: true,
    errors: [],
  });
  const [validating, setValidating] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  return {
    validationResult,
    validating,
    submitted,
    setSubmitted,
    getErrorForField: (fieldName: string) =>
      getErrorForField(validationResult.errors, fieldName),
    getFieldClass: (fieldName: string) =>
      getFieldClass(validationResult.errors, fieldName),
    setValidating,
    setValidationResult,
  };
}
