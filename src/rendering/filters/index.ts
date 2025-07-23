/**
 * @fileoverview Filter System Entry Point
 *
 * Unified export for all filter-related functionality including
 * core filters, advanced filters, displacement effects, and utilities.
 *
 * @version 1.0.0
 */

// Core filter system
export { FilterChain } from '../filter-chain';
export type {
  FilterConfig,
  FilterChainOptions,
  ChainExecutionResult,
  FilterChainMetrics,
} from '../filter-chain';

// Effect presets
export { EffectPresets } from '../effect-presets';
export { AdvancedFilterPresets } from '../advanced-filter-presets';
export type {
  PresetIntensity,
  EffectCategory,
  PresetOptions,
  EffectPreset,
  EffectPresetResult,
} from '../effect-presets';

// Displacement effects
export { DisplacementEffects } from '../displacement-effects';
export type {
  MouseFollowOptions,
  TransitionOptions,
  IdleEffectOptions,
} from '../displacement-effects';

// Displacement texture loading
export { DisplacementTextureLoader } from '../displacement-texture-loader';
export type {
  DisplacementTextureConfig,
  DisplacementTextures,
} from '../displacement-texture-loader';

// Validation utilities
export { FilterValidator } from '../filter-validation';
export type {
  FilterValidationResult,
  ValidationResults,
} from '../filter-validation';

// Convenience re-exports from PIXI core
export {
  BlurFilter,
  ColorMatrixFilter,
  DisplacementFilter,
  NoiseFilter,
} from 'pixi.js';

// Import classes for internal use
import { FilterChain, type FilterChainOptions } from '../filter-chain';
import { EffectPresets, type PresetOptions } from '../effect-presets';
import { AdvancedFilterPresets } from '../advanced-filter-presets';
import { DisplacementTextureLoader } from '../displacement-texture-loader';
import { DisplacementEffects } from '../displacement-effects';
import { FilterValidator } from '../filter-validation';

/**
 * Quick setup function for basic filter usage
 *
 * @param options - Configuration options
 * @returns Configured filter system components
 */
export async function setupFilterSystem(
  options: {
    loadDisplacementTextures?: boolean;
    enableAdvancedFilters?: boolean;
    validateSystem?: boolean;
  } = {}
): Promise<{
  effectPresets: EffectPresets;
  advancedPresets: AdvancedFilterPresets | null;
  textureLoader: DisplacementTextureLoader | null;
  displacementEffects: DisplacementEffects | null;
  createFilterChain: (options?: FilterChainOptions) => FilterChain;
  createBasicEffect: (
    name: string,
    options?: Partial<PresetOptions>
  ) => ReturnType<EffectPresets['createEffect']>;
  createAdvancedEffect: (
    name: string,
    options?: Partial<PresetOptions>
  ) => ReturnType<AdvancedFilterPresets['createEffect']> | undefined;
}> {
  const {
    loadDisplacementTextures = true,
    enableAdvancedFilters = true,
    validateSystem = false,
  } = options;

  // Initialize basic components
  const effectPresets = new EffectPresets();
  const advancedPresets = enableAdvancedFilters
    ? new AdvancedFilterPresets()
    : null;

  // Load displacement textures if requested
  let textureLoader: DisplacementTextureLoader | null = null;
  let displacementEffects: DisplacementEffects | null = null;

  if (loadDisplacementTextures) {
    textureLoader = new DisplacementTextureLoader();
    try {
      await textureLoader.loadDisplacementTextures();
      displacementEffects =
        textureLoader.createDisplacementEffects('background');
    } catch (error) {
      // Log displacement texture loading failure for debugging
      if (process.env.NODE_ENV !== 'test') {
        /* eslint-disable-next-line no-console */
        console.warn('Failed to load displacement textures:', error);
      }
    }
  }

  // Run validation if requested
  if (validateSystem) {
    const isValid = await FilterValidator.quickValidation();
    if (!isValid) {
      // Log validation failure for debugging
      if (process.env.NODE_ENV !== 'test') {
        /* eslint-disable-next-line no-console */
        console.warn('Filter system validation failed');
      }
    }
  }

  return {
    effectPresets,
    advancedPresets,
    textureLoader,
    displacementEffects,

    // Convenience methods
    createFilterChain: (options?: FilterChainOptions): FilterChain =>
      new FilterChain(options),
    createBasicEffect: (
      name: string,
      options?: Partial<PresetOptions>
    ): ReturnType<EffectPresets['createEffect']> =>
      effectPresets.createEffect(name, options),
    createAdvancedEffect: (
      name: string,
      options?: Partial<PresetOptions>
    ): ReturnType<AdvancedFilterPresets['createEffect']> | undefined =>
      advancedPresets?.createEffect(name, options),
  };
}

/**
 * Default export for quick access
 */
const FilterSystem = {
  FilterChain,
  EffectPresets,
  AdvancedFilterPresets,
  DisplacementEffects,
  DisplacementTextureLoader,
  FilterValidator,
  setupFilterSystem,
};

export default FilterSystem;
