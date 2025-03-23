import { GlitchFilter } from 'pixi-filters';
import { type GlitchFilterConfig, type FilterResult } from './types';
import { gsap } from 'gsap';
import { ShaderResourceManager } from '../managers/ShaderResourceManager';

/**
 * Creates a Glitch filter with mixed smooth and jumpy animations for a more realistic effect
 * Uses shader pooling for better performance.
 *
 * @param config - Configuration for the Glitch filter
 * @returns FilterResult with the filter instance and control functions
 */
export function createGlitchFilter(config: GlitchFilterConfig): FilterResult {
    // Get shader manager instance
    const shaderManager = ShaderResourceManager.getInstance();

    // Create options object for the filter
    const options: any = {};

    // Apply configuration values if provided, otherwise use defaults
    if (config.average !== undefined) options.average = config.average;
    if (config.direction !== undefined) options.direction = config.direction;
    if (config.red !== undefined) options.red = config.red;
    if (config.green !== undefined) options.green = config.green;
    if (config.blue !== undefined) options.blue = config.blue;
    if (config.slices !== undefined) options.slices = config.slices;
    if (config.offset !== undefined) options.offset = config.offset;
    if (config.minSize !== undefined) options.minSize = config.minSize;
    if (config.sampleSize !== undefined) options.sampleSize = config.sampleSize;
    if (config.seed !== undefined) options.seed = config.seed;
    if (config.fillMode !== undefined) options.fillMode = config.fillMode;

    // Create a unique key for this filter configuration
    const slicesStr = (options.slices || 5).toString();
    const fillModeStr = (options.fillMode || 0).toString();
    const shaderKey = `glitch-filter-${slicesStr}-${fillModeStr}`;

    // Create the filter with options
    const filter = new GlitchFilter(options);

    // Register filter with shader manager
    try {
        shaderManager.registerFilter(filter, shaderKey);
    } catch (error) {
        console.warn('Error registering glitch filter with shader manager:', error);
    }

    // For animation
    let animationInterval: number | null = null;
    let currentTweens: gsap.core.Tween[] = [];

    // Current target values - we'll store these to apply instant changes to non-tweened properties
    let currentTargets = {
        red: { ...filter.red },
        blue: { ...filter.blue },
        green: { ...filter.green },
        offset: filter.offset,
        direction: filter.direction
    };

    // Generate random target values for transitions
    // Generate random target values for transitions
    const generateTargetValues = (baseOffset: number) => {
        // Randomize the variation based on intensity
        const variation = baseOffset * 0.6; // 60% variation

        // Generate random offsets for each channel
        const redX = (Math.random() * variation * 2 - variation) + (config.red?.x || 0);
        const redY = (Math.random() * variation * 0.5 - variation * 0.25) + (config.red?.y || 0);

        const blueX = (Math.random() * variation * 2 - variation) + (config.blue?.x || 0);
        const blueY = (Math.random() * variation * 0.5 - variation * 0.25) + (config.blue?.y || 0);

        // For green channel, we typically want to keep it more stable
        // to avoid color overlay issues
        const greenX = config.green?.x || 0;
        const greenY = config.green?.y || 0;

        const offsetVariation = baseOffset * 0.4; // 40% variation in slice offset
        const newOffset = filter.offset + (Math.random() * offsetVariation * 2 - offsetVariation);

        // Generate random direction change if needed
        const directionChange = Math.random() > 0.7 ? (Math.random() * 30 - 15) : 0;
        const newDirection = ((filter.direction + directionChange) % 360 + 360) % 360;

        return {
            red: { x: redX, y: redY },
            blue: { x: blueX, y: blueY },
            green: { x: greenX, y: greenY }, // Add green channel
            offset: Math.max(0, newOffset),
            direction: newDirection
        };
    };

    // Helper to update animation with mixed tweening/jumping
    // Helper to update animation with mixed tweening/jumping
    const updateAnimationInterval = (frequency: number, baseIntensity: number) => {
        if (animationInterval !== null) {
            window.clearInterval(animationInterval);
            animationInterval = null;
        }

        // Clear any existing tweens
        for (const tween of currentTweens) {
            tween.kill();
        }
        currentTweens = [];

        if (frequency > 0 && config.animated) {
            // Convert frequency to milliseconds
            const interval = Math.floor(1000 / frequency);

            // Calculate transition duration - faster transitions for higher frequency
            // but never longer than the interval itself
            const transitionDuration = Math.min(interval * 0.8 / 1000, 0.5);

            animationInterval = window.setInterval(() => {
                // Generate new target values
                const targetValues = generateTargetValues(baseIntensity * 10);
                currentTargets = { ...targetValues }; // Store for reference

                // Decide which properties to tween and which to jump
                // We'll make these weighted random decisions for a dynamic effect
                const shouldTweenRed = Math.random() > 0.3;    // 70% chance to tween red
                const shouldTweenBlue = Math.random() > 0.3;   // 70% chance to tween blue
                const shouldTweenOffset = Math.random() > 0.5; // 50% chance to tween offset
                // NEVER tween direction - always jump rotations

                // Clear any existing tweens
                for (const tween of currentTweens) {
                    tween.kill();
                }
                currentTweens = [];

                // Create a tweening object for each property we want to tween
                const tweenProps: any = {};

                // For properties we want to tween, add them to the tweenProps
                if (shouldTweenRed) {
                    tweenProps.red = targetValues.red;
                } else {
                    // Immediate jump for red channel
                    filter.red = targetValues.red;
                }

                if (shouldTweenBlue) {
                    tweenProps.blue = targetValues.blue;
                } else {
                    // Immediate jump for blue channel
                    filter.blue = targetValues.blue;
                }

                if (shouldTweenOffset) {
                    tweenProps.offset = targetValues.offset;
                } else {
                    // Immediate jump for offset
                    filter.offset = targetValues.offset;
                }

                // Always apply direction immediately - never tween rotations
                filter.direction = targetValues.direction;

                // Only create a tween if we have properties to animate
                if (Object.keys(tweenProps).length > 0) {
                    // Random ease for more variety
                    const eases = ["power1.inOut", "power2.inOut", "power3.in", "power2.out", "none"];
                    const ease = eases[Math.floor(Math.random() * eases.length)];

                    // Random duration for more variety (within our max constraint)
                    const duration = Math.max(0.05, Math.random() * transitionDuration);

                    // Create the tween
                    const tween = gsap.to(filter, {
                        duration: duration,
                        ...tweenProps,
                        ease: ease,
                        onComplete: () => {
                            // Occasionally cause an abrupt refresh for even more variation
                            if (Math.random() > 0.8) {
                                filter.refresh();

                                // Randomize seed occasionally
                                if (Math.random() > 0.7) {
                                    filter.seed = Math.random() * 1000;
                                }
                            }
                        }
                    });

                    // Store the tween
                    currentTweens.push(tween);
                } else {
                    // No tweening at all for this update - call refresh directly
                    filter.refresh();
                }

                // Sometimes cause a mini-glitch during the main animation
                if (Math.random() > 0.85) { // 15% chance of mini-glitch
                    setTimeout(() => {
                        // Create a small random offset change
                        const miniJump = Math.random() * baseIntensity * 15;

                        // Jump immediately
                        filter.offset = filter.offset + miniJump;

                        // Maybe also jump direction for a sudden rotation
                        if (Math.random() > 0.5) {
                            filter.direction = (filter.direction + (Math.random() * 90 - 45)) % 360;
                        }

                        // And return after a very short time
                        setTimeout(() => {
                            filter.offset = currentTargets.offset;
                            filter.direction = currentTargets.direction;
                        }, Math.random() * 100 + 50); // 50-150ms
                    }, Math.random() * (interval * 0.6)); // Random time during the interval
                }

            }, interval);
        }
    };

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
                case 'slices':
                    // Map 0-10 to 1-20 slices
                    filter.slices = 1 + Math.floor(normalizedIntensity * 2);
                    break;
                case 'offset':
                    // Map 0-10 to 0-200 offset
                    filter.offset = normalizedIntensity * 20;
                    break;
                case 'direction':
                    // Map 0-10 to 0-360 degrees
                    filter.direction = normalizedIntensity * 36;
                    break;
                case 'red':
                    // Adjust red channel offset based on intensity
                    filter.red = { x: normalizedIntensity * 2, y: 0 };
                    break;
                case 'blue':
                    // Adjust blue channel offset based on intensity
                    filter.blue = { x: -normalizedIntensity * 2, y: 0 };
                    break;
                default:
                    // Default to offset adjustment
                    filter.offset = normalizedIntensity * 20;
            }
        } else {
            // Default behavior - adjust offset (most visible effect)
            filter.offset = normalizedIntensity * 20;
        }

        // If specified, adjust animation timing based on intensity
        if (config.refreshFrequency !== undefined) {
            updateAnimationInterval(config.refreshFrequency, normalizedIntensity);
        }
    };

    // Set initial intensity
    updateIntensity(config.intensity);

    /**
     * Reset the filter to initial configuration
     */
    const reset = (): void => {
        // Clear any existing animation
        if (animationInterval !== null) {
            window.clearInterval(animationInterval);
            animationInterval = null;
        }

        // Clear any existing tweens
        for (const tween of currentTweens) {
            tween.kill();
        }
        currentTweens = [];

        // Reset all filter properties
        filter.average = config.average !== undefined ? config.average : false;
        filter.red = config.red || { x: 0, y: 0 };
        filter.green = config.green || { x: 0, y: 0 };
        filter.blue = config.blue || { x: 0, y: 0 };
        filter.offset = config.offset !== undefined ? config.offset : 0;
        filter.direction = config.direction !== undefined ? config.direction : 0;
        filter.fillMode = config.fillMode !== undefined ? config.fillMode : 0;
        filter.seed = config.seed !== undefined ? config.seed : 0;
        filter.slices = config.slices !== undefined ? config.slices : 5;
        filter.minSize = config.minSize !== undefined ? config.minSize : 8;
        filter.sampleSize = config.sampleSize !== undefined ? config.sampleSize : 512;

        // Re-apply intensity if provided
        if (config.intensity !== undefined) {
            updateIntensity(config.intensity);
        }
    };

    /**
     * Release any WebGL resources used by this filter and stop animations
     */
    const dispose = (): void => {
        // Stop animations and clear tweens
        if (animationInterval !== null) {
            window.clearInterval(animationInterval);
            animationInterval = null;
        }

        for (const tween of currentTweens) {
            tween.kill();
        }
        currentTweens = [];

        // Release shader resources
        try {
            shaderManager.releaseFilter(filter, shaderKey);
        } catch (error) {
            console.warn('Error releasing glitch filter shader:', error);
        }

        // Destroy the filter
        filter.destroy();
    };

    return { filter, updateIntensity, reset, dispose };
}