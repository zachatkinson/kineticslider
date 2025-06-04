import { AsciiFilter as PixiAsciiFilter } from 'pixi-filters';
import { Filter } from 'pixi.js';
import { createFilterIntensity, type FilterIntensity } from '../types/filters';
import { BaseFilter, type BaseFilterConfig } from './BaseFilter';
import type { ColorSource } from 'pixi.js';

/**
 * Configuration for the Ascii filter
 *
 * @example
 * ```typescript
 * const config: AsciiFilterConfig = {
 *   type: 'ascii',
 *   size: 8,
 *   color: 0x00ff00,
 *   replaceColor: true,
 *   intensity: 5
 * };
 * ```
 */
export interface AsciiFilterConfig extends BaseFilterConfig {
  type: 'ascii';
  color?: ColorSource;        // The resulting color of the ascii characters (RGB array or hex)
  replaceColor?: boolean | undefined;     // Whether to replace source colors with the provided color
  size?: number;              // The pixel size used by the filter (default: 8)
  primaryProperty?: 'size';   // Property controlled by intensity
}

/**
 * Ascii Filter Implementation
 *
 * Creates an ASCII art effect that renders the image as ASCII characters.
 *
 * @example
 * ```typescript
 * const filter = new AsciiFilter({ 
 *   type: 'ascii', 
 *   size: 12, 
 *   color: 0x00ff00 
 * });
 * filter.updateIntensity(7);
 * filter.reset();
 * ```
 */
export class AsciiFilter extends BaseFilter<AsciiFilterConfig> {
  private pendingTimeout: number | null = null;
  private isFirstActivation = true;

  /**
   *
   */
  constructor(config: AsciiFilterConfig) {
    const pixiFilter = new PixiAsciiFilter();
    super(config, pixiFilter);
  }

  private get asciiFilter(): PixiAsciiFilter {
    return this.pixiFilter as PixiAsciiFilter;
  }

  protected initialize(): void {
    // Set initial properties
    this.asciiFilter.size = this.originalConfig.size ?? 8;

    if (this.originalConfig.color !== undefined) {
      this.asciiFilter.color = this.originalConfig.color;
    }

    // Start with replaceColor set to false for proper initial rendering
    this.asciiFilter.replaceColor = false;

    // Call parent initialize to handle intensity
    super.initialize();
  }

  /**
   * Force a complete refresh of the filter to ensure proper state
   *
   * @param intensity
   *
   */
  private forceRefresh(intensity: number): void {
    // Clear any pending timeout to avoid race conditions
    if (this.pendingTimeout !== null) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }

    // Calculate size based on intensity
    const intensityValue = createFilterIntensity(intensity);
    this.asciiFilter.size = Math.max(2, Math.round(2 + (intensityValue * 1.8)));

    // Ensure color is correct
    if (this.originalConfig.color !== undefined) {
      this.asciiFilter.color = this.originalConfig.color;
    }

    // Handle replaceColor with special timing for proper rendering
    if (this.originalConfig.replaceColor === true) {
      this.asciiFilter.replaceColor = false;

      // Set timeout to apply replaceColor after the next render
      this.pendingTimeout = window.setTimeout(() => {
        this.asciiFilter.replaceColor = true;
        this.pendingTimeout = null;
      }, 50);
    } else if (this.originalConfig.replaceColor !== undefined) {
      this.asciiFilter.replaceColor = this.originalConfig.replaceColor;
    }
  }

  /**
   * Updates the filter intensity
   *
   * @param intensity - The intensity value (0-10)
   *
   */
  updateIntensity(intensity: FilterIntensity): void {
    // For first activation, force a complete refresh
    if (this.isFirstActivation) {
      this.forceRefresh(intensity);
      this.isFirstActivation = false;
    } else {
      // Standard intensity update
      const intensityValue = createFilterIntensity(intensity);
      this.asciiFilter.size = Math.max(2, Math.round(2 + (intensityValue * 1.8)));

      // Ensure color is maintained
      if (this.originalConfig.color !== undefined) {
        this.asciiFilter.color = this.originalConfig.color;
      }

      // Ensure replaceColor is maintained
      if (this.originalConfig.replaceColor !== undefined) {
        this.asciiFilter.replaceColor = this.originalConfig.replaceColor;
      }
    }
  }

  /**
   * Resets the filter to its original configuration
   *
   * @returns void
   *
   */
  reset(): void {
    // Clear any pending timeout
    if (this.pendingTimeout !== null) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }

    // Reset properties
    this.asciiFilter.size = this.originalConfig.size ?? 8;

    if (this.originalConfig.color !== undefined) {
      this.asciiFilter.color = this.originalConfig.color;
    } else {
      this.asciiFilter.color = 0xffffff;
    }

    // For replaceColor, follow our special pattern
    if (this.originalConfig.replaceColor === true) {
      this.isFirstActivation = true; // Force the refresh process on next update
      this.asciiFilter.replaceColor = false; // Start with false
    } else if (this.originalConfig.replaceColor !== undefined) {
      this.asciiFilter.replaceColor = this.originalConfig.replaceColor;
    } else {
      this.asciiFilter.replaceColor = false;
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
      size: this.asciiFilter.size,
      color: this.asciiFilter.color,
      replaceColor: this.asciiFilter.replaceColor,
      configuredSize: this.originalConfig.size,
      configuredColor: this.originalConfig.color,
      configuredReplaceColor: this.originalConfig.replaceColor
    };
  }

  /**
   * Disposes of the filter and cleans up resources
   */
  dispose(): void {
    // Clear any pending timeout
    if (this.pendingTimeout !== null) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }

    super.dispose();
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
export function createAsciiFilter(config: AsciiFilterConfig): {
  filter: Filter;
  updateIntensity: (intensity: number) => void;
  reset: () => void;
  dispose: () => void;
} {
  const filterInstance = new AsciiFilter(config);
  
  return {
    filter: filterInstance.filter,
    updateIntensity: (intensity: number) => filterInstance.updateIntensity(createFilterIntensity(intensity)),
    reset: () => filterInstance.reset(),
    dispose: () => filterInstance.dispose()
  };
} 