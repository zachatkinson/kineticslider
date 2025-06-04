import { KawaseBlurFilter as PixiKawaseBlurFilter } from 'pixi-filters';
import type { KawaseBlurFilterConfig, FilterResult } from '../types/filters';

/**
 * Enhanced Kawase Blur Filter
 *
 * Extends the PIXI KawaseBlurFilter with intensity control and configuration management.
 * A much faster blur than Gaussian blur, but more complicated to use.
 * 
 * Based on official PIXI KawaseBlurFilter documentation:
 * - clamp: boolean (default: false) - Get the if the filter is clamped
 * - kernels: number[] (default: [0]) - The kernel size of the blur filter, for advanced usage
 * - pixelSize: PointData (default: {x:1,y:1}) - The size of the pixels. Large size is blurrier. For advanced usage.
 * - pixelSizeX: number (default: 1) - The size of the pixels on the `x` axis. Large size is blurrier. For advanced usage.
 * - pixelSizeY: number (default: 1) - The size of the pixels on the `y` axis. Large size is blurrier. For advanced usage.
 * - quality: number (default: 3) - The quality of the filter, integer greater than `1`.
 * - strength: number (default: 4) - The amount of blur, value greater than `0`.
 *
 * @example
 * ```typescript
 * const filter = createFilter({
 *   type: 'kawaseBlur',
 *   enabled: true,
 *   intensity: createFilterIntensity(6),
 *   strength: 8,        // Amount of blur
 *   quality: 4,         // Number of passes  
 *   clamp: true,        // Clamp filter edges
 *   pixelSize: {x: 2, y: 2},  // Pixel size for blur
 *   pixelSizeX: 2,      // Alternative X pixel size
 *   pixelSizeY: 2       // Alternative Y pixel size
 * });
 * ```
 */
class EnhancedKawaseBlurFilter extends PixiKawaseBlurFilter {
  private config: KawaseBlurFilterConfig;

  constructor(config: KawaseBlurFilterConfig) {
    // Initialize with PIXI defaults or config values
    // Note: clamp is passed to constructor but becomes read-only after
    super(
      config.strength ?? 4,
      config.quality ?? 3,
      config.clamp ?? false
    );
    
    this.config = config;
    this.enabled = config.enabled;
    
    // Set additional writable properties
    if (config.kernels !== undefined) {
      this.kernels = config.kernels;
    }
    
    // Handle pixelSize properties - prioritize individual X/Y over PointData
    if (config.pixelSizeX !== undefined || config.pixelSizeY !== undefined) {
      this.pixelSize = {
        x: config.pixelSizeX ?? 1,
        y: config.pixelSizeY ?? 1
      };
    } else if (config.pixelSize !== undefined) {
      this.pixelSize = config.pixelSize;
    }
    
    // Apply initial intensity if provided
    if (config.intensity !== undefined) {
      this.updateIntensity(config.intensity);
    }
  }

  /**
   * Update filter intensity
   *
   * Controls the primary property specified in config, or defaults to strength adjustment.
   *
   * @param intensity - Intensity value (0-10)
   *
   */
  updateIntensity(intensity: number): void {
    const normalizedIntensity = Math.max(0, Math.min(10, intensity));
    
    // Determine which property to adjust based on config
    if (this.config.primaryProperty) {
      switch (this.config.primaryProperty) {
        case 'strength':
          // strength: Amount of blur (0-20 for good range)
          const baseStrength = this.config.strength ?? 4;
          this.strength = baseStrength + (normalizedIntensity * 1.6); // Scale up from base
          break;
        case 'quality':
          // quality: Number of passes (1-10 range)
          const baseQuality = this.config.quality ?? 3;
          this.quality = Math.max(1, Math.round(baseQuality + normalizedIntensity * 0.7)); // 0-10 -> base to base+7
          break;
        case 'pixelSizeX':
          // pixelSizeX: Scale X pixel size
          const basePixelSizeX = this.config.pixelSizeX ?? this.config.pixelSize?.x ?? 1;
          const scaleX = 1 + (normalizedIntensity / 10) * 4; // 0-10 -> 1-5 scale
          this.pixelSize = {
            x: basePixelSizeX * scaleX,
            y: this.pixelSize.y
          };
          break;
        case 'pixelSizeY':
          // pixelSizeY: Scale Y pixel size
          const basePixelSizeY = this.config.pixelSizeY ?? this.config.pixelSize?.y ?? 1;
          const scaleY = 1 + (normalizedIntensity / 10) * 4; // 0-10 -> 1-5 scale
          this.pixelSize = {
            x: this.pixelSize.x,
            y: basePixelSizeY * scaleY
          };
          break;
        default:
          // Default behavior: adjust strength
          const defaultStrength = this.config.strength ?? 4;
          this.strength = defaultStrength + (normalizedIntensity * 1.6);
      }
    } else {
      // Default behavior: adjust strength proportionally
      const baseStrength = this.config.strength ?? 4;
      this.strength = baseStrength + (normalizedIntensity * 1.6); // Scale up from base
    }
  }

  /**
   * Reset filter to original configuration
   */
  reset(): void {
    // Reset writable properties to configured values or PIXI defaults
    this.kernels = this.config.kernels ?? [0];
    this.quality = this.config.quality ?? 3;
    this.strength = this.config.strength ?? 4;
    this.enabled = this.config.enabled;

    // Handle pixelSize properties - prioritize individual X/Y over PointData
    if (this.config.pixelSizeX !== undefined || this.config.pixelSizeY !== undefined) {
      this.pixelSize = {
        x: this.config.pixelSizeX ?? 1,
        y: this.config.pixelSizeY ?? 1
      };
    } else {
      this.pixelSize = this.config.pixelSize ?? { x: 1, y: 1 };
    }

    // Apply intensity if configured
    if (this.config.intensity !== undefined) {
      this.updateIntensity(this.config.intensity);
    }
  }

  /**
   * Get current filter state
   *
   * @returns Current filter state including all Kawase blur properties
   *
   */
  getState(): Record<string, unknown> {
    return {
      enabled: this.enabled,
      clamp: this.clamp,           // Read-only property
      kernels: this.kernels,
      pixelSize: this.pixelSize,
      pixelSizeX: this.pixelSize.x,
      pixelSizeY: this.pixelSize.y,
      quality: this.quality,
      strength: this.strength,
      // Config tracking
      configuredClamp: this.config.clamp,
      configuredKernels: this.config.kernels,
      configuredPixelSize: this.config.pixelSize,
      configuredPixelSizeX: this.config.pixelSizeX,
      configuredPixelSizeY: this.config.pixelSizeY,
      configuredQuality: this.config.quality,
      configuredStrength: this.config.strength,
      primaryProperty: this.config.primaryProperty,
      intensity: this.config.intensity
    };
  }
}

/**
 * Create a Kawase Blur filter
 *
 * @param config - Filter configuration
 *
 * @returns FilterResult with filter instance and control functions
 *
 */
export function createFilter(config: KawaseBlurFilterConfig): FilterResult {
  const filter = new EnhancedKawaseBlurFilter(config);

  return {
    filter,
    config,
    updateIntensity: (intensity) => filter.updateIntensity(intensity),
    reset: () => filter.reset(),
    dispose: () => filter.destroy(),
    getState: () => filter.getState()
  };
} 