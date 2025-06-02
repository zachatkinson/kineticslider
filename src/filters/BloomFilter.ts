import { BloomFilter } from 'pixi-filters';
import type { BloomFilterConfig, FilterResult } from '../types/filters';

/**
 * Enhanced BloomFilter with intensity control
 * 
 * The BloomFilter applies a Gaussian blur to create a bloom effect.
 * The strength of the blur can be set for x- and y-axis separately.
 * 
 * @param config - Configuration for the Bloom filter
 *
 * @returns FilterResult with the filter instance and control functions
 * 
 * @example
 * ```typescript
 * const bloomFilter = createBloomFilter({
 *   type: 'bloom',
 *   enabled: true,
 *   intensity: createFilterIntensity(6),
 *   strength: 4,
 *   primaryProperty: 'strength'
 * });
 * ```
 */
export function createBloomFilter(config: BloomFilterConfig): FilterResult {
    // Create the filter with default constructor
    const filter = new BloomFilter();
    
    // Store original config for reset functionality
    const originalConfig = { ...config };
    
    // Set default values based on config or defaults
    const defaultStrength = config.strength ?? 2;
    
    // Apply initial configuration
    filter.strength = defaultStrength;
    if (config.strengthX !== undefined) {
        filter.strengthX = config.strengthX;
    }
    if (config.strengthY !== undefined) {
        filter.strengthY = config.strengthY;
    }
    
    /**
     * Update the filter's intensity based on the configuration
     * Maps intensity (0-10) to filter properties using formulas
     * 
     * @param intensity - New intensity value (0-10 scale)
     *
     */
    function updateIntensity(intensity: number): void {
        // Normalize intensity to a 0-10 scale
        const normalizedIntensity = Math.max(0, Math.min(10, intensity));

        // Determine which property to adjust based on config
        const primaryProperty = config.primaryProperty || 'strength';
        
        if (primaryProperty === 'strength') {
            // Map intensity (0-10) to strength (0-20) using 2x multiplier like main branch
            filter.strength = normalizedIntensity * 2;
        }
        else if (primaryProperty === 'strengthX') {
            // Map intensity (0-10) to strengthX (0-20)
            filter.strengthX = normalizedIntensity * 2;
        }
        else if (primaryProperty === 'strengthY') {
            // Map intensity (0-10) to strengthY (0-20)
            filter.strengthY = normalizedIntensity * 2;
        }
        else {
            // Default: adjust overall strength
            filter.strength = normalizedIntensity * 2;
        }
    }

    /**
     * Reset the filter to initial configuration values or defaults
     */
    function reset(): void {
        // Reset to configured values or defaults
        filter.strength = originalConfig.strength ?? 2;
        
        if (originalConfig.strengthX !== undefined) {
            filter.strengthX = originalConfig.strengthX;
        }
        if (originalConfig.strengthY !== undefined) {
            filter.strengthY = originalConfig.strengthY;
        }

        // If intensity was provided in config, apply that
        if (originalConfig.intensity !== undefined) {
            updateIntensity(originalConfig.intensity);
        }
    }

    /**
     * Release any WebGL resources used by this filter
     */
    function dispose(): void {
        filter.destroy();
    }

    // Set initial intensity if provided
    if (config.intensity !== undefined) {
        updateIntensity(config.intensity);
    }

    return { filter, updateIntensity, reset, dispose, config };
} 