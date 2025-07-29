/**
 * @fileoverview Advanced Filter Presets - Extended filter library
 *
 * Extends our EffectPresets with advanced filters from pixi-filters package.
 * Provides comprehensive visual effects including ASCII, Dot, Glitch, CRT, etc.
 *
 * @version 1.0.0
 */

import { gsap } from 'gsap';
import { Filter, Sprite, Container, Assets, Texture } from 'pixi.js';
import { FilterChain } from './filter-chain';
import { FilterManager } from './filter-manager';
import { debugLogger } from '../utils/debug-logger';
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
  AdvancedBloomFilter,
  AdjustmentFilter,
  AsciiFilter,
  BackdropBlurFilter,
  BevelFilter,
  BloomFilter,
  BulgePinchFilter,
  ColorGradientFilter,
  ColorMapFilter,
  ColorOverlayFilter,
  ColorReplaceFilter,
  ConvolutionFilter,
  DotFilter,
  DropShadowFilter,
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
  MultiColorReplaceFilter,
  RadialBlurFilter,
  CrossHatchFilter,
  GodrayFilter,
  HslAdjustmentFilter,
  ReflectionFilter,
  SimpleLightmapFilter,
  SimplexNoiseFilter,
  TiltShiftFilter,
  TwistFilter,
  ZoomBlurFilter,
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
      name: 'ascii',
      category: 'artistic' as EffectCategory,
      description: 'Convert image to ASCII art representation',
      performanceImpact: 3,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['retro games', 'terminal effects', 'artistic processing'],
      create: (options) => this.createAsciiEffect(options),
    });

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
      name: 'dropShadow',
      category: 'effects' as EffectCategory,
      description: 'Drop shadow effect with customizable offset and blur',
      performanceImpact: 2,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['depth effects', 'layered visuals', 'text shadows'],
      create: (options) => this.createDropShadowEffect(options),
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

    this.registerAdvancedPreset({
      name: 'adjustment',
      category: 'artistic' as EffectCategory,
      description:
        'Comprehensive color adjustment with brightness, contrast, and saturation',
      performanceImpact: 2,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['color correction', 'mood enhancement', 'visual tuning'],
      create: (options) => this.createAdjustmentEffect(options),
    });

    this.registerAdvancedPreset({
      name: 'bloom',
      category: 'glow' as EffectCategory,
      description: 'Fast bloom effect for performance-focused applications',
      performanceImpact: 2,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['light glow', 'bright highlights', 'fast bloom effects'],
      create: (options) => this.createBloomEffect(options),
    });

    this.registerAdvancedPreset({
      name: 'advancedBloom',
      category: 'glow' as EffectCategory,
      description: 'Professional bloom effect with advanced brightness control',
      performanceImpact: 4,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['dramatic lighting', 'glow effects', 'cinematic bloom'],
      create: (options) => this.createAdvancedBloomEffect(options),
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
      name: 'multiColorReplace',
      category: 'color-advanced' as AdvancedEffectCategory,
      description: 'Replace multiple colors with new colors simultaneously',
      performanceImpact: 3,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['color theming', 'recoloring', 'palette swapping'],
      create: (options) => this.createMultiColorReplaceEffect(options),
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
      name: 'simpleLightmap',
      category: 'lighting' as EffectCategory,
      description: 'Lightmap effect for dynamic lighting',
      performanceImpact: 3,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: [
        'dynamic lighting',
        'atmospheric effects',
        'spotlight effects',
      ],
      create: (options) => this.createSimpleLightmapEffect(options),
    });

    this.registerAdvancedPreset({
      name: 'simplexNoise',
      category: 'artistic' as EffectCategory,
      description: 'Procedural simplex noise texture generation',
      performanceImpact: 3,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: [
        'texture generation',
        'organic patterns',
        'procedural effects',
      ],
      create: (options) => this.createSimplexNoiseEffect(options),
    });

    this.registerAdvancedPreset({
      name: 'tiltShift',
      category: 'blur-advanced' as AdvancedEffectCategory,
      description: 'Tilt-shift camera effect with selective focus',
      performanceImpact: 4,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['miniature effect', 'selective focus', 'depth of field'],
      create: (options) => this.createTiltShiftEffect(options),
    });

    this.registerAdvancedPreset({
      name: 'twist',
      category: 'distortion-advanced' as AdvancedEffectCategory,
      description: 'Circular twist distortion effect',
      performanceImpact: 3,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['whirlpool effect', 'spiral distortion', 'dynamic warping'],
      create: (options) => this.createTwistEffect(options),
    });

    this.registerAdvancedPreset({
      name: 'zoomBlur',
      category: 'blur-advanced' as AdvancedEffectCategory,
      description: 'Radial zoom blur effect from center point',
      performanceImpact: 4,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: [
        'speed effects',
        'zoom transitions',
        'motion blur',
        'impact effects',
      ],
      create: (options) => this.createZoomBlurEffect(options),
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

    this.registerAdvancedPreset({
      name: 'bevel',
      category: 'artistic' as EffectCategory,
      description: '3D bevel effect with lighting and shadows',
      performanceImpact: 3,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['3D buttons', 'raised surfaces', 'embossed text'],
      create: (options) => this.createBevelEffect(options),
    });

    this.registerAdvancedPreset({
      name: 'bulgePinch',
      category: 'distortion-advanced' as AdvancedEffectCategory,
      description: 'Bulge and pinch distortion effects',
      performanceImpact: 3,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['lens distortion', 'magnification effects', 'warp distortion'],
      create: (options) => this.createBulgePinchEffect(options),
    });

    this.registerAdvancedPreset({
      name: 'colorGradient',
      category: 'artistic' as EffectCategory,
      description: 'Color gradient overlay effects',
      performanceImpact: 2,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['mood tinting', 'color overlays', 'atmospheric effects'],
      create: (options) => this.createColorGradientEffect(options),
    });

    this.registerAdvancedPreset({
      name: 'colorMap',
      category: 'artistic' as EffectCategory,
      description: 'Color remapping using texture-based color lookup',
      performanceImpact: 2,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['color grading', 'vintage effects', 'stylized rendering'],
      create: (options) => this.createColorMapEffect(options),
    });

    this.registerAdvancedPreset({
      name: 'colorOverlay',
      category: 'artistic' as EffectCategory,
      description: 'Solid color overlay with alpha blending',
      performanceImpact: 1,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['color tinting', 'mood effects', 'UI theming'],
      create: (options) => this.createColorOverlayEffect(options),
    });

    this.registerAdvancedPreset({
      name: 'colorReplace',
      category: 'artistic' as EffectCategory,
      description: 'Replace specific colors with tolerance control',
      performanceImpact: 2,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: [
        'color correction',
        'selective recoloring',
        'brand color updates',
      ],
      create: (options) => this.createColorReplaceEffect(options),
    });

    this.registerAdvancedPreset({
      name: 'hslAdjustment',
      category: 'artistic' as EffectCategory,
      description: 'HSL color adjustment for hue, saturation, and lightness',
      performanceImpact: 2,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['color correction', 'mood adjustment', 'artistic styling'],
      create: (options) => this.createHslAdjustmentEffect(options),
    });

    this.registerAdvancedPreset({
      name: 'convolution',
      category: 'artistic' as EffectCategory,
      description: 'Custom convolution matrix effects',
      performanceImpact: 3,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['edge detection', 'sharpening', 'embossing'],
      create: (options) => this.createConvolutionEffect(options),
    });

    // Modern Backdrop Blur Effect
    this.registerAdvancedPreset({
      name: 'backdropBlur',
      category: 'blur-advanced' as AdvancedEffectCategory,
      description: 'Backdrop blur effect for depth and layering',
      performanceImpact: 3,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['depth effects', 'UI layering', 'focus effects'],
      create: (options) => this.createBackdropBlurEffect(options),
    });

    // Reflection Effect
    this.registerAdvancedPreset({
      name: 'reflection',
      category: 'artistic' as EffectCategory,
      description: 'Water reflection effect with animated waves',
      performanceImpact: 3,
      compatibility: ['chrome', 'firefox', 'safari', 'edge'],
      useCases: ['water effects', 'mirror reflections', 'artistic scenes'],
      create: (options) => this.createReflectionEffect(options),
    });
  }

  // =============================================================================
  // Advanced Effect Creation Methods
  // =============================================================================

  /**
   * Create ASCII effect using original image colors by default
   */
  private createAsciiEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    // Use replaceColor: false by default to preserve original image colors
    // Size mapping: smaller size = more detailed ASCII characters
    const intensityMap = {
      subtle: { size: 16 }, // Large ASCII blocks
      moderate: { size: 12 }, // Medium ASCII blocks
      strong: { size: 8 }, // Smaller ASCII blocks
      intense: { size: 6 }, // Finest ASCII detail
    };
    const settings = intensityMap[options.intensity];

    // Create ASCII filter
    const filter = new AsciiFilter({
      size: settings.size,
      color: 0xffffff,
      replaceColor: false, // Use original image colors
    });

    debugLogger.debug('ASCII Filter created', 'FILTER_PRESETS');

    const filterChain = new FilterChain({ name: 'ascii-effect' });
    filterChain.addFilter(filter, {
      id: 'ascii',
      animated: true,
      animationProperties: { size: settings.size },
      duration: options.duration,
      ease: options.ease,
    });

    // Enhanced applyTo method that ensures texture is GPU-ready
    const originalResult = this.createEffectResult(
      filterChain,
      [filter],
      options
    );

    return {
      ...originalResult,
      applyTo: async (target: Sprite | Container): Promise<void> => {
        const filterManager = FilterManager.getInstance();

        debugLogger.debug(
          'Applying ASCII filter with modern filter manager',
          'FILTER_PRESETS'
        );

        // Use FilterManager for proper isolation
        const result = await filterManager.applyFilter(
          target,
          filter,
          'ascii',
          {
            isolate: true, // Clear all other filters to prevent conflicts
          }
        );

        if (result.success) {
          debugLogger.debug(
            'ASCII filter successfully applied',
            'FILTER_PRESETS'
          );
        } else {
          debugLogger.error(
            'Failed to apply ASCII filter',
            'FILTER_PRESETS',
            result.error
          );
        }
      },
    };
  }

  private createDotEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = {
      subtle: { scale: 2, angle: 5, grayscale: false },
      moderate: { scale: 4, angle: 15, grayscale: false },
      strong: { scale: 6, angle: 30, grayscale: true },
      intense: { scale: 8, angle: 45, grayscale: true },
    };
    const settings = intensityMap[options.intensity];

    const filter = new DotFilter({
      scale: settings.scale,
      angle: settings.angle,
      grayscale: settings.grayscale,
    });
    const filterChain = new FilterChain({ name: 'dot-effect' });
    filterChain.addFilter(filter, {
      id: 'dot',
      animated: true,
      animationProperties: {
        scale: settings.scale,
        angle: settings.angle,
      },
      duration: options.duration,
      ease: options.ease,
    });

    return this.createEffectResult(filterChain, [filter], options);
  }

  private createDropShadowEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = {
      subtle: { offsetX: 2, offsetY: 2, blur: 1, alpha: 0.3 },
      moderate: { offsetX: 4, offsetY: 4, blur: 2, alpha: 0.5 },
      strong: { offsetX: 6, offsetY: 6, blur: 3, alpha: 0.7 },
      intense: { offsetX: 8, offsetY: 8, blur: 4, alpha: 0.9 },
    };
    const settings = intensityMap[options.intensity];

    const filter = new DropShadowFilter({
      offset: { x: settings.offsetX, y: settings.offsetY },
      blur: settings.blur,
      alpha: settings.alpha,
      color: 0x000000,
      quality: 4,
      shadowOnly: false, // Show both panel and shadow
    });

    debugLogger.info(
      `DropShadow filter created - offsetX: ${settings.offsetX}, offsetY: ${settings.offsetY}, blur: ${settings.blur}, alpha: ${settings.alpha}, shadowOnly: false`,
      'FILTER_PRESETS'
    );

    const filterChain = new FilterChain({ name: 'dropshadow-effect' });
    filterChain.addFilter(filter, {
      id: 'dropShadow',
      animated: true,
      animationProperties: {
        blur: settings.blur,
        alpha: settings.alpha,
      },
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
      innerStrength: 0, // Default is 0
      color: 0xffffff,
      alpha: 1, // Default alpha
      knockout: false, // Default knockout
      quality: 0.1, // Use API default
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
      subtle: {
        curvature: 0.5,
        lineWidth: 0.8,
        lineContrast: 0.15,
        noise: 0.1,
        vignetting: 0.2,
      },
      moderate: {
        curvature: 1.0,
        lineWidth: 1.0,
        lineContrast: 0.25,
        noise: 0.2,
        vignetting: 0.3,
      },
      strong: {
        curvature: 1.5,
        lineWidth: 1.2,
        lineContrast: 0.35,
        noise: 0.3,
        vignetting: 0.4,
      },
      intense: {
        curvature: 2.0,
        lineWidth: 1.5,
        lineContrast: 0.45,
        noise: 0.4,
        vignetting: 0.5,
      },
    };
    const settings = intensityMap[options.intensity];

    const filter = new CRTFilter({
      curvature: settings.curvature,
      lineWidth: settings.lineWidth,
      lineContrast: settings.lineContrast,
      noise: settings.noise,
      vignetting: settings.vignetting,
      vignettingAlpha: 1,
      vignettingBlur: 0.3,
      verticalLine: false,
      time: 0.3,
    });

    const filterChain = new FilterChain({ name: 'crt-effect' });
    filterChain.addFilter(filter, {
      id: 'crt',
      animated: true,
      animationProperties: {
        curvature: settings.curvature,
        lineContrast: settings.lineContrast,
        noise: settings.noise,
        vignetting: settings.vignetting,
      },
      duration: options.duration,
      ease: options.ease,
    });

    const originalResult = this.createEffectResult(
      filterChain,
      [filter],
      options
    );

    return {
      ...originalResult,
      applyTo: async (target: Sprite | Container): Promise<void> => {
        const filterManager = FilterManager.getInstance();

        // CRT is an exclusive visual effect - use isolation
        const result = await filterManager.applyFilter(target, filter, 'crt', {
          isolate: true,
        });

        if (!result.success) {
          debugLogger.error(
            'Failed to apply CRT filter',
            'FILTER_PRESETS',
            result.error
          );
        }
      },
    };
  }

  private createAdvancedGlitchEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = { subtle: 5, moderate: 10, strong: 20, intense: 50 };
    const slices = intensityMap[options.intensity];

    const filter = new GlitchFilter({
      slices,
      offset: 15,
      direction: 0,
      fillMode: 0,
      seed: Math.random(),
    });

    const filterChain = new FilterChain({ name: 'glitch-effect' });

    // Create random glitch bursts like satellite/space camera feed
    let nextGlitchTime = Date.now() + (Math.random() * 7500 + 1500); // First glitch in 1.5-9 seconds
    let isGlitching = false;
    let glitchEndTime = 0;
    let glitchIntensity = 1; // Current burst intensity multiplier
    let hasResidualGlitch = false;
    let residualOffset = 0;
    let residualSlices = slices;

    filterChain.addFilter(filter, {
      id: 'glitch',
      animated: true,
      animationProperties: { offset: 30 },
      duration: 100, // Short duration for immediate application
      ease: 'none',
      onUpdate: () => {
        const now = Date.now();

        // Check if it's time to start a new glitch burst
        if (!isGlitching && now >= nextGlitchTime) {
          isGlitching = true;
          // Random glitch duration: 0.2-1.2 seconds
          glitchEndTime = now + (Math.random() * 1000 + 200);
          // Random intensity: 0.3 (mild) to 2.0 (severe)
          glitchIntensity = Math.random() * 1.7 + 0.3;
          // Schedule next glitch burst: 1.5-9 seconds later
          nextGlitchTime = glitchEndTime + (Math.random() * 7500 + 1500);
        }

        // Check if current glitch burst should end
        if (isGlitching && now >= glitchEndTime) {
          isGlitching = false;

          // 5-10% chance the signal doesn't fully recover
          if (Math.random() < 0.075) {
            // 7.5% chance
            hasResidualGlitch = true;
            residualOffset = Math.random() * 8 + 2; // Small persistent offset
            residualSlices = Math.floor(slices * (0.8 + Math.random() * 0.4)); // Slightly off slice count
          } else {
            hasResidualGlitch = false;
            residualOffset = 0;
            residualSlices = slices;
          }
        }

        if (isGlitching) {
          // During glitch bursts - intensity varies randomly
          const burstElapsed = (now - (glitchEndTime - 1200)) / 1000;

          // Horizontal glitch movement scaled by intensity
          const baseOffset =
            Math.sin(burstElapsed * 8) * 25 +
            Math.cos(burstElapsed * 5.5) * 15 +
            (Math.random() - 0.5) * 20;
          (filter as GlitchFilter).offset = Math.abs(
            baseOffset * glitchIntensity
          );

          // Keep direction horizontal for scan line effect
          (filter as GlitchFilter).direction = 0;

          // Slice flickering scaled by intensity
          const baseSlices = slices;
          const intenseBurst =
            Math.sin(burstElapsed * 20) * Math.cos(burstElapsed * 15);
          const randomBurst =
            Math.random() < 0.4 + glitchIntensity * 0.3
              ? Math.random() * 0.8
              : 0;
          const burstMultiplier =
            1 +
            intenseBurst * 0.5 * glitchIntensity +
            randomBurst * glitchIntensity;
          (filter as GlitchFilter).slices = Math.floor(
            baseSlices * burstMultiplier
          );

          // Dramatic slice changes - more frequent with higher intensity
          const sliceChangeChance = 0.15 + glitchIntensity * 0.15;
          if (Math.random() < sliceChangeChance) {
            (filter as GlitchFilter).slices =
              Math.random() < 0.4 ? 0 : baseSlices * (2 + glitchIntensity);
          }

          // Rapid seed changes for chaotic corruption
          if (Math.floor(burstElapsed * 30) % 2 === 0) {
            (filter as GlitchFilter).seed = Math.random();
          }

          // Offset spikes - more frequent and intense with higher intensity
          const spikeChance = 0.1 + glitchIntensity * 0.1;
          if (Math.random() < spikeChance) {
            (filter as GlitchFilter).offset =
              (Math.random() * 60 + 30) * glitchIntensity;
          }
        } else {
          // During quiet periods - but check for residual corruption
          if (hasResidualGlitch) {
            // Signal didn't fully recover - persistent glitch artifacts
            (filter as GlitchFilter).offset = residualOffset;
            (filter as GlitchFilter).direction = 0;
            (filter as GlitchFilter).slices = residualSlices;

            // Very occasional minor fluctuations in the corrupted signal
            if (Math.random() < 0.01) {
              // 1% chance
              (filter as GlitchFilter).offset =
                residualOffset + (Math.random() - 0.5) * 3;
            }
          } else {
            // Clean signal like normal camera feed
            (filter as GlitchFilter).offset = 0;
            (filter as GlitchFilter).direction = 0;
            (filter as GlitchFilter).slices = slices; // Normal slice count

            // Occasional very minor static during quiet periods
            if (Math.random() < 0.002) {
              // Very rare (0.2% chance)
              (filter as GlitchFilter).offset = Math.random() * 3 + 1; // Tiny static
            }
          }
        }
      },
    });

    return this.createEffectResult(filterChain, [filter], options);
  }

  private createPixelateEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = { subtle: 6, moderate: 13, strong: 19, intense: 32 };
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
      subtle: { redX: -3, greenY: 3, blueX: 3 },
      moderate: { redX: -5, greenY: 5, blueX: 5 },
      strong: { redX: -10, greenY: 10, blueX: 10 },
      intense: { redX: -20, greenY: 20, blueX: 20 },
    };
    const settings = intensityMap[options.intensity];

    const filter = new RGBSplitFilter({
      red: { x: settings.redX, y: 0 },
      green: { x: 0, y: settings.greenY },
      blue: { x: settings.blueX, y: 0 },
    });

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
    const strength = intensityMap[options.intensity];

    const filter = new KawaseBlurFilter({
      clamp: false, // Default clamp
      pixelSize: { x: 1, y: 1 }, // Default pixel size
      quality: 3, // Default quality (integer > 1)
      strength, // Blur amount scaled by intensity
    });

    // Set additional properties after creation (these are documented but not in constructor options)
    filter.pixelSizeX = 1; // Default X pixel size
    filter.pixelSizeY = 1; // Default Y pixel size
    const filterChain = new FilterChain({ name: 'kawase-blur-effect' });
    filterChain.addFilter(filter, {
      id: 'kawase-blur',
      animated: true,
      animationProperties: { strength },
      duration: options.duration,
      ease: options.ease,
    });

    const originalResult = this.createEffectResult(
      filterChain,
      [filter],
      options
    );

    return {
      ...originalResult,
      applyTo: async (target: Sprite | Container): Promise<void> => {
        const filterManager = FilterManager.getInstance();

        // Kawase blur should replace other blur effects but allow other types
        const result = await filterManager.applyFilter(target, filter, 'blur', {
          replace: true,
        });

        if (!result.success) {
          debugLogger.error(
            'Failed to apply Kawase blur filter',
            'FILTER_PRESETS',
            result.error
          );
        }
      },
    };
  }

  private createAdvancedMotionBlurEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = {
      subtle: { x: 10, y: 0 },
      moderate: { x: 20, y: 0 },
      strong: { x: 40, y: 0 },
      intense: { x: 80, y: 0 },
    };
    const velocity = intensityMap[options.intensity];

    const filter = new MotionBlurFilter({
      velocity, // Use PointData object format {x, y}
      kernelSize: 5, // Use correct default value (5 instead of 15)
      offset: 0,
    });

    // Set velocityX and velocityY properties after creation (documented properties)
    filter.velocityX = velocity.x;
    filter.velocityY = velocity.y;

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
    const intensityMap = {
      subtle: { radius: -1, angle: 2, kernelSize: 5 },
      moderate: { radius: -1, angle: 4, kernelSize: 5 },
      strong: { radius: -1, angle: 6, kernelSize: 7 },
      intense: { radius: -1, angle: 10, kernelSize: 9 },
    };
    const settings = intensityMap[options.intensity];

    const filter = new RadialBlurFilter({
      angle: settings.angle, // Non-zero angle for visible blur
      center: { x: 0.5, y: 0.5 }, // Use PointData object format, centered in image
      radius: settings.radius,
      kernelSize: settings.kernelSize, // Larger kernel for more blur
    });

    const filterChain = new FilterChain({ name: 'radial-blur-effect' });
    filterChain.addFilter(filter, {
      id: 'radial-blur',
      animated: true,
      animationProperties: {
        radius: settings.radius,
        angle: settings.angle * 2, // Animate to double the angle for motion effect
      },
      duration: options.duration,
      ease: options.ease,
    });

    return this.createEffectResult(filterChain, [filter], options);
  }

  /**
   * Create MultiColorReplace effect - replace multiple colors simultaneously
   */
  private createMultiColorReplaceEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    // Define color replacement pairs based on intensity
    // Your colors: D9B94A (golden), C34672 (rose), 8FE2EA (cyan)
    // Replaced with vibrant neons: electric lime, hot pink, electric blue
    const colorReplacements = {
      subtle: [
        [0xd9b94a, 0x00ff41] as [number, number], // Golden to Electric Lime
      ],
      moderate: [
        [0xd9b94a, 0x00ff41] as [number, number], // Golden to Electric Lime
        [0xc34672, 0xff1493] as [number, number], // Rose to Hot Pink
      ],
      strong: [
        [0xd9b94a, 0x00ff41] as [number, number], // Golden to Electric Lime
        [0xc34672, 0xff1493] as [number, number], // Rose to Hot Pink
        [0x8fe2ea, 0x0080ff] as [number, number], // Cyan to Electric Blue
      ],
      intense: [
        [0xd9b94a, 0x00ff41] as [number, number], // Golden to Electric Lime
        [0xc34672, 0xff1493] as [number, number], // Rose to Hot Pink
        [0x8fe2ea, 0x0080ff] as [number, number], // Cyan to Electric Blue
        [0xffffff, 0xff00ff] as [number, number], // White to Magenta (bonus replacement)
      ],
    };

    const replacements = colorReplacements[options.intensity];

    const filter = new MultiColorReplaceFilter(
      replacements, // Array of [originalColor, targetColor] pairs
      0.05 // tolerance for color matching
    );

    const filterChain = new FilterChain({ name: 'multi-color-replace-effect' });
    filterChain.addFilter(filter, {
      id: 'multi-color-replace',
      animated: false, // Color replacement doesn't need animation
      animationProperties: {},
      duration: options.duration,
      ease: options.ease,
    });

    return this.createEffectResult(filterChain, [filter], options);
  }

  /**
   * Create CrossHatch effect - artistic sketch rendering
   */
  private createCrosshatchEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    // CrossHatchFilter in PIXI v8 doesn't have many configurable properties
    // We'll use a combination approach with alpha/blend modes for intensity
    const filter = new CrossHatchFilter();

    // Intensity affects the overall visibility of the effect
    const intensityMap = {
      subtle: { alpha: 0.3 },
      moderate: { alpha: 0.5 },
      strong: { alpha: 0.7 },
      intense: { alpha: 1.0 },
    };
    const settings = intensityMap[options.intensity];

    const filterChain = new FilterChain({ name: 'crosshatch-effect' });
    filterChain.addFilter(filter, {
      id: 'crosshatch',
      animated: true,
      animationProperties: {
        // While CrossHatch itself doesn't have many properties,
        // we can animate the overall filter alpha for a fade-in effect
        alpha: settings.alpha,
      },
      duration: options.duration,
      ease: options.ease,
      onUpdate: (_progress) => {
        // CrossHatch filter doesn't have direct alpha property
        // The alpha is handled by the filter chain animation
      },
    });

    debugLogger.info(
      `CrossHatch effect created with intensity: ${options.intensity}`,
      'FILTER_PRESETS'
    );

    return this.createEffectResult(filterChain, [filter], options);
  }

  private createShockwaveEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    // Use proper amplitude values based on main branch implementation
    const intensityMap = { subtle: 30, moderate: 40, strong: 50, intense: 60 };
    const amplitude = intensityMap[options.intensity];

    // Use proper constructor format with center as {x, y} object (not array)
    const filter = new ShockwaveFilter({
      center: { x: 0.5, y: 0.5 }, // Should be center, but may need adjustment based on coordinate system
      amplitude: amplitude,
      wavelength: 160,
      brightness: 1,
      speed: 500,
      radius: -1, // Infinite radius
      time: 0,
    });

    debugLogger.info(
      `ShockwaveFilter created - center: {x:0.5, y:0.5}, amplitude: ${amplitude}, wavelength: 160, brightness: 1, speed: 500`,
      'FILTER_PRESETS'
    );

    const filterChain = new FilterChain({ name: 'shockwave-effect' });

    // Use requestAnimationFrame for continuous time animation (like main branch)
    let animationActive = false;
    let animationFrameId: number | null = null;
    let lastTime = Date.now();

    const startAnimation = (): void => {
      if (animationActive) return;
      animationActive = true;
      filter.time = 0; // Reset time
      lastTime = Date.now();

      const animate = (): void => {
        const now = Date.now();
        const delta = (now - lastTime) / 1000; // Convert to seconds
        lastTime = now;

        // Increment time for wave progression (like main branch)
        filter.time += delta * 0.8; // Animation speed

        debugLogger.debug(
          `Shockwave animation - time: ${filter.time.toFixed(2)}, amplitude: ${filter.amplitude}`,
          'FILTER_PRESETS'
        );

        // Reset wave after 3 seconds and pause
        if (filter.time >= 3.0) {
          animationActive = false;
          // Pause for 1 second before next wave
          setTimeout(() => {
            if (animationFrameId !== null) {
              startAnimation();
            }
          }, 1000);
          return;
        }

        animationFrameId = requestAnimationFrame(animate);
      };

      animate();
    };

    // Start the animation
    startAnimation();

    filterChain.addFilter(filter, {
      id: 'shockwave',
      animated: false, // We're handling animation manually
      animationProperties: {},
      duration: options.duration,
      ease: options.ease,
    });

    const originalResult = this.createEffectResult(
      filterChain,
      [filter],
      options
    );

    return {
      ...originalResult,
      cleanup: (): void => {
        // Stop the animation
        animationActive = false;
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        originalResult.cleanup();
      },
    };
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
      alpha: 1, // Default alpha
      angle: 30, // Default angle
      center: { x: 0, y: 0 }, // Default center point (controls centerX/centerY)
      gain: 0.5 * intensity, // Effect intensity scaled by user preference
      lacunarity: 2.5, // Default lacunarity
      parallel: true, // Default parallel rays
      time: 0, // Default time
    });

    const filterChain = new FilterChain({ name: 'godray-effect' });

    // Create continuous animation for god rays using setInterval
    const startTime = Date.now();
    const animationInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      (filter as GodrayFilter).time = elapsed * 2; // Slow, smooth movement
    }, 16); // ~60fps

    filterChain.addFilter(filter, {
      id: 'godray',
      animated: true,
      animationProperties: {
        gain: 0.5 * intensity,
        time: 10,
      },
      duration: options.duration,
      ease: options.ease,
    });

    // Store the interval for potential cleanup (though this is a simple demo)
    // In a production app, you'd want to clear this when the filter is removed
    (
      filter as GodrayFilter & { _animationInterval?: NodeJS.Timeout }
    )._animationInterval = animationInterval;

    return this.createEffectResult(filterChain, [filter], options);
  }

  private createAdjustmentEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    // Use custom settings if provided, otherwise fall back to intensity presets
    if (options.customSettings) {
      const filter = new AdjustmentFilter({
        brightness:
          typeof options.customSettings.brightness === 'number'
            ? options.customSettings.brightness
            : 1.0,
        contrast:
          typeof options.customSettings.contrast === 'number'
            ? options.customSettings.contrast
            : 1.0,
        saturation:
          typeof options.customSettings.saturation === 'number'
            ? options.customSettings.saturation
            : 1.0,
        gamma:
          typeof options.customSettings.gamma === 'number'
            ? options.customSettings.gamma
            : 1.0,
        red:
          typeof options.customSettings.red === 'number'
            ? options.customSettings.red
            : 1.0,
        green:
          typeof options.customSettings.green === 'number'
            ? options.customSettings.green
            : 1.0,
        blue:
          typeof options.customSettings.blue === 'number'
            ? options.customSettings.blue
            : 1.0,
        alpha:
          typeof options.customSettings.alpha === 'number'
            ? options.customSettings.alpha
            : 1.0,
      });

      const filterChain = new FilterChain();
      return this.createEffectResult(filterChain, [filter], options);
    }

    // Fallback to preset-based settings
    const intensityMap = {
      subtle: { brightness: 1.1, contrast: 1.05, saturation: 0.95 },
      moderate: { brightness: 1.2, contrast: 1.1, saturation: 0.9 },
      strong: { brightness: 1.4, contrast: 1.2, saturation: 0.8 },
      intense: { brightness: 1.6, contrast: 1.3, saturation: 0.7 },
    };
    const adjustments = intensityMap[options.intensity];

    const filter = new AdjustmentFilter({
      brightness: adjustments.brightness,
      contrast: adjustments.contrast,
      saturation: adjustments.saturation,
      gamma: 1.0,
      red: 1.0,
      green: 1.0,
      blue: 1.0,
      alpha: 1.0,
    });

    const filterChain = new FilterChain({ name: 'adjustment-effect' });
    filterChain.addFilter(filter, {
      id: 'adjustment',
      animated: true,
      animationProperties: {
        brightness: adjustments.brightness,
        contrast: adjustments.contrast,
        saturation: adjustments.saturation,
      },
      duration: options.duration,
      ease: options.ease,
    });

    return this.createEffectResult(filterChain, [filter], options);
  }

  /**
   * Create fast bloom effect for performance-focused applications
   */
  private createBloomEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = {
      subtle: { strength: 0.5 },
      moderate: { strength: 1.0 },
      strong: { strength: 1.5 },
      intense: { strength: 2.0 },
    };
    const settings = intensityMap[options.intensity];

    // Use the simpler constructor approach for BloomFilter
    const filter = new BloomFilter();
    // Set properties directly
    filter.strength = settings.strength;

    const filterChain = new FilterChain({ name: 'bloom-effect' });
    filterChain.addFilter(filter, {
      id: 'bloom',
      animated: true,
      animationProperties: {
        strength: settings.strength,
      },
      duration: options.duration,
      ease: options.ease,
    });

    return this.createEffectResult(filterChain, [filter], options);
  }

  /**
   * Create advanced bloom effect with professional-grade parameters
   */
  private createAdvancedBloomEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    // Use custom settings if provided, otherwise fall back to intensity presets
    if (options.customSettings) {
      const filter = new AdvancedBloomFilter({
        bloomScale:
          typeof options.customSettings.bloomScale === 'number'
            ? options.customSettings.bloomScale
            : 1.0,
        blur:
          typeof options.customSettings.blur === 'number'
            ? options.customSettings.blur
            : 2.0,
        brightness:
          typeof options.customSettings.brightness === 'number'
            ? options.customSettings.brightness
            : 1.0,
        threshold:
          typeof options.customSettings.threshold === 'number'
            ? options.customSettings.threshold
            : 0.5,
        quality:
          typeof options.customSettings.quality === 'number'
            ? options.customSettings.quality
            : 4,
        pixelSize: {
          x:
            typeof options.customSettings.pixelSizeX === 'number'
              ? options.customSettings.pixelSizeX
              : 1.0,
          y:
            typeof options.customSettings.pixelSizeY === 'number'
              ? options.customSettings.pixelSizeY
              : 1.0,
        },
      });

      const filterChain = new FilterChain();
      return this.createEffectResult(filterChain, [filter], options);
    }

    // Fallback to preset-based settings
    const intensityMap = {
      subtle: { bloomScale: 0.8, threshold: 0.7, brightness: 1.0, blur: 1 },
      moderate: { bloomScale: 1.0, threshold: 0.5, brightness: 1.1, blur: 2 },
      strong: { bloomScale: 1.3, threshold: 0.4, brightness: 1.2, blur: 3 },
      intense: { bloomScale: 1.6, threshold: 0.3, brightness: 1.3, blur: 4 },
    };
    const settings = intensityMap[options.intensity];

    const filter = new AdvancedBloomFilter({
      bloomScale: settings.bloomScale,
      threshold: settings.threshold,
      brightness: settings.brightness,
      blur: settings.blur,
      quality: 4,
      pixelSize: { x: 1, y: 1 },
    });

    const filterChain = new FilterChain({ name: 'advanced-bloom-effect' });
    filterChain.addFilter(filter, {
      id: 'advancedBloom',
      animated: true,
      animationProperties: {
        bloomScale: settings.bloomScale,
        threshold: settings.threshold,
        brightness: settings.brightness,
        blur: settings.blur,
      },
      duration: options.duration,
      ease: options.ease,
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

  /**
   * Create Bevel effect for 3D appearance
   */
  private createBevelEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = {
      subtle: { thickness: 2, lightAlpha: 0.7, shadowAlpha: 0.7 },
      moderate: { thickness: 4, lightAlpha: 0.8, shadowAlpha: 0.8 },
      strong: { thickness: 6, lightAlpha: 0.9, shadowAlpha: 0.9 },
      intense: { thickness: 10, lightAlpha: 1.0, shadowAlpha: 1.0 },
    };
    const settings = intensityMap[options.intensity];

    const filter = new BevelFilter({
      rotation: 45, // Light angle in degrees
      thickness: settings.thickness,
      lightColor: 0xffffff,
      lightAlpha: settings.lightAlpha,
      shadowColor: 0x000000,
      shadowAlpha: settings.shadowAlpha,
    });

    const filterChain = new FilterChain({ name: 'bevel-effect' });
    filterChain.addFilter(filter, {
      id: 'bevel',
      animated: true,
      animationProperties: {
        thickness: settings.thickness,
        lightAlpha: settings.lightAlpha,
        shadowAlpha: settings.shadowAlpha,
      },
      duration: options.duration,
      ease: options.ease,
    });

    return this.createEffectResult(filterChain, [filter], options);
  }

  /**
   * Create BulgePinch effect for lens distortion
   */
  private createBulgePinchEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = {
      subtle: { strength: 0.5, centerX: 0.5, centerY: 0.5, radius: 200 },
      moderate: { strength: 1.0, centerX: 0.5, centerY: 0.5, radius: 250 },
      strong: { strength: 1.5, centerX: 0.5, centerY: 0.5, radius: 300 },
      intense: { strength: 2.0, centerX: 0.5, centerY: 0.5, radius: 350 },
    };
    const settings = intensityMap[options.intensity];

    // Use the simpler constructor approach for BulgePinchFilter
    const filter = new BulgePinchFilter();
    // Set properties directly
    filter.center = [settings.centerX, settings.centerY];
    filter.radius = settings.radius;
    filter.strength = settings.strength;

    const filterChain = new FilterChain({ name: 'bulge-pinch-effect' });
    filterChain.addFilter(filter, {
      id: 'bulgePinch',
      animated: true,
      animationProperties: {
        strength: settings.strength,
        radius: settings.radius,
      },
      duration: options.duration,
      ease: options.ease,
    });

    return this.createEffectResult(filterChain, [filter], options);
  }

  /**
   * Create ColorGradient effect for color overlay effects
   */
  private createColorGradientEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = {
      subtle: { alpha: 0.3 },
      moderate: { alpha: 0.5 },
      strong: { alpha: 0.7 },
      intense: { alpha: 0.9 },
    };
    const settings = intensityMap[options.intensity];

    // Use the simpler constructor approach for ColorGradientFilter
    const filter = new ColorGradientFilter();
    // Set properties directly - use simple red to blue gradient
    filter.stops = [
      { offset: 0, color: 0xff4444, alpha: settings.alpha },
      { offset: 1, color: 0x4444ff, alpha: settings.alpha },
    ];
    filter.type = 0; // 0 = linear

    const filterChain = new FilterChain({ name: 'color-gradient-effect' });
    filterChain.addFilter(filter, {
      id: 'colorGradient',
      animated: true,
      animationProperties: {},
      duration: options.duration,
      ease: options.ease,
    });

    return this.createEffectResult(filterChain, [filter], options);
  }

  /**
   * Create ColorMap effect using colormap texture
   */
  private createColorMapEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = {
      subtle: { mix: 0.3 },
      moderate: { mix: 0.6 },
      strong: { mix: 0.8 },
      intense: { mix: 1.0 },
    };
    const settings = intensityMap[options.intensity];

    // Create a simple canvas texture as initial colorMap (1x1 gradient)
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Create a simple gradient as initial colormap
      const gradient = ctx.createLinearGradient(0, 0, 256, 0);
      gradient.addColorStop(0, '#ff0000');
      gradient.addColorStop(0.5, '#00ff00');
      gradient.addColorStop(1, '#0000ff');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);
    }
    const initialTexture = Texture.from(canvas);

    const filter = new ColorMapFilter({
      colorMap: initialTexture,
      mix: settings.mix,
    });

    // Load the actual colormap texture asynchronously and replace
    Assets.load('/images/colormap.png')
      .then((colorMapTexture) => {
        filter.colorMap = colorMapTexture;
        debugLogger.info(
          'ColorMap texture loaded and applied',
          'FILTER_PRESETS'
        );
      })
      .catch((error) => {
        debugLogger.warn(
          'Failed to load colormap.png, using default gradient',
          'FILTER_PRESETS',
          error
        );
      });

    const filterChain = new FilterChain({ name: 'color-map-effect' });
    filterChain.addFilter(filter, {
      id: 'colorMap',
      animated: true,
      animationProperties: {
        mix: settings.mix,
      },
      duration: options.duration,
      ease: options.ease,
    });

    return this.createEffectResult(filterChain, [filter], options);
  }

  /**
   * Create HSL Adjustment effect for color correction
   */
  private createHslAdjustmentEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = {
      subtle: { hue: 15, saturation: 0.2, lightness: 0.1 },
      moderate: { hue: 30, saturation: 0.4, lightness: 0.2 },
      strong: { hue: 60, saturation: 0.6, lightness: 0.3 },
      intense: { hue: 90, saturation: 0.8, lightness: 0.4 },
    };
    const settings = intensityMap[options.intensity];

    const filter = new HslAdjustmentFilter({
      alpha: 1, // Default alpha
      colorize: false, // Default colorize
      hue: settings.hue, // Hue adjustment in degrees (-180 to 180)
      lightness: settings.lightness, // Lightness adjustment (-1 to 1)
      saturation: settings.saturation, // Saturation adjustment (-1 to 1)
    });

    const filterChain = new FilterChain({ name: 'hsl-adjustment-effect' });
    filterChain.addFilter(filter, {
      id: 'hslAdjustment',
      animated: true,
      animationProperties: {
        hue: settings.hue,
        saturation: settings.saturation,
        lightness: settings.lightness,
      },
      duration: options.duration,
      ease: options.ease,
    });

    return this.createEffectResult(filterChain, [filter], options);
  }

  /**
   * Create ColorOverlay effect
   */
  private createColorOverlayEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = {
      subtle: { alpha: 0.2 },
      moderate: { alpha: 0.4 },
      strong: { alpha: 0.6 },
      intense: { alpha: 0.8 },
    };
    const settings = intensityMap[options.intensity];

    // Create filter with a nice blue color by default
    const filter = new ColorOverlayFilter(0x4488ff, settings.alpha);

    const filterChain = new FilterChain({ name: 'color-overlay-effect' });
    filterChain.addFilter(filter, {
      id: 'colorOverlay',
      animated: true,
      animationProperties: {
        alpha: settings.alpha,
      },
      duration: options.duration,
      ease: options.ease,
      onUpdate: (progress) => {
        // Animate color shift from blue to purple
        const p = progress as unknown as number;
        const r = Math.floor(0x44 + (0x88 - 0x44) * p);
        const g = Math.floor(0x88 - (0x88 - 0x44) * p);
        const b = 0xff;
        filter.color = (r << 16) | (g << 8) | b;
      },
    });

    return this.createEffectResult(filterChain, [filter], options);
  }

  /**
   * Create ColorReplace effect
   */
  private createColorReplaceEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = {
      subtle: { tolerance: 0.1 },
      moderate: { tolerance: 0.3 },
      strong: { tolerance: 0.5 },
      intense: { tolerance: 0.8 },
    };
    const settings = intensityMap[options.intensity];

    // Replace the specific color #D9B94A with lime green
    const filter = new ColorReplaceFilter({
      originalColor: 0xd9b94a, // #D9B94A (golden/beige color)
      targetColor: 0x00ff00, // Lime green
      tolerance: settings.tolerance,
    });

    const filterChain = new FilterChain({ name: 'color-replace-effect' });
    filterChain.addFilter(filter, {
      id: 'colorReplace',
      animated: true,
      animationProperties: {
        tolerance: settings.tolerance,
      },
      duration: options.duration,
      ease: options.ease,
      onUpdate: (_progress) => {
        // Keep the color replacement static - no animation
        // This ensures the effect persists after animation completes
        filter.originalColor = 0xd9b94a;
        filter.targetColor = 0x00ff00;
        filter.tolerance = settings.tolerance;
      },
    });

    return this.createEffectResult(filterChain, [filter], options);
  }

  /**
   * Create Convolution effect
   */
  private createConvolutionEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    // Different convolution matrices for different intensities
    const matrices = {
      subtle: {
        // Sharpen (subtle)
        matrix: [0, -0.5, 0, -0.5, 3, -0.5, 0, -0.5, 0],
        width: 3,
        height: 3,
      },
      moderate: {
        // Edge detection
        matrix: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
        width: 3,
        height: 3,
      },
      strong: {
        // Emboss
        matrix: [-2, -1, 0, -1, 1, 1, 0, 1, 2],
        width: 3,
        height: 3,
      },
      intense: {
        // Strong sharpen
        matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0],
        width: 3,
        height: 3,
      },
    };

    const settings = matrices[options.intensity];
    const filter = new ConvolutionFilter(
      settings.matrix,
      settings.width,
      settings.height
    );

    const filterChain = new FilterChain({ name: 'convolution-effect' });
    filterChain.addFilter(filter, {
      id: 'convolution',
      animated: true,
      animationProperties: {},
      duration: options.duration,
      ease: options.ease,
      onUpdate: (_progress) => {
        // Convolution matrices typically don't animate well
        // Keep the effect static
      },
    });

    return this.createEffectResult(filterChain, [filter], options);
  }

  /**
   * Create BackdropBlur effect with proper resource management
   */
  private createBackdropBlurEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = {
      subtle: { strength: 4, quality: 3 },
      moderate: { strength: 8, quality: 4 },
      strong: { strength: 12, quality: 5 },
      intense: { strength: 16, quality: 6 },
    };
    const settings = intensityMap[options.intensity];

    // Create BackdropBlur filter with proper configuration
    const filter = new BackdropBlurFilter({
      strength: settings.strength,
      quality: settings.quality,
      kernelSize: 5,
      resolution: 1,
    });

    const filterChain = new FilterChain({ name: 'backdrop-blur-effect' });
    filterChain.addFilter(filter, {
      id: 'backdropBlur',
      animated: true,
      animationProperties: { strength: settings.strength },
      duration: options.duration,
      ease: options.ease,
    });

    const originalResult = this.createEffectResult(
      filterChain,
      [filter],
      options
    );

    return {
      ...originalResult,
      applyTo: async (target: Sprite | Container): Promise<void> => {
        const filterManager = FilterManager.getInstance();

        debugLogger.debug(
          'Applying backdrop blur filter with modern filter manager',
          'FILTER_PRESETS'
        );

        // Use FilterManager with replace mode for backdrop blur
        const result = await filterManager.applyFilter(
          target,
          filter,
          'backdropBlur',
          {
            replace: true, // Replace other backdrop blur filters, but don't clear all filters
          }
        );

        if (result.success) {
          debugLogger.debug(
            'Backdrop blur filter successfully applied',
            'FILTER_PRESETS'
          );
        } else {
          debugLogger.error(
            'Failed to apply backdrop blur filter',
            'FILTER_PRESETS',
            result.error
          );
        }
      },
    };
  }

  /**
   * Create Reflection effect for water-like reflections
   */
  private createReflectionEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = {
      subtle: {
        amplitude: [0, 5],
        waveLength: [30, 50],
        alpha: [1, 0.8],
        boundary: 0.5,
      },
      moderate: {
        amplitude: [0, 10],
        waveLength: [30, 70],
        alpha: [1, 0.6],
        boundary: 0.5,
      },
      strong: {
        amplitude: [0, 15],
        waveLength: [30, 90],
        alpha: [1, 0.4],
        boundary: 0.5,
      },
      intense: {
        amplitude: [0, 20],
        waveLength: [30, 100],
        alpha: [1, 0.2],
        boundary: 0.5,
      },
    };
    const settings = intensityMap[options.intensity];

    // Create filter with minimal constructor options
    const filter = new ReflectionFilter();

    // Set properties individually
    // The types expect Range (Float32Array) but the filter works with arrays
    Object.assign(filter, {
      alpha: settings.alpha,
      amplitude: settings.amplitude,
      boundary: settings.boundary,
      mirror: true,
      time: 0,
      waveLength: settings.waveLength,
    });

    const filterChain = new FilterChain({ name: 'reflection-effect' });

    // Create continuous animation for water ripple effect
    const startTime = Date.now();
    const animationInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      filter.time = elapsed * 2; // Animate water ripples
    }, 16); // ~60fps

    filterChain.addFilter(filter, {
      id: 'reflection',
      animated: true,
      animationProperties: {
        time: 10, // This will be overridden by the interval animation
      },
      duration: options.duration,
      ease: options.ease,
    });

    // Store the interval for cleanup
    (
      filter as ReflectionFilter & { _animationInterval?: NodeJS.Timeout }
    )._animationInterval = animationInterval;

    const originalResult = this.createEffectResult(
      filterChain,
      [filter],
      options
    );

    return {
      ...originalResult,
      cleanup: (): void => {
        // Clear the animation interval
        const filterWithInterval = filter as ReflectionFilter & {
          _animationInterval?: NodeJS.Timeout;
        };
        if (filterWithInterval._animationInterval) {
          clearInterval(filterWithInterval._animationInterval);
        }
        originalResult.cleanup();
      },
    };
  }

  /**
   * Create SimpleLightmap effect for dynamic lighting
   */
  private createSimpleLightmapEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = {
      subtle: { alpha: 0.7, color: 0x444444 },
      moderate: { alpha: 0.8, color: 0x666666 },
      strong: { alpha: 0.9, color: 0x888888 },
      intense: { alpha: 1.0, color: 0xaaaaaa },
    };
    const settings = intensityMap[options.intensity];

    // Create a gradient lightmap texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Create a radial gradient for spotlight effect
      const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); // Bright center
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)'); // Mid brightness
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)'); // Dark edges

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);
    }

    const lightmapTexture = Texture.from(canvas);

    // Create the filter
    const filter = new SimpleLightmapFilter(lightmapTexture, settings.color);
    filter.alpha = settings.alpha;

    debugLogger.info(
      `SimpleLightmapFilter created - color: ${settings.color.toString(16)}, alpha: ${settings.alpha}`,
      'FILTER_PRESETS'
    );

    const filterChain = new FilterChain({ name: 'simple-lightmap-effect' });

    // Animate the lightmap for dynamic lighting
    let animationActive = true;
    let animationFrameId: number | null = null;
    let time = 0;

    const animate = (): void => {
      if (!animationActive) return;

      time += 0.02;

      // Animate alpha for pulsing light effect
      filter.alpha = settings.alpha * (0.8 + Math.sin(time) * 0.2);

      animationFrameId = requestAnimationFrame(animate);
    };

    // Start animation
    animate();

    filterChain.addFilter(filter, {
      id: 'simpleLightmap',
      animated: false, // We're handling animation manually
      animationProperties: {},
      duration: options.duration,
      ease: options.ease,
    });

    const originalResult = this.createEffectResult(
      filterChain,
      [filter],
      options
    );

    return {
      ...originalResult,
      cleanup: (): void => {
        // Stop animation
        animationActive = false;
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        // Destroy the lightmap texture
        lightmapTexture.destroy();
        originalResult.cleanup();
      },
    };
  }

  /**
   * Create SimplexNoise effect for procedural texture generation
   */
  private createSimplexNoiseEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    const intensityMap = {
      subtle: { strength: 0.3, noiseScale: 8 },
      moderate: { strength: 0.5, noiseScale: 10 },
      strong: { strength: 0.7, noiseScale: 12 },
      intense: { strength: 0.9, noiseScale: 15 },
    };
    const settings = intensityMap[options.intensity];

    // Create the filter with proper options
    const filter = new SimplexNoiseFilter({
      strength: settings.strength,
      noiseScale: settings.noiseScale,
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
      step: -1, // Default value for smooth noise
    });

    debugLogger.info(
      `SimplexNoiseFilter created - strength: ${settings.strength}, noiseScale: ${settings.noiseScale}`,
      'FILTER_PRESETS'
    );

    const filterChain = new FilterChain({ name: 'simplex-noise-effect' });

    // Animate the noise by shifting offsets for dynamic pattern
    let animationActive = true;
    let animationFrameId: number | null = null;
    let time = 0;

    const animate = (): void => {
      if (!animationActive) return;

      time += 0.01; // Slow animation speed for subtle movement

      // Create flowing noise pattern by animating offsets
      filter.offsetX = Math.sin(time) * 20;
      filter.offsetY = Math.cos(time * 0.7) * 15;
      filter.offsetZ = time * 0.5; // Depth animation for 3D noise variation

      debugLogger.debug(
        `SimplexNoise animation - time: ${time.toFixed(2)}, offsetX: ${filter.offsetX.toFixed(1)}, offsetY: ${filter.offsetY.toFixed(1)}, offsetZ: ${filter.offsetZ.toFixed(1)}`,
        'FILTER_PRESETS'
      );

      animationFrameId = requestAnimationFrame(animate);
    };

    // Start animation
    animate();

    filterChain.addFilter(filter, {
      id: 'simplexNoise',
      animated: false, // We're handling animation manually
      animationProperties: {},
      duration: options.duration,
      ease: options.ease,
    });

    const originalResult = this.createEffectResult(
      filterChain,
      [filter],
      options
    );

    return {
      ...originalResult,
      cleanup: (): void => {
        // Stop animation
        animationActive = false;
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        originalResult.cleanup();
      },
    };
  }

  /**
   * Create TiltShift effect for selective focus/miniature effect
   */
  private createTiltShiftEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    // Use proper PIXI.js TiltShiftFilter values based on API defaults
    // Default blur: 100, gradientBlur: 600 - these create the wide focus area
    const intensityMap = {
      subtle: { blur: 50, gradientBlur: 300, focusHeight: 0.4 },
      moderate: { blur: 75, gradientBlur: 450, focusHeight: 0.3 },
      strong: { blur: 100, gradientBlur: 600, focusHeight: 0.25 },
      intense: { blur: 150, gradientBlur: 800, focusHeight: 0.2 },
    };
    const settings = intensityMap[options.intensity];

    // TiltShiftFilter uses start/end points to define the gradient transition
    // Smaller distance between start/end = wider sharp focus area
    // Larger gradientBlur = smoother transition between sharp and blurred areas
    const centerY = 0.5;
    const halfFocusHeight = settings.focusHeight / 2;

    // These define the gradient transition points, not the focus boundaries
    const startY = centerY - halfFocusHeight;
    const endY = centerY + halfFocusHeight;

    const filter = new TiltShiftFilter({
      blur: settings.blur,
      gradientBlur: settings.gradientBlur,
      start: { x: 0, y: startY },
      end: { x: 1, y: endY },
    });

    debugLogger.info(
      `TiltShiftFilter created - blur: ${settings.blur}, gradientBlur: ${settings.gradientBlur}, focusHeight: ${settings.focusHeight}`,
      'FILTER_PRESETS'
    );

    const filterChain = new FilterChain({ name: 'tilt-shift-effect' });

    // Animate the focus area for dynamic tilt-shift effect
    let animationActive = true;
    let animationFrameId: number | null = null;
    let time = 0;

    const animate = (): void => {
      if (!animationActive) return;

      time += 0.005; // Even slower animation for more stable focus

      // Very subtly shift the focus area up and down
      const focusOffset = Math.sin(time) * 0.05; // ±5% movement for subtle breathing effect
      const currentCenterY = centerY + focusOffset;

      // Update focus area bounds with proper calculation
      const currentHalfFocusHeight = settings.focusHeight / 2;
      const currentStartY = currentCenterY - currentHalfFocusHeight;
      const currentEndY = currentCenterY + currentHalfFocusHeight;

      filter.start = { x: 0, y: currentStartY };
      filter.end = { x: 1, y: currentEndY };

      debugLogger.debug(
        `TiltShift animation - time: ${time.toFixed(2)}, centerY: ${currentCenterY.toFixed(2)}, startY: ${filter.start.y.toFixed(2)}, endY: ${filter.end.y.toFixed(2)}`,
        'FILTER_PRESETS'
      );

      animationFrameId = requestAnimationFrame(animate);
    };

    // Start animation
    animate();

    filterChain.addFilter(filter, {
      id: 'tiltShift',
      animated: false, // We're handling animation manually
      animationProperties: {},
      duration: options.duration,
      ease: options.ease,
    });

    const originalResult = this.createEffectResult(
      filterChain,
      [filter],
      options
    );

    return {
      ...originalResult,
      cleanup: (): void => {
        // Stop animation
        animationActive = false;
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        originalResult.cleanup();
      },
    };
  }

  /**
   * Create Twist effect for circular distortion/whirlpool effect
   */
  private createTwistEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    // Configure twist parameters based on intensity
    const intensityMap = {
      subtle: { angle: 2, radius: 150, speed: 0.01 },
      moderate: { angle: 4, radius: 200, speed: 0.015 },
      strong: { angle: 6, radius: 250, speed: 0.02 },
      intense: { angle: 8, radius: 300, speed: 0.025 },
    };
    const settings = intensityMap[options.intensity];

    // Create TwistFilter with center offset - using pixel coordinates for proper centering
    // TwistFilter expects actual pixel coordinates, so we need to center it properly
    const filter = new TwistFilter({
      angle: settings.angle,
      offset: { x: 400, y: 300 }, // Center based on typical slider dimensions (800x600)
      radius: settings.radius,
    });

    debugLogger.info(
      `TwistFilter created - angle: ${settings.angle}, radius: ${settings.radius}, speed: ${settings.speed}`,
      'FILTER_PRESETS'
    );

    const filterChain = new FilterChain({ name: 'twist-effect' });

    // Animate the twist angle and offset for dynamic effect
    let animationActive = true;
    let animationFrameId: number | null = null;
    let time = 0;

    const animate = (): void => {
      if (!animationActive) return;

      time += settings.speed;

      // Animate twist angle with sine wave for smooth rotation
      filter.angle = settings.angle + Math.sin(time) * (settings.angle * 0.3);

      // Keep the twist center fixed at the center
      filter.offset = { x: 400, y: 300 };

      debugLogger.debug(
        `Twist animation - time: ${time.toFixed(2)}, angle: ${filter.angle.toFixed(1)}, centered at (400,300)`,
        'FILTER_PRESETS'
      );

      animationFrameId = requestAnimationFrame(animate);
    };

    // Start animation
    animate();

    filterChain.addFilter(filter, {
      id: 'twist',
      animated: false, // We're handling animation manually
      animationProperties: {},
      duration: options.duration,
      ease: options.ease,
    });

    const originalResult = this.createEffectResult(
      filterChain,
      [filter],
      options
    );

    return {
      ...originalResult,
      cleanup: (): void => {
        // Stop animation
        animationActive = false;
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        originalResult.cleanup();
      },
    };
  }

  /**
   * Create ZoomBlur effect for radial motion blur/speed effect
   */
  private createZoomBlurEffect(
    options: Required<PresetOptions>
  ): EffectPresetResult {
    // Configure zoom blur parameters based on intensity
    const intensityMap = {
      subtle: { strength: 0.1, radius: 100, innerRadius: 0 },
      moderate: { strength: 0.15, radius: 200, innerRadius: 0 },
      strong: { strength: 0.2, radius: 300, innerRadius: 0 },
      intense: { strength: 0.3, radius: -1, innerRadius: 0 },
    };
    const settings = intensityMap[options.intensity];

    // Create ZoomBlurFilter with pixel coordinates like TwistFilter
    const filter = new ZoomBlurFilter({
      strength: settings.strength,
      center: { x: 400, y: 300 }, // Use pixel coordinates like TwistFilter
      innerRadius: settings.innerRadius,
      radius: settings.radius,
    });

    debugLogger.info(
      `ZoomBlurFilter created - strength: ${settings.strength}, center: {x:400, y:300}, radius: ${settings.radius}, innerRadius: ${settings.innerRadius}`,
      'FILTER_PRESETS'
    );

    const filterChain = new FilterChain({ name: 'zoom-blur-effect' });

    filterChain.addFilter(filter, {
      id: 'zoomBlur',
      animated: true,
      animationProperties: {
        strength: settings.strength,
      },
      duration: options.duration,
      ease: options.ease,
    });

    const originalResult = this.createEffectResult(
      filterChain,
      [filter],
      options
    );

    // Override applyTo to set proper center
    return {
      ...originalResult,
      applyTo: async (target: Sprite | Container): Promise<void> => {
        // Update center to sprite's actual center
        const app = target.parent?.parent;

        // Calculate center position for zoom blur
        if (
          app &&
          (app as unknown as { screen?: { width: number; height: number } })
            .screen
        ) {
          const screen = (
            app as unknown as { screen: { width: number; height: number } }
          ).screen;

          // Use screen center - filters use pixel coordinates
          const centerXPixel = screen.width / 2;
          const centerYPixel = screen.height / 2;

          // Set center to pixel coordinates
          filter.center = { x: centerXPixel, y: centerYPixel };
        }

        // Call original applyTo
        await originalResult.applyTo(target);
      },
    };
  }
}
