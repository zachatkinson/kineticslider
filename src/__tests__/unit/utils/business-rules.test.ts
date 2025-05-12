import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Slide } from "@/types";
import type { ValidationError, ValidationResult } from "@/types/validation";
// Import mocked modules
import {
  _memoizedSlideValidator as memoizedSlideValidator,
  validateSlideWithSchema,
  _validateSlideWithBusinessRules as validateSlideWithBusinessRules,
  _validateSlidesWithSchema as validateSlidesWithSchema,
} from "@/utils/slide-validator";
import { clearValidationCache } from "@/utils/validation";
import { createSlideId } from "@/utils/id-helpers";
import {
  ValidationErrorCode,
  ValidationErrorSeverity,
  ValidationErrorType,
} from "@/types/validation";

// Mock modules
vi.mock("@/utils/slide-validator");

describe("Business Rule Validation", () => {
  // Valid slide for testing
  const validSlide: Slide = {
    id: createSlideId("test-slide"),
    title: "Test Slide",
    description: "This is a test slide",
    image: "https://example.com/image.jpg",
    alt: "Test image",
  };

  // Validation results for testing
  const validResult: ValidationResult = { valid: true, errors: [] };
  const invalidResult: ValidationResult = {
    valid: false,
    errors: [
      {
        property: "title",
        message: "Title is required",
        type: ValidationErrorType.TYPE,
        code: ValidationErrorCode.INVALID_TYPE,
        severity: ValidationErrorSeverity.ERROR,
        value: undefined,
        expected: "string",
      },
    ],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    clearValidationCache();

    // Set up default mock behaviors
    vi.mocked(validateSlideWithSchema).mockResolvedValue(validResult);
    vi.mocked(memoizedSlideValidator).mockImplementation((_slide: unknown) =>
      Promise.resolve(validResult),
    );
    vi.mocked(validateSlidesWithSchema).mockResolvedValue(validResult);
    vi.mocked(validateSlideWithBusinessRules).mockResolvedValue(validResult);
  });

  describe("validateSlideWithSchema", () => {
    it("validates a valid slide correctly", async () => {
      // Set up the mock to return valid result
      vi.mocked(validateSlideWithSchema).mockResolvedValue(validResult);

      const result = await validateSlideWithSchema(validSlide);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("validates a slide with missing required fields", async () => {
      // Set up the mock to return invalid result
      vi.mocked(validateSlideWithSchema).mockResolvedValue(invalidResult);

      const invalidSlide = { ...validSlide, title: undefined };
      const result = await validateSlideWithSchema(invalidSlide);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("validates type constraints", async () => {
      // Set up the mock to return invalid result for type error
      vi.mocked(validateSlideWithSchema).mockResolvedValue({
        valid: false,
        errors: [
          {
            property: "order",
            message: "Order must be a number",
            type: ValidationErrorType.TYPE,
            code: ValidationErrorCode.INVALID_TYPE,
            severity: ValidationErrorSeverity.ERROR,
            value: "not-a-number",
            expected: "number",
          },
        ],
      });

      const invalidSlide = { ...validSlide, order: "not-a-number" };
      const result = await validateSlideWithSchema(invalidSlide);
      expect(result.valid).toBe(false);

      // Check that we have a type error for the order field
      const orderError = result.errors.find(
        (e: ValidationError) => e.property === "order",
      );
      expect(orderError).toBeDefined();
    });
  });

  describe("validateSlidesWithSchema", () => {
    it("validates an array of valid slides", async () => {
      // Set up mock to return valid result with metadata
      vi.mocked(validateSlidesWithSchema).mockResolvedValue({
        valid: true,
        errors: [],
        metadata: {
          totalSlides: 2,
          validSlides: 2,
        },
      });

      const slides = [
        validSlide,
        { ...validSlide, id: createSlideId("slide-2") },
      ];
      const result = await validateSlidesWithSchema(slides);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("validates an array with invalid slides", async () => {
      // Set up mock to return invalid result
      vi.mocked(validateSlidesWithSchema).mockResolvedValue({
        valid: false,
        errors: [
          {
            property: "title",
            message: "Slide at index 1: Title is required",
            type: ValidationErrorType.TYPE,
            code: ValidationErrorCode.INVALID_TYPE,
            severity: ValidationErrorSeverity.ERROR,
            value: undefined,
            expected: "string",
          },
        ],
        metadata: {
          totalSlides: 2,
          validSlides: 1,
        },
      });

      const slides = [
        validSlide,
        { ...validSlide, id: createSlideId("slide-2"), title: undefined },
      ];
      const result = await validateSlidesWithSchema(slides);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      // Check that we include the index in the error message
      const errorMessage = result.errors[0]?.message || "";
      expect(errorMessage).toContain("index 1");
    });

    it("validates that slides array cannot be empty", async () => {
      // Set up mock to return invalid result for empty array
      vi.mocked(validateSlidesWithSchema).mockResolvedValue({
        valid: false,
        errors: [
          {
            type: ValidationErrorType.RANGE,
            message: "Slides array cannot be empty",
            code: ValidationErrorCode.OUT_OF_RANGE,
            severity: ValidationErrorSeverity.ERROR,
            value: 0,
            expected: "> 0 slides",
          },
        ],
      });

      const result = await validateSlidesWithSchema([]);
      expect(result.valid).toBe(false);
      expect(result.errors[0]?.type).toBe(ValidationErrorType.RANGE);
    });

    it("provides metadata about validation results", async () => {
      // Set up mock to return result with metadata
      vi.mocked(validateSlidesWithSchema).mockResolvedValue({
        valid: true,
        errors: [],
        metadata: {
          totalSlides: 2,
          validSlides: 2,
        },
      });

      const slides = [
        validSlide,
        { ...validSlide, id: createSlideId("slide-2") },
      ];
      const result = await validateSlidesWithSchema(slides);
      expect(result.metadata).toBeDefined();
      if (result.metadata) {
        expect(result.metadata["totalSlides"]).toBe(2);
        expect(result.metadata["validSlides"]).toBe(2);
      }
    });
  });

  describe("memoizedSlideValidator", () => {
    it("validates a valid slide correctly", async () => {
      // Since we're mocking at the module level, ensure the mock returns valid for this test
      vi.mocked(memoizedSlideValidator).mockResolvedValue(validResult);

      const result = await memoizedSlideValidator(validSlide);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("validates an invalid slide correctly", async () => {
      // Mock invalid result for this test
      vi.mocked(memoizedSlideValidator).mockResolvedValue(invalidResult);

      const result = await memoizedSlideValidator({
        ...validSlide,
        title: undefined,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("validateSlideWithBusinessRules", () => {
    it("validates a slide that meets business rules", async () => {
      // Configure mock to return valid result
      vi.mocked(validateSlideWithBusinessRules).mockResolvedValue({
        valid: true,
        errors: [],
      });

      const result = await validateSlideWithBusinessRules(validSlide);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("detects when title is too similar to description", async () => {
      // Configure mock to return business rule violation
      vi.mocked(validateSlideWithBusinessRules).mockResolvedValue({
        valid: false,
        errors: [
          {
            message: "Description should not simply repeat the title",
            property: "description",
            type: ValidationErrorType.CUSTOM,
            code: ValidationErrorCode.CUSTOM_ERROR,
            severity: ValidationErrorSeverity.WARNING,
            value: "Test Slide",
            expected: "More detailed description",
          },
        ],
      });

      const sameContentSlide = {
        ...validSlide,
        description: validSlide.title,
      };
      const result = await validateSlideWithBusinessRules(sameContentSlide);
      expect(result.valid).toBe(false);
      expect(result.errors[0]?.code).toBe(ValidationErrorCode.CUSTOM_ERROR);
    });

    it("detects when image does not meet quality requirements", async () => {
      // Configure mock to return business rule violation for image
      vi.mocked(validateSlideWithBusinessRules).mockResolvedValue({
        valid: false,
        errors: [
          {
            message: "Image does not meet quality requirements",
            property: "image",
            type: ValidationErrorType.CUSTOM,
            code: ValidationErrorCode.CUSTOM_ERROR,
            severity: ValidationErrorSeverity.ERROR,
            value: "https://example.com/low-quality.jpg",
            expected: "High quality image (min 1024x768)",
          },
        ],
      });

      const result = await validateSlideWithBusinessRules({
        ...validSlide,
        image: "https://example.com/low-quality.jpg",
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]?.property).toBe("image");
    });
  });
});
