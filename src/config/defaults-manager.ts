/**
 * @fileoverview Configuration Defaults Management System
 *
 * Intelligent default configuration management with responsive support and
 * smart merging algorithms. Provides sensible defaults for all configuration
 * options with performance optimization.
 *
 * @version 2.0.0 - Phase 4.2 Enhanced Configuration System
 */

import type {
  SliderConfig,
  SlideConfig,
  ResponsiveBreakpoint,
} from '../core/types';
import { warn } from '../utils/debug-logger';
import {
  ANIMATION_DURATION,
  EASING,
  INPUT,
  SCALE,
  VIEWPORT,
  DEFAULT_PHYSICS_CONFIG,
  DEFAULT_RENDER_CONFIG,
  DEFAULT_INPUT_CONFIG,
  RESOURCE_CONSTANTS,
  PERFORMANCE_THRESHOLDS,
} from '../core/constants';

/**
 * Default configuration values organized by category
 */
export const DEFAULT_CONFIGS = {
  // Core slider settings
  CORE: {
    autoPlay: false,
    autoPlayInterval: 3000, // 3 seconds
    duration: ANIMATION_DURATION.STANDARD * 1000, // Convert to milliseconds
    easing: EASING.EASE_OUT,
    loop: false,
    interactive: true,
    debug: false,
  },

  // Interaction settings
  INTERACTION: {
    pauseOnHover: true,
    pauseOnFocus: true,
    pauseOnInteraction: true,
  },

  // Performance settings
  PERFORMANCE: {
    preloadCount: 2,
    enableVirtualization: false,
  },

  // Physics configuration
  PHYSICS: DEFAULT_PHYSICS_CONFIG,

  // Rendering configuration
  RENDERING: DEFAULT_RENDER_CONFIG,

  // Input configuration
  INPUT: DEFAULT_INPUT_CONFIG,

  // Memory management
  MEMORY_MANAGEMENT: {
    maxMemoryUsage: 256, // 256MB
    autoGarbageCollection: true,
    cleanupThreshold: RESOURCE_CONSTANTS.MEMORY_PRESSURE_THRESHOLD,
    textureCacheSize: 50,
  },

  // Visual effects
  VISUAL_EFFECTS: {
    opacity: 1.0,
    scale: SCALE.DEFAULT,
    blur: {
      enabled: false,
      intensity: 0,
      quality: 'medium' as const,
    },
    colorAdjustments: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      hue: 0,
    },
    particles: {
      enabled: false,
      count: 50,
      size: { min: 1, max: 3 },
      speed: { min: 0.5, max: 2 },
    },
  },

  // Accessibility configuration
  ACCESSIBILITY: {
    screenReader: true,
    keyboardNavigation: true,
    highContrast: false,
    reduceMotion: false,
    focusManagement: {
      autoFocus: false,
      trapFocus: false,
      outlineStyle: '2px solid #007acc',
    },
    ariaLabels: {
      sliderLabel: 'Image slider',
      previousButton: 'Previous slide',
      nextButton: 'Next slide',
      playPauseButton: 'Toggle play/pause',
      slideLabel: 'Slide {index} of {total}',
    },
  },

  // Responsive configuration
  RESPONSIVE: {
    enabled: true,
    strategy: 'mobile-first' as const,
    breakpoints: [
      {
        name: 'mobile',
        minWidth: 0,
        maxWidth: 767,
        config: {
          rendering: {
            width: VIEWPORT.MOBILE.width,
            height: VIEWPORT.MOBILE.height,
          },
          input: {
            swipeThreshold: INPUT.SWIPE_THRESHOLD * 0.8, // Reduced for mobile
          },
        },
      },
      {
        name: 'tablet',
        minWidth: 768,
        maxWidth: 1023,
        config: {
          rendering: {
            width: VIEWPORT.TABLET.width,
            height: VIEWPORT.TABLET.height,
          },
        },
      },
      {
        name: 'desktop',
        minWidth: 1024,
        config: {
          rendering: {
            width: VIEWPORT.DESKTOP.width,
            height: VIEWPORT.DESKTOP.height,
          },
        },
      },
    ] as ResponsiveBreakpoint[],
  },

  // Performance monitoring
  PERFORMANCE_MONITORING: {
    enabled: false,
    metrics: ['fps', 'memory', 'renderTime'] as ['fps', 'memory', 'renderTime'],
    warnings: {
      fpsWarning: PERFORMANCE_THRESHOLDS.MIN_FPS,
      memoryWarning: 200, // 200MB
      renderTimeWarning: 16, // 16ms for 60fps
    },
    logging: false,
  },

  // Slide defaults
  SLIDE: {
    metadata: {
      priority: 0,
      tags: [] as string[],
      data: {},
      description: '',
    },
    loading: {
      lazy: false,
      priority: 'normal' as const,
      timeout: 5000,
    },
    timing: {
      duration: ANIMATION_DURATION.STANDARD * 1000,
      delay: 0,
      easing: EASING.EASE_OUT,
    },
    effects: {
      opacity: 1.0,
      scale: SCALE.DEFAULT,
    },
  },
} as const;

/**
 * Configuration defaults manager with intelligent merging
 */
export class DefaultsManager {
  private static instance: DefaultsManager | null = null;
  private cachedDefaults: SliderConfig | null = null;

  /**
   * Get singleton instance of DefaultsManager
   */
  static getInstance(): DefaultsManager {
    if (!DefaultsManager.instance) {
      DefaultsManager.instance = new DefaultsManager();
    }
    return DefaultsManager.instance;
  }

  /**
   * Get complete default configuration
   *
   * @returns Complete default slider configuration
   */
  getDefaults(): SliderConfig {
    if (this.cachedDefaults) {
      return this.cachedDefaults;
    }

    this.cachedDefaults = this.buildDefaultConfig();
    return this.cachedDefaults;
  }

  /**
   * Merge user configuration with intelligent defaults
   *
   * @param userConfig - Partial user configuration
   * @returns Complete configuration with defaults applied
   */
  mergeWithDefaults(userConfig: Partial<SliderConfig>): SliderConfig {
    const defaults = this.getDefaults();

    // Handle legacy images -> slides conversion
    const normalizedConfig = this.normalizeLegacyConfig(userConfig);

    // Deep merge with defaults
    const merged = this.deepMerge(
      defaults as unknown as Record<string, unknown>,
      normalizedConfig as unknown as Record<string, unknown>
    ) as unknown as SliderConfig;

    // Apply responsive overrides based on current viewport
    const responsive = this.applyResponsiveDefaults(merged);

    // Apply intelligent defaults based on context
    const intelligent = this.applyIntelligentDefaults(responsive);

    return intelligent;
  }

  /**
   * Get default configuration for a specific slide
   *
   * @param slideConfig - Partial slide configuration
   * @returns Complete slide configuration with defaults
   */
  getSlideDefaults(slideConfig: Partial<SlideConfig>): SlideConfig {
    const defaults: SlideConfig = {
      id: '',
      src: '',
      alt: '',
      title: '',
      metadata: { ...DEFAULT_CONFIGS.SLIDE.metadata },
      loading: { ...DEFAULT_CONFIGS.SLIDE.loading },
      timing: { ...DEFAULT_CONFIGS.SLIDE.timing },
      effects: { ...DEFAULT_CONFIGS.SLIDE.effects },
    };

    return this.deepMerge(
      defaults as unknown as Record<string, unknown>,
      slideConfig as unknown as Record<string, unknown>
    ) as unknown as SlideConfig;
  }

  /**
   * Get breakpoint-specific defaults
   *
   * @param breakpointName - Name of the breakpoint
   * @returns Configuration overrides for the breakpoint
   */
  getBreakpointDefaults(breakpointName: string): Partial<SliderConfig> {
    const breakpoint = DEFAULT_CONFIGS.RESPONSIVE.breakpoints.find(
      (bp) => bp.name === breakpointName
    );

    return breakpoint?.config || {};
  }

  /**
   * Clear cached defaults (useful for testing or dynamic reconfiguration)
   */
  clearCache(): void {
    this.cachedDefaults = null;
  }

  // =============================================================================
  // Private Implementation Methods
  // =============================================================================

  private buildDefaultConfig(): SliderConfig {
    return {
      slides: [],

      // Core settings
      autoPlay: DEFAULT_CONFIGS.CORE.autoPlay,
      autoPlayInterval: DEFAULT_CONFIGS.CORE.autoPlayInterval,
      duration: DEFAULT_CONFIGS.CORE.duration,
      easing: DEFAULT_CONFIGS.CORE.easing,
      loop: DEFAULT_CONFIGS.CORE.loop,
      interactive: DEFAULT_CONFIGS.CORE.interactive,
      debug: DEFAULT_CONFIGS.CORE.debug,

      // Interaction settings
      pauseOnHover: DEFAULT_CONFIGS.INTERACTION.pauseOnHover,
      pauseOnFocus: DEFAULT_CONFIGS.INTERACTION.pauseOnFocus,
      pauseOnInteraction: DEFAULT_CONFIGS.INTERACTION.pauseOnInteraction,

      // Performance settings
      preloadCount: DEFAULT_CONFIGS.PERFORMANCE.preloadCount,
      enableVirtualization: DEFAULT_CONFIGS.PERFORMANCE.enableVirtualization,
      memoryManagement: { ...DEFAULT_CONFIGS.MEMORY_MANAGEMENT },

      // System configurations
      physics: { ...DEFAULT_CONFIGS.PHYSICS },
      rendering: { ...DEFAULT_CONFIGS.RENDERING },
      input: { ...DEFAULT_CONFIGS.INPUT },
      effects: this.deepCopy(
        DEFAULT_CONFIGS.VISUAL_EFFECTS
      ) as SliderConfig['effects'],
      accessibility: this.deepCopy(
        DEFAULT_CONFIGS.ACCESSIBILITY
      ) as SliderConfig['accessibility'],
      responsive: this.deepCopy(
        DEFAULT_CONFIGS.RESPONSIVE
      ) as SliderConfig['responsive'],
      performance: { ...DEFAULT_CONFIGS.PERFORMANCE_MONITORING },

      // Advanced features (disabled by default)
      texts: [],
      filters: [],
      displacementEffects: undefined,
    };
  }

  private normalizeLegacyConfig(
    config: Partial<SliderConfig>
  ): Partial<SliderConfig> {
    const normalized = { ...config };

    // Convert legacy 'images' property to 'slides'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ('images' in normalized && Array.isArray((normalized as any).images)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const legacyImages = (normalized as any).images;

      // Log deprecation warning
      warn(
        'images property is deprecated. Use slides instead.',
        'CONFIG_MIGRATION'
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      normalized.slides = legacyImages.map((img: any, index: number) => ({
        id: img.id || `slide-${index}`,
        src: img.src || '',
        alt: img.alt || '',
        title: img.title || '',
        ...img,
      }));

      // Remove the legacy property
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (normalized as any).images;
    }

    return normalized;
  }

  private applyResponsiveDefaults(config: SliderConfig): SliderConfig {
    if (!config.responsive?.enabled) {
      return config;
    }

    // Get current viewport width (fallback to desktop if not available)
    const viewportWidth =
      typeof window !== 'undefined'
        ? window.innerWidth
        : VIEWPORT.DESKTOP.width;

    // Find matching breakpoint
    const breakpoints =
      config.responsive.breakpoints || DEFAULT_CONFIGS.RESPONSIVE.breakpoints;
    const matchingBreakpoint = breakpoints
      .filter(
        (bp) =>
          viewportWidth >= bp.minWidth &&
          (!bp.maxWidth || viewportWidth <= bp.maxWidth)
      )
      .sort((a, b) => b.minWidth - a.minWidth)[0]; // Get the most specific match

    if (matchingBreakpoint?.config) {
      return this.deepMerge(
        config as unknown as Record<string, unknown>,
        matchingBreakpoint.config as unknown as Record<string, unknown>
      ) as unknown as SliderConfig;
    }

    return config;
  }

  private applyIntelligentDefaults(config: SliderConfig): SliderConfig {
    const intelligent = { ...config };

    // Adjust preload count based on slide count
    if (config.slides.length < 3) {
      intelligent.preloadCount = Math.min(
        intelligent.preloadCount || 0,
        config.slides.length
      );
    }

    // Enable virtualization for large slide sets
    if (
      config.slides.length > 50 &&
      (intelligent.enableVirtualization === undefined ||
        intelligent.enableVirtualization === false)
    ) {
      intelligent.enableVirtualization = true;
    }

    // Adjust auto-play interval based on slide count and duration
    if (config.autoPlay && config.slides.length > 10) {
      const minInterval =
        (config.duration || DEFAULT_CONFIGS.CORE.duration) + 500;
      intelligent.autoPlayInterval = Math.max(
        intelligent.autoPlayInterval || DEFAULT_CONFIGS.CORE.autoPlayInterval,
        minInterval
      );
    }

    // Enable performance monitoring in debug mode
    if (config.debug && !config.performance?.enabled) {
      intelligent.performance = {
        ...intelligent.performance,
        enabled: true,
        logging: true,
      };
    }

    // Adjust memory management for high-resolution content
    if (config.rendering?.resolution && config.rendering.resolution > 2) {
      intelligent.memoryManagement = {
        ...intelligent.memoryManagement,
        maxMemoryUsage: Math.max(
          intelligent.memoryManagement?.maxMemoryUsage || 256,
          512
        ),
      };
    }

    // Enable accessibility features based on user preferences
    if (this.shouldEnableReducedMotion()) {
      intelligent.accessibility = {
        ...intelligent.accessibility,
        reduceMotion: true,
      };

      // Reduce animation durations for accessibility
      intelligent.duration = Math.min(
        intelligent.duration || DEFAULT_CONFIGS.CORE.duration,
        ANIMATION_DURATION.FAST * 1000
      );
    }

    return intelligent;
  }

  private shouldEnableReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;

    try {
      return (
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      );
    } catch {
      return false;
    }
  }

  private deepMerge(
    target: Record<string, unknown>,
    source: Record<string, unknown>
  ): Record<string, unknown> {
    if (!this.isObject(target) || !this.isObject(source)) {
      return source;
    }

    const result = { ...target };

    const sourceKeys = Object.keys(source);
    for (const key of sourceKeys) {
      if (!(key in source)) continue;

      // eslint-disable-next-line security/detect-object-injection
      const sourceValue = source[key];
      // eslint-disable-next-line security/detect-object-injection
      const targetValue = target[key];

      if (this.isObject(sourceValue) && this.isObject(targetValue)) {
        // eslint-disable-next-line security/detect-object-injection
        result[key] = this.deepMerge(targetValue, sourceValue);
      } else {
        // eslint-disable-next-line security/detect-object-injection
        result[key] = sourceValue;
      }
    }

    return result;
  }

  private deepCopy(obj: unknown): unknown {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map((item) => this.deepCopy(item));

    if (typeof obj === 'object') {
      const copy: Record<string, unknown> = {};
      const sourceObj = obj as Record<string, unknown>;
      const objKeys = Object.keys(sourceObj);
      for (const key of objKeys) {
        if (!(key in sourceObj)) continue;
        // eslint-disable-next-line security/detect-object-injection
        copy[key] = this.deepCopy(sourceObj[key]);
      }
      return copy;
    }

    return obj;
  }

  private isObject(item: unknown): item is Record<string, unknown> {
    return Boolean(item && typeof item === 'object' && !Array.isArray(item));
  }
}

// Export singleton instance for convenience
export const defaultsManager = DefaultsManager.getInstance();
