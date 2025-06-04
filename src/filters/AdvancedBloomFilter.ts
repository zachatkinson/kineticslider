import { AdvancedBloomFilter as PixiAdvancedBloomFilter } from 'pixi-filters';
import { Filter } from 'pixi.js';
import { createFilterIntensity, type FilterIntensity } from '../types/filters';
import { BaseFilter, type BaseFilterConfig } from './BaseFilter';
import type { PointData } from 'pixi.js';

/**
 * Configuration for the AdvancedBloom filter
 *
 * @example
 * ```typescript
 * const config: AdvancedBloomFilterConfig = {
 *   type: 'advancedBloom',
 *   bloomScale: 1.5,
 *   brightness: 1.2,
 *   threshold: 0.3,
 *   intensity: 6
 * };
 * ```
 */
export interface AdvancedBloomFilterConfig extends BaseFilterConfig {
  type: 'advancedBloom';
  bloomScale?: number;      // To adjust the strength of the bloom (default: 1.0)
  blur?: number;            // The strength of the Blur properties (default: 2)
  brightness?: number;      // The brightness of the bloom effect (default: 1.0)
  kernels?: number[];
  pixelSize?: PointData;    // The quality of the Blur Filter (default: 4)
  pixelSizeX?: number;      // The horizontal pixel size of the Kawase Blur filter (default: 1)
  pixelSizeY?: number;      // The vertical pixel size of the Kawase Blur filter (default: 1)
  primaryProperty?: 'bloomScale' | 'brightness' | 'blur' | 'threshold'; // Property controlled by intensity
  quality?: number;
  threshold?: number;       // Defines how bright a color needs to be extracted (0-1, default: 0.5)
}

/**
 * AdvancedBloom Filter Implementation
 *
 * Creates an advanced bloom effect with more control options than the standard BloomFilter.
 * Note: this filter is more GPU-intensive than the standard BloomFilter.
 *
 * @example
 * ```typescript
 * const filter = new AdvancedBloomFilter({ 
 *   type: 'advancedBloom', 
 *   bloomScale: 1.5, 
 *   threshold: 0.3 
 * });
 * filter.updateIntensity(7);
 * filter.reset();
 * ```
 */
export class AdvancedBloomFilter extends BaseFilter<AdvancedBloomFilterConfig> {
  /**
   * Constructor with enhanced configuration
   *
   * @param config - Filter configuration
   *
   */
  constructor(config: AdvancedBloomFilterConfig) {
    // Create options object with defaults for required properties
    const options = {
      bloomScale: config.bloomScale ?? 1,
      blur: config.blur ?? 2,
      brightness: config.brightness ?? 1,
      quality: config.quality ?? 4,
      threshold: config.threshold ?? 0.5,
    };

    // Add optional properties if specified
    if (config.pixelSize !== undefined) {
      (options as { pixelSize?: PointData }).pixelSize = config.pixelSize;
    }

    const pixiFilter = new PixiAdvancedBloomFilter(options);
    super(config, pixiFilter);
  }

  private get advancedBloomFilter(): PixiAdvancedBloomFilter {
    return this.pixiFilter as PixiAdvancedBloomFilter;
  }

  /**
   * Updates the filter intensity
   *
   * @param intensity - The intensity value (0-10)
   *
   */
  updateIntensity(intensity: FilterIntensity): void {
    const intensityValue = createFilterIntensity(intensity);
    
    // Determine which property to adjust based on config
    if (this.originalConfig.primaryProperty) {
      // Map intensity (0-10) to appropriate range for the specified property
      switch (this.originalConfig.primaryProperty) {
        case 'bloomScale':
          // bloomScale: Higher values = more intense brightness (0-2 is a good range)
          this.advancedBloomFilter.bloomScale = intensityValue / 5; // 0-10 -> 0-2
          break;
        case 'brightness':
          // brightness: Higher values = more blown-out (0-2 is a good range)
          this.advancedBloomFilter.brightness = intensityValue / 5; // 0-10 -> 0-2
          break;
        case 'blur':
          // blur: Strength of blur properties (1-10 is a good range)
          this.advancedBloomFilter.blur = Math.max(1, intensityValue / 2); // 0-10 -> 0-5 (min 1)
          break;
        case 'threshold':
          // threshold: How bright a color needs to be affected (0-1)
          this.advancedBloomFilter.threshold = intensityValue / 10; // 0-10 -> 0-1
          break;
        default:
          // Default behavior if primaryProperty is not recognized
          this.advancedBloomFilter.bloomScale = intensityValue / 5; // 0-10 -> 0-2
      }
    } else {
      // Default behavior if no primaryProperty is specified:
      // Adjust both bloomScale and brightness proportionally
      this.advancedBloomFilter.bloomScale = intensityValue / 5; // 0-10 -> 0-2
      this.advancedBloomFilter.brightness = Math.min(1.5, 0.5 + (intensityValue / 20)); // 0-10 -> 0.5-1.5
    }
  }

  /**
   * Resets the filter to its original configuration
   *
   * @returns void
   *
   */
  reset(): void {
    // Reset to configured values or defaults
    this.advancedBloomFilter.threshold = this.originalConfig.threshold ?? 0.5;
    this.advancedBloomFilter.bloomScale = this.originalConfig.bloomScale ?? 1;
    this.advancedBloomFilter.brightness = this.originalConfig.brightness ?? 1;
    this.advancedBloomFilter.blur = this.originalConfig.blur ?? 2;
    this.advancedBloomFilter.quality = this.originalConfig.quality ?? 4;

    // Reset pixel size if it was configured
    if (this.originalConfig.pixelSize) {
      this.advancedBloomFilter.pixelSize = this.originalConfig.pixelSize;
    } else if (this.originalConfig.pixelSizeX !== undefined || this.originalConfig.pixelSizeY !== undefined) {
      this.advancedBloomFilter.pixelSize = {
        x: this.originalConfig.pixelSizeX ?? 1,
        y: this.originalConfig.pixelSizeY ?? 1
      };
    }

    // Apply intensity if configured
    if (this.originalConfig.intensity !== undefined) {
      this.updateIntensity(createFilterIntensity(this.originalConfig.intensity));
    }
  }

  /**
   * Gets the current state of the filter
   *
   * @returns The current filter state
   *
   */
  getState(): Record<string, unknown> {
    return {
      ...super.getState(),
      bloomScale: this.advancedBloomFilter.bloomScale,
      brightness: this.advancedBloomFilter.brightness,
      blur: this.advancedBloomFilter.blur,
      threshold: this.advancedBloomFilter.threshold,
      quality: this.advancedBloomFilter.quality,
      pixelSize: this.advancedBloomFilter.pixelSize,
      configuredBloomScale: this.originalConfig.bloomScale,
      configuredBrightness: this.originalConfig.brightness,
      configuredThreshold: this.originalConfig.threshold
    };
  }
}

/**
 * Factory function for backward compatibility
 *
 * @param config - The filter configuration
 *
 * @returns The filter instance with utility methods
 *
 */
export function createAdvancedBloomFilter(config: AdvancedBloomFilterConfig): {
  filter: Filter;
  updateIntensity: (intensity: number) => void;
  reset: () => void;
  dispose: () => void;
} {
  const filterInstance = new AdvancedBloomFilter(config);
  
  return {
    filter: filterInstance.filter,
    updateIntensity: (intensity: number) => filterInstance.updateIntensity(createFilterIntensity(intensity)),
    reset: () => filterInstance.reset(),
    dispose: () => filterInstance.dispose()
  };
} 