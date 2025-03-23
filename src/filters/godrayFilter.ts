import { GodrayFilter } from 'pixi-filters';
import { type GodrayFilterConfig, type FilterResult } from './types';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

/**
 * Creates a Godray filter that applies light ray effects
 *
 * The GodrayFilter creates crepuscular rays (light shafts) extending from a bright source
 * which can be animated and customized for intensity, direction, and density.
 * Uses shader pooling for better performance.
 *
 * @param config - Configuration for the Godray filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createGodrayFilter(config: GodrayFilterConfig): FilterResult {
    // Get shader manager instance
    const shaderManager = ShaderResourceManager.getInstance();

    // Create options object for the filter
    const options: any = {};

    // Apply configuration values if provided, otherwise use defaults
    if (config.alpha !== undefined) options.alpha = config.alpha;
    if (config.angle !== undefined) options.angle = config.angle;
    if (config.center !== undefined) options.center = config.center;
    if (config.centerX !== undefined) options.centerX = config.centerX;
    if (config.centerY !== undefined) options.centerY = config.centerY;
    if (config.gain !== undefined) options.gain = config.gain;
    if (config.lacunarity !== undefined) options.lacunarity = config.lacunarity;
    if (config.parallel !== undefined) options.parallel = config.parallel;
    if (config.time !== undefined) options.time = config.time;

    // Create a unique key for this filter configuration
    const angleStr = (options.angle || 30).toString();
    const parallelStr = options.parallel ? 'parallel' : 'radial';
    const shaderKey = `godray-filter-${angleStr}-${parallelStr}`;

    // Create the filter with options
    const filter = new GodrayFilter(options);

    // Register filter with shader manager
    try {
        shaderManager.registerFilter(filter, shaderKey);
    } catch (error) {
        console.warn('Error registering godray filter with shader manager:', error);
    }

    // Keep track of animation state
    let animationActive = false;
    let animationFrameId: number | null = null;
    let lastTime = 0;

    /**
     * Update the filter's intensity based on the configuration
     *
     * @param intensity - New intensity value (0-10 scale)
     */
    const updateIntensity = (intensity: number): void => {
        // Normalize intensity to a 0-10 scale
        const normalizedIntensity = Math.max(0, Math.min(10, intensity));

        // Determine which property to adjust based on config
        if (config.primaryProperty) {
            switch (config.primaryProperty) {
                case 'gain':
                    // Map 0-10 to 0-1 range for gain (intensity)
                    filter.gain = normalizedIntensity / 10;
                    break;
                case 'alpha':
                    // Map 0-10 to 0-1 range for alpha (opacity)
                    filter.alpha = normalizedIntensity / 10;
                    break;
                case 'lacunarity':
                    // Map 0-10 to 0.5-5 range for lacunarity (density)
                    filter.lacunarity = 0.5 + (normalizedIntensity / 2);
                    break;
                case 'angle':
                    // Map 0-10 to 0-360 degrees for angle
                    filter.angle = normalizedIntensity * 36;
                    break;
                default:
                    // Default to gain adjustment (most visible effect)
                    filter.gain = normalizedIntensity / 10;
            }
        } else {
            // Default behavior - adjust gain (intensity)
            filter.gain = normalizedIntensity / 10;
        }

        // Start or stop animation if configured
        if (config.animate) {
            if (normalizedIntensity > 0 && !animationActive) {
                // Start animation
                startAnimation();
            } else if (normalizedIntensity === 0 && animationActive) {
                // Stop animation
                stopAnimation();
            }
        }
    };

    /**
     * Start the time-based animation
     */
    const startAnimation = (): void => {
        if (animationActive) return;

        animationActive = true;
        lastTime = Date.now();

        const animate = () => {
            const now = Date.now();
            const delta = (now - lastTime) / 1000; // Convert to seconds
            lastTime = now;

            // Update time value for animation (speed controlled by config)
            const animationSpeed = config.animationSpeed || 0.01;
            filter.time += delta * animationSpeed;

            // Continue animation loop
            animationFrameId = requestAnimationFrame(animate);
        };

        animate();
    };

    /**
     * Stop the time-based animation
     */
    const stopAnimation = (): void => {
        if (!animationActive) return;

        animationActive = false;

        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    };

    // Set initial intensity
    updateIntensity(config.intensity);

    // Start animation if initial intensity > 0 and animation is enabled
    if (config.animate && config.intensity > 0) {
        startAnimation();
    }

    /**
     * Reset the filter to initial configuration values or defaults
     */
    const reset = (): void => {
        // Reset enabled property if it exists and was specified in config
        if ('enabled' in filter) {
            filter.enabled = config.enabled !== undefined ? config.enabled : true;
        }

        // Reset alpha if it exists on the filter and was specified in config
        if ('alpha' in filter) {
            (filter as any).alpha = config.alpha !== undefined ? config.alpha : 1;
        }

        // Even though GrayscaleFilter doesn't have many configurable properties,
        // if intensity was provided, apply it for consistency with other filters
        if (config.intensity !== undefined) {
            updateIntensity(config.intensity);
        }
    };

    /**
     * Release any WebGL resources used by this filter and stop animations
     */
    const dispose = (): void => {
        // Stop any ongoing animations
        stopAnimation();

        // Release shader resources
        try {
            shaderManager.releaseFilter(filter, shaderKey);
        } catch (error) {
            console.warn('Error releasing godray filter shader:', error);
        }

        // Destroy the filter
        filter.destroy();
    };

    return { filter, updateIntensity, reset, dispose };
}