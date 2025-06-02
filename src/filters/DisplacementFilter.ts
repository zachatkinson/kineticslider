/**
 * Displacement Filter Implementation
 * 
 * Core visual effect for KineticSlider that creates the signature
 * displacement/distortion effect using PIXI.js DisplacementFilter.
 * 
 * @module DisplacementFilter
 * @version 1.0.0
 */

import { DisplacementFilter, Texture, Sprite, Point } from 'pixi.js';
import { 
  type DisplacementFilterConfig, 
  type FilterResult,
  type FilterIntensity
} from '../types/filters';
import { logger } from '../utils/logger';

/**
 * Enhanced DisplacementFilter with intensity control
 *
 * @example
 * const filter = new EnhancedDisplacementFilter(sprite, new Point(20, 20));
 * filter.updateIntensity(8);
 */
class EnhancedDisplacementFilter extends DisplacementFilter {
  private baseScaleX: number;
  private baseScaleY: number;
  private currentIntensity: FilterIntensity;

  constructor(sprite: Sprite, scale?: Point) {
    super(sprite, scale);
    
    // Store base scale values for intensity calculations
    this.baseScaleX = scale?.x ?? 20;
    this.baseScaleY = scale?.y ?? 20;
    this.currentIntensity = 5 as FilterIntensity; // Default intensity
  }

  /**
   * Update filter intensity (0-10 scale)
   *
   * @param intensity - Filter intensity value
   *
   * @returns void
   *
   */
  updateIntensity(intensity: FilterIntensity): void {
    this.currentIntensity = intensity;
    
    // Map intensity (0-10) to scale multiplier (0-2)
    const multiplier = intensity / 5; // 5 = middle intensity
    
    this.scale.x = this.baseScaleX * multiplier;
    this.scale.y = this.baseScaleY * multiplier;
    
    logger.debug('DisplacementFilter intensity updated', {
      intensity,
      scaleX: this.scale.x,
      scaleY: this.scale.y
    });
  }

  /**
   * Reset filter to default state
   *
   * @returns void
   *
   */
  reset(): void {
    this.scale.x = this.baseScaleX;
    this.scale.y = this.baseScaleY;
    this.currentIntensity = 5 as FilterIntensity;
  }

  /**
   * Get current filter state
   *
   * @returns Object containing current filter state
   *
   */
  getState(): Record<string, unknown> {
    return {
      intensity: this.currentIntensity,
      scaleX: this.scale.x,
      scaleY: this.scale.y,
      baseScaleX: this.baseScaleX,
      baseScaleY: this.baseScaleY
    };
  }
}

/**
 * Create a displacement filter instance
 *
 * @param config - Displacement filter configuration
 *
 * @returns FilterResult containing the filter and control methods
 *
 */
export function createFilter(config: DisplacementFilterConfig): FilterResult {
  try {
    logger.debug('Creating DisplacementFilter', { config });
    
    // Handle displacement map
    let displacementTexture: Texture;
    let displacementSprite: Sprite;
    
    if (typeof config.displacementMap === 'string') {
      // Load texture from URL/path
      displacementTexture = Texture.from(config.displacementMap);
    } else {
      // Use provided texture
      displacementTexture = config.displacementMap;
    }
    
    // Create sprite for displacement
    displacementSprite = new Sprite(displacementTexture);
    
    // Determine scale values
    let scalePoint: Point;
    
    if (config.scale) {
      scalePoint = new Point(config.scale.x, config.scale.y);
    } else if (config.scaleX !== undefined || config.scaleY !== undefined) {
      scalePoint = new Point(
        config.scaleX ?? 20,
        config.scaleY ?? 20
      );
    } else {
      // Default scale
      scalePoint = new Point(20, 20);
    }
    
    // Create the enhanced filter
    const filter = new EnhancedDisplacementFilter(displacementSprite, scalePoint);
    
    // Apply initial intensity
    if (config.intensity) {
      filter.updateIntensity(config.intensity);
    }
    
    // Set enabled state
    filter.enabled = config.enabled;
    
    const result: FilterResult = {
      filter,
      config,
      updateIntensity: (intensity: FilterIntensity) => {
        filter.updateIntensity(intensity);
      },
      reset: () => {
        filter.reset();
      },
      dispose: () => {
        // Clean up resources
        if (displacementSprite) {
          displacementSprite.destroy();
        }
        if (displacementTexture && displacementTexture.destroy) {
          displacementTexture.destroy();
        }
        filter.destroy();
        
        logger.debug('DisplacementFilter disposed');
      },
      getState: () => filter.getState()
    };
    
    logger.debug('DisplacementFilter created successfully', {
      scaleX: filter.scale.x,
      scaleY: filter.scale.y,
      enabled: filter.enabled
    });
    
    return result;
    
  } catch (error) {
    logger.error('Failed to create DisplacementFilter', error as Error, { config });
    throw error;
  }
}

/**
 * Default export for dynamic imports
 */
export default createFilter; 