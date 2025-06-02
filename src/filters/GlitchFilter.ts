import { GlitchFilter } from 'pixi-filters';
import type { GlitchFilterConfig, FilterResult } from '../types/filters';

/**
 * Enhanced Glitch Filter
 *
 * Extends the PIXI GlitchFilter with intensity control and animation support.
 * Creates digital glitch effects with RGB channel separation.
 *
 * @example
 * ```typescript
 * const filter = createFilter({
 *   type: 'glitch',
 *   enabled: true,
 *   intensity: createFilterIntensity(8),
 *   slices: 10,
 *   offset: 150,
 *   direction: 45,
 *   animated: true,
 *   refreshFrequency: 100
 * });
 * ```
 */
class EnhancedGlitchFilter extends GlitchFilter {
  private baseSlices: number;
  private baseOffset: number;
  private baseDirection: number;
  private baseSeed: number;
  private config: GlitchFilterConfig;
  private animationInterval?: NodeJS.Timeout;

  constructor(config: GlitchFilterConfig) {
    // Initialize with default or configured values
    const options: Record<string, unknown> = {};
    
    if (config.slices !== undefined) options.slices = config.slices;
    if (config.offset !== undefined) options.offset = config.offset;
    if (config.direction !== undefined) options.direction = config.direction;
    if (config.seed !== undefined) options.seed = config.seed;
    if (config.red !== undefined) options.red = config.red;
    if (config.green !== undefined) options.green = config.green;
    if (config.blue !== undefined) options.blue = config.blue;
    
    super(options);
    
    this.config = config;
    this.enabled = config.enabled;
    
    // Store base values for intensity calculations
    this.baseSlices = this.slices || 5;
    this.baseOffset = this.offset || 100;
    this.baseDirection = this.direction || 0;
    this.baseSeed = this.seed || 0;
    
    // Start animation if configured
    if (config.animated && config.refreshFrequency) {
      this.startAnimation(config.refreshFrequency);
    }
    
    // Only apply initial intensity if no specific values are provided
    const hasSpecificValues = config.slices !== undefined || 
                             config.offset !== undefined || 
                             config.direction !== undefined ||
                             config.seed !== undefined ||
                             config.red !== undefined ||
                             config.green !== undefined ||
                             config.blue !== undefined;
    
    if (!hasSpecificValues) {
      this.updateIntensity(config.intensity);
    }
  }

  /**
   * Update filter intensity
   *
   * @param intensity - Intensity value (0-10)
   *
   */
  updateIntensity(intensity: number): void {
    const normalizedIntensity = Math.max(0, Math.min(10, intensity));
    
    // Always update slices and offset regardless of primaryProperty
    this.slices = Math.max(1, Math.floor(normalizedIntensity));
    this.offset = this.baseOffset * (normalizedIntensity / 5);
    
    // Update other properties based on primaryProperty
    if (this.config.primaryProperty) {
      switch (this.config.primaryProperty) {
        case 'direction':
          this.direction = this.baseDirection * (normalizedIntensity / 10);
          break;
        // slices and offset are always updated above
      }
    }
  }

  /**
   * Start animation
   *
   * @param frequency - Animation frequency in milliseconds
   *
   */
  private startAnimation(frequency: number): void {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
    
    this.animationInterval = setInterval(() => {
      this.seed = Math.random();
    }, frequency);
  }

  /**
   * Stop animation
   */
  private stopAnimation(): void {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = undefined;
    }
  }

  /**
   * Reset filter to original configuration
   */
  reset(): void {
    this.slices = this.baseSlices;
    this.offset = this.baseOffset;
    this.direction = this.baseDirection;
    this.seed = this.baseSeed;
  }

  /**
   * Get current filter state
   *
   * @returns Current filter state including all glitch properties
   *
   */
  getState(): Record<string, unknown> {
    return {
      slices: this.slices,
      offset: this.offset,
      direction: this.direction,
      seed: this.seed,
      red: this.red,
      green: this.green,
      blue: this.blue,
      enabled: this.enabled,
      intensity: this.config.intensity
    };
  }

  /**
   * Dispose of the filter and stop animations
   */
  destroy(): void {
    this.stopAnimation();
    super.destroy();
  }
}

/**
 * Create a Glitch filter
 *
 * @param config - Filter configuration
 *
 * @returns FilterResult with filter instance and control functions
 *
 */
export function createFilter(config: GlitchFilterConfig): FilterResult {
  const filter = new EnhancedGlitchFilter(config);

  return {
    filter,
    config,
    updateIntensity: (intensity) => filter.updateIntensity(intensity),
    reset: () => filter.reset(),
    dispose: () => filter.destroy(),
    getState: () => filter.getState()
  };
} 