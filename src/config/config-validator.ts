/**
 * @fileoverview Configuration Validation System
 *
 * Runtime validation for SliderConfig and SlideConfig with helpful error messages.
 * Provides comprehensive validation rules and partial configuration support.
 *
 * @version 2.0.0 - Phase 4.2 Enhanced Configuration System
 */

import type {
  SliderConfig,
  SlideConfig,
  PhysicsConfig,
  RenderConfig,
  InputConfig,
  MemoryManagementConfig,
  VisualEffectsConfig,
  AccessibilityConfig,
  ResponsiveConfig,
  PerformanceConfig,
  ErrorHandlingConfig,
  FallbackRendererConfig,
  ErrorBoundaryConfig,
} from '../core/types';
import { EASING, SCALE } from '../core/constants';

/**
 * Validation result for configuration validation
 */
export interface ValidationResult {
  /** Whether validation passed */
  isValid: boolean;
  /** Array of validation errors */
  errors: ValidationError[];
  /** Array of validation warnings */
  warnings: ValidationWarning[];
}

/**
 * Validation error details
 */
export interface ValidationError {
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** JSON path to the invalid property */
  path: string;
  /** Expected value or constraint */
  expected?: unknown;
  /** Actual invalid value */
  actual?: unknown;
}

/**
 * Validation warning details
 */
export interface ValidationWarning {
  /** Warning code for programmatic handling */
  code: string;
  /** Human-readable warning message */
  message: string;
  /** JSON path to the property */
  path: string;
  /** Suggested value */
  suggestion?: unknown;
}

/**
 * Validation error codes
 */
export const VALIDATION_ERROR_CODES = {
  REQUIRED_PROPERTY: 'REQUIRED_PROPERTY',
  INVALID_TYPE: 'INVALID_TYPE',
  OUT_OF_RANGE: 'OUT_OF_RANGE',
  INVALID_VALUE: 'INVALID_VALUE',
  INVALID_FORMAT: 'INVALID_FORMAT',
  DEPENDENCY_CONFLICT: 'DEPENDENCY_CONFLICT',
  PERFORMANCE_CONCERN: 'PERFORMANCE_CONCERN',
} as const;

/**
 * Validation warning codes
 */
export const VALIDATION_WARNING_CODES = {
  DEPRECATED_PROPERTY: 'DEPRECATED_PROPERTY',
  PERFORMANCE_IMPACT: 'PERFORMANCE_IMPACT',
  ACCESSIBILITY_CONCERN: 'ACCESSIBILITY_CONCERN',
  DEFAULT_OVERRIDE: 'DEFAULT_OVERRIDE',
  BEST_PRACTICE: 'BEST_PRACTICE',
} as const;

/**
 * Configuration validator with comprehensive validation rules
 */
export class ConfigValidator {
  private errors: ValidationError[] = [];
  private warnings: ValidationWarning[] = [];
  private currentPath: string = '';

  /**
   * Validate a complete slider configuration
   *
   * @param config - Configuration to validate
   * @returns Validation result with errors and warnings
   */
  validateConfig(config: Partial<SliderConfig>): ValidationResult {
    this.reset();
    this.currentPath = 'config';

    if (!config) {
      this.addError(
        VALIDATION_ERROR_CODES.REQUIRED_PROPERTY,
        'Configuration object is required',
        'config',
        'object',
        config
      );
      return this.getResult();
    }

    // Validate required properties
    this.validateRequiredProperties(config);

    // Validate slides array
    if (config.slides) {
      this.validateSlides(config.slides);
    }

    // Legacy images property is no longer supported

    // Validate configuration sections
    this.validateCoreSettings(config);
    this.validatePerformanceSettings(config);
    this.validateErrorHandlingSettings(config);
    this.validateVisualSettings(config);
    this.validateInputSettings(config);
    this.validateAccessibilitySettings(config);
    this.validateResponsiveSettings(config);
    this.validateAdvancedSettings(config);

    return this.getResult();
  }

  /**
   * Validate a single slide configuration
   *
   * @param slide - Slide configuration to validate
   * @param index - Slide index for error reporting
   * @returns Validation result with errors and warnings
   */
  validateSlideConfig(
    slide: Partial<SlideConfig>,
    index?: number
  ): ValidationResult {
    this.reset();
    const indexStr = index !== undefined ? `[${index}]` : '';
    this.currentPath = `slide${indexStr}`;

    if (!slide) {
      this.addError(
        VALIDATION_ERROR_CODES.REQUIRED_PROPERTY,
        'Slide configuration is required',
        this.currentPath,
        'object',
        slide
      );
      return this.getResult();
    }

    // Validate required slide properties
    this.validateRequiredSlideProperties(slide);

    // Validate slide-specific configuration
    this.validateSlideMetadata(slide);
    this.validateSlideAnimations(slide);
    this.validateSlideEffects(slide);
    this.validateSlideLoading(slide);
    this.validateSlideTiming(slide);

    return this.getResult();
  }

  // =============================================================================
  // Private Validation Methods
  // =============================================================================

  private validateRequiredProperties(config: Partial<SliderConfig>): void {
    // Either slides or images must be provided
    if (!config.slides && !config.images) {
      this.addError(
        VALIDATION_ERROR_CODES.REQUIRED_PROPERTY,
        'Either "slides" or "images" array must be provided',
        'config',
        'slides: SlideConfig[] or images: SlideData[]',
        undefined
      );
    }
  }

  private validateSlides(slides: SlideConfig[]): void {
    if (!Array.isArray(slides)) {
      this.addError(
        VALIDATION_ERROR_CODES.INVALID_TYPE,
        'Slides must be an array',
        'config.slides',
        'array',
        typeof slides
      );
      return;
    }

    if (slides.length === 0) {
      this.addError(
        VALIDATION_ERROR_CODES.INVALID_VALUE,
        'Slides array cannot be empty',
        'config.slides',
        'non-empty array',
        'empty array'
      );
      return;
    }

    // Validate each slide
    slides.forEach((slide, index) => {
      const result = this.validateSlideConfig(slide, index);
      this.errors.push(...result.errors);
      this.warnings.push(...result.warnings);
    });
  }

  private validateRequiredSlideProperties(slide: Partial<SlideConfig>): void {
    if (!slide.id) {
      this.addError(
        VALIDATION_ERROR_CODES.REQUIRED_PROPERTY,
        'Slide ID is required',
        `${this.currentPath}.id`,
        'string',
        slide.id
      );
    }

    if (!slide.src) {
      this.addError(
        VALIDATION_ERROR_CODES.REQUIRED_PROPERTY,
        'Slide source URL is required',
        `${this.currentPath}.src`,
        'string',
        slide.src
      );
    } else {
      this.validateUrl(slide.src, `${this.currentPath}.src`);
    }
  }

  private validateCoreSettings(config: Partial<SliderConfig>): void {
    // Validate duration
    if (config.duration !== undefined) {
      if (typeof config.duration !== 'number' || config.duration <= 0) {
        this.addError(
          VALIDATION_ERROR_CODES.OUT_OF_RANGE,
          'Duration must be a positive number',
          'config.duration',
          'positive number (milliseconds)',
          config.duration
        );
      } else if (config.duration < 100) {
        this.addWarning(
          VALIDATION_WARNING_CODES.PERFORMANCE_IMPACT,
          'Very short duration may cause performance issues',
          'config.duration',
          'Consider duration >= 100ms'
        );
      }
    }

    // Validate easing
    if (config.easing !== undefined) {
      this.validateEasing(config.easing, 'config.easing');
    }

    // Validate auto-play interval
    if (config.autoPlayInterval !== undefined) {
      if (
        typeof config.autoPlayInterval !== 'number' ||
        config.autoPlayInterval <= 0
      ) {
        this.addError(
          VALIDATION_ERROR_CODES.OUT_OF_RANGE,
          'Auto-play interval must be a positive number',
          'config.autoPlayInterval',
          'positive number (milliseconds)',
          config.autoPlayInterval
        );
      }
    }
  }

  private validatePerformanceSettings(config: Partial<SliderConfig>): void {
    // Validate preload count
    if (config.preloadCount !== undefined) {
      if (!Number.isInteger(config.preloadCount) || config.preloadCount < 0) {
        this.addError(
          VALIDATION_ERROR_CODES.OUT_OF_RANGE,
          'Preload count must be a non-negative integer',
          'config.preloadCount',
          'non-negative integer',
          config.preloadCount
        );
      } else if (config.preloadCount > 10) {
        this.addWarning(
          VALIDATION_WARNING_CODES.PERFORMANCE_IMPACT,
          'High preload count may impact memory usage',
          'config.preloadCount',
          'Consider preloadCount <= 10'
        );
      }
    }

    // Validate memory management
    if (config.memoryManagement) {
      this.validateMemoryManagement(config.memoryManagement);
    }

    // Validate performance config
    if (config.performance) {
      this.validatePerformanceConfig(config.performance);
    }
  }

  /**
   * Validate error handling configuration
   */
  private validateErrorHandlingSettings(config: Partial<SliderConfig>): void {
    if (config.errorHandling) {
      this.validateErrorHandlingConfig(config.errorHandling);
    }
  }

  private validateVisualSettings(config: Partial<SliderConfig>): void {
    // Validate physics config
    if (config.physics) {
      this.validatePhysicsConfig(config.physics);
    }

    // Validate render config
    if (config.rendering) {
      this.validateRenderConfig(config.rendering);
    }

    // Validate effects config
    if (config.effects) {
      this.validateVisualEffectsConfig(config.effects);
    }
  }

  private validateInputSettings(config: Partial<SliderConfig>): void {
    if (config.input) {
      this.validateInputConfig(config.input);
    }
  }

  private validateAccessibilitySettings(config: Partial<SliderConfig>): void {
    if (config.accessibility) {
      this.validateAccessibilityConfig(config.accessibility);
    }
  }

  private validateResponsiveSettings(config: Partial<SliderConfig>): void {
    if (config.responsive) {
      this.validateResponsiveConfig(config.responsive);
    }
  }

  private validateAdvancedSettings(config: Partial<SliderConfig>): void {
    // Validate filters
    if (config.filters) {
      if (!Array.isArray(config.filters)) {
        this.addError(
          VALIDATION_ERROR_CODES.INVALID_TYPE,
          'Filters must be an array',
          'config.filters',
          'array',
          typeof config.filters
        );
      }
    }

    // Validate displacement effects
    if (config.displacementEffects) {
      this.validateDisplacementEffects(config.displacementEffects);
    }
  }

  private validatePhysicsConfig(physics: Partial<PhysicsConfig>): void {
    const basePath = 'config.physics';

    if (physics.transitionDuration !== undefined) {
      this.validateNumber(
        physics.transitionDuration,
        `${basePath}.transitionDuration`,
        0.01,
        10,
        'Transition duration must be between 0.01 and 10 seconds'
      );
    }

    if (physics.swipeThreshold !== undefined) {
      this.validateNumber(
        physics.swipeThreshold,
        `${basePath}.swipeThreshold`,
        1,
        500,
        'Swipe threshold must be between 1 and 500 pixels'
      );
    }

    if (physics.scaleIntensity !== undefined) {
      this.validateNumber(
        physics.scaleIntensity,
        `${basePath}.scaleIntensity`,
        0,
        1,
        'Scale intensity must be between 0 and 1'
      );
    }

    if (physics.momentumDamping !== undefined) {
      this.validateNumber(
        physics.momentumDamping,
        `${basePath}.momentumDamping`,
        0,
        1,
        'Momentum damping must be between 0 and 1'
      );
    }
  }

  private validateRenderConfig(rendering: Partial<RenderConfig>): void {
    const basePath = 'config.rendering';

    if (rendering.width !== undefined) {
      this.validateNumber(
        rendering.width,
        `${basePath}.width`,
        1,
        8192,
        'Width must be between 1 and 8192 pixels'
      );
    }

    if (rendering.height !== undefined) {
      this.validateNumber(
        rendering.height,
        `${basePath}.height`,
        1,
        8192,
        'Height must be between 1 and 8192 pixels'
      );
    }

    if (rendering.resolution !== undefined) {
      this.validateNumber(
        rendering.resolution,
        `${basePath}.resolution`,
        0.1,
        4,
        'Resolution must be between 0.1 and 4'
      );
    }
  }

  private validateInputConfig(input: Partial<InputConfig>): void {
    const basePath = 'config.input';

    if (input.swipeThreshold !== undefined) {
      this.validateNumber(
        input.swipeThreshold,
        `${basePath}.swipeThreshold`,
        1,
        500,
        'Swipe threshold must be between 1 and 500 pixels'
      );
    }

    if (input.dragThreshold !== undefined) {
      this.validateNumber(
        input.dragThreshold,
        `${basePath}.dragThreshold`,
        1,
        100,
        'Drag threshold must be between 1 and 100 pixels'
      );
    }
  }

  private validateMemoryManagement(memory: MemoryManagementConfig): void {
    const basePath = 'config.memoryManagement';

    if (memory.maxMemoryUsage !== undefined) {
      this.validateNumber(
        memory.maxMemoryUsage,
        `${basePath}.maxMemoryUsage`,
        10,
        2048,
        'Max memory usage must be between 10MB and 2048MB'
      );
    }

    if (memory.cleanupThreshold !== undefined) {
      this.validateNumber(
        memory.cleanupThreshold,
        `${basePath}.cleanupThreshold`,
        0,
        1,
        'Cleanup threshold must be between 0 and 1'
      );
    }

    if (memory.textureCacheSize !== undefined) {
      this.validateNumber(
        memory.textureCacheSize,
        `${basePath}.textureCacheSize`,
        1,
        1000,
        'Texture cache size must be between 1 and 1000'
      );
    }
  }

  private validateVisualEffectsConfig(effects: VisualEffectsConfig): void {
    const basePath = 'config.effects';

    if (effects.opacity !== undefined) {
      this.validateNumber(
        effects.opacity,
        `${basePath}.opacity`,
        0,
        1,
        'Opacity must be between 0 and 1'
      );
    }

    if (effects.scale !== undefined) {
      this.validateNumber(
        effects.scale,
        `${basePath}.scale`,
        SCALE.MIN,
        SCALE.MAX,
        `Scale must be between ${SCALE.MIN} and ${SCALE.MAX}`
      );
    }
  }

  private validateAccessibilityConfig(
    accessibility: AccessibilityConfig
  ): void {
    if (accessibility.reduceMotion) {
      this.addWarning(
        VALIDATION_WARNING_CODES.ACCESSIBILITY_CONCERN,
        'Consider disabling auto-play when reduce motion is enabled',
        'config.accessibility.reduceMotion',
        'Set autoPlay: false for better accessibility'
      );
    }
  }

  private validateResponsiveConfig(responsive: ResponsiveConfig): void {
    if (responsive.breakpoints) {
      if (!Array.isArray(responsive.breakpoints)) {
        this.addError(
          VALIDATION_ERROR_CODES.INVALID_TYPE,
          'Responsive breakpoints must be an array',
          'config.responsive.breakpoints',
          'array',
          typeof responsive.breakpoints
        );
        return;
      }

      // Validate breakpoint ordering
      const sortedBreakpoints = [...responsive.breakpoints].sort(
        (a, b) => a.minWidth - b.minWidth
      );

      for (let i = 0; i < sortedBreakpoints.length - 1; i++) {
        // eslint-disable-next-line security/detect-object-injection
        const currentBreakpoint = sortedBreakpoints[i];
        if (!currentBreakpoint) continue;
        const current = currentBreakpoint as {
          minWidth: number;
          maxWidth?: number;
        };
        const next = sortedBreakpoints[i + 1];

        if (current.maxWidth && current.maxWidth >= next.minWidth) {
          this.addError(
            VALIDATION_ERROR_CODES.DEPENDENCY_CONFLICT,
            'Breakpoint ranges overlap',
            'config.responsive.breakpoints',
            'Non-overlapping ranges',
            `${current.minWidth}-${current.maxWidth} overlaps with ${next.minWidth}-${next.maxWidth}`
          );
        }
      }
    }
  }

  private validatePerformanceConfig(performance: PerformanceConfig): void {
    if (performance.warnings) {
      if (
        performance.warnings.fpsWarning !== undefined &&
        performance.warnings.fpsWarning <= 0
      ) {
        this.addError(
          VALIDATION_ERROR_CODES.OUT_OF_RANGE,
          'FPS warning threshold must be positive',
          'config.performance.warnings.fpsWarning',
          'positive number',
          performance.warnings.fpsWarning
        );
      }

      if (
        performance.warnings.memoryWarning !== undefined &&
        performance.warnings.memoryWarning <= 0
      ) {
        this.addError(
          VALIDATION_ERROR_CODES.OUT_OF_RANGE,
          'Memory warning threshold must be positive',
          'config.performance.warnings.memoryWarning',
          'positive number (MB)',
          performance.warnings.memoryWarning
        );
      }
    }
  }

  /**
   * Validate error handling configuration details
   */
  private validateErrorHandlingConfig(
    errorHandling: Partial<ErrorHandlingConfig>
  ): void {
    // Validate mode
    if (errorHandling.mode !== undefined) {
      const validModes = ['full', 'basic', 'disabled'];
      if (!validModes.includes(errorHandling.mode)) {
        this.addError(
          VALIDATION_ERROR_CODES.INVALID_VALUE,
          `Invalid error handling mode: "${errorHandling.mode}"`,
          'config.errorHandling.mode',
          validModes.join(' | '),
          errorHandling.mode
        );
      }
    }

    // Validate recovery attempts
    if (errorHandling.maxRecoveryAttempts !== undefined) {
      if (
        !Number.isInteger(errorHandling.maxRecoveryAttempts) ||
        errorHandling.maxRecoveryAttempts < 0
      ) {
        this.addError(
          VALIDATION_ERROR_CODES.OUT_OF_RANGE,
          'Max recovery attempts must be a non-negative integer',
          'config.errorHandling.maxRecoveryAttempts',
          'non-negative integer',
          errorHandling.maxRecoveryAttempts
        );
      } else if (errorHandling.maxRecoveryAttempts > 10) {
        this.addWarning(
          VALIDATION_WARNING_CODES.PERFORMANCE_IMPACT,
          'High recovery attempt count may cause delays',
          'config.errorHandling.maxRecoveryAttempts',
          'Consider maxRecoveryAttempts <= 10'
        );
      }
    }

    // Validate timing settings
    if (errorHandling.recoveryBaseDelay !== undefined) {
      if (
        typeof errorHandling.recoveryBaseDelay !== 'number' ||
        errorHandling.recoveryBaseDelay < 0
      ) {
        this.addError(
          VALIDATION_ERROR_CODES.OUT_OF_RANGE,
          'Recovery base delay must be a non-negative number',
          'config.errorHandling.recoveryBaseDelay',
          'non-negative number (ms)',
          errorHandling.recoveryBaseDelay
        );
      }
    }

    if (errorHandling.recoveryTimeout !== undefined) {
      if (
        typeof errorHandling.recoveryTimeout !== 'number' ||
        errorHandling.recoveryTimeout <= 0
      ) {
        this.addError(
          VALIDATION_ERROR_CODES.OUT_OF_RANGE,
          'Recovery timeout must be a positive number',
          'config.errorHandling.recoveryTimeout',
          'positive number (ms)',
          errorHandling.recoveryTimeout
        );
      }
    }

    // Validate backoff multiplier
    if (errorHandling.recoveryBackoffMultiplier !== undefined) {
      if (
        typeof errorHandling.recoveryBackoffMultiplier !== 'number' ||
        errorHandling.recoveryBackoffMultiplier < 1
      ) {
        this.addError(
          VALIDATION_ERROR_CODES.OUT_OF_RANGE,
          'Recovery backoff multiplier must be >= 1',
          'config.errorHandling.recoveryBackoffMultiplier',
          'number >= 1',
          errorHandling.recoveryBackoffMultiplier
        );
      }
    }

    // Validate fallback config
    if (errorHandling.fallback) {
      this.validateFallbackRendererConfig(errorHandling.fallback);
    }

    // Validate boundary config
    if (errorHandling.boundary) {
      this.validateErrorBoundaryConfig(errorHandling.boundary);
    }
  }

  /**
   * Validate fallback renderer configuration
   */
  private validateFallbackRendererConfig(
    fallback: Partial<FallbackRendererConfig>
  ): void {
    if (fallback.mode !== undefined) {
      const validModes = ['static', 'basic', 'css-animations'];
      if (!validModes.includes(fallback.mode)) {
        this.addError(
          VALIDATION_ERROR_CODES.INVALID_VALUE,
          `Invalid fallback renderer mode: "${fallback.mode}"`,
          'config.errorHandling.fallback.mode',
          validModes.join(' | '),
          fallback.mode
        );
      }
    }

    if (fallback.cssPrefix !== undefined) {
      if (
        typeof fallback.cssPrefix !== 'string' ||
        fallback.cssPrefix.trim() === ''
      ) {
        this.addError(
          VALIDATION_ERROR_CODES.INVALID_VALUE,
          'CSS prefix must be a non-empty string',
          'config.errorHandling.fallback.cssPrefix',
          'non-empty string',
          fallback.cssPrefix
        );
      }
    }
  }

  /**
   * Validate error boundary configuration
   */
  private validateErrorBoundaryConfig(
    boundary: Partial<ErrorBoundaryConfig>
  ): void {
    if (boundary.maxErrors !== undefined) {
      if (!Number.isInteger(boundary.maxErrors) || boundary.maxErrors < 1) {
        this.addError(
          VALIDATION_ERROR_CODES.OUT_OF_RANGE,
          'Max errors must be a positive integer',
          'config.errorHandling.boundary.maxErrors',
          'positive integer',
          boundary.maxErrors
        );
      }
    }

    if (boundary.recoveryDelay !== undefined) {
      if (
        typeof boundary.recoveryDelay !== 'number' ||
        boundary.recoveryDelay < 0
      ) {
        this.addError(
          VALIDATION_ERROR_CODES.OUT_OF_RANGE,
          'Recovery delay must be a non-negative number',
          'config.errorHandling.boundary.recoveryDelay',
          'non-negative number (ms)',
          boundary.recoveryDelay
        );
      }
    }
  }

  private validateDisplacementEffects(displacement: {
    intensity?: number;
  }): void {
    if (displacement.intensity !== undefined) {
      this.validateNumber(
        displacement.intensity,
        'config.displacementEffects.intensity',
        0,
        1,
        'Displacement intensity must be between 0 and 1'
      );
    }
  }

  private validateSlideMetadata(slide: Partial<SlideConfig>): void {
    if (slide.metadata?.priority !== undefined) {
      if (
        !Number.isInteger(slide.metadata.priority) ||
        slide.metadata.priority < 0
      ) {
        this.addError(
          VALIDATION_ERROR_CODES.OUT_OF_RANGE,
          'Slide priority must be a non-negative integer',
          `${this.currentPath}.metadata.priority`,
          'non-negative integer',
          slide.metadata.priority
        );
      }
    }
  }

  private validateSlideAnimations(_slide: Partial<SlideConfig>): void {
    // Slide animation validation would go here
    // For now, basic structure validation
  }

  private validateSlideEffects(slide: Partial<SlideConfig>): void {
    if (slide.effects?.opacity !== undefined) {
      this.validateNumber(
        slide.effects.opacity,
        `${this.currentPath}.effects.opacity`,
        0,
        1,
        'Slide opacity must be between 0 and 1'
      );
    }

    if (slide.effects?.scale !== undefined) {
      this.validateNumber(
        slide.effects.scale,
        `${this.currentPath}.effects.scale`,
        SCALE.MIN,
        SCALE.MAX,
        `Slide scale must be between ${SCALE.MIN} and ${SCALE.MAX}`
      );
    }
  }

  private validateSlideLoading(slide: Partial<SlideConfig>): void {
    if (slide.loading?.timeout !== undefined) {
      if (slide.loading.timeout <= 0) {
        this.addError(
          VALIDATION_ERROR_CODES.OUT_OF_RANGE,
          'Loading timeout must be positive',
          `${this.currentPath}.loading.timeout`,
          'positive number (milliseconds)',
          slide.loading.timeout
        );
      }
    }
  }

  private validateSlideTiming(slide: Partial<SlideConfig>): void {
    if (slide.timing?.duration !== undefined) {
      if (slide.timing.duration <= 0) {
        this.addError(
          VALIDATION_ERROR_CODES.OUT_OF_RANGE,
          'Slide duration must be positive',
          `${this.currentPath}.timing.duration`,
          'positive number (milliseconds)',
          slide.timing.duration
        );
      }
    }

    if (slide.timing?.easing) {
      this.validateEasing(
        slide.timing.easing,
        `${this.currentPath}.timing.easing`
      );
    }
  }

  // =============================================================================
  // Utility Validation Methods
  // =============================================================================

  private validateNumber(
    value: unknown,
    path: string,
    min?: number,
    max?: number,
    message?: string
  ): void {
    if (typeof value !== 'number' || isNaN(value)) {
      this.addError(
        VALIDATION_ERROR_CODES.INVALID_TYPE,
        message || 'Value must be a number',
        path,
        'number',
        value
      );
      return;
    }

    if (min !== undefined && value < min) {
      this.addError(
        VALIDATION_ERROR_CODES.OUT_OF_RANGE,
        message || `Value must be >= ${min}`,
        path,
        `>= ${min}`,
        value
      );
    }

    if (max !== undefined && value > max) {
      this.addError(
        VALIDATION_ERROR_CODES.OUT_OF_RANGE,
        message || `Value must be <= ${max}`,
        path,
        `<= ${max}`,
        value
      );
    }
  }

  private validateUrl(url: string, path: string): void {
    try {
      const parsedUrl = new URL(url);
      // Only allow http, https protocols for absolute URLs
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        this.addError(
          VALIDATION_ERROR_CODES.INVALID_FORMAT,
          'Invalid URL protocol. Only http and https are allowed',
          path,
          'http:// or https:// URL',
          url
        );
      }
    } catch {
      // Check if it's a relative path or simple filename
      const isRelativePath =
        url.startsWith('/') || url.startsWith('./') || url.startsWith('../');
      const hasFileExtension = /\.[a-zA-Z0-9]+$/.test(url); // Has extension like .jpg, .png, etc.

      if (!isRelativePath && !hasFileExtension) {
        this.addError(
          VALIDATION_ERROR_CODES.INVALID_FORMAT,
          'Invalid URL format',
          path,
          'valid URL or relative path',
          url
        );
      }
    }
  }

  private validateEasing(easing: string, path: string): void {
    const validEasings = Object.values(EASING);
    if (
      !validEasings.includes(easing as (typeof EASING)[keyof typeof EASING])
    ) {
      this.addWarning(
        VALIDATION_WARNING_CODES.BEST_PRACTICE,
        `Unknown easing function "${easing}". Consider using a standard GSAP easing.`,
        path,
        `One of: ${validEasings.join(', ')}`
      );
    }
  }

  // =============================================================================
  // Helper Methods
  // =============================================================================

  private addError(
    code: string,
    message: string,
    path: string,
    expected?: unknown,
    actual?: unknown
  ): void {
    this.errors.push({
      code,
      message,
      path,
      expected,
      actual,
    });
  }

  private addWarning(
    code: string,
    message: string,
    path: string,
    suggestion?: unknown
  ): void {
    this.warnings.push({
      code,
      message,
      path,
      suggestion,
    });
  }

  private reset(): void {
    this.errors = [];
    this.warnings = [];
    this.currentPath = '';
  }

  private getResult(): ValidationResult {
    return {
      isValid: this.errors.length === 0,
      errors: [...this.errors],
      warnings: [...this.warnings],
    };
  }
}
