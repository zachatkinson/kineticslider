/**
 * @fileoverview Advanced Filter Presets - Extended filter library
 *
 * Extends our EffectPresets with advanced filters from pixi-filters package.
 * Provides comprehensive visual effects including ASCII, Dot, Glitch, CRT, etc.
 *
 * @version 1.0.0
 */

import { gsap } from 'gsap';
import { Filter, Sprite, Container } from 'pixi.js';
import { FilterChain } from './filter-chain';
import {
  EffectPresets,
  type PresetOptions,
  type EffectPresetResult,
  type EffectCategory,
  type EffectPreset,
} from './effect-presets';
// import { ANIMATION_DURATION, EASING } from '../core/constants';

// Import advanced filters from pixi-filters
import {
  AsciiFilter,
  DotFilter,
  GlowFilter,
  CRTFilter,
  GlitchFilter,
  PixelateFilter,
  OldFilmFilter,
  EmbossFilter,
  OutlineFilter,
  ShockwaveFilter,
  RGBSplitFilter,
  MotionBlurFilter,
  KawaseBlurFilter,
  RadialBlurFilter,
  CrossHatchFilter,
  GodrayFilter,
} from 'pixi-filters';

/**
 * Extended preset categories for advanced effects
 */
export type AdvancedEffectCategory =
  | EffectCategory
  | 'blur-advanced'
  | 'distortion-advanced';

/**
 * Extended preset definition interface for advanced effects
 */
export interface AdvancedEffectPreset extends Omit<EffectPreset, 'category'> {
  category: AdvancedEffectCategory;
}

/**
 * AdvancedFilterPresets - Extended effect presets library
 *
 * Provides access to advanced visual effects from pixi-filters package
 * with the same configuration and management as basic effects.
 */
export class AdvancedFilterPresets extends EffectPresets {
  constructor() {
    super();
    this.registerAdvancedPresets();
  }

  /**
   * Register advanced preset with extended category types
   */
  private registerAdvancedPreset(preset: AdvancedEffectPreset): void {
    // Cast to base preset for registration
    super.registerPreset(preset as EffectPreset);
  }

  /**
   * Register advanced filter presets from pixi-filters
   */
  private registerAdvancedPresets(): void {
    // Retro Effects
    this.registerAdvancedPreset({
      name: 'ascii',
      category: 'retro' as EffectCategory,
      description: 'Convert image to ASCII art representation',
      performanceImpact: 4,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['retro games', 'terminal effects', 'artistic processing'],
      create: (options) => this.createAsciiEffect(options),
    });

    this.registerAdvancedPreset({
      name: 'crt',
      category: 'retro' as EffectCategory,
      description: 'Classic CRT monitor effect with scanlines',
      performanceImpact: 3,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['retro gaming', '80s aesthetic', 'vintage displays'],
      create: (options) => this.createCRTEffect(options),
    });

    this.registerAdvancedPreset({
      name: 'oldFilm',
      category: 'retro' as EffectCategory,
      description: 'Vintage film effect with grain and scratches',
      performanceImpact: 3,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['vintage photography', 'film processing', 'nostalgic effects'],
      create: (options) => this.createOldFilmEffect(options),
    });

    // Artistic Effects
    this.registerAdvancedPreset({
      name: 'dot',
      category: 'artistic' as EffectCategory,
      description: 'Halftone dot pattern effect',
      performanceImpact: 2,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['print media', 'comic book style', 'pop art'],
      create: (options) => this.createDotEffect(options),
    });

    this.registerAdvancedPreset({
      name: 'crosshatch',
      category: 'artistic' as EffectCategory,
      description: 'Cross-hatching sketch effect',
      performanceImpact: 3,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['sketch art', 'drawing effects', 'artistic rendering'],
      create: (options) => this.createCrosshatchEffect(options),
    });

    this.registerAdvancedPreset({
      name: 'emboss',
      category: 'artistic' as EffectCategory,
      description: 'Embossed relief effect',
      performanceImpact: 2,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['sculptural effects', 'texture enhancement', 'depth illusion'],
      create: (options) => this.createEmbossEffect(options),
    });

    // Glitch Effects
    this.registerAdvancedPreset({
      name: 'glitch',
      category: 'glitch' as EffectCategory,
      description: 'Digital glitch distortion effect',
      performanceImpact: 4,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['cyberpunk aesthetic', 'error simulation', 'digital art'],
      create: (options) => this.createAdvancedGlitchEffect(options),
    });

    this.registerAdvancedPreset({
      name: 'rgbSplit',
      category: 'glitch' as EffectCategory,
      description: 'RGB channel separation effect',
      performanceImpact: 2,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: [
        'chromatic aberration',
        'analog distortion',
        'psychedelic effects',
      ],
      create: (options) => this.createRGBSplitEffect(options),
    });

    // Advanced Blur Effects
    this.registerAdvancedPreset({
      name: 'kawaseBlur',
      category: 'blur-advanced' as AdvancedEffectCategory,
      description: 'High-quality Kawase blur algorithm',
      performanceImpact: 3,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['performance blur', 'UI effects', 'depth of field'],
      create: (options) => this.createKawaseBlurEffect(options),
    });

    this.registerAdvancedPreset({
      name: 'motionBlur',
      category: 'blur-advanced' as AdvancedEffectCategory,
      description: 'Directional motion blur effect',
      performanceImpact: 4,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['speed effects', 'movement indication', 'dynamic blur'],
      create: (options) => this.createAdvancedMotionBlurEffect(options),
    });

    this.registerAdvancedPreset({
      name: 'radialBlur',
      category: 'blur-advanced' as AdvancedEffectCategory,
      description: 'Radial blur from center point',
      performanceImpact: 4,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['zoom effects', 'focus blur', 'vortex blur'],
      create: (options) => this.createRadialBlurEffect(options),
    });

    // Advanced Distortion Effects
    this.registerAdvancedPreset({
      name: 'shockwave',
      category: 'distortion-advanced' as AdvancedEffectCategory,
      description: 'Shockwave ripple distortion',
      performanceImpact: 4,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['impact effects', 'explosion ripples', 'wave distortions'],
      create: (options) => this.createShockwaveEffect(options),
    });

    this.registerAdvancedPreset({
      name: 'pixelate',
      category: 'distortion-advanced' as AdvancedEffectCategory,
      description: 'Pixelation effect with configurable size',
      performanceImpact: 2,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['retro gaming', 'censoring', 'low-res aesthetic'],
      create: (options) => this.createPixelateEffect(options),
    });

    // Special Effects
    this.registerAdvancedPreset({
      name: 'glow',
      category: 'glow' as AdvancedEffectCategory,
      description: 'Advanced glow effect with customizable parameters',
      performanceImpact: 3,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['neon effects', 'magical auras', 'highlight emphasis'],
      create: (options) => this.createAdvancedGlowEffect(options),
    });

    this.registerAdvancedPreset({
      name: 'outline',
      category: 'artistic' as EffectCategory,
      description: 'Outline stroke effect around objects',
      performanceImpact: 2,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['object highlighting', 'UI selection', 'cartoon effects'],
      create: (options) => this.createOutlineEffect(options),
    });

    this.registerAdvancedPreset({
      name: 'godray',
      category: 'artistic' as EffectCategory,
      description: 'God ray light beam effect',
      performanceImpact: 4,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['atmospheric lighting', 'divine effects', 'volumetric light'],
      create: (options) => this.createGodrayEffect(options),
    });
  }

  // =============================================================================
  // Advanced Effect Creation Methods
  // =============================================================================

  private createAsciiEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = { subtle: 6, moderate: 8, strong: 12, intense: 16 };
    const size = intensityMap[options.intensity];

    const filter = new AsciiFilter({ size });
    const filterChain = new FilterChain({ name: 'ascii-effect' });
    filterChain.addFilter(filter, {
      id: 'ascii',
      animated: true,
      animationProperties: { size },
      duration: options.duration,
      ease: options.ease,
    });

    return this.createEffectResult(filterChain, [filter], options);
  }

  private createDotEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = { subtle: 3, moderate: 5, strong: 8, intense: 12 };
    const scale = intensityMap[options.intensity];

    const filter = new DotFilter({ scale, angle: 5 });
    const filterChain = new FilterChain({ name: 'dot-effect' });
    filterChain.addFilter(filter, {
      id: 'dot',
      animated: true,
      animationProperties: { scale },
      duration: options.duration,
      ease: options.ease,
    });

    return this.createEffectResult(filterChain, [filter], options);
  }

  private createAdvancedGlowEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = { subtle: 5, moderate: 10, strong: 15, intense: 25 };
    const distance = intensityMap[options.intensity];

    const filter = new GlowFilter({
      distance,
      outerStrength: 2,
      innerStrength: 1,
      color: 0xffffff,
      quality: 0.5,
    });

    const filterChain = new FilterChain({ name: 'glow-effect' });
    filterChain.addFilter(filter, {
      id: 'glow',
      animated: true,
      animationProperties: { distance, outerStrength: 2 },
      duration: options.duration,
      ease: options.ease,
    });

    return this.createEffectResult(filterChain, [filter], options);
  }

  private createCRTEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = {
      subtle: 0.3,
      moderate: 0.5,
      strong: 0.7,
      intense: 1.0,
    };
    const intensity = intensityMap[options.intensity];

    const filter = new CRTFilter({
      curvature: 2.0 * intensity,
      lineWidth: 1.0 * intensity,
      lineContrast: 0.25 * intensity,
      noise: 0.1 * intensity,
    });

    const filterChain = new FilterChain({ name: 'crt-effect' });
    filterChain.addFilter(filter, {
      id: 'crt',
      animated: true,
      animationProperties: {
        curvature: 2.0 * intensity,
        lineContrast: 0.25 * intensity,
      },
      duration: options.duration,
      ease: options.ease,
    });

    return this.createEffectResult(filterChain, [filter], options);
  }

  private createAdvancedGlitchEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = { subtle: 5, moderate: 10, strong: 20, intense: 50 };
    const slices = intensityMap[options.intensity];

    const filter = new GlitchFilter({
      slices,
      offset: 10,
      direction: 0,
      fillMode: 0,
      seed: Math.random(),
    });

    const filterChain = new FilterChain({ name: 'glitch-effect' });
    filterChain.addFilter(filter, {
      id: 'glitch',
      animated: true,
      animationProperties: { offset: 10, direction: 360 },
      duration: options.duration,
      ease: options.ease,
      onUpdate: (filter, progress) => {
        // Animate glitch parameters for dynamic effect
        (filter as GlitchFilter).seed = Math.random();
        (filter as GlitchFilter).direction = progress * 360;
      },
    });

    return this.createEffectResult(filterChain, [filter], options);
  }

  private createPixelateEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = { subtle: 2, moderate: 5, strong: 10, intense: 20 };
    const size = intensityMap[options.intensity];

    const filter = new PixelateFilter(size);
    const filterChain = new FilterChain({ name: 'pixelate-effect' });
    filterChain.addFilter(filter, {
      id: 'pixelate',
      animated: true,
      animationProperties: { size },
      duration: options.duration,
      ease: options.ease,
    });

    return this.createEffectResult(filterChain, [filter], options);
  }

  private createOldFilmEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = {
      subtle: 0.3,
      moderate: 0.5,
      strong: 0.7,
      intense: 1.0,
    };
    const intensity = intensityMap[options.intensity];

    const filter = new OldFilmFilter();
    filter.sepia = 0.5 * intensity;
    filter.noise = 0.3 * intensity;
    filter.scratch = 0.5 * intensity;
    filter.scratchDensity = 0.3 * intensity;
    filter.vignetting = 0.3 * intensity;

    const filterChain = new FilterChain({ name: 'oldfilm-effect' });
    filterChain.addFilter(filter, {
      id: 'oldfilm',
      animated: true,
      animationProperties: {
        sepia: 0.5 * intensity,
        noise: 0.3 * intensity,
      },
      duration: options.duration,
      ease: options.ease,
    });

    return this.createEffectResult(filterChain, [filter], options);
  }

  private createEmbossEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = { subtle: 3, moderate: 5, strong: 8, intense: 12 };
    const strength = intensityMap[options.intensity];

    const filter = new EmbossFilter();
    filter.strength = strength;
    const filterChain = new FilterChain({ name: 'emboss-effect' });
    filterChain.addFilter(filter, {
      id: 'emboss',
      animated: true,
      animationProperties: { strength },
      duration: options.duration,
      ease: options.ease,
    });

    return this.createEffectResult(filterChain, [filter], options);
  }

  private createRGBSplitEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = {
      subtle: [3, -3],
      moderate: [5, -5],
      strong: [10, -10],
      intense: [20, -20],
    };
    const [redX, blueX] = intensityMap[options.intensity];

    const filter = new RGBSplitFilter();
    filter.red = [redX, 0];
    filter.green = [0, 0];
    filter.blue = [blueX, 0];

    const filterChain = new FilterChain({ name: 'rgbsplit-effect' });
    filterChain.addFilter(filter, {
      id: 'rgbsplit',
      animated: true,
      animationProperties: {},
      duration: options.duration,
      ease: options.ease,
    });

    return this.createEffectResult(filterChain, [filter], options);
  }

  private createKawaseBlurEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = { subtle: 2, moderate: 4, strong: 8, intense: 16 };
    const blur = intensityMap[options.intensity];

    const filter = new KawaseBlurFilter(blur, 3);
    const filterChain = new FilterChain({ name: 'kawase-blur-effect' });
    filterChain.addFilter(filter, {
      id: 'kawase-blur',
      animated: true,
      animationProperties: { blur },
      duration: options.duration,
      ease: options.ease,
    });

    return this.createEffectResult(filterChain, [filter], options);
  }

  private createAdvancedMotionBlurEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = {
      subtle: [10, 0],
      moderate: [20, 0],
      strong: [40, 0],
      intense: [80, 0],
    };
    const [velocityX, velocityY] = intensityMap[options.intensity];

    const filter = new MotionBlurFilter({
      velocity: [velocityX, velocityY],
      kernelSize: 15,
      offset: 0,
    });

    const filterChain = new FilterChain({ name: 'motion-blur-effect' });
    filterChain.addFilter(filter, {
      id: 'motion-blur',
      animated: true,
      animationProperties: {},
      duration: options.duration,
      ease: options.ease,
    });

    return this.createEffectResult(filterChain, [filter], options);
  }

  private createRadialBlurEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = { subtle: 5, moderate: 10, strong: 20, intense: 40 };
    const radius = intensityMap[options.intensity];

    const filter = new RadialBlurFilter({
      angle: 0,
      center: [0.5, 0.5],
      radius,
      kernelSize: 15,
    });

    const filterChain = new FilterChain({ name: 'radial-blur-effect' });
    filterChain.addFilter(filter, {
      id: 'radial-blur',
      animated: true,
      animationProperties: { radius, angle: 360 },
      duration: options.duration,
      ease: options.ease,
    });

    return this.createEffectResult(filterChain, [filter], options);
  }

  private createCrosshatchEffect(
    _options: Required<PresetOptions>
  ): EffectPresetResult {
    const filter = new CrossHatchFilter();
    const filterChain = new FilterChain({ name: 'crosshatch-effect' });
    filterChain.addFilter(filter, {
      id: 'crosshatch',
      animated: false, // CrossHatch doesn't have animatable properties
      duration: _options.duration,
      ease: _options.ease,
    });

    return this.createEffectResult(filterChain, [filter], _options);
  }

  private createShockwaveEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = { subtle: 10, moderate: 20, strong: 40, intense: 80 };
    const amplitude = intensityMap[options.intensity];

    const filter = new ShockwaveFilter([0.5, 0.5]);
    filter.radius = 0;
    filter.amplitude = amplitude;
    filter.wavelength = 160;
    filter.brightness = 1;
    filter.speed = 500;

    const filterChain = new FilterChain({ name: 'shockwave-effect' });
    filterChain.addFilter(filter, {
      id: 'shockwave',
      animated: true,
      animationProperties: {
        radius: 200,
        amplitude: amplitude * 0.5,
      },
      duration: options.duration,
      ease: options.ease,
      onUpdate: (filter, progress) => {
        // Animate shockwave expansion
        (filter as ShockwaveFilter).radius = progress * 200;
        (filter as ShockwaveFilter).amplitude =
          amplitude * (1 - progress * 0.5);
      },
    });

    return this.createEffectResult(filterChain, [filter], options);
  }

  private createOutlineEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = { subtle: 1, moderate: 2, strong: 4, intense: 8 };
    const thickness = intensityMap[options.intensity];

    const filter = new OutlineFilter({
      thickness,
      color: 0xffffff,
      alpha: 1,
    });

    const filterChain = new FilterChain({ name: 'outline-effect' });
    filterChain.addFilter(filter, {
      id: 'outline',
      animated: true,
      animationProperties: { thickness },
      duration: options.duration,
      ease: options.ease,
    });

    return this.createEffectResult(filterChain, [filter], options);
  }

  private createGodrayEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = {
      subtle: 0.3,
      moderate: 0.5,
      strong: 0.7,
      intense: 1.0,
    };
    const intensity = intensityMap[options.intensity];

    const filter = new GodrayFilter({
      angle: 30,
      gain: 0.5 * intensity,
      lacunarity: 2.5,
      parallel: true,
      time: 0,
    });

    const filterChain = new FilterChain({ name: 'godray-effect' });
    filterChain.addFilter(filter, {
      id: 'godray',
      animated: true,
      animationProperties: {
        gain: 0.5 * intensity,
        time: 10,
      },
      duration: options.duration,
      ease: options.ease,
      onUpdate: (filter, progress) => {
        // Animate god ray movement
        (filter as GodrayFilter).time = progress * 10;
      },
    });

    return this.createEffectResult(filterChain, [filter], options);
  }

  /**
   * Helper method to create standardized effect results
   */
  private createEffectResult(
    filterChain: FilterChain,
    filters: Filter[],
    _options: Required<PresetOptions>
  ): EffectPresetResult {
    let timeline: gsap.core.Timeline | undefined;

    return {
      filterChain,
      filters,
      timeline,
      cleanup: (): void => {
        if (timeline) timeline.kill();
        filterChain.dispose();
      },
      applyTo: (target: Sprite | Container): void => {
        const result = filterChain.applyTo(target);
        timeline = result.timeline;
      },
      removeFrom: (target: Sprite | Container): void => {
        filterChain.removeFrom(target, true);
      },
    };
  }
}
