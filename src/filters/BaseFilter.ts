/**
 * Base Filter Class
 * 
 * Abstract base class that all filter implementations should extend.
 * Provides common functionality and enforces consistent interface.
 */
import { Filter } from 'pixi.js';
import type { FilterIntensity } from '../types/filters';
import { createFilterIntensity } from '../types/filters';

/**
 * Base configuration for all filters
 *
 * @example
 * ```typescript
 * interface MyFilterConfig extends BaseFilterConfig {
 *   type: 'myFilter';
 *   customProperty?: number;
 * }
 * ```
 */
export interface BaseFilterConfig {
  type: string;
  enabled?: boolean;
  intensity?: number;
}

/**
 * Abstract base class for all filter implementations
 *
 * Provides common functionality for filter management, intensity control,
 * and lifecycle management using the PIXI.js filter system.
 *
 * @example
 * ```typescript
 * class MyFilter extends BaseFilter<MyFilterConfig> {
 *   constructor(config: MyFilterConfig) {
 *     const pixiFilter = new PIXI.MyFilter();
 *     super(config, pixiFilter);
 *   }
 * }
 * ```
 */
export abstract class BaseFilter<T extends BaseFilterConfig> {
  protected readonly originalConfig: T;
  protected readonly pixiFilter: Filter;

  /**
   *
   */
  constructor(config: T, pixiFilter: Filter) {
    this.originalConfig = { ...config };
    this.pixiFilter = pixiFilter;
    this.initialize();
  }

  /**
   * Gets the underlying PIXI filter
   *
   * @returns The PIXI filter instance
   *
   */
  get filter(): Filter {
    return this.pixiFilter;
  }

  /**
   * Gets the filter configuration
   *
   * @returns The original filter configuration
   *
   */
  get config(): T {
    return { ...this.originalConfig };
  }

  /**
   * Initializes the filter with default settings
   * Subclasses can override this to set up initial filter state
   */
  protected initialize(): void {
    // Set initial enabled state
    const enabled = this.originalConfig.enabled ?? true;
    if ('enabled' in this.pixiFilter) {
      (this.pixiFilter as Filter & { enabled: boolean }).enabled = enabled;
    }

    // Apply initial intensity if provided
    if (this.originalConfig.intensity !== undefined) {
      this.updateIntensity(createFilterIntensity(this.originalConfig.intensity));
    }
  }

  /**
   * Updates the filter intensity
   * Must be implemented by subclasses
   *
   * @param intensity - The intensity value to apply
   *
   */
  abstract updateIntensity(intensity: FilterIntensity): void;

  /**
   * Resets the filter to its original configuration
   * Must be implemented by subclasses
   *
   * @returns void
   *
   */
  abstract reset(): void;

  /**
   * Gets the current state of the filter
   * Can be overridden by subclasses to provide additional state information
   *
   * @returns The current filter state
   *
   */
  getState(): Record<string, unknown> {
    return {
      type: this.originalConfig.type,
      enabled: this.originalConfig.enabled,
      intensity: this.originalConfig.intensity,
      filterEnabled: 'enabled' in this.pixiFilter ? 
        (this.pixiFilter as Filter & { enabled: boolean }).enabled : 
        true
    };
  }

  /**
   * Disposes of the filter and cleans up resources
   * Calls the destroy method on the underlying PIXI filter if available
   */
  dispose(): void {
    if (this.pixiFilter && typeof (this.pixiFilter as Filter & { destroy?: () => void }).destroy === 'function') {
      (this.pixiFilter as Filter & { destroy: () => void }).destroy();
    }
  }

  /**
   * Helper method to safely set filter properties
   *
   * @param property - The filter property to set
   *
   * @param value - The value to set
   *
   * @returns void
   *
   */
  protected setFilterProperty<K extends keyof Filter>(
    property: K, 
    value: Filter[K]
  ): void {
    if (property in this.pixiFilter) {
      (this.pixiFilter as Record<K, Filter[K]>)[property] = value;
    }
  }

  /**
   * Helper method to safely get filter properties
   *
   * @param property - The filter property to get
   *
   * @returns The property value if it exists, undefined otherwise
   *
   */
  protected getFilterProperty<K extends keyof Filter>(property: K): Filter[K] | undefined {
    return property in this.pixiFilter ? (this.pixiFilter as Record<K, Filter[K]>)[property] : undefined;
  }
} 