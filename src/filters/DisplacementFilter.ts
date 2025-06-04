/**
 * Displacement Filter Implementation
 * 
 * Core visual effect for KineticSlider that creates the signature
 * displacement/distortion effect using PIXI.js DisplacementFilter.
 * 
 * @module DisplacementFilter
 * @version 1.0.0
 */

import { DisplacementFilter as PixiDisplacementFilter, Texture, Sprite, Point } from 'pixi.js';
import type { DisplacementFilterConfig, FilterResult } from '../types/filters';

/**
 * Enhanced DisplacementFilter with intensity control
 *
 * The DisplacementFilter uses the pixel values from the specified texture (called the displacement map)
 * to perform a displacement of an object. The red channel is used for X displacement and green channel for Y displacement.
 *
 * Based on PIXI.js DisplacementFilter documentation:
 *
 * @see https://pixijs.download/release/docs/filters.DisplacementFilter.html
 * 
 * @param config - Configuration for the Displacement filter
 *
 * @returns FilterResult with the filter instance and control functions
 * 
 * @example
 * ```typescript
 * const displacementFilter = createDisplacementFilter({
 *   type: 'displacement',
 *   enabled: true,
 *   intensity: 7,
 *   displacementMap: myTexture,
 *   scale: { x: 20, y: 20 },
 *   primaryProperty: 'scale'
 * });
 * ```
 */
export class DisplacementFilter extends PixiDisplacementFilter {
    public readonly config: DisplacementFilterConfig;
    private readonly baseScale: Point;
    private displacementSprite: Sprite;

    /**
     *
     */
    constructor(config: DisplacementFilterConfig) {
        // Create displacement sprite from texture
        let displacementTexture: Texture;
        
        if (typeof config.displacementMap === 'string') {
            displacementTexture = Texture.from(config.displacementMap);
        } else {
            displacementTexture = config.displacementMap;
        }
        
        const sprite = new Sprite(displacementTexture);
        
        // Set default scale based on PIXI.js typical usage
        const defaultScale = new Point(20, 20);
        const scale = config.scale ? new Point(config.scale.x, config.scale.y) : defaultScale;
        
        super(sprite, scale);
        
        this.config = config;
        this.displacementSprite = sprite;
        this.baseScale = new Point(scale.x, scale.y);

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

        // Map intensity (0-10) to scale multiplier (0-2)
        const multiplier = normalizedIntensity / 5; // 5 = middle intensity gives 1x scale
        
        // Apply to both X and Y scale
        this.scale.x = this.baseScale.x * multiplier;
        this.scale.y = this.baseScale.y * multiplier;
    }

    /**
     * Reset the filter to initial configuration values
     */
    public reset(): void {
        // Reset to configured scale values
        this.scale.x = this.baseScale.x;
        this.scale.y = this.baseScale.y;

        // If intensity was provided in config, apply that
        if (this.config.intensity !== undefined) {
            this.updateIntensity(this.config.intensity);
        }
    }

    /**
     * Get current filter state
     *
     * @returns Record containing current filter properties and state
     *
     */
    public getState(): Record<string, unknown> {
        return {
            scaleX: this.scale.x,
            scaleY: this.scale.y,
            baseScaleX: this.baseScale.x,
            baseScaleY: this.baseScale.y,
            textureWidth: this.displacementSprite.texture.width,
            textureHeight: this.displacementSprite.texture.height,
            type: this.config.type,
            enabled: this.config.enabled
        };
    }

    /**
     * Release any WebGL resources used by this filter
     */
    public dispose(): void {
        // Clean up the displacement sprite
        if (this.displacementSprite) {
            this.displacementSprite.destroy();
        }
        
        // Destroy the filter itself
        this.destroy();
    }
}

/**
 * Create a DisplacementFilter with the specified configuration
 * 
 * @param config - Configuration for the Displacement filter
 *
 * @returns FilterResult with the filter instance and control functions
 *
 */
export function createFilter(config: DisplacementFilterConfig): FilterResult {
    const filter = new DisplacementFilter(config);
    
    return {
        filter,
        updateIntensity: (intensity: number) => filter.updateIntensity(intensity),
        reset: () => filter.reset(),
        dispose: () => filter.dispose(),
        getState: () => filter.getState(),
        config
    };
}

/**
 * Default export for dynamic imports
 */
export default createFilter; 