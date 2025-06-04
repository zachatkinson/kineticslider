import { GlowFilter } from 'pixi-filters';
import type { ColorSource } from 'pixi.js';
import type { GlowFilterConfig, FilterResult } from '../types/filters';

/**
 * Enhanced Glow Filter
 *
 * Extends the PIXI GlowFilter with intensity control and configuration management.
 * Provides inner and outer glow effects with customizable properties.
 * 
 * Based on official PIXI GlowFilter documentation:
 * - alpha: number (default: 1)
 * - color: ColorSource (default: 0xFFFFFF)
 * - distance: number (no documented default)
 * - innerStrength: number (default: 0)
 * - knockout: boolean (default: false)
 * - outerStrength: number (default: 4)
 * - quality: number (default: 0.1)
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
 *   quality: 0.5,
 *   knockout: false,
 *   alpha: 1
 * });
 * ```
 */
class EnhancedGlowFilter extends GlowFilter {
  private baseAlpha: number;
  private baseColor: ColorSource;
  private baseDistance: number;
  private baseInnerStrength: number;
  private baseKnockout: boolean;
  private baseOuterStrength: number;
  private baseQuality: number;
  private config: GlowFilterConfig;

  constructor(config: GlowFilterConfig) {
    // Initialize with default or configured values
    const options: Record<string, unknown> = {};
    
    if (config.alpha !== undefined) options.alpha = config.alpha;
    if (config.color !== undefined) options.color = config.color;
    if (config.distance !== undefined) options.distance = config.distance;
    if (config.innerStrength !== undefined) options.innerStrength = config.innerStrength;
    if (config.knockout !== undefined) options.knockout = config.knockout;
    if (config.outerStrength !== undefined) options.outerStrength = config.outerStrength;
    if (config.quality !== undefined) options.quality = config.quality;
    
    super(options);
    
    this.config = config;
    this.enabled = config.enabled;
    
    // Store base values for intensity calculations (using PIXI defaults)
    this.baseAlpha = this.alpha !== undefined ? this.alpha : 1;
    this.baseColor = this.color !== undefined ? this.color : 0xffffff;
    this.baseDistance = this.distance !== undefined ? this.distance : 10; // Reasonable default since not documented
    this.baseInnerStrength = this.innerStrength !== undefined ? this.innerStrength : 0;
    this.baseKnockout = this.knockout !== undefined ? this.knockout : false;
    this.baseOuterStrength = this.outerStrength !== undefined ? this.outerStrength : 4;
    this.baseQuality = this.quality !== undefined ? this.quality : 0.1;
    
    // Only apply initial intensity if no specific values are provided
    const hasSpecificValues = config.alpha !== undefined ||
                             config.color !== undefined ||
                             config.distance !== undefined ||
                             config.innerStrength !== undefined || 
                             config.knockout !== undefined ||
                             config.outerStrength !== undefined || 
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
        case 'alpha':
          this.alpha = this.baseAlpha * (normalizedIntensity / 10);
          break;
        case 'innerStrength':
          this.innerStrength = this.baseInnerStrength * (normalizedIntensity / 5);
          break;
        case 'outerStrength':
          this.outerStrength = this.baseOuterStrength * (normalizedIntensity / 5);
          break;
        case 'distance':
          this.distance = this.baseDistance * (normalizedIntensity / 10);
          break;
        case 'quality':
          // Quality should be between 0 and 1, map intensity proportionally
          this.quality = Math.min(1, this.baseQuality + (normalizedIntensity / 10) * 0.5);
          break;
        default:
          // Default behavior - adjust outer strength
          this.outerStrength = this.baseOuterStrength * (normalizedIntensity / 5);
      }
    } else {
      // Default behavior - adjust outer strength and distance
      this.outerStrength = this.baseOuterStrength * (normalizedIntensity / 5);
      this.distance = this.baseDistance * (normalizedIntensity / 10);
    }
  }

  /**
   * Reset filter to original configuration
   */
  reset(): void {
    this.alpha = this.config.alpha !== undefined ? this.config.alpha : this.baseAlpha;
    this.color = this.config.color !== undefined ? this.config.color : this.baseColor;
    this.distance = this.config.distance !== undefined ? this.config.distance : this.baseDistance;
    this.innerStrength = this.config.innerStrength !== undefined ? this.config.innerStrength : this.baseInnerStrength;
    this.knockout = this.config.knockout !== undefined ? this.config.knockout : this.baseKnockout;
    this.outerStrength = this.config.outerStrength !== undefined ? this.config.outerStrength : this.baseOuterStrength;
    this.quality = this.config.quality !== undefined ? this.config.quality : this.baseQuality;
  }

  /**
   * Get current filter state
   *
   * @returns Current filter state including all glow properties
   *
   */
  getState(): Record<string, unknown> {
    return {
      alpha: this.alpha,
      color: this.color,
      distance: this.distance,
      innerStrength: this.innerStrength,
      knockout: this.knockout,
      outerStrength: this.outerStrength,
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