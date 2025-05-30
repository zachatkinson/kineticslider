/**
 * Distortion Effects Utility for Phase 3
 * 
 * Provides configurable distortion effects with independent image/text controls,
 * intensity management, and support for custom shaders.
 */

import type { Filter } from 'pixi.js';
import type {
  DistortionEffect,
  ImageDistortionConfig,
  TextDistortionConfig,
  DistortionManager,
  CustomShader,
  ShaderConfig
} from '../../types/animation';
import { log } from '../logger';

/**
 * Default distortion configurations
 */
export const DEFAULT_IMAGE_DISTORTION: ImageDistortionConfig = {
  enabled: true,
  effects: [],
  globalIntensity: 1,
  interactive: true,
  momentum: 0.14,
  scaleIntensity: 0.65
};

export const DEFAULT_TEXT_DISTORTION: TextDistortionConfig = {
  enabled: true,
  effects: [],
  globalIntensity: 1,
  interactive: true,
  separateFromImage: true,
  customProperties: {
    blur: 0,
    offset: { x: 0, y: 0 },
    tilt: 0
  }
};

/**
 * Built-in distortion effects
 */
export const BUILT_IN_EFFECTS: Record<string, DistortionEffect> = {
  displacement: {
    id: 'displacement',
    name: 'Displacement',
    type: 'displacement',
    enabled: true,
    intensity: 1,
    properties: {
      scaleX: 20,
      scaleY: 20,
      momentum: 0.14
    }
  },
  wave: {
    id: 'wave',
    name: 'Wave Distortion',
    type: 'wave',
    enabled: false,
    intensity: 0.5,
    properties: {
      amplitude: 10,
      frequency: 0.1,
      speed: 0.02
    }
  },
  noise: {
    id: 'noise',
    name: 'Noise Distortion',
    type: 'noise',
    enabled: false,
    intensity: 0.3,
    properties: {
      scale: 100,
      speed: 0.01
    }
  }
};

/**
 * Distortion Effects Manager
 *
 * @example Distortion effects usage
 * ```ts
 * const manager = new DistortionEffectsManager(
 *   { globalIntensity: 1.2 },
 *   { globalIntensity: 0.8 },
 *   'balanced'
 * );
 * manager.setGlobalIntensity(1.5);
 * manager.toggleEffect('displacement', true);
 * ```
 */
export class DistortionEffectsManager implements DistortionManager {
  public imageConfig: ImageDistortionConfig;
  public textConfig: TextDistortionConfig;
  public globalEnabled: boolean;
  public performanceMode: 'high' | 'balanced' | 'performance';

  private customShaders = new Map<string, CustomShader>();
  private activeFilters = new Map<string, Filter>();
  private mousePosition = { x: 0, y: 0 };
  private isDestroyed = false;

  /**
   *
   */
  constructor(
    imageConfig: Partial<ImageDistortionConfig> = {},
    textConfig: Partial<TextDistortionConfig> = {},
    performanceMode: 'high' | 'balanced' | 'performance' = 'balanced'
  ) {
    this.imageConfig = { ...DEFAULT_IMAGE_DISTORTION, ...imageConfig };
    this.textConfig = { ...DEFAULT_TEXT_DISTORTION, ...textConfig };
    this.globalEnabled = true;
    this.performanceMode = performanceMode;

    this.initializeBuiltInEffects();
  }

  /**
   * Initialize built-in distortion effects
   */
  private initializeBuiltInEffects(): void {
    // Add built-in effects to both image and text configs if empty
    if (this.imageConfig.effects.length === 0) {
      this.imageConfig.effects = [
        { ...BUILT_IN_EFFECTS.displacement },
        { ...BUILT_IN_EFFECTS.wave, enabled: false },
        { ...BUILT_IN_EFFECTS.noise, enabled: false }
      ];
    }

    if (this.textConfig.effects.length === 0) {
      this.textConfig.effects = [
        { ...BUILT_IN_EFFECTS.displacement, intensity: 0.8 }
      ];
    }
  }

  /**
   * Update image distortion configuration
   *
   * @param config
   *
   */
  public updateImageConfig(config: Partial<ImageDistortionConfig>): void {
    if (this.isDestroyed) {
      log.warn('DistortionEffectsManager has been destroyed');
      return;
    }

    this.imageConfig = {
      ...this.imageConfig,
      ...config
    };

    log.debug('Updated image distortion config');
  }

  /**
   * Update text distortion configuration
   *
   * @param config
   *
   */
  public updateTextConfig(config: Partial<TextDistortionConfig>): void {
    if (this.isDestroyed) {
      log.warn('DistortionEffectsManager has been destroyed');
      return;
    }

    this.textConfig = {
      ...this.textConfig,
      ...config
    };

    log.debug('Updated text distortion config');
  }

  /**
   * Set global distortion intensity
   *
   * @param intensity
   *
   */
  public setGlobalIntensity(intensity: number): void {
    const clampedIntensity = Math.max(0, Math.min(2, intensity));
    
    this.imageConfig.globalIntensity = clampedIntensity;
    this.textConfig.globalIntensity = clampedIntensity;

    log.debug(`Set global distortion intensity: ${clampedIntensity}`);
  }

  /**
   * Set intensity for specific target
   *
   * @param target
   *
   * @param intensity
   *
   */
  public setTargetIntensity(target: 'image' | 'text' | 'both', intensity: number): void {
    const clampedIntensity = Math.max(0, Math.min(2, intensity));

    if (target === 'image' || target === 'both') {
      this.imageConfig.globalIntensity = clampedIntensity;
    }

    if (target === 'text' || target === 'both') {
      this.textConfig.globalIntensity = clampedIntensity;
    }

    log.debug(`Set ${target} distortion intensity: ${clampedIntensity}`);
  }

  /**
   * Enable/disable effect by ID
   *
   * @param effectId
   *
   * @param enabled
   *
   * @param target
   *
   */
  public toggleEffect(effectId: string, enabled: boolean, target: 'image' | 'text' | 'both' = 'both'): void {
    if (target === 'image' || target === 'both') {
      const imageEffect = this.imageConfig.effects.find(e => e.id === effectId);
      if (imageEffect) {
        imageEffect.enabled = enabled;
      }
    }

    if (target === 'text' || target === 'both') {
      const textEffect = this.textConfig.effects.find(e => e.id === effectId);
      if (textEffect) {
        textEffect.enabled = enabled;
      }
    }

    log.debug(`Toggled effect ${effectId} to ${enabled} for ${target}`);
  }

  /**
   * Update effect intensity
   *
   * @param effectId
   *
   * @param intensity
   *
   * @param target
   *
   */
  public updateEffectIntensity(effectId: string, intensity: number, target: 'image' | 'text' | 'both' = 'both'): void {
    const clampedIntensity = Math.max(0, Math.min(2, intensity));

    if (target === 'image' || target === 'both') {
      const imageEffect = this.imageConfig.effects.find(e => e.id === effectId);
      if (imageEffect) {
        imageEffect.intensity = clampedIntensity;
      }
    }

    if (target === 'text' || target === 'both') {
      const textEffect = this.textConfig.effects.find(e => e.id === effectId);
      if (textEffect) {
        textEffect.intensity = clampedIntensity;
      }
    }

    log.debug(`Updated effect ${effectId} intensity to ${clampedIntensity} for ${target}`);
  }

  /**
   * Add custom effect
   *
   * @param effect
   *
   * @param target
   *
   */
  public addCustomEffect(effect: DistortionEffect, target: 'image' | 'text' | 'both' = 'both'): void {
    if (target === 'image' || target === 'both') {
      // Remove existing effect with same ID
      this.imageConfig.effects = this.imageConfig.effects.filter(e => e.id !== effect.id);
      this.imageConfig.effects.push({ ...effect });
    }

    if (target === 'text' || target === 'both') {
      // Remove existing effect with same ID
      this.textConfig.effects = this.textConfig.effects.filter(e => e.id !== effect.id);
      this.textConfig.effects.push({ ...effect });
    }

    log.debug(`Added custom effect ${effect.id} for ${target}`);
  }

  /**
   * Remove effect by ID
   *
   * @param effectId
   *
   * @param target
   *
   */
  public removeEffect(effectId: string, target: 'image' | 'text' | 'both' = 'both'): void {
    if (target === 'image' || target === 'both') {
      this.imageConfig.effects = this.imageConfig.effects.filter(e => e.id !== effectId);
    }

    if (target === 'text' || target === 'both') {
      this.textConfig.effects = this.textConfig.effects.filter(e => e.id !== effectId);
    }

    log.debug(`Removed effect ${effectId} from ${target}`);
  }

  /**
   * Register custom shader
   *
   * @param shader
   *
   */
  public registerShader(shader: CustomShader): void {
    if (this.customShaders.has(shader.id)) {
      log.warn(`Shader ${shader.id} already exists, overwriting`);
    }

    this.customShaders.set(shader.id, shader);
    log.debug(`Registered custom shader: ${shader.id}`);
  }

  /**
   * Get custom shader by ID
   *
   * @param shaderId
   * 
   * @returns The custom shader or null if not found
   *
   */
  public getShader(shaderId: string): CustomShader | null {
    return this.customShaders.get(shaderId) || null;
  }

  /**
   * Create shader from config
   *
   * @param shaderId
   *
   * @param config
   * 
   * @returns The created custom shader or null if creation failed
   *
   */
  public createShaderFromConfig(shaderId: string, config: ShaderConfig): CustomShader | null {
    try {
      // This would implement actual shader creation with PIXI.js
      // For now, return a mock shader
      const shader: CustomShader = {
        id: shaderId,
        name: `Custom Shader ${shaderId}`,
        config,
        isLoaded: true,
        metadata: {
          author: 'KineticSlider',
          description: 'Custom shader created from config',
          version: '1.0.0'
        }
      };

      this.registerShader(shader);
      return shader;
    } catch (error) {
      log.error(`Failed to create shader ${shaderId}:`, error as Error);
      return null;
    }
  }

  /**
   * Update mouse position for interactive effects
   *
   * @param x
   *
   * @param y
   *
   */
  public updateMousePosition(x: number, y: number): void {
    this.mousePosition = { x, y };

    // Update interactive effects if enabled
    if (this.imageConfig.interactive || this.textConfig.interactive) {
      this.updateInteractiveEffects();
    }
  }

  /**
   * Update interactive effects based on mouse position
   */
  private updateInteractiveEffects(): void {
    // This would implement the actual interactive effect updates
    // For now, just log the mouse position for debugging
    if (this.performanceMode === 'high') {
      log.debug(`Mouse position: ${this.mousePosition.x}, ${this.mousePosition.y}`);
    }
  }

  /**
   * Get computed intensity for target
   *
   * @param target
   * 
   * @returns The computed intensity value (0-2)
   *
   */
  public getComputedIntensity(target: 'image' | 'text'): number {
    if (!this.globalEnabled) return 0;

    const config = target === 'image' ? this.imageConfig : this.textConfig;
    if (!config.enabled) return 0;

    return config.globalIntensity;
  }

  /**
   * Get active effects for target
   *
   * @param target
   * 
   * @returns Array of active distortion effects
   *
   */
  public getActiveEffects(target: 'image' | 'text'): DistortionEffect[] {
    const config = target === 'image' ? this.imageConfig : this.textConfig;
    return config.effects.filter(effect => effect.enabled);
  }

  /**
   * Set performance mode
   *
   * @param mode
   *
   */
  public setPerformanceMode(mode: 'high' | 'balanced' | 'performance'): void {
    this.performanceMode = mode;

    // Adjust effects based on performance mode
    switch (mode) {
      case 'performance':
        // Reduce effect complexity
        this.imageConfig.effects.forEach(effect => {
          if (effect.type === 'noise' || effect.type === 'wave') {
            effect.enabled = false;
          }
        });
        break;
      case 'balanced':
        // Moderate effect usage
        break;
      case 'high':
        // Enable all effects
        break;
    }

    log.info(`Distortion effects performance mode set to: ${mode}`);
  }

  /**
   * Reset to default configurations
   */
  public reset(): void {
    this.imageConfig = { ...DEFAULT_IMAGE_DISTORTION };
    this.textConfig = { ...DEFAULT_TEXT_DISTORTION };
    this.initializeBuiltInEffects();

    log.debug('Reset distortion effects to defaults');
  }

  /**
   * Destroy and clean up resources
   */
  public destroy(): void {
    if (this.isDestroyed) return;

    // Clean up active filters
    this.activeFilters.forEach(filter => {
      try {
        filter.destroy?.();
      } catch (error) {
        log.error('Error destroying filter:', error as Error);
      }
    });

    this.activeFilters.clear();
    this.customShaders.clear();
    this.isDestroyed = true;

    log.debug('DistortionEffectsManager destroyed');
  }
} 