import { DropShadowFilter as PixiDropShadowFilter } from 'pixi-filters';
import { Filter } from 'pixi.js';
import { createFilterIntensity, type FilterIntensity } from '../types/filters';
import { BaseFilter, type BaseFilterConfig } from './BaseFilter';

// Type for offset configuration
type OffsetConfig = number | { x: number; y: number };

/**
 * Configuration for the DropShadow filter
 *
 * @example
 * ```typescript
 * const config: DropShadowFilterConfig = {
 *   type: 'dropShadow',
 *   blur: 4,
 *   color: 0x000000,
 *   offset: { x: 3, y: 3 },
 *   intensity: 5
 * };
 * ```
 */
export interface DropShadowFilterConfig extends BaseFilterConfig {
    type: 'dropShadow';
    alpha?: number;
    blur?: number;
    color?: number;
    offsetX?: number;
    offsetY?: number;
    offset?: OffsetConfig;
    pixelSize?: number;
    pixelSizeX?: number;
    pixelSizeY?: number;
    quality?: number;
    shadowOnly?: boolean;
}

/**
 * DropShadow Filter Implementation
 *
 * Creates a drop shadow effect behind the display object using pixi-filters.
 *
 * @example
 * ```typescript
 * const filter = new DropShadowFilter({ 
 *   type: 'dropShadow', 
 *   blur: 6,
 *   color: 0x333333,
 *   offset: 5
 * });
 * filter.updateIntensity(7);
 * filter.reset();
 * ```
 */
export class DropShadowFilter extends BaseFilter<DropShadowFilterConfig> {
    /**
     *
     */
    constructor(config: DropShadowFilterConfig) {
        // Convert offset configuration to offsetX/Y
        const options: Record<string, unknown> = { ...config };
        if (config.offset !== undefined) {
            if (typeof config.offset === 'number') {
                options.offsetX = config.offset;
                options.offsetY = config.offset;
            } else {
                options.offsetX = config.offset.x;
                options.offsetY = config.offset.y;
            }
            delete options.offset;
        }
        
        // Remove our custom properties before passing to PIXI
        delete options.type;
        delete options.enabled;
        delete options.intensity;
        
        const pixiFilter = new PixiDropShadowFilter(options);
        super(config, pixiFilter);
    }

    private get dropShadowFilter(): PixiDropShadowFilter {
        return this.pixiFilter as PixiDropShadowFilter;
    }

    /**
     * Updates the filter intensity
     *
     * @param intensity - The intensity value (0-10)
     *
     */
    updateIntensity(intensity: FilterIntensity): void {
        const intensityValue = createFilterIntensity(intensity);
        
        // Calculate blur and offset values based on configuration
        const configuredBlur = this.originalConfig.blur ?? 2;
        const configuredOffsetX = this.originalConfig.offsetX ?? this.getOffsetXFromConfig() ?? 2;
        const configuredOffsetY = this.originalConfig.offsetY ?? this.getOffsetYFromConfig() ?? 2;
        
        // Apply intensity scaling
        this.dropShadowFilter.blur = configuredBlur + (intensityValue * 1.8);
        this.dropShadowFilter.offsetX = configuredOffsetX + (intensityValue * 1.0);
        this.dropShadowFilter.offsetY = configuredOffsetY + (intensityValue * 1.0);
        
        // Scale alpha if not explicitly configured
        if (this.originalConfig.alpha === undefined) {
            this.dropShadowFilter.alpha = 0.5 + (intensityValue / 20); // Scale from 0.5 to 1.0
        }
    }

    /**
     * Helper method to extract offsetX from offset configuration
     *
     * @returns The offsetX value from offset config or undefined
     *
     */
    private getOffsetXFromConfig(): number | undefined {
        if (this.originalConfig.offset === undefined) return undefined;
        if (typeof this.originalConfig.offset === 'number') return this.originalConfig.offset;
        return this.originalConfig.offset.x;
    }

    /**
     * Helper method to extract offsetY from offset configuration
     *
     * @returns The offsetY value from offset config or undefined
     *
     */
    private getOffsetYFromConfig(): number | undefined {
        if (this.originalConfig.offset === undefined) return undefined;
        if (typeof this.originalConfig.offset === 'number') return this.originalConfig.offset;
        return this.originalConfig.offset.y;
    }

    /**
     * Resets the filter to its original configuration
     *
     * @returns void
     *
     */
    reset(): void {
        // Reset to configured values or defaults
        const configuredBlur = this.originalConfig.blur ?? 2;
        const configuredOffsetX = this.originalConfig.offsetX ?? this.getOffsetXFromConfig() ?? 2;
        const configuredOffsetY = this.originalConfig.offsetY ?? this.getOffsetYFromConfig() ?? 2;
        const configuredAlpha = this.originalConfig.alpha ?? 0.5;
        
        this.dropShadowFilter.blur = configuredBlur;
        this.dropShadowFilter.offsetX = configuredOffsetX;
        this.dropShadowFilter.offsetY = configuredOffsetY;
        this.dropShadowFilter.alpha = configuredAlpha;
        
        // Copy other configured properties
        if (this.originalConfig.color !== undefined) {
            this.dropShadowFilter.color = this.originalConfig.color;
        }
        
        // Apply intensity if configured AND shadow-specific properties are configured
        // Only apply intensity if there are actual shadow properties, not just color/enabled
        const hasShadowConfig = this.originalConfig.blur !== undefined || 
                               this.originalConfig.offsetX !== undefined || 
                               this.originalConfig.offsetY !== undefined ||
                               this.originalConfig.offset !== undefined ||
                               this.originalConfig.alpha !== undefined;

        if (this.originalConfig.intensity !== undefined && hasShadowConfig) {
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
            alpha: this.dropShadowFilter.alpha,
            blur: this.dropShadowFilter.blur,
            color: this.dropShadowFilter.color,
            offsetX: this.dropShadowFilter.offsetX,
            offsetY: this.dropShadowFilter.offsetY,
            configuredAlpha: this.originalConfig.alpha,
            configuredBlur: this.originalConfig.blur,
            configuredColor: this.originalConfig.color,
            configuredOffsetX: this.originalConfig.offsetX,
            configuredOffsetY: this.originalConfig.offsetY,
            configuredOffset: this.originalConfig.offset
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
export function createDropShadowFilter(config: DropShadowFilterConfig): {
    filter: Filter;
    updateIntensity: (intensity: number) => void;
    reset: () => void;
    dispose: () => void;
} {
    const filterInstance = new DropShadowFilter(config);
    
    return {
        filter: filterInstance.filter,
        updateIntensity: (intensity: number) => filterInstance.updateIntensity(createFilterIntensity(intensity)),
        reset: () => filterInstance.reset(),
        dispose: () => filterInstance.dispose()
    };
} 