import { GlowFilter } from 'pixi-filters';
import type { ColorSource } from 'pixi.js';
import type { GlowFilterConfig, FilterResult } from '../types/filters';

/**
 * Enhanced Glow Filter
 *
 * Extends the PIXI GlowFilter with intensity control and configuration management.
 * Provides inner and outer glow effects with customizable properties.
 *
 * @example
 * ```typescript
 * const filter = createFilter({
 *   type: 'glow',
 *   enabled: true,
 *   intensity: createFilterIntensity(6),
 *   innerStrength: 2,
 *   outerStrength: 4,
 *   distance: 10,
 *   color: 0x00ff00,
 *   quality: 0.5
 * });
 * ```
 */
class EnhancedGlowFilter extends GlowFilter {
  private baseInnerStrength: number;
  private baseOuterStrength: number;
  private baseDistance: number;
  private baseColor: ColorSource;
  private baseQuality: number;
  private config: GlowFilterConfig;

  constructor(config: GlowFilterConfig) {
    // Initialize with default or configured values
    const options: Record<string, unknown> = {};
    
    if (config.innerStrength !== undefined) options.innerStrength = config.innerStrength;
    if (config.outerStrength !== undefined) options.outerStrength = config.outerStrength;
    if (config.distance !== undefined) options.distance = config.distance;
    if (config.color !== undefined) options.color = config.color;
    if (config.quality !== undefined) options.quality = config.quality;
    
    super(options);
    
    this.config = config;
    this.enabled = config.enabled;
    
    // Store base values for intensity calculations
    this.baseInnerStrength = this.innerStrength || 0;
    this.baseOuterStrength = this.outerStrength || 4;
    this.baseDistance = this.distance || 10;
    this.baseColor = this.color || 0xffffff;
    this.baseQuality = this.quality || 0.1;
    
    // Only apply initial intensity if no specific values are provided
    const hasSpecificValues = config.innerStrength !== undefined || 
                             config.outerStrength !== undefined || 
                             config.distance !== undefined ||
                             config.color !== undefined ||
                             config.quality !== undefined;
    
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
    
    if (this.config.primaryProperty) {
      switch (this.config.primaryProperty) {
        case 'innerStrength':
          this.innerStrength = this.baseInnerStrength * (normalizedIntensity / 10);
          break;
        case 'outerStrength':
          this.outerStrength = this.baseOuterStrength * (normalizedIntensity / 10);
          break;
        case 'distance':
          this.distance = this.baseDistance * (normalizedIntensity / 10);
          break;
        default:
          // Default behavior - adjust outer strength
          this.outerStrength = this.baseOuterStrength * (normalizedIntensity / 10);
      }
    } else {
      // Default behavior - adjust outer strength and distance
      this.outerStrength = this.baseOuterStrength * (normalizedIntensity / 10);
      this.distance = this.baseDistance * (normalizedIntensity / 10);
    }
  }

  /**
   * Reset filter to original configuration
   */
  reset(): void {
    this.innerStrength = this.config.innerStrength || this.baseInnerStrength;
    this.outerStrength = this.config.outerStrength || this.baseOuterStrength;
    this.distance = this.config.distance || this.baseDistance;
    this.color = this.config.color || this.baseColor;
    this.quality = this.config.quality || this.baseQuality;
  }

  /**
   * Get current filter state
   *
   * @returns Current filter state including all glow properties
   *
   */
  getState(): Record<string, unknown> {
    return {
      innerStrength: this.innerStrength,
      outerStrength: this.outerStrength,
      distance: this.distance,
      color: this.color,
      quality: this.quality,
      enabled: this.enabled,
      intensity: this.config.intensity
    };
  }
}

/**
 * Create a Glow filter
 *
 * @param config - Filter configuration
 *
 * @returns FilterResult with filter instance and control functions
 *
 */
export function createFilter(config: GlowFilterConfig): FilterResult {
  const filter = new EnhancedGlowFilter(config);

  return {
    filter,
    config,
    updateIntensity: (intensity) => filter.updateIntensity(intensity),
    reset: () => filter.reset(),
    dispose: () => filter.destroy(),
    getState: () => filter.getState()
  };
} 