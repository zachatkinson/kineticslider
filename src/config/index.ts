/**
 * @fileoverview Configuration System Exports
 * 
 * Main entry point for the enhanced configuration system providing
 * validation, defaults management, and type-safe configuration handling.
 * 
 * @version 2.0.0 - Phase 4.2 Enhanced Configuration System
 */

// Configuration validation
export {
  ConfigValidator,
  VALIDATION_ERROR_CODES,
  VALIDATION_WARNING_CODES,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
} from './config-validator';
import { ConfigValidator } from './config-validator';

// Configuration defaults management
export {
  DefaultsManager,
  defaultsManager,
  DEFAULT_CONFIGS,
} from './defaults-manager';
import { DefaultsManager } from './defaults-manager';

// Re-export enhanced configuration types
export type {
  SliderConfig,
  SlideConfig,
  SlideMetadata,
  SlideAnimationConfig,
  SlideEffectsConfig,
  SlideLoadingConfig,
  SlideResponsiveConfig,
  SlideTiming,
  MemoryManagementConfig,
  VisualEffectsConfig,
  BlurEffectConfig,
  ColorAdjustmentConfig,
  ParticleEffectConfig,
  AccessibilityConfig,
  FocusManagementConfig,
  AriaLabelsConfig,
  ResponsiveConfig,
  ResponsiveBreakpoint,
  ResponsiveImageSource,
  ResponsiveAspectRatio,
  PerformanceConfig,
  PerformanceMetric,
  PerformanceWarnings,
  TransitionEffectConfig,
} from '../core/types';

/**
 * Configuration system utilities
 */
/**
 * Configuration system utilities
 */
export class ConfigurationSystem {
  private static validator = new ConfigValidator();
  private static defaultsManager = DefaultsManager.getInstance();

  /**
   * Validate and merge configuration with intelligent defaults
   * 
   * @param userConfig - User-provided configuration
   * @returns Validated and merged configuration
   * @throws Error if validation fails
   */
  static processConfig(userConfig: Partial<import('../core/types').SliderConfig>): import('../core/types').SliderConfig {
    // Validate configuration
    const validationResult = this.validator.validateConfig(userConfig);
    
    if (!validationResult.isValid) {
      const errorMessages = validationResult.errors.map(
        error => `${error.path}: ${error.message}`
      ).join('\n');
      
      throw new Error(`Configuration validation failed:\n${errorMessages}`);
    }

    // Log warnings to console
    if (validationResult.warnings.length > 0) {
      validationResult.warnings.forEach(warning => {
        // eslint-disable-next-line no-console
        console.warn(`Configuration warning: ${warning.path}: ${warning.message}`);
      });
    }

    // Merge with defaults
    return this.defaultsManager.mergeWithDefaults(userConfig);
  }

  /**
   * Validate configuration without merging defaults
   * 
   * @param config - Configuration to validate
   * @returns Validation result
   */
  static validateConfig(config: Partial<import('../core/types').SliderConfig>): import('./config-validator').ValidationResult {
    return this.validator.validateConfig(config);
  }

  /**
   * Get default configuration
   * 
   * @returns Complete default configuration
   */
  static getDefaults(): import('../core/types').SliderConfig {
    return this.defaultsManager.getDefaults();
  }

  /**
   * Process slide configuration with defaults
   * 
   * @param slideConfig - Slide configuration to process
   * @returns Complete slide configuration
   */
  static processSlideConfig(slideConfig: Partial<import('../core/types').SlideConfig>): import('../core/types').SlideConfig {
    return this.defaultsManager.getSlideDefaults(slideConfig);
  }

  /**
   * Clear cached defaults (useful for testing)
   */
  static clearCache(): void {
    this.defaultsManager.clearCache();
  }
}