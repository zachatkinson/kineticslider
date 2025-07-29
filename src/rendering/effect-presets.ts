/**
 * @fileoverview EffectPresets - Reusable effect configurations
 *
 * Comprehensive library of pre-configured visual effects for quick implementation.
 * Includes blur, glow, color manipulation, distortion, and composite effects.
 * All presets are performance-optimized and cross-browser compatible.
 *
 * @version 1.0.0
 */

import { gsap } from 'gsap';
import {
  AlphaFilter,
  BlurFilter,
  ColorMatrixFilter,
  DisplacementFilter,
  NoiseFilter,
  Filter,
  Sprite,
  Container,
  Texture,
} from 'pixi.js';
import { GlowFilter, GrayscaleFilter, OldFilmFilter } from 'pixi-filters';
import { FilterChain } from './filter-chain';
import {
  DisplacementEffects,
  MouseFollowOptions,
  IdleEffectOptions,
} from './displacement-effects';
// import type { AnimationConfig } from '../core/types';
import { ANIMATION_DURATION, EASING } from '../core/constants';

/**
 * Preset intensity levels
 */
export type PresetIntensity = 'subtle' | 'moderate' | 'strong' | 'intense';

/**
 * Effect category classification
 */
export type EffectCategory =
  | 'blur'
  | 'glow'
  | 'color'
  | 'distortion'
  | 'composite'
  | 'displacement';

/**
 * Preset configuration options
 */
export interface PresetOptions {
  /** Effect intensity level */
  intensity?: PresetIntensity;
  /** Animation duration in seconds */
  duration?: number;
  /** GSAP easing function */
  ease?: string;
  /** Whether to enable automatic cleanup */
  autoCleanup?: boolean;
  /** Custom parameters for fine-tuning */
  customParams?: Record<string, unknown>;
  /** Custom settings from UI components */
  customSettings?: Record<string, number | string | boolean>;
}

/**
 * Preset definition interface
 */
export interface EffectPreset {
  /** Preset name */
  name: string;
  /** Preset category */
  category: EffectCategory;
  /** Preset description */
  description: string;
  /** Factory function to create the effect */
  create: (options: Required<PresetOptions>) => EffectPresetResult;
  /** Performance impact rating (1-5) */
  performanceImpact: number;
  /** Browser compatibility notes */
  compatibility: string[];
  /** Recommended use cases */
  useCases: string[];
}

/**
 * Result of creating a preset effect
 */
export interface EffectPresetResult {
  /** Filter chain containing the effects */
  filterChain?: FilterChain;
  /** Displacement effects instance */
  displacementEffects?: DisplacementEffects;
  /** Individual filters for custom usage */
  filters: Filter[];
  /** GSAP timeline for animations */
  timeline?: gsap.core.Timeline;
  /** Cleanup function */
  cleanup: () => void;
  /** Apply to target function */
  applyTo: (target: Sprite | Container) => void;
  /** Remove from target function */
  removeFrom: (target: Sprite | Container) => void;
}

/**
 * Preset library configuration
 */
export interface PresetLibraryConfig {
  /** Enable performance monitoring */
  enableMetrics?: boolean;
  /** Default intensity level */
  defaultIntensity?: PresetIntensity;
  /** Quality level (0-1) */
  qualityLevel?: number;
  /** Enable automatic optimization */
  autoOptimize?: boolean;
}

/**
 * EffectPresets - Reusable effect configurations
 *
 * Comprehensive library of pre-configured visual effects for rapid development
 * and consistent visual quality across the application.
 */
export class EffectPresets {
  private presets: Map<string, EffectPreset> = new Map();
  private config: Required<PresetLibraryConfig>;
  private displacementTexture: Texture | null = null;

  constructor(config: PresetLibraryConfig = {}) {
    this.config = {
      enableMetrics: config.enableMetrics ?? true,
      defaultIntensity: config.defaultIntensity ?? 'moderate',
      qualityLevel: config.qualityLevel ?? 1.0,
      autoOptimize: config.autoOptimize ?? true,
    };

    this.registerBuiltInPresets();
  }

  /**
   * Set displacement texture for displacement-based effects
   */
  setDisplacementTexture(texture: Texture): void {
    this.displacementTexture = texture;
  }

  /**
   * Register a custom preset
   */
  registerPreset(preset: EffectPreset): void {
    this.presets.set(preset.name, preset);
  }

  /**
   * Get preset by name
   */
  getPreset(name: string): EffectPreset | undefined {
    return this.presets.get(name);
  }

  /**
   * Get all presets by category
   */
  getPresetsByCategory(category: EffectCategory): EffectPreset[] {
    return Array.from(this.presets.values()).filter(
      (p) => p.category === category
    );
  }

  /**
   * Get all preset names
   */
  getPresetNames(): string[] {
    return Array.from(this.presets.keys());
  }

  /**
   * Create effect from preset
   */
  createEffect(
    presetName: string,
    options?: PresetOptions
  ): EffectPresetResult {
    const preset = this.presets.get(presetName);
    if (!preset) {
      throw new Error(`Preset "${presetName}" not found`);
    }

    const mergedOptions = this.mergeOptions(options);
    return preset.create(mergedOptions);
  }

  /**
   * Get performance impact for preset
   */
  getPerformanceImpact(presetName: string): number {
    const preset = this.presets.get(presetName);
    return preset ? preset.performanceImpact : 0;
  }

  /**
   * Get recommended presets for performance level
   */
  getRecommendedPresets(maxPerformanceImpact: number = 3): EffectPreset[] {
    return Array.from(this.presets.values())
      .filter((p) => p.performanceImpact <= maxPerformanceImpact)
      .sort((a, b) => a.performanceImpact - b.performanceImpact);
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  /**
   * Register built-in effect presets
   */
  private registerBuiltInPresets(): void {
    // Blur Effects
    this.registerPreset({
      name: 'softBlur',
      category: 'blur',
      description: 'Gentle blur effect for subtle softening',
      performanceImpact: 2,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['background blur', 'depth of field', 'loading states'],
      create: (options) => this.createSoftBlurEffect(options),
    });

    this.registerPreset({
      name: 'motionBlur',
      category: 'blur',
      description: 'Directional blur for motion effects',
      performanceImpact: 3,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['transitions', 'movement indication', 'speed effects'],
      create: (options) => this.createMotionBlurEffect(options),
    });

    this.registerPreset({
      name: 'blur',
      category: 'blur',
      description: 'Standard blur filter with configurable strength',
      performanceImpact: 2,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['background blur', 'focus effects', 'depth blur'],
      create: (options) => this.createBlurEffect(options),
    });

    this.registerPreset({
      name: 'alpha',
      category: 'color',
      description: 'Alpha transparency effect for fade effects',
      performanceImpact: 1,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['fade effects', 'transparency', 'alpha compositing'],
      create: (options) => this.createAlphaEffect(options),
    });

    this.registerPreset({
      name: 'colorMatrix',
      category: 'color',
      description: 'Advanced color manipulation using matrix transformations',
      performanceImpact: 2,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['color grading', 'artistic effects', 'mood enhancement'],
      create: (options) => this.createColorMatrixEffect(options),
    });

    // Glow Effects
    this.registerPreset({
      name: 'softGlow',
      category: 'glow',
      description: 'Warm glow effect for highlights',
      performanceImpact: 3,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['UI highlights', 'hover effects', 'focus indication'],
      create: (options) => this.createSoftGlowEffect(options),
    });

    this.registerPreset({
      name: 'neonGlow',
      category: 'glow',
      description: 'Vibrant neon glow effect',
      performanceImpact: 4,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['cyberpunk themes', 'energy effects', 'special highlights'],
      create: (options) => this.createNeonGlowEffect(options),
    });

    // Color Effects
    this.registerPreset({
      name: 'vintage',
      category: 'color',
      description: 'Vintage color grading with warm tones',
      performanceImpact: 2,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['retro themes', 'nostalgic effects', 'photo filters'],
      create: (options) => this.createVintageEffect(options),
    });

    this.registerPreset({
      name: 'cyberpunk',
      category: 'color',
      description: 'Cyberpunk color palette with neon highlights',
      performanceImpact: 3,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['futuristic themes', 'tech interfaces', 'gaming'],
      create: (options) => this.createCyberpunkEffect(options),
    });

    this.registerPreset({
      name: 'blackAndWhite',
      category: 'color',
      description: 'Classic black and white with contrast adjustment',
      performanceImpact: 1,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['artistic effects', 'focus enhancement', 'minimal themes'],
      create: (options) => this.createBlackAndWhiteEffect(options),
    });

    // Distortion Effects
    this.registerPreset({
      name: 'displacement',
      category: 'distortion',
      description: 'Displacement distortion effect',
      performanceImpact: 4,
      compatibility: ['chrome', 'firefox', 'safari'],
      useCases: ['water effects', 'impact animations', 'magical themes'],
      create: (options) => this.createDisplacementEffect(options),
    });

    this.registerPreset({
      name: 'wave',
      category: 'distortion',
      description: 'Smooth wave distortion',
      performanceImpact: 3,
      compatibility: ['chrome', 'firefox', 'safari'],
      useCases: ['fluid transitions', 'organic movement', 'background effects'],
      create: (options) => this.createWaveEffect(options),
    });

    // Displacement Effects
    this.registerPreset({
      name: 'mouseFollowDisplacement',
      category: 'displacement',
      description: 'Displacement effect that follows mouse movement',
      performanceImpact: 4,
      compatibility: ['chrome', 'firefox', 'safari'],
      useCases: [
        'interactive elements',
        'immersive experiences',
        'portfolio showcases',
      ],
      create: (options) => this.createMouseFollowDisplacementEffect(options),
    });

    this.registerPreset({
      name: 'idleFloat',
      category: 'displacement',
      description: 'Gentle floating displacement animation',
      performanceImpact: 3,
      compatibility: ['chrome', 'firefox', 'safari'],
      useCases: ['idle animations', 'ambient effects', 'organic movement'],
      create: (options) => this.createIdleFloatEffect(options),
    });

    // Composite Effects
    this.registerPreset({
      name: 'cinematicTransition',
      category: 'composite',
      description: 'Cinematic transition with multiple effects',
      performanceImpact: 5,
      compatibility: ['chrome', 'firefox', 'safari'],
      useCases: ['slide transitions', 'scene changes', 'dramatic reveals'],
      create: (options) => this.createCinematicTransitionEffect(options),
    });

    this.registerPreset({
      name: 'glitchEffect',
      category: 'composite',
      description: 'Digital glitch effect with distortion and color shifts',
      performanceImpact: 4,
      compatibility: ['chrome', 'firefox', 'safari'],
      useCases: ['error states', 'cyberpunk themes', 'digital art'],
      create: (options) => this.createGlitchEffect(options),
    });
  }

  /**
   * Merge options with defaults
   */
  private mergeOptions(options?: PresetOptions): Required<PresetOptions> {
    return {
      intensity: options?.intensity ?? this.config.defaultIntensity,
      duration: options?.duration ?? ANIMATION_DURATION.STANDARD,
      ease: options?.ease ?? EASING.EASE_OUT,
      autoCleanup: options?.autoCleanup ?? true,
      customParams: options?.customParams ?? {},
      customSettings: options?.customSettings ?? {},
    };
  }

  /**
   * Get intensity multiplier
   */
  private getIntensityMultiplier(intensity: PresetIntensity): number {
    switch (intensity) {
      case 'subtle':
        return 0.3;
      case 'moderate':
        return 0.6;
      case 'strong':
        return 0.8;
      case 'intense':
        return 1.0;
      default:
        return 0.6;
    }
  }

  // =============================================================================
  // Preset Implementation Methods
  // =============================================================================

  /**
   * Create soft blur effect
   */
  private createSoftBlurEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensity = this.getIntensityMultiplier(options.intensity);
    const blurFilter = new BlurFilter({ strength: intensity * 8, quality: 4 });

    const filterChain = new FilterChain({ name: 'softBlur' });
    filterChain.addFilter(blurFilter, {
      id: 'blur',
      animationProperties: { strength: intensity * 8 },
      duration: options.duration,
      ease: options.ease,
    });

    const timeline = gsap.timeline();
    const filters = [blurFilter];

    return {
      filterChain,
      filters,
      timeline,
      cleanup: (): void => {
        timeline.kill();
        filterChain.dispose();
      },
      applyTo: (target): void => {
        filterChain.applyTo(target);
      },
      removeFrom: (target): void => {
        filterChain.removeFrom(target);
      },
    };
  }

  /**
   * Create motion blur effect
   */
  private createMotionBlurEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensity = this.getIntensityMultiplier(options.intensity);
    const blurFilter = new BlurFilter({ strength: intensity * 12, quality: 2 });

    const filterChain = new FilterChain({ name: 'motionBlur' });
    filterChain.addFilter(blurFilter, {
      id: 'motionBlur',
      animationProperties: {
        strength: intensity * 12,
        quality: 2,
      },
      duration: options.duration,
      ease: options.ease,
    });

    const timeline = gsap.timeline();
    const filters = [blurFilter];

    return {
      filterChain,
      filters,
      timeline,
      cleanup: (): void => {
        timeline.kill();
        filterChain.dispose();
      },
      applyTo: (target): void => {
        filterChain.applyTo(target);
      },
      removeFrom: (target): void => {
        filterChain.removeFrom(target);
      },
    };
  }

  /**
   * Create glow effect
   */
  private createSoftGlowEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensity = this.getIntensityMultiplier(options.intensity);

    // Create glow using proper GlowFilter from pixi-filters with API defaults
    const glowFilter = new GlowFilter({
      distance: 10 + intensity * 5, // Default 10, slight increase based on intensity
      outerStrength: 4 + intensity * 2, // Default 4, slight increase based on intensity
      innerStrength: 0, // Default is 0
      color: 0xff0000, // Red color for better visibility testing
      alpha: 1, // Default alpha
      knockout: false, // Default knockout
      quality: 0.1, // Use API default value
    });

    const filterChain = new FilterChain({ name: 'softGlow' });
    filterChain.addFilter(glowFilter, {
      id: 'glow',
      animationProperties: {
        distance: 10 + intensity * 5,
        outerStrength: 4 + intensity * 2,
      },
      duration: options.duration,
      ease: options.ease,
    });

    const timeline = gsap.timeline();
    const filters = [glowFilter];

    return {
      filterChain,
      filters,
      timeline,
      cleanup: (): void => {
        timeline.kill();
        filterChain.dispose();
      },
      applyTo: (target): void => {
        filterChain.applyTo(target);
      },
      removeFrom: (target): void => {
        filterChain.removeFrom(target);
      },
    };
  }

  /**
   * Create neon glow effect
   */
  private createNeonGlowEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensity = this.getIntensityMultiplier(options.intensity);

    const blurFilter = new BlurFilter({ strength: intensity * 10, quality: 4 });
    const colorFilter = new ColorMatrixFilter();

    // Neon colors - cyan/magenta
    colorFilter.brightness(1 + intensity * 0.5, false);
    colorFilter.contrast(1 + intensity * 0.4, false);
    colorFilter.hue(180 + intensity * 60, false);

    const filterChain = new FilterChain({ name: 'neonGlow' });
    filterChain.addFilter(blurFilter, {
      id: 'neonBlur',
      animationProperties: { strength: intensity * 10 },
      duration: options.duration,
      ease: options.ease,
    });

    filterChain.addFilter(colorFilter, {
      id: 'neonColor',
      animationProperties: { alpha: 1 },
      duration: options.duration,
      ease: options.ease,
    });

    const timeline = gsap.timeline();
    const filters = [blurFilter, colorFilter];

    return {
      filterChain,
      filters,
      timeline,
      cleanup: (): void => {
        timeline.kill();
        filterChain.dispose();
      },
      applyTo: (target): void => {
        filterChain.applyTo(target);
      },
      removeFrom: (target): void => {
        filterChain.removeFrom(target);
      },
    };
  }

  /**
   * Create old film effect
   */
  private createVintageEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensity = this.getIntensityMultiplier(options.intensity);

    // Create vintage using proper OldFilmFilter with enhanced scratch/noise effects
    const oldFilmFilter = new OldFilmFilter({
      noise: 0.1 + 0.1 * intensity, // Much more subtle noise: 0.1-0.2 range
      noiseSize: 1, // PIXI default
      scratch: 0.6 + 0.4 * intensity, // Enhanced scratches: 0.6-1.0 range for more visible scratches
      scratchDensity: 0.4 + 0.3 * intensity, // Enhanced scratch density: 0.4-0.7 range
      scratchWidth: 1, // PIXI default
      seed: Math.random(), // Random seed for varying effects
      sepia: 0.3 * intensity, // Keep sepia as before
      vignetting: 0.3 * intensity, // Keep vignetting as before
      vignettingAlpha: 1, // PIXI default 1.0
      vignettingBlur: 1, // PIXI default
    });

    const filterChain = new FilterChain({ name: 'vintage' });
    filterChain.addFilter(oldFilmFilter, {
      id: 'oldFilm',
      animationProperties: {
        noise: 0.1 + 0.1 * intensity, // Much more subtle noise
        scratch: 0.6 + 0.4 * intensity, // Animate scratches
      },
      duration: options.duration,
      ease: options.ease,
    });

    // Create continuous animation timeline for authentic vintage film feel
    const timeline = gsap.timeline({ repeat: -1 });

    // Continuously change seed every 0.1 seconds for flickering film grain
    timeline.to(oldFilmFilter, {
      duration: 0.1,
      ease: 'none',
      repeat: -1,
      onRepeat: () => {
        oldFilmFilter.seed = Math.random();
      },
    });

    // Vary noise intensity every 0.3 seconds
    timeline.to(
      oldFilmFilter,
      {
        duration: 0.3,
        noise: 0.08 + 0.12 * intensity, // Much more subtle noise animation
        ease: 'power2.inOut',
        repeat: -1,
        yoyo: true,
      },
      0
    );

    // Vary scratch intensity every 0.5 seconds
    timeline.to(
      oldFilmFilter,
      {
        duration: 0.5,
        scratch: 0.5 + 0.5 * intensity,
        ease: 'power2.inOut',
        repeat: -1,
        yoyo: true,
      },
      0
    );

    const filters = [oldFilmFilter];

    return {
      filterChain,
      filters,
      timeline,
      cleanup: (): void => {
        timeline.kill();
        filterChain.dispose();
      },
      applyTo: (target): void => {
        filterChain.applyTo(target);
      },
      removeFrom: (target): void => {
        filterChain.removeFrom(target);
      },
    };
  }

  /**
   * Create cyberpunk effect
   */
  private createCyberpunkEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensity = this.getIntensityMultiplier(options.intensity);
    const colorFilter = new ColorMatrixFilter();

    // Cyberpunk color palette
    colorFilter.brightness(1 + intensity * 0.2, false);
    colorFilter.contrast(1 + intensity * 0.3, false);
    colorFilter.saturate(1 + intensity * 0.5, false);
    colorFilter.hue(300 + intensity * 40, false);

    const filterChain = new FilterChain({ name: 'cyberpunk' });
    filterChain.addFilter(colorFilter, {
      id: 'cyberpunkColor',
      animationProperties: { alpha: 1 },
      duration: options.duration,
      ease: options.ease,
    });

    const timeline = gsap.timeline();
    const filters = [colorFilter];

    return {
      filterChain,
      filters,
      timeline,
      cleanup: (): void => {
        timeline.kill();
        filterChain.dispose();
      },
      applyTo: (target): void => {
        filterChain.applyTo(target);
      },
      removeFrom: (target): void => {
        filterChain.removeFrom(target);
      },
    };
  }

  /**
   * Create grayscale effect
   */
  private createBlackAndWhiteEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    // Create grayscale using proper GrayscaleFilter from pixi-filters
    const grayscaleFilter = new GrayscaleFilter();

    const filterChain = new FilterChain({ name: 'blackAndWhite' });
    filterChain.addFilter(grayscaleFilter, {
      id: 'grayscale',
      animationProperties: { alpha: 1 },
      duration: options.duration,
      ease: options.ease,
    });

    const timeline = gsap.timeline();
    const filters = [grayscaleFilter];

    return {
      filterChain,
      filters,
      timeline,
      cleanup: (): void => {
        timeline.kill();
        filterChain.dispose();
      },
      applyTo: (target): void => {
        filterChain.applyTo(target);
      },
      removeFrom: (target): void => {
        filterChain.removeFrom(target);
      },
    };
  }

  /**
   * Create displacement effect
   */
  private createDisplacementEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    if (!this.displacementTexture) {
      throw new Error('Displacement texture required for displacement effect');
    }

    // Create displacement sprite for the filter
    const displacementSprite = new Sprite(this.displacementTexture);

    // Setup displacement sprite with different scales based on intensity
    const scaleMap = {
      subtle: { scale: 10, spriteScale: 1 },
      moderate: { scale: 20, spriteScale: 1.5 },
      strong: { scale: 40, spriteScale: 2 },
      intense: { scale: 80, spriteScale: 3 },
    };

    const settings = scaleMap[options.intensity];

    // Configure displacement sprite
    displacementSprite.scale.set(settings.spriteScale);
    displacementSprite.anchor.set(0.5);

    // Create displacement filter with proper scale
    const displacementFilter = new DisplacementFilter({
      sprite: displacementSprite,
      scale: settings.scale,
    });

    const filterChain = new FilterChain({ name: 'displacement' });
    filterChain.addFilter(displacementFilter, {
      id: 'displacement',
      animationProperties: {
        scale: settings.scale,
      },
      duration: options.duration,
      ease: options.ease,
    });

    // Animate the displacement sprite for dynamic effect
    const timeline = gsap.timeline({ repeat: -1 });
    timeline.to(displacementSprite, {
      x: 100,
      y: 100,
      rotation: Math.PI * 2,
      duration: 10,
      ease: 'none',
    });

    const filters = [displacementFilter];

    // Displacement sprite is used by the filter directly

    return {
      filterChain,
      filters,
      timeline,
      cleanup: (): void => {
        timeline.kill();
        filterChain.dispose();
        // Note: displacement sprite cleanup is handled by the filter
      },
      applyTo: (target): void => {
        // The displacement sprite will be managed by the filter itself
        // PIXI handles adding it to the appropriate container
        filterChain.applyTo(target);
      },
      removeFrom: (target): void => {
        filterChain.removeFrom(target);
      },
    };
  }

  /**
   * Create wave effect
   */
  private createWaveEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    if (!this.displacementTexture) {
      throw new Error('Displacement texture required for wave effect');
    }

    const intensity = this.getIntensityMultiplier(options.intensity);
    const displacementSprite = new Sprite(this.displacementTexture);
    const displacementFilter = new DisplacementFilter(displacementSprite, 0);

    const filterChain = new FilterChain({ name: 'wave' });
    filterChain.addFilter(displacementFilter, {
      id: 'waveDisplacement',
      animationProperties: {
        'scale.x': intensity * 30,
        'scale.y': intensity * 15,
      },
      duration: options.duration,
      ease: options.ease,
    });

    const timeline = gsap.timeline();
    const filters = [displacementFilter];

    return {
      filterChain,
      filters,
      timeline,
      cleanup: (): void => {
        timeline.kill();
        filterChain.dispose();
      },
      applyTo: (target): void => {
        filterChain.applyTo(target);
      },
      removeFrom: (target): void => {
        filterChain.removeFrom(target);
      },
    };
  }

  /**
   * Create mouse follow displacement effect
   */
  private createMouseFollowDisplacementEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    if (!this.displacementTexture) {
      throw new Error(
        'Displacement texture required for mouse follow displacement'
      );
    }

    const intensity = this.getIntensityMultiplier(options.intensity);
    const displacementEffects = new DisplacementEffects(
      this.displacementTexture
    );

    const mouseFollowOptions: MouseFollowOptions = {
      intensity: intensity,
      radius: (options.customParams.radius as number) || 150,
      smoothing: (options.customParams.smoothing as boolean) ?? true,
      duration: options.duration,
      ease: options.ease,
    };

    const timeline = gsap.timeline();
    const filters: Filter[] = [];

    return {
      displacementEffects,
      filters,
      timeline,
      cleanup: (): void => {
        timeline.kill();
        displacementEffects.dispose();
      },
      applyTo: (target): void => {
        if (target instanceof Sprite) {
          displacementEffects.createMouseFollowEffect(
            target,
            mouseFollowOptions
          );
        }
      },
      removeFrom: (_target): void => {
        displacementEffects.stopAllEffects();
      },
    };
  }

  /**
   * Create idle float effect
   */
  private createIdleFloatEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    if (!this.displacementTexture) {
      throw new Error('Displacement texture required for idle float effect');
    }

    const intensity = this.getIntensityMultiplier(options.intensity);
    const displacementEffects = new DisplacementEffects(
      this.displacementTexture
    );

    const idleOptions: IdleEffectOptions = {
      type: 'float',
      intensity: intensity,
      duration: options.duration * 2,
      loop: true,
      ease: options.ease,
    };

    const timeline = gsap.timeline();
    const filters: Filter[] = [];

    return {
      displacementEffects,
      filters,
      timeline,
      cleanup: (): void => {
        timeline.kill();
        displacementEffects.dispose();
      },
      applyTo: (target): void => {
        if (target instanceof Sprite) {
          displacementEffects.createIdleEffect(target, idleOptions);
        }
      },
      removeFrom: (_target): void => {
        displacementEffects.stopAllEffects();
      },
    };
  }

  /**
   * Create cinematic transition effect
   */
  private createCinematicTransitionEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensity = this.getIntensityMultiplier(options.intensity);

    const blurFilter = new BlurFilter({ strength: 0, quality: 4 });
    const colorFilter = new ColorMatrixFilter();

    colorFilter.brightness(1 + intensity * 0.2, false);
    colorFilter.contrast(1 + intensity * 0.3, false);

    const filterChain = new FilterChain({
      name: 'cinematicTransition',
      mode: 'sequential',
      staggerDelay: 0.2,
    });

    filterChain.addFilter(blurFilter, {
      id: 'cinematicBlur',
      animationProperties: { strength: intensity * 15 },
      duration: options.duration * 0.6,
      ease: EASING.EASE_IN_OUT,
    });

    filterChain.addFilter(colorFilter, {
      id: 'cinematicColor',
      animationProperties: { alpha: 1 },
      duration: options.duration * 0.8,
      ease: options.ease,
    });

    const timeline = gsap.timeline();
    const filters = [blurFilter, colorFilter];

    return {
      filterChain,
      filters,
      timeline,
      cleanup: (): void => {
        timeline.kill();
        filterChain.dispose();
      },
      applyTo: (target): void => {
        filterChain.applyTo(target);
      },
      removeFrom: (target): void => {
        filterChain.removeFrom(target);
      },
    };
  }

  /**
   * Create glitch effect
   */
  private createGlitchEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensity = this.getIntensityMultiplier(options.intensity);

    const colorFilter = new ColorMatrixFilter();
    const noiseFilter = new NoiseFilter({
      noise: intensity * 0.3,
      seed: Math.random(),
    });

    // Glitch color shift
    colorFilter.hue(intensity * 180, true);
    colorFilter.contrast(1 + intensity * 0.5, true);

    const filterChain = new FilterChain({
      name: 'glitchEffect',
      mode: 'parallel',
    });

    filterChain.addFilter(colorFilter, {
      id: 'glitchColor',
      animationProperties: { alpha: 1 },
      duration: options.duration * 0.3,
      ease: 'steps(10)',
    });

    filterChain.addFilter(noiseFilter, {
      id: 'glitchNoise',
      animationProperties: { noise: intensity * 0.3 },
      duration: options.duration * 0.5,
      ease: 'steps(5)',
    });

    const timeline = gsap.timeline();
    const filters = [colorFilter, noiseFilter];

    return {
      filterChain,
      filters,
      timeline,
      cleanup: (): void => {
        timeline.kill();
        filterChain.dispose();
      },
      applyTo: (target): void => {
        filterChain.applyTo(target);
      },
      removeFrom: (target): void => {
        filterChain.removeFrom(target);
      },
    };
  }

  /**
   * Create alpha transparency effect
   */
  private createAlphaEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = {
      subtle: 0.85,
      moderate: 0.7,
      strong: 0.5,
      intense: 0.3,
    };
    const alpha = intensityMap[options.intensity];

    const alphaFilter = new AlphaFilter({ alpha });
    const filterChain = new FilterChain({ name: 'alphaEffect' });

    filterChain.addFilter(alphaFilter, {
      id: 'alpha',
      animationProperties: { alpha },
      duration: options.duration,
      ease: options.ease,
    });

    const timeline = gsap.timeline();
    const filters = [alphaFilter];

    return {
      filterChain,
      filters,
      timeline,
      cleanup: (): void => {
        timeline.kill();
        filterChain.dispose();
      },
      applyTo: (target): void => {
        filterChain.applyTo(target);
      },
      removeFrom: (target): void => {
        filterChain.removeFrom(target);
      },
    };
  }

  /**
   * Create standard blur effect
   */
  private createBlurEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = {
      subtle: 2,
      moderate: 4,
      strong: 8,
      intense: 16,
    };
    const blur = intensityMap[options.intensity];

    const blurFilter = new BlurFilter(blur);
    const filterChain = new FilterChain({ name: 'blurEffect' });

    filterChain.addFilter(blurFilter, {
      id: 'blur',
      animationProperties: { strength: blur },
      duration: options.duration,
      ease: options.ease,
    });

    const timeline = gsap.timeline();
    const filters = [blurFilter];

    return {
      filterChain,
      filters,
      timeline,
      cleanup: (): void => {
        timeline.kill();
        filterChain.dispose();
      },
      applyTo: (target): void => {
        filterChain.applyTo(target);
      },
      removeFrom: (target): void => {
        filterChain.removeFrom(target);
      },
    };
  }

  /**
   * Create color matrix effect with various color transformations
   */
  private createColorMatrixEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const colorMatrixFilter = new ColorMatrixFilter();

    // Different color matrix effects based on intensity
    const effects = {
      subtle: (): void => {
        colorMatrixFilter.sepia(false);
        colorMatrixFilter.saturate(1.2, false);
        colorMatrixFilter.brightness(1.1, false);
      },
      moderate: (): void => {
        colorMatrixFilter.vintage(false);
        colorMatrixFilter.contrast(1.2, false);
        colorMatrixFilter.saturate(1.4, false);
      },
      strong: (): void => {
        colorMatrixFilter.polaroid(false);
        colorMatrixFilter.contrast(1.4, false);
        colorMatrixFilter.brightness(1.2, false);
      },
      intense: (): void => {
        colorMatrixFilter.kodachrome(false);
        colorMatrixFilter.contrast(1.6, false);
        colorMatrixFilter.saturate(1.8, false);
      },
    };

    // Apply the effect based on intensity
    effects[options.intensity]();

    const filterChain = new FilterChain({ name: 'colorMatrixEffect' });

    filterChain.addFilter(colorMatrixFilter, {
      id: 'colorMatrix',
      animationProperties: { alpha: 1 },
      duration: options.duration,
      ease: options.ease,
    });

    const timeline = gsap.timeline();
    const filters = [colorMatrixFilter];

    return {
      filterChain,
      filters,
      timeline,
      cleanup: (): void => {
        timeline.kill();
        filterChain.dispose();
      },
      applyTo: (target): void => {
        filterChain.applyTo(target);
      },
      removeFrom: (target): void => {
        filterChain.removeFrom(target);
      },
    };
  }
}
