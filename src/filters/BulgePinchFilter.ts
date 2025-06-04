import { BulgePinchFilter as PixiBulgePinchFilter } from 'pixi-filters';
import type { BulgePinchFilterConfig, FilterResult } from '../types/filters';

/**
 * Enhanced BulgePinchFilter with intensity control
 * 
 * The BulgePinchFilter applies a bulge or pinch distortion effect from a center point.
 * Positive strength values create a bulge, negative values create a pinch effect.
 * 
 * @param config - Configuration for the BulgePinch filter
 *
 * @returns FilterResult with the filter instance and control functions
 * 
 * @example
 * ```typescript
 * const bulgePinchFilter = createBulgePinchFilter({
 *   type: 'bulgePinch',
 *   enabled: true,
 *   intensity: 6,
 *   strength: 1,
 *   radius: 100,
 *   primaryProperty: 'strength'
 * });
 * ```
 */
export class BulgePinchFilter extends PixiBulgePinchFilter {
    public readonly config: BulgePinchFilterConfig;
    private readonly baseValues: {
        strength: number;
        radius: number;
        centerX: number;
        centerY: number;
    };

    /**
     *
     */
    constructor(config: BulgePinchFilterConfig) {
        super();
        this.config = config;

        // Set defaults matching PIXI documentation
        const strength = config.strength ?? 1;  // PIXI default is 1
        const radius = config.radius ?? 100;    // PIXI default is 100
        const centerX = config.centerX ?? config.center?.x ?? 0.5;  // PIXI center default is {x:0.5, y:0.5}
        const centerY = config.centerY ?? config.center?.y ?? 0.5;  // PIXI center default is {x:0.5, y:0.5}

        // Store base values for reset
        this.baseValues = { strength, radius, centerX, centerY };

        // Apply initial configuration
        this.strength = strength;
        this.radius = radius;
        this.center = [centerX, centerY];

        // Set initial intensity
        this.updateIntensity(config.intensity);
    }

    /**
     * Update the filter's intensity based on the configuration
     * 
     * @param intensity - New intensity value (0-10 scale)
     *
     */
    public updateIntensity(intensity: number): void {
        // Normalize intensity to a 0-10 scale
        const normalizedIntensity = Math.max(0, Math.min(10, intensity));

        // Determine which property to adjust based on config
        if (this.config.primaryProperty === 'strength') {
            // Map intensity (0-10) to strength (-1 to 1)
            this.strength = (normalizedIntensity - 5) / 5; // Creates range from -1 to 1
        }
        else if (this.config.primaryProperty === 'radius') {
            // Map intensity (0-10) to radius (20-200)
            this.radius = 20 + (normalizedIntensity * 18); // Creates range from 20 to 200
        }
        else if (this.config.primaryProperty === 'centerX') {
            // Map intensity (0-10) to centerX (0-1)
            this.centerX = normalizedIntensity / 10;
        }
        else if (this.config.primaryProperty === 'centerY') {
            // Map intensity (0-10) to centerY (0-1)
            this.centerY = normalizedIntensity / 10;
        }
        else {
            // Default: adjust strength
            this.strength = (normalizedIntensity - 5) / 5; // Creates range from -1 to 1
        }
    }

    /**
     * Reset the filter to initial configuration values or defaults
     */
    public reset(): void {
        // Reset to configured values or defaults
        this.strength = this.baseValues.strength;
        this.radius = this.baseValues.radius;
        this.center = [this.baseValues.centerX, this.baseValues.centerY];

        // If intensity was provided in config, apply that
        if (this.config.intensity !== undefined) {
            this.updateIntensity(this.config.intensity);
        }
    }

    /**
     * Release any WebGL resources used by this filter
     */
    public dispose(): void {
        this.destroy();
    }
}

/**
 * Create a BulgePinchFilter with the specified configuration
 * 
 * @param config - Configuration for the BulgePinch filter
 *
 * @returns FilterResult with the filter instance and control functions
 *
 */
export function createBulgePinchFilter(config: BulgePinchFilterConfig): FilterResult {
    const filter = new BulgePinchFilter(config);
    
    return {
        filter,
        updateIntensity: (intensity: number) => filter.updateIntensity(intensity),
        reset: () => filter.reset(),
        dispose: () => filter.dispose(),
        config
    };
} 