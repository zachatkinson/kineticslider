import { BloomFilter as PixiBloomFilter } from 'pixi-filters';
import { createFilterIntensity, type FilterIntensity } from '../types/filters';
import { BaseFilter, type BaseFilterConfig } from './BaseFilter';
import type { PointData } from 'pixi.js';

/**
 * Configuration for the Bloom filter
 *
 * @example
 * ```typescript
 * const config: BloomFilterConfig = {
 *   type: 'bloom',
 *   strengthX: 4,
 *   strengthY: 6,
 *   intensity: 5
 * };
 * ```
 */
export interface BloomFilterConfig extends BaseFilterConfig {
  type: 'bloom';
  strength?: PointData | number; // Sets both strengthX and strengthY as PointData or number
  strengthX?: number;       // X-axis blur strength (default: 2)
  strengthY?: number;       // Y-axis blur strength (default: 2)
  quality?: number;         // Quality of the blur (default: 4)
  resolution?: number;      // Resolution of the blur (default: PIXI.settings.FILTER_RESOLUTION)
  kernelSize?: number;      // Kernel size (5, 7, 9, 11, 13, 15) (default: 5)
  primaryProperty?: 'strength' | 'strengthX' | 'strengthY'; // Property controlled by intensity
}

/**
 * Bloom Filter Implementation
 *
 * Creates a bloom effect using PIXI.js BloomFilter.
 * The strength of the blur can be set for x- and y-axis separately.
 *
 * @example
 * ```typescript
 * const filter = new BloomFilter({ 
 *   type: 'bloom', 
 *   strengthX: 4, 
 *   strengthY: 6 
 * });
 * filter.updateIntensity(7);
 * filter.reset();
 * ```
 */
export class BloomFilter extends BaseFilter<BloomFilterConfig> {
  /**
   *
   */
  constructor(config: BloomFilterConfig) {
    // Create the PIXI BloomFilter with defaults, we'll set the actual values in initialize()
    const pixiFilter = new PixiBloomFilter();
    super(config, pixiFilter);
  }

  private get bloomFilter(): PixiBloomFilter {
    return this.pixiFilter as PixiBloomFilter;
  }

  protected initialize(): void {
    // Set strength values based on configuration priority:
    // 1. PointData strength takes precedence
    // 2. Individual strengthX/strengthY 
    // 3. Defaults

    if (this.originalConfig.strength !== undefined) {
      if (typeof this.originalConfig.strength === 'object') {
        // PointData - set individual values
        this.bloomFilter.strengthX = this.originalConfig.strength.x;
        this.bloomFilter.strengthY = this.originalConfig.strength.y;
      } else {
        // number - set both to same value
        this.bloomFilter.strengthX = this.originalConfig.strength;
        this.bloomFilter.strengthY = this.originalConfig.strength;
      }
    } else {
      // Set individual components or defaults
      this.bloomFilter.strengthX = this.originalConfig.strengthX ?? 2;
      this.bloomFilter.strengthY = this.originalConfig.strengthY ?? 2;
    }
    
    // Call parent initialize to handle intensity
    super.initialize();
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
      switch (this.originalConfig.primaryProperty) {
        case 'strength':
          // Map intensity (0-10) to strength (multiply by 2 for default scaling)
          const strengthValue = intensityValue * 2;
          // Setting both strengthX and strengthY to same value should make strength a number
          this.bloomFilter.strengthX = strengthValue;
          this.bloomFilter.strengthY = strengthValue;
          break;
        case 'strengthX':
          // Map intensity (0-10) to strengthX
          this.bloomFilter.strengthX = intensityValue * 2;
          break;
        case 'strengthY':
          // Map intensity (0-10) to strengthY
          this.bloomFilter.strengthY = intensityValue * 2;
          break;
        default:
          // Default: adjust overall strength
          const defaultValue = intensityValue * 2;
          this.bloomFilter.strengthX = defaultValue;
          this.bloomFilter.strengthY = defaultValue;
      }
    } else {
      // Default behavior: scale overall strength proportionally
      // When no primaryProperty is specified, scale based on intensity directly
      const strengthValue = intensityValue * 2;
      this.bloomFilter.strengthX = strengthValue;
      this.bloomFilter.strengthY = strengthValue;
    }
  }

  /**
   * Resets the filter to its original configuration
   *
   * @returns void
   *
   */
  reset(): void {
    // Use the same logic as initialize() to set strength values
    if (this.originalConfig.strength !== undefined) {
      if (typeof this.originalConfig.strength === 'object') {
        // PointData - set individual values
        this.bloomFilter.strengthX = this.originalConfig.strength.x;
        this.bloomFilter.strengthY = this.originalConfig.strength.y;
      } else {
        // number - set both to same value
        this.bloomFilter.strengthX = this.originalConfig.strength;
        this.bloomFilter.strengthY = this.originalConfig.strength;
      }
    } else {
      // Set individual components or defaults
      this.bloomFilter.strengthX = this.originalConfig.strengthX ?? 2;
      this.bloomFilter.strengthY = this.originalConfig.strengthY ?? 2;
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
    // Get strength as number if both X and Y are equal, otherwise as PointData
    let strengthValue: number | PointData;
    if (this.bloomFilter.strengthX === this.bloomFilter.strengthY) {
      strengthValue = this.bloomFilter.strengthX;
    } else {
      strengthValue = {
        x: this.bloomFilter.strengthX,
        y: this.bloomFilter.strengthY
      };
    }

    return {
      ...super.getState(),
      strength: strengthValue,
      strengthX: this.bloomFilter.strengthX,
      strengthY: this.bloomFilter.strengthY,
      configuredStrength: this.originalConfig.strength,
      configuredStrengthX: this.originalConfig.strengthX,
      configuredStrengthY: this.originalConfig.strengthY
    };
  }
} 