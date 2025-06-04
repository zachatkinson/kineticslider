import { MotionBlurFilter as PixiMotionBlurFilter } from 'pixi-filters';
import type { MotionBlurFilterConfig, FilterResult } from '../types/filters';

/**
 * Enhanced Motion Blur Filter
 *
 * Extends the PIXI MotionBlurFilter with intensity control and configuration management.
 * The MotionBlurFilter applies a Motion blur to an object.
 * 
 * Based on official PIXI MotionBlurFilter documentation:
 * - kernelSize: number (default: 5) - The kernelSize of the blur filter. Must be odd number >= 5
 * - offset: number (default: 0) - The offset of the blur filter
 * - velocity: PointData (default: {x:0,y:0}) - Sets the velocity of the motion for blur effect
 * - velocityX: number (default: 0) - Sets the velocity of the motion for blur effect on the `x` axis
 * - velocityY: number (default: 0) - Sets the velocity of the motion for blur effect on the `y` axis
 *
 * @example
 * ```typescript
 * const filter = createFilter({
 *   type: 'motionBlur',
 *   enabled: true,
 *   intensity: createFilterIntensity(6),
 *   velocity: {x: 15, y: 5},  // Motion velocity
 *   velocityX: 15,            // Alternative X velocity  
 *   velocityY: 5,             // Alternative Y velocity
 *   kernelSize: 7,            // Blur kernel size (odd, >= 5)
 *   offset: 2                 // Blur offset
 * });
 * ```
 */
class EnhancedMotionBlurFilter extends PixiMotionBlurFilter {
  private config: MotionBlurFilterConfig;

  constructor(config: MotionBlurFilterConfig) {
    // Initialize with PIXI defaults or config values
    // Handle velocity properly - prioritize individual X/Y over PointData
    let velocity = config.velocity ?? { x: 0, y: 0 }; // PIXI default is {x:0, y:0}
    if (config.velocityX !== undefined || config.velocityY !== undefined) {
      velocity = {
        x: config.velocityX ?? 0,
        y: config.velocityY ?? 0
      };
    }
    
    super(
      velocity,
      config.kernelSize ?? 5,
      config.offset ?? 0
    );
    
    this.config = config;
    this.enabled = config.enabled;
    
    // Apply direction-based velocity if specified (custom enhancement)
    if (config.direction !== undefined) {
      const direction = config.direction;
      const magnitude = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
      const radians = (direction * Math.PI) / 180;
      this.velocity = {
        x: Math.cos(radians) * magnitude,
        y: Math.sin(radians) * magnitude
      };
    }
    
    // Apply initial intensity if provided
    if (config.intensity !== undefined) {
      this.updateIntensity(config.intensity);
    }
  }

  /**
   * Update filter intensity
   *
   * Controls the primary property specified in config, or defaults to velocity scaling.
   *
   * @param intensity - Intensity value (0-10)
   *
   */
  updateIntensity(intensity: number): void {
    const normalizedIntensity = Math.max(0, Math.min(10, intensity));
    
    // Determine which property to adjust based on config
    if (this.config.primaryProperty) {
      switch (this.config.primaryProperty) {
        case 'velocity':
          // velocity: Scale both X and Y velocity components
          const baseVelocity = this.config.velocity ?? { x: 0, y: 0 };
          const scale = normalizedIntensity / 5; // 0-10 -> 0-2 scale
          this.velocity = {
            x: baseVelocity.x * scale,
            y: baseVelocity.y * scale
          };
          break;
        case 'velocityX':
          // velocityX: Scale only X velocity
          const baseVelX = this.config.velocityX ?? this.config.velocity?.x ?? 0;
          this.velocity = {
            x: baseVelX * (normalizedIntensity / 5),
            y: this.velocity.y
          };
          break;
        case 'velocityY':
          // velocityY: Scale only Y velocity
          const baseVelY = this.config.velocityY ?? this.config.velocity?.y ?? 0;
          this.velocity = {
            x: this.velocity.x,
            y: baseVelY * (normalizedIntensity / 5)
          };
          break;
        case 'kernelSize':
          // kernelSize: Must be odd number >= 5
          const baseKernel = this.config.kernelSize ?? 5;
          const newKernelSize = Math.max(5, Math.round(baseKernel + normalizedIntensity));
          // Ensure odd number
          this.kernelSize = newKernelSize % 2 === 0 ? newKernelSize + 1 : newKernelSize;
          break;
        case 'offset':
          // offset: Scale the offset
          const baseOffset = this.config.offset ?? 0;
          this.offset = baseOffset + (normalizedIntensity * 2); // 0-10 -> 0-20 added to base
          break;
        default:
          // Default behavior: scale velocity
          const defaultBaseVel = this.config.velocity ?? { x: 0, y: 0 };
          const defaultScale = normalizedIntensity / 5;
          this.velocity = {
            x: defaultBaseVel.x * defaultScale,
            y: defaultBaseVel.y * defaultScale
          };
      }
    } else {
      // Default behavior: scale velocity proportionally
      const baseVel = this.config.velocity ?? { x: 0, y: 0 };
      // Handle individual velocity components if specified
      if (this.config.velocityX !== undefined || this.config.velocityY !== undefined) {
        baseVel.x = this.config.velocityX ?? 0;
        baseVel.y = this.config.velocityY ?? 0;
      }
      
      const defaultScale = normalizedIntensity / 5; // 0-10 -> 0-2
      this.velocity = {
        x: baseVel.x * defaultScale,
        y: baseVel.y * defaultScale
      };
    }
  }

  /**
   * Reset filter to original configuration
   */
  reset(): void {
    // Reset to configured values or PIXI defaults
    this.kernelSize = this.config.kernelSize ?? 5;
    this.offset = this.config.offset ?? 0;
    this.enabled = this.config.enabled;

    // Handle velocity - prioritize individual X/Y over PointData
    if (this.config.velocityX !== undefined || this.config.velocityY !== undefined) {
      this.velocity = {
        x: this.config.velocityX ?? 0,
        y: this.config.velocityY ?? 0
      };
    } else {
      this.velocity = this.config.velocity ?? { x: 0, y: 0 };
    }

    // Apply direction-based velocity if specified (custom enhancement)
    if (this.config.direction !== undefined) {
      const direction = this.config.direction;
      const magnitude = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
      const radians = (direction * Math.PI) / 180;
      this.velocity = {
        x: Math.cos(radians) * magnitude,
        y: Math.sin(radians) * magnitude
      };
    }

    // Apply intensity if configured
    if (this.config.intensity !== undefined) {
      this.updateIntensity(this.config.intensity);
    }
  }

  /**
   * Get current filter state
   *
   * @returns Current filter state including all motion blur properties
   *
   */
  getState(): Record<string, unknown> {
    return {
      enabled: this.enabled,
      kernelSize: this.kernelSize,
      offset: this.offset,
      velocity: this.velocity,
      velocityX: this.velocity.x,
      velocityY: this.velocity.y,
      // Config tracking
      configuredKernelSize: this.config.kernelSize,
      configuredOffset: this.config.offset,
      configuredVelocity: this.config.velocity,
      configuredVelocityX: this.config.velocityX,
      configuredVelocityY: this.config.velocityY,
      configuredDirection: this.config.direction,
      primaryProperty: this.config.primaryProperty,
      intensity: this.config.intensity
    };
  }
}

/**
 * Create a Motion Blur filter
 *
 * @param config - Filter configuration
 *
 * @returns FilterResult with filter instance and control functions
 *
 */
export function createFilter(config: MotionBlurFilterConfig): FilterResult {
  const filter = new EnhancedMotionBlurFilter(config);

  return {
    filter,
    config,
    updateIntensity: (intensity) => filter.updateIntensity(intensity),
    reset: () => filter.reset(),
    dispose: () => filter.destroy(),
    getState: () => filter.getState()
  };
} 