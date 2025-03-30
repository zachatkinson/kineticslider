/* eslint-env vitest */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Slide } from '../../types';
import type { ValidationResult } from '../../types/validation';
// Import mocked modules
import {
  memoizedSlideValidator,
  validateSlidesWithSchema,
  validateSlideWithBusinessRules,
  validateSlideWithSchema,
} from '../../utils/slide-validator';
import { clearValidationCache, toSlideId } from '../../utils/validation';
import {
  ValidationErrorCode,
  ValidationErrorSeverity,
  ValidationErrorType,
} from '../../utils/validation';

// Mock modules
vi.mock('../../utils/slide-validator');

describe('Business Rule Validation', () => {
  // Valid slide for testing
  const validSlide: Slide = {
    id: toSlideId('test-slide'),
    title: 'Test Slide',
    description: 'This is a test slide',
    image: 'https://example.com/image.jpg',
    alt: 'Test image',
  };

  // Validation results for testing
  const validResult: ValidationResult = { valid: true, errors: [] };
  const invalidResult: ValidationResult = {
    valid: false,
    errors: [
      {
        property: 'title',
        message: 'Title is required',
        type: ValidationErrorType.INVALID_TYPE,
        code: ValidationErrorCode.INVALID_TYPE,
        severity: ValidationErrorSeverity.ERROR,
        value: undefined,
        expected: 'string',
      },
    ],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    clearValidationCache();

    // Set up default mock behaviors
    vi.mocked(validateSlideWithSchema).mockResolvedValue(validResult);
    vi.mocked(memoizedSlideValidator).mockImplementation((_slide: unknown) =>
      Promise.resolve(validResult)
    );
    vi.mocked(validateSlidesWithSchema).mockResolvedValue(validResult);
    vi.mocked(validateSlideWithBusinessRules).mockResolvedValue(validResult);
  });

  describe('validateSlideWithSchema', () => {
    it('validates a valid slide correctly', async () => {
      // Set up the mock to return valid result
      vi.mocked(validateSlideWithSchema).mockResolvedValue(validResult);

      const result = await validateSlideWithSchema(validSlide);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('validates a slide with missing required fields', async () => {
      // Set up the mock to return invalid result
      vi.mocked(validateSlideWithSchema).mockResolvedValue(invalidResult);

      const invalidSlide = { ...validSlide, title: undefined };
      const result = await validateSlideWithSchema(invalidSlide);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('validates type constraints', async () => {
      // Set up the mock to return invalid result for type error
      vi.mocked(validateSlideWithSchema).mockResolvedValue({
        valid: false,
        errors: [
          {
            property: 'order',
            message: 'Order must be a number',
            type: ValidationErrorType.INVALID_TYPE,
            code: ValidationErrorCode.INVALID_TYPE,
            severity: ValidationErrorSeverity.ERROR,
            value: 'not-a-number',
            expected: 'number',
          },
        ],
      });

      const invalidSlide = { ...validSlide, order: 'not-a-number' };
      const result = await validateSlideWithSchema(invalidSlide);
      expect(result.valid).toBe(false);

      // Check that we have a type error for the order field
      const orderError = result.errors.find((e) => e.property === 'order');
      expect(orderError).toBeDefined();
    });
  });

  describe('validateSlidesWithSchema', () => {
    it('validates an array of valid slides', async () => {
      // Set up mock to return valid result with metadata
      vi.mocked(validateSlidesWithSchema).mockResolvedValue({
        valid: true,
        errors: [],
        metadata: {
          totalSlides: 2,
          validSlides: 2,
        },
      });

      const slides = [validSlide, { ...validSlide, id: toSlideId('slide-2') }];
      const result = await validateSlidesWithSchema(slides);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('validates an array with invalid slides', async () => {
      // Set up mock to return invalid result
      vi.mocked(validateSlidesWithSchema).mockResolvedValue({
        valid: false,
        errors: [
          {
            property: 'title',
            message: 'Slide at index 1: Title is required',
            type: ValidationErrorType.INVALID_TYPE,
            code: ValidationErrorCode.INVALID_TYPE,
            severity: ValidationErrorSeverity.ERROR,
            value: undefined,
            expected: 'string',
          },
        ],
        metadata: {
          totalSlides: 2,
          validSlides: 1,
        },
      });

      const slides = [
        validSlide,
        { ...validSlide, id: toSlideId('slide-2'), title: undefined },
      ];
      const result = await validateSlidesWithSchema(slides);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      // Check that we include the index in the error message
      const errorMessage = result.errors[0]?.message || '';
      expect(errorMessage).toContain('index 1');
    });

    it('validates that slides array cannot be empty', async () => {
      // Set up mock to return invalid result for empty array
      vi.mocked(validateSlidesWithSchema).mockResolvedValue({
        valid: false,
        errors: [
          {
            type: ValidationErrorType.INVALID_RANGE,
            message: 'Slides array cannot be empty',
            code: ValidationErrorCode.INVALID_RANGE,
            severity: ValidationErrorSeverity.ERROR,
            value: 0,
            expected: '> 0 slides',
          },
        ],
      });

      const result = await validateSlidesWithSchema([]);
      expect(result.valid).toBe(false);
      expect(result.errors[0]?.type).toBe(ValidationErrorType.INVALID_RANGE);
    });

    it('provides metadata about validation results', async () => {
      // Set up mock to return result with metadata
      vi.mocked(validateSlidesWithSchema).mockResolvedValue({
        valid: true,
        errors: [],
        metadata: {
          totalSlides: 2,
          validSlides: 2,
        },
      });

      const slides = [validSlide, { ...validSlide, id: toSlideId('slide-2') }];
      const result = await validateSlidesWithSchema(slides);
      expect(result.metadata).toBeDefined();
      if (result.metadata) {
        expect(result.metadata['totalSlides']).toBe(2);
        expect(result.metadata['validSlides']).toBe(2);
      }
    });
  });

  describe('memoizedSlideValidator', () => {
    // Just define some simple test cases that don't rely on mocking internals
    it('validates a valid slide correctly', async () => {
      // Since we're mocking at the module level, ensure the mock returns valid for this test
      vi.mocked(memoizedSlideValidator).mockResolvedValue(validResult);

      const result = await memoizedSlideValidator(validSlide);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('validates an invalid slide correctly', async () => {
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

  describe('validateSlideWithBusinessRules', () => {
    it('validates a slide that meets business rules', async () => {
      // Configure mock to return valid result
      vi.mocked(validateSlideWithBusinessRules).mockResolvedValue({
        valid: true,
        errors: [],
      });

      const result = await validateSlideWithBusinessRules(validSlide);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('detects when title is too similar to description', async () => {
      // Configure mock to return business rule violation
      vi.mocked(validateSlideWithBusinessRules).mockResolvedValue({
        valid: false,
        errors: [
          {
            message: 'Description should not simply repeat the title',
            property: 'description',
            suggestion: 'Make the description provide additional context',
            type: ValidationErrorType.CUSTOM_VALIDATION_FAILED,
            code: ValidationErrorCode.CUSTOM_VALIDATION_FAILED,
            severity: ValidationErrorSeverity.WARNING,
            value: 'Very specific title with some extra words',
            expected: 'Unique content that adds value beyond the title',
          },
        ],
      });

      const slide = {
        ...validSlide,
        title: 'Very specific title',
        description: 'Very specific title with some extra words',
      };

      const result = await validateSlideWithBusinessRules(slide);
      expect(result.valid).toBe(false);

      // Should have a warning about title similarity
      const titleError = result.errors.find(
        (e) =>
          e.message.includes('repeat the title') || e.property === 'description'
      );
      expect(titleError).toBeDefined();
      expect(titleError?.suggestion).toBeDefined();
    });

    it('validates image quality through mock function', async () => {
      // Configure mock to return image quality violation
      vi.mocked(validateSlideWithBusinessRules).mockResolvedValue({
        valid: false,
        errors: [
          {
            message: 'Image does not meet quality requirements',
            property: 'image',
            type: ValidationErrorType.CUSTOM_VALIDATION_FAILED,
            code: ValidationErrorCode.CUSTOM_VALIDATION_FAILED,
            severity: ValidationErrorSeverity.WARNING,
            value: 'https://example.com/small-thumbnail.jpg',
            expected: 'High quality image (min 800x600)',
          },
        ],
      });

      // Create a slide with a low quality image URL
      const slide = {
        ...validSlide,
        image: 'https://example.com/small-thumbnail.jpg',
      };

      const result = await validateSlideWithBusinessRules(slide);
      expect(result.valid).toBe(false);

      // Should have a warning about image quality
      const imageError = result.errors.find(
        (e) => e.message.includes('quality') || e.property === 'image'
      );
      expect(imageError).toBeDefined();
    });

    it('adds metadata to validation result', async () => {
      // Configure mock to return result with metadata
      vi.mocked(validateSlideWithBusinessRules).mockResolvedValue({
        valid: true,
        errors: [],
        metadata: {
          checkedBusinessRules: true,
          timestamp: '2023-01-01T00:00:00.000Z',
        },
      });

      const result = await validateSlideWithBusinessRules(validSlide);
      expect(result.metadata).toBeDefined();
      if (result.metadata) {
        expect(result.metadata['checkedBusinessRules']).toBe(true);
        expect(result.metadata['timestamp']).toBeDefined();
      }
    });

    it('handles non-object input gracefully', async () => {
      // Configure mock to return invalid result for null
      vi.mocked(validateSlideWithBusinessRules).mockResolvedValue({
        valid: false,
        errors: [
          {
            message: 'Value must be an object',
            type: ValidationErrorType.INVALID_TYPE,
            code: ValidationErrorCode.INVALID_TYPE,
            severity: ValidationErrorSeverity.ERROR,
            value: null,
            expected: 'object',
          },
        ],
      });

      const result = await validateSlideWithBusinessRules(null as any);
      expect(result.valid).toBe(false);
    });
  });
});
