/**
 * @fileoverview Unit Tests for ConfigurationSystem
 * 
 * Integration tests for the complete configuration system combining
 * validation, defaults management, and configuration processing.
 * 
 * @version 2.0.0 - Phase 4.2 Enhanced Configuration System
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigurationSystem } from '../../config';
import type { SliderConfig, SlideConfig } from '../../core/types';

describe('ConfigurationSystem', () => {
  beforeEach(() => {
    ConfigurationSystem.clearCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('processConfig', () => {
    describe('Valid configurations', () => {
      it('should process minimal configuration', () => {
        const userConfig: Partial<SliderConfig> = {
          slides: [
            { id: 'slide1', src: 'image1.jpg' },
            { id: 'slide2', src: 'image2.jpg' },
          ],
        };

        const result = ConfigurationSystem.processConfig(userConfig);
        
        expect(result).toBeDefined();
        expect(result.slides).toHaveLength(2);
        expect(result.slides[0].id).toBe('slide1');
        expect(result.slides[1].id).toBe('slide2');
        
        // Defaults should be applied
        expect(result.autoPlay).toBeDefined();
        expect(result.duration).toBeDefined();
        expect(result.easing).toBeDefined();
        expect(result.physics).toBeDefined();
        expect(result.rendering).toBeDefined();
        expect(result.input).toBeDefined();
      });

      it('should process comprehensive configuration', () => {
        const userConfig: Partial<SliderConfig> = {
          slides: [
            { 
              id: 'slide1', 
              src: 'https://example.com/image1.jpg',
              alt: 'First slide',
              metadata: { priority: 1 },
            },
            { 
              id: 'slide2', 
              src: 'https://example.com/image2.jpg',
              alt: 'Second slide',
            },
          ],
          autoPlay: true,
          autoPlayInterval: 4000,
          duration: 600,
          easing: 'power3.out',
          loop: true,
          interactive: true,
          pauseOnHover: true,
          pauseOnFocus: false,
          preloadCount: 3,
          physics: {
            transitionDuration: 0.7,
            swipeThreshold: 80,
          },
          rendering: {
            width: 1920,
            height: 1080,
            antialias: true,
          },
          input: {
            enableKeyboard: true,
            enableMouse: true,
            enableTouch: false, // Disabled for desktop-only
            swipeThreshold: 100,
          },
          accessibility: {
            screenReader: true,
            keyboardNavigation: true,
            reduceMotion: false,
          },
          performance: {
            enabled: true,
            metrics: ['fps', 'memory'],
            logging: false,
          },
          responsive: {
            enabled: false, // Disable responsive to preserve explicit width
          },
        };

        const result = ConfigurationSystem.processConfig(userConfig);
        
        // User values should be preserved
        expect(result.autoPlay).toBe(true);
        expect(result.autoPlayInterval).toBe(4000);
        expect(result.duration).toBe(600);
        expect(result.easing).toBe('power3.out');
        expect(result.loop).toBe(true);
        expect(result.pauseOnFocus).toBe(false);
        expect(result.physics?.transitionDuration).toBe(0.7);
        expect(result.rendering?.width).toBe(1920);
        expect(result.input?.enableTouch).toBe(false);
        
        // Defaults should be applied for missing values
        expect(result.physics?.transitionEase).toBeDefined();
        expect(result.rendering?.backgroundColor).toBeDefined();
        expect(result.input?.enableKeyboard).toBe(true);
      });

    });

    describe('Invalid configurations', () => {
      it('should throw validation error for invalid config', () => {
        const invalidConfig: Partial<SliderConfig> = {
          // Missing slides/images
          duration: -500, // Invalid duration
        };

        expect(() => {
          ConfigurationSystem.processConfig(invalidConfig);
        }).toThrow(/Configuration validation failed/);
      });

      it('should throw error with detailed validation messages', () => {
        const invalidConfig: Partial<SliderConfig> = {
          slides: [], // Empty slides
          duration: -100,
          preloadCount: -5,
        };

        try {
          ConfigurationSystem.processConfig(invalidConfig);
          expect(true).toBe(false); // Should have thrown
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Configuration validation failed');
          expect((error as Error).message).toContain('config.slides');
          expect((error as Error).message).toContain('config.duration');
          expect((error as Error).message).toContain('config.preloadCount');
        }
      });

      it('should handle multiple validation errors', () => {
        const invalidConfig: Partial<SliderConfig> = {
          slides: [
            {
              id: '', // Missing required ID
              src: 'invalid-url-format', // Invalid URL
              effects: {
                opacity: 2.0, // Out of range
              },
            },
          ],
          physics: {
            transitionDuration: -1, // Invalid
            scaleIntensity: 5.0, // Out of range
          },
        };

        try {
          ConfigurationSystem.processConfig(invalidConfig);
          expect(true).toBe(false); // Should have thrown
        } catch (error) {
          const message = (error as Error).message;
          expect(message).toContain('Configuration validation failed');
          // Should contain multiple error paths
          expect(message.split('\n').length).toBeGreaterThan(2);
        }
      });
    });

    describe('Warning handling', () => {
      it('should log warnings but not fail processing', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        
        const configWithWarnings: Partial<SliderConfig> = {
          slides: [{ id: 'slide1', src: 'image1.jpg' }],
          preloadCount: 15, // High preload count warning
          easing: 'customUnknownEasing', // Unknown easing warning
        };

        const result = ConfigurationSystem.processConfig(configWithWarnings);
        
        // Processing should succeed
        expect(result).toBeDefined();
        expect(result.slides).toHaveLength(1);
        
        // Warnings should have been logged
        expect(consoleSpy).toHaveBeenCalled();
        const warnings = consoleSpy.mock.calls.map(call => call[0]);
        expect(warnings.some((w: string) => w.includes('easing'))).toBe(true);
        
        consoleSpy.mockRestore();
      });
    });
  });

  describe('validateConfig', () => {
    it('should return validation result without processing', () => {
      const config: Partial<SliderConfig> = {
        slides: [{ id: 'slide1', src: 'image1.jpg' }],
        duration: -100, // Invalid
      };

      const result = ConfigurationSystem.validateConfig(config);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].path).toBe('config.duration');
      expect(result.warnings).toEqual([]);
    });

    it('should validate without throwing errors', () => {
      const invalidConfig: Partial<SliderConfig> = {
        // Completely invalid
      };

      const result = ConfigurationSystem.validateConfig(invalidConfig);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getDefaults', () => {
    it('should return complete default configuration', () => {
      const defaults = ConfigurationSystem.getDefaults();
      
      expect(defaults).toBeDefined();
      expect(defaults.slides).toEqual([]);
      expect(defaults.autoPlay).toBeDefined();
      expect(defaults.duration).toBeDefined();
      expect(defaults.physics).toBeDefined();
      expect(defaults.rendering).toBeDefined();
      expect(defaults.input).toBeDefined();
      expect(defaults.effects).toBeDefined();
      expect(defaults.accessibility).toBeDefined();
      expect(defaults.responsive).toBeDefined();
      expect(defaults.performance).toBeDefined();
    });
  });

  describe('processSlideConfig', () => {
    it('should process slide configuration with defaults', () => {
      const slideConfig: Partial<SlideConfig> = {
        id: 'slide1',
        src: 'image1.jpg',
        alt: 'First slide',
      };

      const result = ConfigurationSystem.processSlideConfig(slideConfig);
      
      expect(result).toBeDefined();
      expect(result.id).toBe('slide1');
      expect(result.src).toBe('image1.jpg');
      expect(result.alt).toBe('First slide');
      
      // Defaults should be applied
      expect(result.title).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.loading).toBeDefined();
      expect(result.timing).toBeDefined();
      expect(result.effects).toBeDefined();
    });

    it('should merge partial slide configuration', () => {
      const slideConfig: Partial<SlideConfig> = {
        id: 'slide1',
        src: 'image1.jpg',
        metadata: {
          priority: 5,
          tags: ['featured'],
        },
        effects: {
          opacity: 0.8,
        },
      };

      const result = ConfigurationSystem.processSlideConfig(slideConfig);
      
      // User values should be preserved
      expect(result.metadata?.priority).toBe(5);
      expect(result.metadata?.tags).toEqual(['featured']);
      expect(result.effects?.opacity).toBe(0.8);
      
      // Defaults should be applied for missing values
      expect(result.metadata?.description).toBeDefined();
      expect(result.effects?.scale).toBeDefined();
      expect(result.loading).toBeDefined();
      expect(result.timing).toBeDefined();
    });
  });

  describe('clearCache', () => {
    it('should clear internal caches', () => {
      // Process config to populate caches
      const config: Partial<SliderConfig> = {
        slides: [{ id: 'slide1', src: 'image1.jpg' }],
      };
      
      const result1 = ConfigurationSystem.processConfig(config);
      const defaults1 = ConfigurationSystem.getDefaults();
      
      // Clear cache
      ConfigurationSystem.clearCache();
      
      // Get again - should be fresh instances
      const result2 = ConfigurationSystem.processConfig(config);
      const defaults2 = ConfigurationSystem.getDefaults();
      
      // Content should be the same
      expect(result1).toEqual(result2);
      expect(defaults1).toEqual(defaults2);
      
      // But references might be different due to cache clearing
      // This is implementation-dependent, so we just test that clearing doesn't break anything
      expect(result2).toBeDefined();
      expect(defaults2).toBeDefined();
    });
  });

  describe('Error handling edge cases', () => {
    it('should handle null/undefined gracefully', () => {
      expect(() => {
        ConfigurationSystem.processConfig(null as never);
      }).toThrow();

      expect(() => {
        ConfigurationSystem.processConfig(undefined as never);
      }).toThrow();
    });

    it('should handle empty configuration object', () => {
      expect(() => {
        ConfigurationSystem.processConfig({});
      }).toThrow(); // Should fail validation for missing slides
    });

    it('should handle deeply nested invalid values', () => {
      const config: Partial<SliderConfig> = {
        slides: [{ id: 'slide1', src: 'image1.jpg' }],
        physics: {
          transitionDuration: NaN, // Invalid number
        },
        rendering: {
          width: Infinity, // Invalid dimension
        },
        effects: {
          blur: {
            intensity: -10, // Out of range
          } as { intensity: number },
        },
      };

      expect(() => {
        ConfigurationSystem.processConfig(config);
      }).toThrow(/Configuration validation failed/);
    });
  });

  describe('Type safety', () => {
    it('should maintain type safety after processing', () => {
      const userConfig: Partial<SliderConfig> = {
        slides: [{ id: 'slide1', src: 'image1.jpg' }],
        autoPlay: true,
      };

      const result = ConfigurationSystem.processConfig(userConfig);
      
      // TypeScript should enforce these types
      expect(typeof result.autoPlay).toBe('boolean');
      expect(typeof result.duration).toBe('number');
      expect(typeof result.easing).toBe('string');
      expect(Array.isArray(result.slides)).toBe(true);
      expect(typeof result.physics).toBe('object');
      expect(typeof result.rendering).toBe('object');
    });

    it('should handle optional properties correctly', () => {
      const userConfig: Partial<SliderConfig> = {
        slides: [{ id: 'slide1', src: 'image1.jpg' }],
        // Many optional properties omitted
      };

      const result = ConfigurationSystem.processConfig(userConfig);
      
      // Optional properties should have defaults or be properly typed as optional
      expect(result.texts).toBeDefined(); // Should be empty array default
      expect(result.filters).toBeDefined(); // Should be empty array default
      
      // These can be undefined in the processed config if not set
      if (result.displacementEffects) {
        expect(typeof result.displacementEffects).toBe('object');
      }
    });
  });

  describe('Performance considerations', () => {
    it('should handle large configurations efficiently', () => {
      const slides = Array.from({ length: 100 }, (_, i) => ({
        id: `slide${i}`,
        src: `image${i}.jpg`,
        metadata: {
          priority: i % 10,
          tags: [`tag${i}`, `category${i % 5}`],
        },
        effects: {
          opacity: 0.8 + (i % 3) * 0.1,
        },
      }));

      const userConfig: Partial<SliderConfig> = {
        slides,
        responsive: {
          breakpoints: Array.from({ length: 10 }, (_, i) => ({
            name: `breakpoint${i}`,
            minWidth: i * 100,
            maxWidth: i === 9 ? undefined : (i + 1) * 100 - 1, // Avoid overlap, last breakpoint has no maxWidth
            config: {
              rendering: { width: (i + 1) * 200 },
            },
          })),
        },
      };

      const startTime = Date.now();
      const result = ConfigurationSystem.processConfig(userConfig);
      const endTime = Date.now();
      
      expect(result).toBeDefined();
      expect(result.slides).toHaveLength(100);
      
      // Should complete reasonably quickly (adjust threshold as needed)
      expect(endTime - startTime).toBeLessThan(1000); // 1 second max
    });
  });
});