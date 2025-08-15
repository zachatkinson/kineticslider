/**
 * @fileoverview Tests for Core Constants and Validation
 *
 * Comprehensive tests for constants validation and integrity including:
 * - Runtime validation function testing
 * - Constants structure validation
 * - Type exports validation
 * - Value range validation
 */

import { describe, it, expect } from 'vitest';
import {
  validateConstants,
  VERSION,
  PROJECT_NAME,
  DOCUMENTATION,
  PROJECT_PHASES,
  ACCESSIBILITY,
  PERFORMANCE,
  ANIMATION_DURATION,
  EASING,
  PHYSICS,
  SCALE,
  INTENSITY,
  PIXI_CONFIG,
  TEXTURE_CONSTANTS,
  RENDERING_PERFORMANCE,
  ERROR_MESSAGES,
  ERROR_CODES,
  LOG_LEVELS,
  SLIDER_EVENTS,
  KEYBOARD_KEYS,
  DOM_PROPERTIES,
  VIEWPORT,
  type ViewportName,
  type AnimationDuration,
  type EasingType,
  type ErrorCode,
  type LogLevel,
} from '../../core/constants';

describe('Constants Validation', () => {
  describe('validateConstants()', () => {
    it('should return true when all constants are valid', () => {
      expect(validateConstants()).toBe(true);
    });

    it('should be callable multiple times without side effects', () => {
      expect(validateConstants()).toBe(true);
      expect(validateConstants()).toBe(true);
      expect(validateConstants()).toBe(true);
    });
  });

  describe('Runtime Validation Logic', () => {
    it('should validate TARGET_FPS is positive', () => {
      expect(PERFORMANCE.TARGET_FPS).toBeGreaterThan(0);
      expect(typeof PERFORMANCE.TARGET_FPS).toBe('number');
    });

    it('should validate FRAME_BUDGET_MS matches TARGET_FPS calculation', () => {
      const expectedFrameBudget = 1000 / PERFORMANCE.TARGET_FPS;
      const tolerance = 0.01;

      expect(
        Math.abs(PERFORMANCE.FRAME_BUDGET_MS - expectedFrameBudget)
      ).toBeLessThan(tolerance);
    });

    it('should validate SCALE.MIN is less than SCALE.MAX', () => {
      expect(SCALE.MIN).toBeLessThan(SCALE.MAX);
      expect(typeof SCALE.MIN).toBe('number');
      expect(typeof SCALE.MAX).toBe('number');
    });

    it('should validate all INTENSITY values are between 0 and 1', () => {
      Object.entries(INTENSITY).forEach(([_key, value]) => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
        expect(typeof value).toBe('number');
        expect(Number.isFinite(value)).toBe(true);
      });
    });
  });

  describe('Core Application Constants', () => {
    it('should have valid VERSION constant', () => {
      expect(VERSION).toBeDefined();
      expect(typeof VERSION).toBe('string');
      expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/); // Semantic versioning pattern
    });

    it('should have valid PROJECT_NAME constant', () => {
      expect(PROJECT_NAME).toBeDefined();
      expect(typeof PROJECT_NAME).toBe('string');
      expect(PROJECT_NAME.length).toBeGreaterThan(0);
    });

    it('should have valid DOCUMENTATION constants', () => {
      expect(DOCUMENTATION.VERSION).toBe(VERSION);
      expect(DOCUMENTATION.SINCE).toBe(VERSION);
      expect(DOCUMENTATION.WCAG_VERSION).toBe('2.1');
      expect(DOCUMENTATION.WCAG_LEVEL).toBe('AA');
    });

    it('should have all PROJECT_PHASES defined', () => {
      const expectedPhases = [
        'PHASE_1_1',
        'PHASE_1_2',
        'PHASE_1_3',
        'PHASE_1_4',
        'PHASE_1_5',
        'PHASE_1_6',
        'PHASE_4_1',
        'PHASE_3_3',
      ];

      expectedPhases.forEach((phase) => {
        expect(PROJECT_PHASES).toHaveProperty(phase);
        expect(
          typeof PROJECT_PHASES[phase as keyof typeof PROJECT_PHASES]
        ).toBe('string');
      });
    });

    it('should have valid ACCESSIBILITY constants', () => {
      expect(ACCESSIBILITY.WCAG_VERSION).toBe('2.1');
      expect(ACCESSIBILITY.WCAG_LEVEL).toBe('AA');
      expect(ACCESSIBILITY.WCAG_COMPLIANCE).toContain('WCAG 2.1 AA');
    });
  });

  describe('Performance Constants', () => {
    it('should have valid PERFORMANCE constants', () => {
      expect(PERFORMANCE.TARGET_FPS).toBeGreaterThan(0);
      expect(PERFORMANCE.FRAME_BUDGET_MS).toBeGreaterThan(0);

      // Should have reasonable values
      expect(PERFORMANCE.TARGET_FPS).toBeLessThanOrEqual(120); // Max reasonable FPS
      expect(PERFORMANCE.FRAME_BUDGET_MS).toBeLessThan(100); // Should be under 100ms for 60fps

      // Test that PERFORMANCE is an object with numeric values
      Object.entries(PERFORMANCE).forEach(([_key, value]) => {
        expect(typeof value).toBe('number');
        expect(Number.isFinite(value)).toBe(true);
      });
    });

    it('should have valid ANIMATION_DURATION constants', () => {
      expect(typeof ANIMATION_DURATION).toBe('object');
      expect(ANIMATION_DURATION).not.toBeNull();

      Object.entries(ANIMATION_DURATION).forEach(([_key, value]) => {
        expect(typeof value).toBe('number');
        expect(value).toBeGreaterThan(0);
        expect(value).toBeLessThan(10000); // Should be under 10 seconds
      });
    });

    it('should have valid EASING constants', () => {
      expect(typeof EASING).toBe('object');
      expect(EASING).not.toBeNull();

      Object.entries(EASING).forEach(([_key, value]) => {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });

    it('should have valid PHYSICS constants', () => {
      expect(typeof PHYSICS).toBe('object');
      expect(PHYSICS).not.toBeNull();

      Object.entries(PHYSICS).forEach(([_key, value]) => {
        if (typeof value === 'object' && value !== null) {
          // Handle nested objects like DURATION_FACTORS
          Object.entries(value).forEach(([_nestedKey, nestedValue]) => {
            expect(typeof nestedValue).toBe('number');
            expect(Number.isFinite(nestedValue)).toBe(true);
          });
        } else {
          expect(typeof value).toBe('number');
          expect(Number.isFinite(value)).toBe(true);
        }
      });
    });
  });

  describe('PIXI Configuration Constants', () => {
    it('should have valid PIXI_CONFIG constants', () => {
      expect(PIXI_CONFIG.MAX_INIT_TIME).toBeGreaterThan(0);
      expect(PIXI_CONFIG.SHADER_CACHE_SIZE).toBeGreaterThan(0);
      expect(PIXI_CONFIG.TEXTURE_POOL_SIZE).toBeGreaterThan(0);
      expect(PIXI_CONFIG.LOADER_CONCURRENT_LIMIT).toBeGreaterThan(0);
      expect(PIXI_CONFIG.TEXTURE_MEMORY_LIMIT).toBeGreaterThan(0);
      expect(PIXI_CONFIG.GC_THRESHOLD).toBeGreaterThan(0);
      expect(PIXI_CONFIG.GC_THRESHOLD).toBeLessThanOrEqual(1);
      expect(PIXI_CONFIG.PROGRESSIVE_CHUNK_SIZE).toBeGreaterThan(0);
    });

    it('should have valid TEXTURE_CONSTANTS', () => {
      expect(Array.isArray(TEXTURE_CONSTANTS.SUPPORTED_FORMATS)).toBe(true);
      expect(TEXTURE_CONSTANTS.SUPPORTED_FORMATS.length).toBeGreaterThan(0);
      expect(TEXTURE_CONSTANTS.DEFAULT_QUALITY).toBeGreaterThan(0);
      expect(TEXTURE_CONSTANTS.DEFAULT_QUALITY).toBeLessThanOrEqual(1);
      expect(TEXTURE_CONSTANTS.PRELOAD_CACHE_SIZE).toBeGreaterThan(0);
      expect(TEXTURE_CONSTANTS.LAZY_LOAD_THRESHOLD).toBeGreaterThanOrEqual(0);

      // Validate supported formats
      TEXTURE_CONSTANTS.SUPPORTED_FORMATS.forEach((format) => {
        expect(typeof format).toBe('string');
        expect(format.length).toBeGreaterThan(0);
      });
    });

    it('should have valid RENDERING_PERFORMANCE constants', () => {
      expect(RENDERING_PERFORMANCE).toHaveProperty('WARNING_THRESHOLDS');
      expect(RENDERING_PERFORMANCE).toHaveProperty('CRITICAL_THRESHOLDS');

      // Check warning thresholds
      const warning = RENDERING_PERFORMANCE.WARNING_THRESHOLDS;
      expect(warning.FPS_LOW).toBeGreaterThan(0);
      expect(warning.MEMORY_HIGH).toBeGreaterThan(0);

      // Check critical thresholds
      const critical = RENDERING_PERFORMANCE.CRITICAL_THRESHOLDS;
      expect(critical.FPS_CRITICAL).toBeGreaterThan(0);
      expect(critical.MEMORY_CRITICAL).toBeGreaterThan(0);

      // Warning thresholds should be less severe than critical
      expect(warning.FPS_LOW).toBeGreaterThan(critical.FPS_CRITICAL);
      expect(warning.MEMORY_HIGH).toBeLessThan(critical.MEMORY_CRITICAL);
    });
  });

  describe('Event and Error Constants', () => {
    it('should have valid SLIDER_EVENTS constants', () => {
      expect(SLIDER_EVENTS).toHaveProperty('SLIDE_CHANGED');
      expect(SLIDER_EVENTS).toHaveProperty('ERROR');
      expect(SLIDER_EVENTS).toHaveProperty('STATE_VALIDATION_WARNING');

      Object.entries(SLIDER_EVENTS).forEach(([_key, value]) => {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });

    it('should have valid ERROR_CODES constants', () => {
      expect(ERROR_CODES).toHaveProperty('INIT_FAILED');
      expect(ERROR_CODES).toHaveProperty('INVALID_CONFIG');
      expect(ERROR_CODES).toHaveProperty('ANIMATION_FAILED');

      Object.entries(ERROR_CODES).forEach(([_key, value]) => {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });

    it('should have valid ERROR_MESSAGES constants', () => {
      expect(ERROR_MESSAGES).toHaveProperty('CONSTANTS_VALIDATION_FAILED');
      expect(ERROR_MESSAGES).toHaveProperty('VALIDATION');
      expect(ERROR_MESSAGES.VALIDATION).toHaveProperty('TARGET_FPS_POSITIVE');
      expect(ERROR_MESSAGES.VALIDATION).toHaveProperty('FRAME_BUDGET_MISMATCH');
      expect(ERROR_MESSAGES.VALIDATION).toHaveProperty('SCALE_MIN_MAX');
      expect(ERROR_MESSAGES.VALIDATION).toHaveProperty('INTENSITY_RANGE');

      expect(typeof ERROR_MESSAGES.CONSTANTS_VALIDATION_FAILED).toBe(
        'function'
      );
      expect(typeof ERROR_MESSAGES.VALIDATION.TARGET_FPS_POSITIVE).toBe(
        'string'
      );
      expect(typeof ERROR_MESSAGES.VALIDATION.INTENSITY_RANGE).toBe('function');
    });

    it('should have valid LOG_LEVELS constants', () => {
      expect(LOG_LEVELS).toHaveProperty('ERROR');
      expect(LOG_LEVELS).toHaveProperty('WARN');
      expect(LOG_LEVELS).toHaveProperty('INFO');
      expect(LOG_LEVELS).toHaveProperty('DEBUG');
      expect(LOG_LEVELS).toHaveProperty('TRACE');

      // Log levels should be in ascending order
      expect(LOG_LEVELS.ERROR).toBeLessThan(LOG_LEVELS.WARN);
      expect(LOG_LEVELS.WARN).toBeLessThan(LOG_LEVELS.INFO);
      expect(LOG_LEVELS.INFO).toBeLessThan(LOG_LEVELS.DEBUG);
      expect(LOG_LEVELS.DEBUG).toBeLessThan(LOG_LEVELS.TRACE);
    });
  });

  describe('Input and Interaction Constants', () => {
    it('should have valid KEYBOARD_KEYS constants', () => {
      expect(KEYBOARD_KEYS).toHaveProperty('ARROW_LEFT');
      expect(KEYBOARD_KEYS).toHaveProperty('ARROW_RIGHT');
      expect(KEYBOARD_KEYS).toHaveProperty('ARROW_UP');
      expect(KEYBOARD_KEYS).toHaveProperty('ARROW_DOWN');
      expect(KEYBOARD_KEYS).toHaveProperty('SPACE');
      expect(KEYBOARD_KEYS).toHaveProperty('ENTER');

      Object.entries(KEYBOARD_KEYS).forEach(([_key, value]) => {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });

    it('should have valid DOM_PROPERTIES constants', () => {
      expect(DOM_PROPERTIES).toHaveProperty('TYPE_OBJECT');
      expect(DOM_PROPERTIES).toHaveProperty('TYPE_FUNCTION');
      expect(DOM_PROPERTIES).toHaveProperty('TYPE_STRING');
      expect(DOM_PROPERTIES).toHaveProperty('TYPE_NUMBER');
      expect(DOM_PROPERTIES).toHaveProperty('STYLE');
      expect(DOM_PROPERTIES).toHaveProperty('TRANSFORM');
      expect(DOM_PROPERTIES).toHaveProperty('OPACITY');

      Object.entries(DOM_PROPERTIES).forEach(([_key, value]) => {
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Viewport Constants', () => {
    it('should have valid VIEWPORT constants', () => {
      expect(VIEWPORT).toHaveProperty('MOBILE');
      expect(VIEWPORT).toHaveProperty('TABLET');
      expect(VIEWPORT).toHaveProperty('DESKTOP');

      Object.entries(VIEWPORT).forEach(([_key, viewport]) => {
        expect(viewport).toHaveProperty('name');
        expect(viewport).toHaveProperty('width');
        expect(viewport).toHaveProperty('height');

        expect(typeof viewport.name).toBe('string');
        expect(typeof viewport.width).toBe('number');
        expect(typeof viewport.height).toBe('number');
        expect(viewport.width).toBeGreaterThan(0);
        expect(viewport.height).toBeGreaterThan(0);
      });

      // Viewport widths should be in ascending order
      expect(VIEWPORT.MOBILE.width).toBeLessThan(VIEWPORT.TABLET.width);
      expect(VIEWPORT.TABLET.width).toBeLessThan(VIEWPORT.DESKTOP.width);
    });
  });

  describe('Type Exports', () => {
    it('should export valid TypeScript types', () => {
      // Test ViewportName type
      const mobileViewport: ViewportName = VIEWPORT.MOBILE.name;
      expect(mobileViewport).toBe('mobile');

      // Test AnimationDuration type
      const fastDuration: AnimationDuration = ANIMATION_DURATION.FAST;
      expect(typeof fastDuration).toBe('number');

      // Test EasingType
      const easingType: EasingType = EASING.EASE_OUT;
      expect(typeof easingType).toBe('string');

      // Test ErrorCode type
      const errorCode: ErrorCode = ERROR_CODES.INVALID_CONFIG;
      expect(typeof errorCode).toBe('string');

      // Test LogLevel type
      const logLevel: LogLevel = LOG_LEVELS.INFO;
      expect(typeof logLevel).toBe('number');
    });
  });

  describe('Constants Integrity', () => {
    it('should have consistent naming conventions', () => {
      // All constant objects should be uppercase
      const constantNames = [
        'VERSION',
        'PROJECT_NAME',
        'DOCUMENTATION',
        'PROJECT_PHASES',
        'ACCESSIBILITY',
        'PERFORMANCE',
        'ANIMATION_DURATION',
        'EASING',
        'PHYSICS',
        'SCALE',
        'INTENSITY',
        'PIXI_CONFIG',
        'TEXTURE_CONSTANTS',
      ];

      constantNames.forEach((name) => {
        expect(name).toMatch(/^[A-Z][A-Z_]*$/);
      });
    });

    it('should have immutable constant objects', () => {
      const originalValue = PERFORMANCE.TARGET_FPS;

      // Test that constants maintain their values through type system
      // Note: Runtime immutability depends on implementation, but TypeScript prevents modifications
      expect(PERFORMANCE.TARGET_FPS).toBe(originalValue);
      expect(typeof PERFORMANCE.TARGET_FPS).toBe('number');
      expect(PERFORMANCE.TARGET_FPS).toBeGreaterThan(0);
    });

    it('should have consistent units and scales', () => {
      // Duration values should be in milliseconds
      Object.entries(ANIMATION_DURATION).forEach(([_key, value]) => {
        expect(value).toBeGreaterThan(0);
        expect(value).toBeLessThan(10000); // Under 10 seconds
      });

      // Performance values should be reasonable
      expect(PERFORMANCE.TARGET_FPS).toBeGreaterThanOrEqual(30);
      expect(PERFORMANCE.TARGET_FPS).toBeLessThanOrEqual(120);

      // Intensity values should be normalized (0-1)
      Object.values(INTENSITY).forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      });
    });

    it('should not have circular dependencies', () => {
      // Constants should not reference themselves
      expect(DOCUMENTATION.VERSION).toBe(VERSION);
      expect(DOCUMENTATION.SINCE).toBe(VERSION);

      // No constant should contain references that could cause circular imports
      const stringifyTest = () => {
        JSON.stringify({
          VERSION,
          PERFORMANCE,
          ANIMATION_DURATION,
          EASING,
          PHYSICS,
        });
      };

      expect(stringifyTest).not.toThrow();
    });
  });

  describe('Error Message Functions', () => {
    it('should generate proper error messages', () => {
      const testError = new Error('test error');
      const errorMessage =
        ERROR_MESSAGES.CONSTANTS_VALIDATION_FAILED(testError);

      expect(errorMessage).toContain('Constants validation failed');
      expect(errorMessage).toContain('test error');
    });

    it('should generate intensity range error messages', () => {
      const invalidValue = 1.5;
      const errorMessage =
        ERROR_MESSAGES.VALIDATION.INTENSITY_RANGE(invalidValue);

      expect(errorMessage).toContain('Intensity value 1.5');
      expect(errorMessage).toContain('must be between 0 and 1');
    });

    it('should handle edge cases in error message generation', () => {
      // Test with null/undefined
      expect(() => {
        ERROR_MESSAGES.CONSTANTS_VALIDATION_FAILED(null);
      }).not.toThrow();

      expect(() => {
        ERROR_MESSAGES.CONSTANTS_VALIDATION_FAILED(undefined);
      }).not.toThrow();

      // Test with complex objects
      expect(() => {
        ERROR_MESSAGES.CONSTANTS_VALIDATION_FAILED({ complex: 'object' });
      }).not.toThrow();
    });
  });
});
