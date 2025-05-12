import React from "react";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { ValidationError } from "@/types/validation";
import {
  ValidationErrorType,
  ValidationErrorCode,
  ValidationErrorSeverity,
} from "@/types/validation";
import type { ValidationResult } from "@/types/validation";
import type { Slide } from "@/types/slider";

// Mock modules before imports
vi.mock("@/hooks/slider/useSlideValidation", () => ({
  useSlideValidation: vi.fn(() => ({
    validationResult: { valid: true, errors: [] },
    validating: false,
    submitted: false,
    setValidationResult: vi.fn(),
    setValidating: vi.fn(),
    setSubmitted: vi.fn(),
    getErrorForField: vi.fn(() => null),
    getFieldClass: vi.fn(() => "form-control"),
  })),
}));

vi.mock("@/utils/form-helpers", () => ({
  validateAndSubmit: vi.fn(
    async (
      data: Slide,
      validateFn: (data: Slide) => Promise<ValidationResult>,
      onSave: (data: Slide) => void,
    ) => {
      const result = await validateFn(data);
      if (result.valid) {
        onSave(data);
      }
      return result.valid;
    },
  ),
  getFeedbackClass: vi.fn(() => "is-valid"),
  getFieldClass: vi.fn(() => "is-valid"),
}));

vi.mock("@/utils/validation-helpers", () => ({
  _validateSlide: vi.fn(),
}));

// Import components and types after mocks
import { SlideForm } from "@/components/SlideForm";
import { createSlideId } from "@/utils/id-helpers";
import { useSlideValidation } from "@/hooks/slider/useSlideValidation";
import * as formHelpers from "@/utils/form-helpers";
import * as validationHelpers from "@/utils/validation-helpers";

describe("SlideForm Component", () => {
  // Valid slide for testing
  const validSlide: Slide = {
    id: createSlideId("slide-1"),
    title: "Test Slide",
    description: "This is a detailed description of the test slide",
    image: "https://example.com/image.jpg",
    alt: "A test image",
  };

  // Mock callbacks
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders with default empty slide when no initial slide provided", () => {
    render(<SlideForm onSave={mockOnSave} onCancel={mockOnCancel} />);

    // Check that form inputs are rendered with empty values
    expect(screen.getByLabelText(/title/i)).toHaveValue("");
    expect(screen.getByLabelText(/description/i)).toHaveValue("");
    expect(screen.getByLabelText(/image url/i)).toHaveValue("");
    expect(screen.getByLabelText(/alt text/i)).toHaveValue("");
  });

  it("renders with initial slide values when provided", () => {
    render(
      <SlideForm
        initialSlide={validSlide}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />,
    );

    // Check that form inputs are rendered with initial values
    expect(screen.getByLabelText(/title/i)).toHaveValue(validSlide.title);
    expect(screen.getByLabelText(/description/i)).toHaveValue(
      validSlide.description,
    );
    expect(screen.getByLabelText(/image url/i)).toHaveValue(validSlide.image);
    expect(screen.getByLabelText(/alt text/i)).toHaveValue(validSlide.alt);
  });

  it("validates form fields on input change", () => {
    // Create a validation error
    const titleError: ValidationError = {
      field: "title",
      message: "Title is required",
      type: ValidationErrorType.REQUIRED_PROP,
      code: ValidationErrorCode.REQUIRED_PROP,
      severity: ValidationErrorSeverity.ERROR,
    };

    // Mock validation state for this test
    vi.mocked(useSlideValidation).mockImplementation(() => ({
      validationResult: { valid: false, errors: [titleError] },
      validating: false,
      submitted: true,
      setValidationResult: vi.fn(),
      setValidating: vi.fn(),
      setSubmitted: vi.fn(),
      getErrorForField: vi.fn((fieldName: string) =>
        fieldName === "title" ? titleError : null,
      ),
      getFieldClass: vi.fn((fieldName: string) =>
        fieldName === "title" ? "is-invalid" : "form-control",
      ),
    }));

    // Mock the feedback class for the error
    vi.mocked(formHelpers.getFeedbackClass).mockImplementation(
      (error: ValidationError | undefined) => {
        return error?.severity === ValidationErrorSeverity.WARNING
          ? "warning-feedback"
          : "invalid-feedback";
      },
    );

    render(
      <SlideForm onSave={mockOnSave} onCancel={mockOnCancel} />,
    );

    // Use a more specific query to find the error message in the input field's feedback
    const titleField = screen.getByLabelText(/title/i).closest(".form-group");
    expect(
      within(titleField as HTMLElement).getByText("Title is required"),
    ).toBeInTheDocument();
  });

  it("submits form with valid data", async () => {
    // Mock validation helpers to return valid result
    vi.mocked(validationHelpers._validateSlide).mockResolvedValue({
      valid: true,
      errors: [],
    });

    // Mock validation hook to return valid state
    vi.mocked(useSlideValidation).mockImplementation(() => ({
      validationResult: { valid: true, errors: [] },
      validating: false,
      submitted: false,
      setValidationResult: vi.fn(),
      setValidating: vi.fn(),
      setSubmitted: vi.fn(),
      getErrorForField: vi.fn(() => null),
      getFieldClass: vi.fn(() => "form-control"),
    }));

    const { container } = render(
      <SlideForm onSave={mockOnSave} onCancel={mockOnCancel} />,
    );

    // Fill in form fields
      fireEvent.change(screen.getByLabelText(/title/i), {
        target: { value: validSlide.title },
      });
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: validSlide.description },
      });
      fireEvent.change(screen.getByLabelText(/image url/i), {
        target: { value: validSlide.image },
      });
      fireEvent.change(screen.getByLabelText(/alt text/i), {
        target: { value: validSlide.alt },
      });

      // Submit the form
      const form = container.querySelector("form.slide-form");
      if (!form) throw new Error("Form not found");
      fireEvent.submit(form);

    // Wait for validation and submission
    await vi.waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: validSlide.title,
          description: validSlide.description,
          image: validSlide.image,
          alt: validSlide.alt,
          id: expect.any(String),
        }),
      );
    });
  });
});
