import { ShockwaveFilter } from 'pixi-filters';
import { type ShockwaveFilterConfig, type FilterResult } from './types';
import { gsap } from 'gsap';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

/**
 * Creates a Shockwave filter that applies a ripple/wrinkle effect like a pond wave or blast
 *
 * The ShockwaveFilter creates a visual distortion that radiates from a center point,
 * simulating ripples on water or blast waves. It can be animated over time.
 * Uses shader pooling for better performance.
 *
 * @param config - Configuration for the Shockwave filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createShockwaveFilter(config: ShockwaveFilterConfig): FilterResult {
    // Get shader manager instance
    const shaderManager = ShaderResourceManager.getInstance();

    // Create options object for the filter
    const options: any = {};

    // Apply configuration values if provided, otherwise use defaults
    if (config.amplitude !== undefined) options.amplitude = config.amplitude;
    if (config.brightness !== undefined) options.brightness = config.brightness;
    if (config.center !== undefined) options.center = config.center;
    if (config.centerX !== undefined) options.centerX = config.centerX;
    if (config.centerY !== undefined) options.centerY = config.centerY;
    if (config.radius !== undefined) options.radius = config.radius;
    if (config.speed !== undefined) options.speed = config.speed;
    if (config.wavelength !== undefined) options.wavelength = config.wavelength;
    if (config.time !== undefined) options.time = config.time;

    // Create a unique key for this filter configuration
    const shaderKey = 'shockwave-filter';

    // Create the filter with options
    const filter = new ShockwaveFilter(options);

    // Register filter with shader manager
    try {
        shaderManager.registerFilter(filter, shaderKey);
    } catch (error) {
        console.warn('Error registering shockwave filter with shader manager:', error);
    }

    // Track animation state
    let animationActive = false;
    let animationFrameId: number | null = null;
    let lastTime = 0;
    let pulseTween: gsap.core.Tween | null = null;

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
                    // Map 0-10 to 0-60 for amplitude
                    filter.amplitude = normalizedIntensity * 6;
                    break;
                case 'wavelength':
                    // Map 0-10 to 80-240 for wavelength
                    filter.wavelength = 80 + (normalizedIntensity * 16);
                    break;
                case 'radius':
                    // Map 0-10 to 0-300 for radius (with -1 for infinite at max)
                    filter.radius = normalizedIntensity === 10 ? -1 : normalizedIntensity * 30;
                    break;
                case 'brightness':
                    // Map 0-10 to 0.5-1.5 for brightness
                    filter.brightness = 0.5 + (normalizedIntensity / 10);
                    break;
                case 'speed':
                    // Map 0-10 to 100-1000 for speed
                    filter.speed = 100 + (normalizedIntensity * 90);
                    break;
                default:
                    // Default to amplitude adjustment
                    filter.amplitude = normalizedIntensity * 6;
            }
        } else {
            // Default behavior - adjust amplitude and brightness together for more visible effect
            filter.amplitude = normalizedIntensity * 6;
            filter.brightness = 0.8 + (normalizedIntensity / 50); // Subtle brightness adjustment
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
            const animationSpeed = config.animationSpeed || 0.5;

            // If the filter has a time property, increment it
            if ('time' in filter) {
                filter.time += delta * animationSpeed;
            }

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

    // Set initial intensity and start animation if configured
    updateIntensity(config.intensity);

    // If pulse effect is requested, create a GSAP animation
    if (config.pulse) {
        const pulseIntensity = config.pulseIntensity || 0.5;
        const pulseDuration = config.pulseDuration || 1.5;

        // Create a pulsing animation using GSAP
        pulseTween = gsap.to(filter, {
            amplitude: filter.amplitude * (1 + pulseIntensity),
            duration: pulseDuration / 2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });
    }

    /**
     * Reset the filter to configured state or default values if not specified
     */
    const reset = (): void => {
        // Stop any active animation
        stopAnimation();

        // Reset to configured values or defaults if not specified
        filter.amplitude = config.amplitude !== undefined ? config.amplitude : 30;
        filter.wavelength = config.wavelength !== undefined ? config.wavelength : 160;
        filter.radius = config.radius !== undefined ? config.radius : -1;
        filter.brightness = config.brightness !== undefined ? config.brightness : 1;
        filter.speed = config.speed !== undefined ? config.speed : 500;

        // Handle center coordinates
        if (config.center !== undefined) {
            // If center object was provided, use that
            filter.center = config.center;
        } else {
            // Otherwise use individual centerX/centerY if provided
            const centerX = config.centerX !== undefined ? config.centerX : 0.5;
            const centerY = config.centerY !== undefined ? config.centerY : 0.5;
            filter.center = { x: centerX, y: centerY };
        }

        // Reset time to 0 or configured value
        if ('time' in filter) {
            filter.time = config.time !== undefined ? config.time : 0;
        }
    };

    /**
     * Release any WebGL resources used by this filter and stop animations
     */
    const dispose = (): void => {
        // Stop any active animation
        stopAnimation();

        // Kill any GSAP animations
        if (pulseTween) {
            pulseTween.kill();
            pulseTween = null;
        }

        // Release shader resources
        try {
            shaderManager.releaseFilter(filter, shaderKey);
        } catch (error) {
            console.warn('Error releasing shockwave filter shader:', error);
        }

        // Destroy the filter
        filter.destroy();
    };

    return { filter, updateIntensity, reset, dispose };
}