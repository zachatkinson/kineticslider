import { ReflectionFilter } from 'pixi-filters';
import { type ReflectionFilterConfig, type FilterResult } from './types';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

/**
 * Creates a Reflection filter that applies a water-like reflection effect
 *
 * The ReflectionFilter simulates the reflection on water with waves,
 * with configurable wave properties and animation settings.
 * Uses shader pooling for better performance.
 *
 * @param config - Configuration for the Reflection filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createReflectionFilter(config: ReflectionFilterConfig): FilterResult {
    // Get shader manager instance
    const shaderManager = ShaderResourceManager.getInstance();

    // Create options object for the filter
    const options: any = {};

    // Apply configuration values if provided, otherwise use defaults
    if (config.alpha !== undefined) options.alpha = config.alpha;
    if (config.amplitude !== undefined) options.amplitude = config.amplitude;
    if (config.boundary !== undefined) options.boundary = config.boundary;
    if (config.mirror !== undefined) options.mirror = config.mirror;
    if (config.waveLength !== undefined) options.waveLength = config.waveLength;
    if (config.time !== undefined) options.time = config.time;

    // Create a unique key for this filter configuration
    // The mirror setting affects shader compilation
    const mirrorStr = options.mirror === false ? 'nomirror' : 'mirror';
    const shaderKey = `reflection-filter-${mirrorStr}`;

    // Create the filter with options
    const filter = new ReflectionFilter(options);

    // Register filter with shader manager
    try {
        shaderManager.registerFilter(filter, shaderKey);
    } catch (error) {
        console.warn('Error registering reflection filter with shader manager:', error);
    }

    // Track animation state if we're using animation
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
                case 'amplitude':
                    // Map 0-10 to 0-30 for amplitude
                    // Using amplitude as a Range object or direct value based on what's available
                    if (typeof filter.amplitude === 'object') {
                        // If amplitude is a Range object (array-like with start and end)
                        filter.amplitude[0] = 0;
                        filter.amplitude[1] = normalizedIntensity * 3; // 0-30 range
                    } else {
                        // Assume it's a direct value
                        filter.amplitudeEnd = normalizedIntensity * 3; // 0-30 range
                    }
                    break;
                case 'waveLength':
                    // Map 0-10 to 30-100 for wavelength
                    if (typeof filter.waveLength === 'object') {
                        // If waveLength is a Range object
                        const start = 30;
                        const end = 30 + (normalizedIntensity * 7); // 30-100 range
                        filter.waveLength[0] = start;
                        filter.waveLength[1] = end;
                    } else {
                        filter.wavelengthEnd = 30 + (normalizedIntensity * 7); // 30-100 range
                    }
                    break;
                case 'boundary':
                    // Map 0-10 to 0-1 for boundary, which controls reflection height
                    filter.boundary = 1 - (normalizedIntensity / 10); // Inverse mapping (higher intensity = larger reflection)
                    break;
                case 'alpha':
                    // Map 0-10 to 0-1 for alpha
                    if (typeof filter.alpha === 'object') {
                        // If alpha is a Range object
                        filter.alpha[0] = normalizedIntensity / 10;
                        filter.alpha[1] = normalizedIntensity / 10;
                    } else {
                        // Assume separate alphaStart and alphaEnd properties
                        filter.alphaStart = normalizedIntensity / 10;
                        filter.alphaEnd = normalizedIntensity / 10;
                    }
                    break;
                default:
                    // Default to adjusting amplitude as it's the most visible effect
                    if (typeof filter.amplitude === 'object') {
                        filter.amplitude = [0, normalizedIntensity * 3]; // 0-30 range
                    } else {
                        filter.amplitudeEnd = normalizedIntensity * 3;
                    }
            }
        } else {
            // Default behavior - adjust amplitude (most visible effect)
            if (typeof filter.amplitude === 'object') {
                filter.amplitude[0] = 0;
                filter.amplitude[1] = normalizedIntensity * 3; // 0-30 range
            } else {
                filter.amplitudeEnd = normalizedIntensity * 3;
            }
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
     * Start the time-based animation for wave movement
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
            const animationSpeed = config.animationSpeed || 0.1;
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
     * Reset the filter to configured state or default values if not specified
     */
    const reset = (): void => {
        // Stop any active animation
        stopAnimation();

        // Reset alpha using config values or defaults
        if (typeof filter.alpha === 'object') {
            // Use a direct array assignment to avoid type conflicts
            if (config.alpha && Array.isArray(config.alpha)) {
                filter.alpha[0] = config.alpha[0];
                filter.alpha[1] = config.alpha[1];
            } else {
                filter.alpha[0] = 1;
                filter.alpha[1] = 1;
            }
        } else {
            filter.alphaStart = config.alphaStart ?? 1;
            filter.alphaEnd = config.alphaEnd ?? 1;
        }

        // Reset amplitude using config values or defaults
        if (typeof filter.amplitude === 'object') {
            // Use a direct array assignment to avoid type conflicts
            if (config.amplitude && Array.isArray(config.amplitude)) {
                filter.amplitude[0] = config.amplitude[0];
                filter.amplitude[1] = config.amplitude[1];
            } else {
                filter.amplitude[0] = 0;
                filter.amplitude[1] = 20;
            }
        } else {
            filter.amplitudeStart = config.amplitudeStart ?? 0;
            filter.amplitudeEnd = config.amplitudeEnd ?? 20;
        }

        // Reset wavelength using config values or defaults
        if (typeof filter.waveLength === 'object') {
            // Use a direct array assignment to avoid type conflicts
            if (config.waveLength && Array.isArray(config.waveLength)) {
                filter.waveLength[0] = config.waveLength[0];
                filter.waveLength[1] = config.waveLength[1];
            } else {
                filter.waveLength[0] = 30;
                filter.waveLength[1] = 100;
            }
        } else {
            filter.wavelengthStart = config.wavelengthStart ?? 30;
            filter.wavelengthEnd = config.wavelengthEnd ?? 100;
        }

        // Reset boundary using config value or default
        filter.boundary = config.boundary ?? 0.5;

        // Reset mirror using config value or default
        filter.mirror = config.mirror ?? true;

        // Always reset time to 0 for consistent initial state
        filter.time = 0;
    };

    /**
     * Release any WebGL resources used by this filter and stop animations
     */
    const dispose = (): void => {
        // Stop any active animation
        stopAnimation();

        // Release shader resources
        try {
            shaderManager.releaseFilter(filter, shaderKey);
        } catch (error) {
            console.warn('Error releasing reflection filter shader:', error);
        }

        // Destroy the filter
        filter.destroy();
    };

    return { filter, updateIntensity, reset, dispose };
}