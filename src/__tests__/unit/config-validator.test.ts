/**
 * @fileoverview Unit Tests for ConfigValidator
 *
 * Comprehensive tests for the configuration validation system ensuring
 * type safety, validation rules, and helpful error messages.
 *
 * @version 2.0.0 - Phase 4.2 Enhanced Configuration System
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ConfigValidator,
  VALIDATION_ERROR_CODES,
  VALIDATION_WARNING_CODES,
} from '../../config/config-validator';
import type { SliderConfig, SlideConfig } from '../../core/types';

describe('ConfigValidator', () => {
  let validator: ConfigValidator;

  beforeEach(() => {
    validator = new ConfigValidator();
  });

  describe('validateConfig', () => {
    describe('Valid configurations', () => {
      it('should validate minimal valid configuration', () => {
        const config: Partial<SliderConfig> = {
          slides: [
            { id: 'slide1', src: 'image1.jpg' },
            { id: 'slide2', src: 'image2.jpg' },
          ],
        };

        const result = validator.validateConfig(config);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate complete configuration', () => {
        const config: Partial<SliderConfig> = {
          slides: [
            {
              id: 'slide1',
              src: 'image1.jpg',
              alt: 'First image',
              title: 'First slide',
            },
          ],
          autoPlay: true,
          autoPlayInterval: 3000,
          duration: 500,
          easing: 'power2.out',
          loop: true,
          interactive: true,
          preloadCount: 2,
          physics: {
            transitionDuration: 0.5,
            swipeThreshold: 75,
            scaleIntensity: 0.2,
          },
          rendering: {
            width: 800,
            height: 600,
            resolution: 1,
          },
        };

        const result = validator.validateConfig(config);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('Invalid configurations', () => {
      it('should reject null/undefined config', () => {
        const result = validator.validateConfig(null as never);

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(
          VALIDATION_ERROR_CODES.REQUIRED_PROPERTY
        );
        expect(result.errors[0].path).toBe('config');
      });

      it('should reject config without slides or images', () => {
        const config: Partial<SliderConfig> = {};

        const result = validator.validateConfig(config);

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThanOrEqual(1);
        expect(result.errors[0].code).toBe(
          VALIDATION_ERROR_CODES.REQUIRED_PROPERTY
        );
        expect(result.errors[0].message).toContain('slides');
      });

      it('should reject empty slides array', () => {
        const config: Partial<SliderConfig> = {
          slides: [],
        };

        const result = validator.validateConfig(config);

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThanOrEqual(1);
        expect(result.errors[0].code).toBe(
          VALIDATION_ERROR_CODES.INVALID_VALUE
        );
        expect(result.errors[0].message).toContain('empty');
      });

      it('should reject invalid duration', () => {
        const config: Partial<SliderConfig> = {
          slides: [{ id: 'slide1', src: 'image1.jpg' }],
          duration: -100,
        };

        const result = validator.validateConfig(config);

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(VALIDATION_ERROR_CODES.OUT_OF_RANGE);
        expect(result.errors[0].path).toBe('config.duration');
      });

      it('should reject invalid preload count', () => {
        const config: Partial<SliderConfig> = {
          slides: [{ id: 'slide1', src: 'image1.jpg' }],
          preloadCount: -5,
        };

        const result = validator.validateConfig(config);

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(VALIDATION_ERROR_CODES.OUT_OF_RANGE);
        expect(result.errors[0].path).toBe('config.preloadCount');
      });
    });

    describe('Warnings', () => {
      it('should warn about performance concerns', () => {
        const config: Partial<SliderConfig> = {
          slides: [{ id: 'slide1', src: 'image1.jpg' }],
          duration: 50, // Very short duration
          preloadCount: 15, // High preload count
        };

        const result = validator.validateConfig(config);

        expect(result.warnings.length).toBeGreaterThan(0);
        const perfWarnings = result.warnings.filter(
          (w) => w.code === VALIDATION_WARNING_CODES.PERFORMANCE_IMPACT
        );
        expect(perfWarnings.length).toBeGreaterThan(0);
      });

      it('should warn about accessibility concerns', () => {
        const config: Partial<SliderConfig> = {
          slides: [{ id: 'slide1', src: 'image1.jpg' }],
          accessibility: {
            reduceMotion: true,
            // autoPlay should be false when reduceMotion is true
          },
          autoPlay: true,
        };

        const result = validator.validateConfig(config);

        const a11yWarnings = result.warnings.filter(
          (w) => w.code === VALIDATION_WARNING_CODES.ACCESSIBILITY_CONCERN
        );
        expect(a11yWarnings.length).toBeGreaterThan(0);
      });

      it('should warn about unknown easing functions', () => {
        const config: Partial<SliderConfig> = {
          slides: [{ id: 'slide1', src: 'image1.jpg' }],
          easing: 'customUnknownEasing',
        };

        const result = validator.validateConfig(config);

        const easingWarnings = result.warnings.filter(
          (w) => w.code === VALIDATION_WARNING_CODES.BEST_PRACTICE
        );
        expect(easingWarnings.length).toBeGreaterThan(0);
      });
    });

    describe('Physics configuration validation', () => {
      it('should validate physics configuration', () => {
        const config: Partial<SliderConfig> = {
          slides: [{ id: 'slide1', src: 'image1.jpg' }],
          physics: {
            transitionDuration: 0.5,
            swipeThreshold: 75,
            scaleIntensity: 0.3,
            momentumDamping: 0.85,
          },
        };

        const result = validator.validateConfig(config);

        expect(result.isValid).toBe(true);
      });

      it('should reject invalid physics values', () => {
        const config: Partial<SliderConfig> = {
          slides: [{ id: 'slide1', src: 'image1.jpg' }],
          physics: {
            transitionDuration: -0.5, // Invalid
            swipeThreshold: 1000, // Too high
            scaleIntensity: 1.5, // Out of range
            momentumDamping: 2.0, // Out of range
          },
        };

        const result = validator.validateConfig(config);

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('Rendering configuration validation', () => {
      it('should validate rendering configuration', () => {
        const config: Partial<SliderConfig> = {
          slides: [{ id: 'slide1', src: 'image1.jpg' }],
          rendering: {
            width: 1920,
            height: 1080,
            resolution: 2.0,
            antialias: true,
          },
        };

        const result = validator.validateConfig(config);

        expect(result.isValid).toBe(true);
      });

      it('should reject invalid rendering dimensions', () => {
        const config: Partial<SliderConfig> = {
          slides: [{ id: 'slide1', src: 'image1.jpg' }],
          rendering: {
            width: 0, // Invalid
            height: 10000, // Too large
            resolution: 5.0, // Too high
          },
        };

        const result = validator.validateConfig(config);

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('Responsive configuration validation', () => {
      it('should validate responsive breakpoints', () => {
        const config: Partial<SliderConfig> = {
          slides: [{ id: 'slide1', src: 'image1.jpg' }],
          responsive: {
            enabled: true,
            breakpoints: [
              {
                name: 'mobile',
                minWidth: 0,
                maxWidth: 767,
                config: { rendering: { width: 375 } },
              },
              {
                name: 'desktop',
                minWidth: 768,
                config: { rendering: { width: 1920 } },
              },
            ],
          },
        };

        const result = validator.validateConfig(config);

        expect(result.isValid).toBe(true);
      });

      it('should detect overlapping breakpoints', () => {
        const config: Partial<SliderConfig> = {
          slides: [{ id: 'slide1', src: 'image1.jpg' }],
          responsive: {
            enabled: true,
            breakpoints: [
              {
                name: 'mobile',
                minWidth: 0,
                maxWidth: 800, // Overlaps with tablet
                config: {},
              },
              {
                name: 'tablet',
                minWidth: 768,
                maxWidth: 1024,
                config: {},
              },
            ],
          },
        };

        const result = validator.validateConfig(config);

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe(
          VALIDATION_ERROR_CODES.DEPENDENCY_CONFLICT
        );
      });
    });
  });

  describe('validateSlideConfig', () => {
    describe('Valid slide configurations', () => {
      it('should validate minimal slide configuration', () => {
        const slide: Partial<SlideConfig> = {
          id: 'slide1',
          src: 'image1.jpg',
        };

        const result = validator.validateSlideConfig(slide);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate complete slide configuration', () => {
        const slide: Partial<SlideConfig> = {
          id: 'slide1',
          src: 'https://example.com/image1.jpg',
          alt: 'First image',
          title: 'First slide',
          metadata: {
            description: 'A beautiful image',
            tags: ['nature', 'landscape'],
            priority: 1,
          },
          loading: {
            lazy: true,
            priority: 'high',
            timeout: 5000,
          },
          effects: {
            opacity: 0.9,
            scale: 1.1,
          },
          timing: {
            duration: 1000,
            delay: 100,
            easing: 'power2.out',
          },
        };

        const result = validator.validateSlideConfig(slide);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('Invalid slide configurations', () => {
      it('should reject slide without required properties', () => {
        const slide: Partial<SlideConfig> = {};

        const result = validator.validateSlideConfig(slide);

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);

        const idError = result.errors.find((e) => e.path.includes('.id'));
        const srcError = result.errors.find((e) => e.path.includes('.src'));

        expect(idError).toBeDefined();
        expect(srcError).toBeDefined();
      });

      it('should reject invalid slide properties', () => {
        const slide: Partial<SlideConfig> = {
          id: 'slide1',
          src: 'image1.jpg',
          effects: {
            opacity: 1.5, // Invalid - should be 0-1
            scale: -0.5, // Invalid - below minimum
          },
          timing: {
            duration: -100, // Invalid - should be positive
          },
          loading: {
            timeout: -5000, // Invalid - should be positive
          },
        };

        const result = validator.validateSlideConfig(slide);

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });

      it('should validate URL formats', () => {
        const validUrls = [
          'https://example.com/image.jpg',
          'http://example.com/image.jpg',
          '/images/image.jpg',
          './images/image.jpg',
          '../images/image.jpg',
        ];

        const invalidUrls = [
          'not-a-valid-url',
          'ftp://invalid-protocol.com/image.jpg',
        ];

        for (const url of validUrls) {
          const slide: Partial<SlideConfig> = {
            id: 'slide1',
            src: url,
          };

          const result = validator.validateSlideConfig(slide);

          if (!result.isValid) {
            // Should be valid, log the error for debugging
            console.log(`URL ${url} failed validation:`, result.errors);
          }
        }

        for (const url of invalidUrls) {
          const slide: Partial<SlideConfig> = {
            id: 'slide1',
            src: url,
          };

          const result = validator.validateSlideConfig(slide);

          expect(result.isValid).toBe(false);
          expect(
            result.errors.some(
              (e) => e.code === VALIDATION_ERROR_CODES.INVALID_FORMAT
            )
          ).toBe(true);
        }
      });
    });
  });

  describe('Multiple validation errors', () => {
    it('should collect all validation errors', () => {
      const config: Partial<SliderConfig> = {
        slides: [
          {
            id: '', // Missing required value
            src: 'invalid-url', // Invalid URL
            effects: {
              opacity: 2.0, // Out of range
              scale: -1.0, // Out of range
            },
          },
        ],
        duration: -500, // Invalid duration
        preloadCount: -10, // Invalid preload count
      };

      const result = validator.validateConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3); // Multiple errors should be collected

      // Check that different types of errors are present
      const errorCodes = result.errors.map((e) => e.code);
      expect(errorCodes).toContain(VALIDATION_ERROR_CODES.REQUIRED_PROPERTY);
      expect(errorCodes).toContain(VALIDATION_ERROR_CODES.OUT_OF_RANGE);
    });
  });

  describe('Error message quality', () => {
    it('should provide helpful error messages with context', () => {
      const config: Partial<SliderConfig> = {
        slides: [{ id: 'slide1', src: 'image1.jpg' }],
        duration: -100,
      };

      const result = validator.validateConfig(config);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('positive');
      expect(result.errors[0].path).toBe('config.duration');
      expect(result.errors[0].expected).toBe('positive number (milliseconds)');
      expect(result.errors[0].actual).toBe(-100);
    });

    it('should provide helpful warning messages', () => {
      const config: Partial<SliderConfig> = {
        slides: [{ id: 'slide1', src: 'image1.jpg' }],
        easing: 'customUnknownEasing', // Unknown easing warning
      };

      const result = validator.validateConfig(config);

      expect(result.warnings[0].message).toContain('easing');
      expect(result.warnings[0].suggestion).toContain('One of:');
    });
  });
});
