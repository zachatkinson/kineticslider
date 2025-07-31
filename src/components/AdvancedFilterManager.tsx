/**
 * @fileoverview Advanced Filter Manager Component
 *
 * Provides an advanced interface for managing filter stacks with:
 * - Smart dropdown showing only unused filters
 * - Dynamic settings panels for each filter
 * - Real-time preview
 * - Add/remove functionality with + and X buttons
 * - Endless list design
 *
 * @version 1.0.0
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { AdvancedFilterPresets } from '../rendering/advanced-filter-presets';
import type { SliderCore } from '../core/slider-core';
import { debugLogger } from '../utils/debug-logger';

interface CustomTextureData {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  dataUrl: string;
  fileName: string;
  isCustomTexture: true;
}

interface FilterInstance {
  id: string;
  name: string;
  displayName: string;
  category: string;
  enabled: boolean;
  settings: Record<string, number | string | boolean | object>;
}

interface AdvancedFilterManagerProps {
  sliderEngine: SliderCore | null;
  onFilterApplied: (filterNames: string[]) => void;
  onError: (error: string) => void;
}

/**
 * Advanced Filter Manager - Smart filter UI with dynamic settings
 */
export const AdvancedFilterManager: React.FC<AdvancedFilterManagerProps> = ({
  sliderEngine,
  onFilterApplied,
  onError,
}) => {
  const [activeFilters, setActiveFilters] = useState<FilterInstance[]>([]);
  const [availableFilters, setAvailableFilters] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [advancedPresets] = useState(() => new AdvancedFilterPresets());

  // Get all available filter names (only advanced PIXI filters, not composite effects)
  const getAllAvailableFilters = useCallback((): string[] => {
    const advancedFilters = advancedPresets.getAdvancedPresetNames();
    return advancedFilters;
  }, [advancedPresets]);

  // Update available filters (exclude active ones)
  useEffect(() => {
    const allFilters = getAllAvailableFilters();
    const usedFilterNames = activeFilters.map((f) => f.name);
    const available = allFilters.filter(
      (name) => !usedFilterNames.includes(name)
    );
    setAvailableFilters(available);
  }, [activeFilters, getAllAvailableFilters]);

  // Stable filter state tracking with proper memoization
  const isApplyingRef = useRef(false);
  const lastSuccessfulStateRef = useRef<string>('');

  // Memoized filter state to prevent unnecessary recalculations
  const filterState = useMemo(() => {
    const enabledFilters = activeFilters.filter((f) => f.enabled);
    return {
      enabled: enabledFilters,
      filterNames: enabledFilters.map((f) => f.name),
      signature: JSON.stringify({
        filters: enabledFilters.map((f) => ({
          name: f.name,
          settings: f.settings,
        })),
      }),
    };
  }, [activeFilters]);

  // Stable filter application function with proper state management
  const applyFiltersStable = useCallback(
    async (state: typeof filterState): Promise<void> => {
      // Prevent concurrent operations
      if (isApplyingRef.current || !sliderEngine) {
        return;
      }

      // Skip if we're trying to apply the exact same state
      if (state.signature === lastSuccessfulStateRef.current) {
        return;
      }

      isApplyingRef.current = true;

      try {
        if (state.enabled.length > 0) {
          const filterSettings: Record<
            string,
            Record<string, number | string | boolean | object>
          > = {};
          state.enabled.forEach((filter) => {
            filterSettings[filter.name] = filter.settings;
          });

          await sliderEngine.applyFilters(state.filterNames, filterSettings);
          onFilterApplied(state.filterNames);
          lastSuccessfulStateRef.current = state.signature;
        } else {
          // Only clear if we previously had a successful state (not initial empty state)
          if (lastSuccessfulStateRef.current !== '') {
            await sliderEngine.clearFilters();
            onFilterApplied([]);
            lastSuccessfulStateRef.current = state.signature;
          }
        }
      } catch (error) {
        onError(
          error instanceof Error ? error.message : 'Filter application failed'
        );
      } finally {
        isApplyingRef.current = false;
      }
    },
    [sliderEngine, onFilterApplied, onError]
  );

  // Effect with stable dependencies and proper cleanup
  useEffect((): (() => void) => {
    const timeoutId = setTimeout(() => {
      applyFiltersStable(filterState);
    }, 100); // Increased debounce for better stability

    return (): void => clearTimeout(timeoutId);
  }, [filterState, applyFiltersStable]);

  // Add a new filter (enabled by default for immediate visual feedback)
  const addFilter = useCallback((filterName: string): void => {
    const displayName =
      filterName.charAt(0).toUpperCase() + filterName.slice(1);
    const newFilter: FilterInstance = {
      id: `${filterName}-${Date.now()}`,
      name: filterName,
      displayName,
      category: 'effect', // Could be enhanced to detect actual category
      enabled: true, // Auto-enable when selected from dropdown
      settings: getDefaultSettings(filterName),
    };

    setActiveFilters((prev) => [...prev, newFilter]);
    setShowDropdown(false);

    // Note: Filter will be applied by useEffect when activeFilters changes
  }, []);

  // Remove a filter
  const removeFilter = useCallback(
    async (filterId: string) => {
      const newFilters = activeFilters.filter((f) => f.id !== filterId);
      setActiveFilters(newFilters);

      // If removing the last filter, clear the slider
      if (newFilters.length === 0 && sliderEngine) {
        await sliderEngine.clearFilters();
        onFilterApplied([]);
      }
      // Otherwise useEffect will handle applying remaining enabled filters
    },
    [activeFilters, sliderEngine, onFilterApplied]
  );

  // Toggle filter enabled state
  const toggleFilterEnabled = useCallback((filterId: string) => {
    setActiveFilters((prev) =>
      prev.map((f) => (f.id === filterId ? { ...f, enabled: !f.enabled } : f))
    );
    // Note: Filter will be applied by useEffect when activeFilters changes
  }, []);

  // Update filter settings
  const updateFilterSettings = useCallback(
    (
      filterId: string,
      settings: Record<string, number | string | boolean | object>
    ) => {
      setActiveFilters((prev) =>
        prev.map((f) =>
          f.id === filterId
            ? { ...f, settings: { ...f.settings, ...settings } }
            : f
        )
      );
      // Note: Filter will be applied by useEffect when activeFilters changes
    },
    []
  );

  // Safe property setter helper
  const createSafeUpdate = (
    key: string,
    value: number | string | boolean | object
  ): Record<string, number | string | boolean | object> => {
    const update: Record<string, number | string | boolean | object> = {};
    // Validate key is a safe property name and use a safe approach
    if (/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) {
      Object.defineProperty(update, key, {
        value,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
    return update;
  };

  // Helper function to handle file upload and texture creation
  const handleFileUpload = async (
    file: File,
    filterId: string,
    key: string
  ): Promise<void> => {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file (PNG, JPG, WebP)');
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('File size must be less than 2MB');
      }

      // Create a file reader to convert file to data URL
      const reader = new FileReader();

      reader.onload = (e): void => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          // Create an image element to load the file
          const img = new Image();
          img.crossOrigin = 'anonymous';

          img.onload = (): void => {
            try {
              // Create a canvas to process the image
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');

              if (!ctx) {
                throw new Error('Could not create canvas context');
              }

              // Resize image if needed (max 512x512 for performance)
              const maxSize = 512;
              let { width, height } = img;

              if (width > maxSize || height > maxSize) {
                const scale = Math.min(maxSize / width, maxSize / height);
                width *= scale;
                height *= scale;
              }

              canvas.width = width;
              canvas.height = height;

              // Draw the image to canvas
              ctx.drawImage(img, 0, 0, width, height);

              // Create texture data that can be passed to the filter
              const textureData = {
                canvas: canvas,
                width: width,
                height: height,
                dataUrl: dataUrl,
                fileName: file.name,
                isCustomTexture: true,
              };

              // Update the filter settings with the texture data
              const updates = createSafeUpdate(key, textureData);
              updateFilterSettings(filterId, updates);

              // Log success for debugging
              debugLogger.info(
                `Custom colormap texture created successfully: ${file.name}`,
                'AdvancedFilterManager'
              );
            } catch (error) {
              debugLogger.error(
                'Error processing image',
                'AdvancedFilterManager',
                error
              );
              // Could show user feedback here
            }
          };

          img.onerror = (): void => {
            debugLogger.error(
              'Error loading image file',
              'AdvancedFilterManager'
            );
            // Could show user feedback here
          };

          img.src = dataUrl;
        }
      };

      reader.onerror = (): void => {
        debugLogger.error('Error reading file', 'AdvancedFilterManager');
        // Could show user feedback here
      };

      reader.readAsDataURL(file);
    } catch (error) {
      debugLogger.error('File upload error', 'AdvancedFilterManager', error);
      // Could show user feedback here
    }
  };

  // Helper functions for property ranges
  function getPropertyMin(key: string, filterName?: string): string {
    // Special handling for godray filter properties
    if (filterName === 'godray') {
      const godrayMinValues: Record<string, string> = {
        angle: '-180',
        centerX: '0',
        centerY: '0',
        gain: '0',
        lacunarity: '1',
        time: '0',
        alpha: '0',
      };
      if (Object.prototype.hasOwnProperty.call(godrayMinValues, key)) {
        return godrayMinValues[key as keyof typeof godrayMinValues];
      }
    }

    // Special handling for HSL adjustment filter properties
    if (filterName === 'hslAdjustment') {
      const hslMinValues: Record<string, string> = {
        hue: '-180',
        lightness: '-1',
        saturation: '-1',
        alpha: '0',
      };
      if (Object.prototype.hasOwnProperty.call(hslMinValues, key)) {
        return hslMinValues[key as keyof typeof hslMinValues];
      }
    }

    // Special handling for kawase blur filter properties
    if (filterName === 'kawaseBlur') {
      const kawaseMinValues: Record<string, string> = {
        strength: '0',
        quality: '1',
        pixelSizeX: '0.1',
        pixelSizeY: '0.1',
        alpha: '0',
      };
      if (Object.prototype.hasOwnProperty.call(kawaseMinValues, key)) {
        return kawaseMinValues[key as keyof typeof kawaseMinValues];
      }
    }

    // Special handling for motion blur filter properties
    if (filterName === 'motionBlur') {
      const motionBlurMinValues: Record<string, string> = {
        velocityX: '-200',
        velocityY: '-200',
        kernelSize: '3',
        offset: '0',
        alpha: '0',
      };
      if (Object.prototype.hasOwnProperty.call(motionBlurMinValues, key)) {
        return motionBlurMinValues[key as keyof typeof motionBlurMinValues];
      }
    }

    // Special handling for multi color replace filter properties
    if (filterName === 'multiColorReplace') {
      const multiColorMinValues: Record<string, string> = {
        epsilon: '0',
        alpha: '0',
      };
      if (Object.prototype.hasOwnProperty.call(multiColorMinValues, key)) {
        return multiColorMinValues[key as keyof typeof multiColorMinValues];
      }
    }

    // Special handling for old film filter properties
    if (filterName === 'oldFilm') {
      const oldFilmMinValues: Record<string, string> = {
        sepia: '0',
        noise: '0',
        noiseSize: '1',
        scratch: '0',
        scratchDensity: '0',
        scratchWidth: '1',
        vignetting: '0',
        vignettingAlpha: '0',
        vignettingBlur: '0',
        alpha: '0',
        flickerFrequency: '0',
        noiseVariation: '0',
        scratchVariation: '0',
        seedChangeRate: '0.1',
        seed: '0',
      };
      if (Object.prototype.hasOwnProperty.call(oldFilmMinValues, key)) {
        return oldFilmMinValues[key as keyof typeof oldFilmMinValues];
      }
    }

    // Special handling for outline filter properties
    if (filterName === 'outline') {
      const outlineMinValues: Record<string, string> = {
        thickness: '0',
        alpha: '0',
        quality: '0',
      };
      if (Object.prototype.hasOwnProperty.call(outlineMinValues, key)) {
        return outlineMinValues[key as keyof typeof outlineMinValues];
      }
    }

    // Special handling for pixelate filter properties
    if (filterName === 'pixelate') {
      const pixelateMinValues: Record<string, string> = {
        size: '4',
      };
      if (Object.prototype.hasOwnProperty.call(pixelateMinValues, key)) {
        return pixelateMinValues[key as keyof typeof pixelateMinValues];
      }
    }

    // Special handling for radial blur filter properties
    if (filterName === 'radialBlur') {
      const radialBlurMinValues: Record<string, string> = {
        angle: '-180',
        centerX: '0',
        centerY: '0',
        radius: '-1',
        kernelSize: '5',
      };
      if (Object.prototype.hasOwnProperty.call(radialBlurMinValues, key)) {
        return radialBlurMinValues[key as keyof typeof radialBlurMinValues];
      }
    }

    // Special handling for reflection filter properties
    if (filterName === 'reflection') {
      const reflectionMinValues: Record<string, string> = {
        boundary: '0',
        amplitudeStart: '0',
        amplitudeEnd: '0',
        wavelengthStart: '10',
        wavelengthEnd: '10',
        alphaStart: '0',
        alphaEnd: '0',
        time: '0',
      };
      if (Object.prototype.hasOwnProperty.call(reflectionMinValues, key)) {
        return reflectionMinValues[key as keyof typeof reflectionMinValues];
      }
    }

    // Special handling for RGB split filter properties
    if (filterName === 'rgbSplit') {
      const rgbSplitMinValues: Record<string, string> = {
        redX: '-20',
        redY: '-20',
        greenX: '-20',
        greenY: '-20',
        blueX: '-20',
        blueY: '-20',
      };
      if (Object.prototype.hasOwnProperty.call(rgbSplitMinValues, key)) {
        return rgbSplitMinValues[key as keyof typeof rgbSplitMinValues];
      }
    }

    // Special handling for shockwave filter properties
    if (filterName === 'shockwave') {
      const shockwaveMinValues: Record<string, string> = {
        speed: '500',
        amplitude: '1',
        wavelength: '2',
        brightness: '0.2',
        radius: '100',
        centerX: '0',
        centerY: '0',
        time: '0',
      };
      if (Object.prototype.hasOwnProperty.call(shockwaveMinValues, key)) {
        return shockwaveMinValues[key as keyof typeof shockwaveMinValues];
      }
    }

    // Special handling for simple lightmap filter properties
    if (filterName === 'simpleLightmap') {
      const simpleLightmapMinValues: Record<string, string> = {
        alpha: '0',
      };
      if (Object.prototype.hasOwnProperty.call(simpleLightmapMinValues, key)) {
        return simpleLightmapMinValues[
          key as keyof typeof simpleLightmapMinValues
        ];
      }
    }

    // Special handling for simplex noise filter properties
    if (filterName === 'simplexNoise') {
      const simplexNoiseMinValues: Record<string, string> = {
        strength: '0',
        noiseScale: '0',
        offsetX: '0',
        offsetY: '0',
        offsetZ: '0',
        step: '-1',
      };
      if (Object.prototype.hasOwnProperty.call(simplexNoiseMinValues, key)) {
        return simplexNoiseMinValues[key as keyof typeof simplexNoiseMinValues];
      }
    }

    // Special handling for tilt shift filter properties
    if (filterName === 'tiltShift') {
      const tiltShiftMinValues: Record<string, string> = {
        blur: '0',
        gradientBlur: '0',
        startX: '0',
        startY: '0',
        endX: '0',
        endY: '0',
      };
      if (Object.prototype.hasOwnProperty.call(tiltShiftMinValues, key)) {
        return tiltShiftMinValues[key as keyof typeof tiltShiftMinValues];
      }
    }

    // Special handling for twist filter properties
    if (filterName === 'twist') {
      const twistMinValues: Record<string, string> = {
        angle: '-10',
        radius: '0',
        offsetX: '0',
        offsetY: '0',
      };
      if (Object.prototype.hasOwnProperty.call(twistMinValues, key)) {
        return twistMinValues[key as keyof typeof twistMinValues];
      }
    }
    // Special handling for zoomBlur filter properties
    if (filterName === 'zoomBlur') {
      const zoomBlurMinValues: Record<string, string> = {
        strength: '0.01',
        centerX: '0',
        centerY: '0',
        innerRadius: '0',
        radius: '-1',
      };
      if (Object.prototype.hasOwnProperty.call(zoomBlurMinValues, key)) {
        return zoomBlurMinValues[key as keyof typeof zoomBlurMinValues];
      }
    }

    const minValues: Record<string, string> = {
      // AdjustmentFilter properties
      gamma: '0.1',
      saturation: '0',
      contrast: '0',
      brightness: '0',
      red: '0',
      green: '0',
      blue: '0',
      alpha: '0',
      // AdvancedBloomFilter properties
      bloomScale: '0',
      blur: '0',
      pixelSizeX: '0.1',
      pixelSizeY: '0.1',
      threshold: '0',
      // Common properties
      intensity: '0',
      size: '1',
      distance: '0',
      outerStrength: '0',
      innerStrength: '0',
      quality: '1',
      // BackdropBlur properties
      blurX: '0',
      blurY: '0',
      resolution: '0.1',
      // BevelFilter properties
      rotation: '0',
      thickness: '0',
      lightAlpha: '0',
      shadowAlpha: '0',
      // BloomFilter properties
      strengthX: '0',
      strengthY: '0',
      // BlurFilter properties (note: blurX/blurY/quality already defined for BackdropBlur)
      // BulgePinchFilter properties
      centerX: '0',
      centerY: '0',
      radius: '10',
      // BulgePinchFilter properties
      bulgePinchStrength: '-1', // Can be negative for pinch effect, positive for others
      // ColorGradientFilter properties
      type: '0', // Gradient type (0 = linear, 1 = radial)
      gradientAngle: '0', // Angle in degrees
      startOffset: '0', // Start position
      endOffset: '0', // End position
      startAlpha: '0', // Start color alpha
      endAlpha: '0', // End color alpha
      // ColorMapFilter properties
      mix: '0', // Blend amount minimum
      nearest: 'false', // Boolean as string for consistency
      // ColorMatrixFilter properties
      hue: '0', // Hue rotation in degrees
      // ColorReplaceFilter properties
      tolerance: '0', // Color matching tolerance minimum
      // ConvolutionFilter properties
      width: '1', // Matrix width minimum
      height: '1', // Matrix height minimum
      // DotFilter properties
      scale: '0.1', // Dot size minimum
      angle: '0', // Rotation angle minimum
      // DropShadowFilter properties
      offsetX: '-20', // Horizontal shadow offset minimum
      offsetY: '-20', // Vertical shadow offset minimum
      // EmbossFilter properties
      strength: '0', // Emboss effect strength minimum
      // GlitchFilter properties
      slices: '0', // Glitch slices minimum
      offset: '0', // Displacement minimum
      direction: '0', // Angle minimum
      seed: '0', // Seed minimum
      fillMode: '0', // Fill mode minimum
      burstFrequency: '1', // Burst frequency minimum (seconds)
      burstDuration: '0.1', // Burst duration minimum (seconds)
      intensityMin: '0.1', // Animation intensity minimum
      intensityMax: '1', // Animation intensity max minimum
      residualChance: '0', // Residual chance minimum (%)
      staticChance: '0', // Static chance minimum (%)
      // CRTFilter properties
      curvature: '0', // Screen curvature minimum
      lineContrast: '0', // Scan line contrast minimum
      lineWidth: '0.1', // Scan line width minimum
      noise: '0', // Noise amount minimum
      vignetting: '0', // Vignette strength minimum
      // DisplacementFilter properties
      scaleX: '0', // Horizontal displacement minimum
      scaleY: '0', // Vertical displacement minimum
    };
    return Object.prototype.hasOwnProperty.call(minValues, key)
      ? minValues[key as keyof typeof minValues]
      : '0';
  }

  function getPropertyMax(key: string, filterName?: string): string {
    // Special handling for godray filter properties
    if (filterName === 'godray') {
      const godrayMaxValues: Record<string, string> = {
        angle: '180',
        centerX: '1',
        centerY: '1',
        gain: '1',
        lacunarity: '5',
        time: '100',
        alpha: '1',
      };
      if (Object.prototype.hasOwnProperty.call(godrayMaxValues, key)) {
        return godrayMaxValues[key as keyof typeof godrayMaxValues];
      }
    }

    // Special handling for HSL adjustment filter properties
    if (filterName === 'hslAdjustment') {
      const hslMaxValues: Record<string, string> = {
        hue: '180',
        lightness: '1',
        saturation: '1',
        alpha: '1',
      };
      if (Object.prototype.hasOwnProperty.call(hslMaxValues, key)) {
        return hslMaxValues[key as keyof typeof hslMaxValues];
      }
    }

    // Special handling for kawase blur filter properties
    if (filterName === 'kawaseBlur') {
      const kawaseMaxValues: Record<string, string> = {
        strength: '50',
        quality: '20',
        pixelSizeX: '10',
        pixelSizeY: '10',
        alpha: '1',
      };
      if (Object.prototype.hasOwnProperty.call(kawaseMaxValues, key)) {
        return kawaseMaxValues[key as keyof typeof kawaseMaxValues];
      }
    }

    // Special handling for motion blur filter properties
    if (filterName === 'motionBlur') {
      const motionBlurMaxValues: Record<string, string> = {
        velocityX: '200',
        velocityY: '200',
        kernelSize: '25',
        offset: '10',
        alpha: '1',
      };
      if (Object.prototype.hasOwnProperty.call(motionBlurMaxValues, key)) {
        return motionBlurMaxValues[key as keyof typeof motionBlurMaxValues];
      }
    }

    // Special handling for multi color replace filter properties
    if (filterName === 'multiColorReplace') {
      const multiColorMaxValues: Record<string, string> = {
        epsilon: '1',
        alpha: '1',
      };
      if (Object.prototype.hasOwnProperty.call(multiColorMaxValues, key)) {
        return multiColorMaxValues[key as keyof typeof multiColorMaxValues];
      }
    }

    // Special handling for old film filter properties
    if (filterName === 'oldFilm') {
      const oldFilmMaxValues: Record<string, string> = {
        sepia: '1',
        noise: '1',
        noiseSize: '10',
        scratch: '1',
        scratchDensity: '1',
        scratchWidth: '10',
        vignetting: '1',
        vignettingAlpha: '1',
        vignettingBlur: '1',
        alpha: '1',
        flickerFrequency: '1',
        noiseVariation: '0.5',
        scratchVariation: '0.5',
        seedChangeRate: '10',
        seed: '1',
      };
      if (Object.prototype.hasOwnProperty.call(oldFilmMaxValues, key)) {
        return oldFilmMaxValues[key as keyof typeof oldFilmMaxValues];
      }
    }

    // Special handling for outline filter properties
    if (filterName === 'outline') {
      const outlineMaxValues: Record<string, string> = {
        thickness: '20',
        alpha: '1',
        quality: '1',
      };
      if (Object.prototype.hasOwnProperty.call(outlineMaxValues, key)) {
        return outlineMaxValues[key as keyof typeof outlineMaxValues];
      }
    }

    // Special handling for pixelate filter properties
    if (filterName === 'pixelate') {
      const pixelateMaxValues: Record<string, string> = {
        size: '40',
      };
      if (Object.prototype.hasOwnProperty.call(pixelateMaxValues, key)) {
        return pixelateMaxValues[key as keyof typeof pixelateMaxValues];
      }
    }

    // Special handling for radial blur filter properties
    if (filterName === 'radialBlur') {
      const radialBlurMaxValues: Record<string, string> = {
        angle: '180',
        centerX: '1200',
        centerY: '400',
        radius: '1200',
        kernelSize: '25',
      };
      if (Object.prototype.hasOwnProperty.call(radialBlurMaxValues, key)) {
        return radialBlurMaxValues[key as keyof typeof radialBlurMaxValues];
      }
    }

    // Special handling for reflection filter properties
    if (filterName === 'reflection') {
      const reflectionMaxValues: Record<string, string> = {
        boundary: '1',
        amplitudeStart: '50',
        amplitudeEnd: '50',
        wavelengthStart: '200',
        wavelengthEnd: '200',
        alphaStart: '1',
        alphaEnd: '1',
        time: '20',
      };
      if (Object.prototype.hasOwnProperty.call(reflectionMaxValues, key)) {
        return reflectionMaxValues[key as keyof typeof reflectionMaxValues];
      }
    }

    // Special handling for RGB split filter properties
    if (filterName === 'rgbSplit') {
      const rgbSplitMaxValues: Record<string, string> = {
        redX: '20',
        redY: '20',
        greenX: '20',
        greenY: '20',
        blueX: '20',
        blueY: '20',
      };
      if (Object.prototype.hasOwnProperty.call(rgbSplitMaxValues, key)) {
        return rgbSplitMaxValues[key as keyof typeof rgbSplitMaxValues];
      }
    }

    // Special handling for shockwave filter properties
    if (filterName === 'shockwave') {
      const shockwaveMaxValues: Record<string, string> = {
        speed: '2000',
        amplitude: '100',
        wavelength: '400',
        brightness: '2',
        radius: '2000',
        centerX: '1200',
        centerY: '400',
        time: '20',
      };
      if (Object.prototype.hasOwnProperty.call(shockwaveMaxValues, key)) {
        return shockwaveMaxValues[key as keyof typeof shockwaveMaxValues];
      }
    }

    // Special handling for simple lightmap filter properties
    if (filterName === 'simpleLightmap') {
      const simpleLightmapMaxValues: Record<string, string> = {
        alpha: '1',
      };
      if (Object.prototype.hasOwnProperty.call(simpleLightmapMaxValues, key)) {
        return simpleLightmapMaxValues[
          key as keyof typeof simpleLightmapMaxValues
        ];
      }
    }

    // Special handling for simplex noise filter properties
    if (filterName === 'simplexNoise') {
      const simplexNoiseMaxValues: Record<string, string> = {
        strength: '1',
        noiseScale: '50',
        offsetX: '5',
        offsetY: '5',
        offsetZ: '5',
        step: '1',
      };
      if (Object.prototype.hasOwnProperty.call(simplexNoiseMaxValues, key)) {
        return simplexNoiseMaxValues[key as keyof typeof simplexNoiseMaxValues];
      }
    }

    // Special handling for tilt shift filter properties
    if (filterName === 'tiltShift') {
      const tiltShiftMaxValues: Record<string, string> = {
        blur: '200',
        gradientBlur: '1000',
        startX: '1200', // Stage width
        startY: '400', // Stage height
        endX: '1200', // Stage width
        endY: '400', // Stage height
      };
      if (Object.prototype.hasOwnProperty.call(tiltShiftMaxValues, key)) {
        return tiltShiftMaxValues[key as keyof typeof tiltShiftMaxValues];
      }
    }

    // Special handling for twist filter properties
    if (filterName === 'twist') {
      const twistMaxValues: Record<string, string> = {
        angle: '10',
        radius: '1200', // Stage width
        offsetX: '1200', // Stage width
        offsetY: '400', // Stage height
      };
      if (Object.prototype.hasOwnProperty.call(twistMaxValues, key)) {
        return twistMaxValues[key as keyof typeof twistMaxValues];
      }
    }
    // Special handling for zoomBlur filter properties
    if (filterName === 'zoomBlur') {
      const zoomBlurMaxValues: Record<string, string> = {
        strength: '0.5',
        centerX: '1200', // Stage width
        centerY: '400', // Stage height
        innerRadius: '300', // Stage height minus 100 (400-100)
        radius: '300', // Stage height minus 100 (400-100)
      };
      if (Object.prototype.hasOwnProperty.call(zoomBlurMaxValues, key)) {
        return zoomBlurMaxValues[key as keyof typeof zoomBlurMaxValues];
      }
    }

    const maxValues: Record<string, string> = {
      // AdjustmentFilter properties
      gamma: '3',
      saturation: '3',
      contrast: '3',
      brightness: '3',
      red: '3',
      green: '3',
      blue: '3',
      alpha: '1',
      // AdvancedBloomFilter properties
      bloomScale: '5',
      blur: '10',
      pixelSizeX: '10',
      pixelSizeY: '10',
      threshold: '1',
      // Common properties
      intensity: '1',
      size: '20',
      distance: '50',
      outerStrength: '4',
      innerStrength: '4',
      quality: '10',
      // BackdropBlur properties
      blurX: '20',
      blurY: '20',
      resolution: '2',
      // BevelFilter properties
      rotation: '360',
      thickness: '10',
      lightAlpha: '1',
      shadowAlpha: '1',
      // BloomFilter properties
      strengthX: '10',
      strengthY: '10',
      // BulgePinchFilter properties
      centerX: '1',
      centerY: '1',
      radius: '500',
      // BulgePinchFilter properties
      bulgePinchStrength: '20', // Max strength for bulge/pinch
      // ColorGradientFilter properties
      type: '1', // Gradient type (0 = linear, 1 = radial)
      gradientAngle: '360', // Angle in degrees (full circle)
      startOffset: '1', // Start position (can be anywhere 0-1)
      endOffset: '1', // End position (can be anywhere 0-1)
      startAlpha: '1', // Start color alpha (full opacity)
      endAlpha: '1', // End color alpha (full opacity)
      // ColorMapFilter properties
      mix: '1', // Blend amount maximum (full effect)
      nearest: 'true', // Boolean as string for consistency
      // ColorMatrixFilter properties
      hue: '360', // Full hue rotation
      // ColorReplaceFilter properties
      tolerance: '1', // Color matching tolerance maximum
      // ConvolutionFilter properties
      width: '5', // Matrix width maximum (practical limit)
      height: '5', // Matrix height maximum (practical limit)
      // CRTFilter properties
      curvature: '5', // Screen curvature maximum
      lineContrast: '1', // Scan line contrast maximum
      lineWidth: '5', // Scan line width maximum
      noise: '1', // Noise amount maximum
      vignetting: '1', // Vignette strength maximum
      // DisplacementFilter properties
      scaleX: '100', // Horizontal displacement maximum
      scaleY: '100', // Vertical displacement maximum
      // DotFilter properties
      scale: '1', // Dot size maximum
      angle: '360', // Rotation angle maximum
      // DropShadowFilter properties
      offsetX: '20', // Horizontal shadow offset maximum
      offsetY: '20', // Vertical shadow offset maximum
      // EmbossFilter properties
      strength: '20', // Emboss effect strength maximum
      // GlitchFilter properties
      slices: '50', // Glitch slices maximum
      offset: '100', // Displacement maximum
      direction: '360', // Angle maximum
      seed: '1', // Seed maximum
      fillMode: '3', // Fill mode maximum
      burstFrequency: '15', // Burst frequency maximum (seconds)
      burstDuration: '3', // Burst duration maximum (seconds)
      intensityMin: '1', // Animation intensity min maximum
      intensityMax: '5', // Animation intensity max maximum
      residualChance: '50', // Residual chance maximum (%)
      staticChance: '10', // Static chance maximum (%)
    };
    return Object.prototype.hasOwnProperty.call(maxValues, key)
      ? maxValues[key as keyof typeof maxValues]
      : '100';
  }

  function getPropertyStep(key: string, filterName?: string): string {
    // Special handling for godray filter properties
    if (filterName === 'godray') {
      const godrayStepValues: Record<string, string> = {
        angle: '1',
        centerX: '0.01',
        centerY: '0.01',
        gain: '0.01',
        lacunarity: '0.1',
        time: '1',
        alpha: '0.01',
      };
      if (Object.prototype.hasOwnProperty.call(godrayStepValues, key)) {
        return godrayStepValues[key as keyof typeof godrayStepValues];
      }
    }

    // Special handling for HSL adjustment filter properties
    if (filterName === 'hslAdjustment') {
      const hslStepValues: Record<string, string> = {
        hue: '1',
        lightness: '0.01',
        saturation: '0.01',
        alpha: '0.01',
      };
      if (Object.prototype.hasOwnProperty.call(hslStepValues, key)) {
        return hslStepValues[key as keyof typeof hslStepValues];
      }
    }

    // Special handling for kawase blur filter properties
    if (filterName === 'kawaseBlur') {
      const kawaseStepValues: Record<string, string> = {
        strength: '0.5',
        quality: '1',
        pixelSizeX: '0.1',
        pixelSizeY: '0.1',
        alpha: '0.01',
      };
      if (Object.prototype.hasOwnProperty.call(kawaseStepValues, key)) {
        return kawaseStepValues[key as keyof typeof kawaseStepValues];
      }
    }

    // Special handling for motion blur filter properties
    if (filterName === 'motionBlur') {
      const motionBlurStepValues: Record<string, string> = {
        velocityX: '1',
        velocityY: '1',
        kernelSize: '1',
        offset: '0.1',
        alpha: '0.01',
      };
      if (Object.prototype.hasOwnProperty.call(motionBlurStepValues, key)) {
        return motionBlurStepValues[key as keyof typeof motionBlurStepValues];
      }
    }

    // Special handling for multi color replace filter properties
    if (filterName === 'multiColorReplace') {
      const multiColorStepValues: Record<string, string> = {
        epsilon: '0.01',
        alpha: '0.01',
      };
      if (Object.prototype.hasOwnProperty.call(multiColorStepValues, key)) {
        return multiColorStepValues[key as keyof typeof multiColorStepValues];
      }
    }

    // Special handling for old film filter properties
    if (filterName === 'oldFilm') {
      const oldFilmStepValues: Record<string, string> = {
        sepia: '0.001', // 3 decimal places
        noise: '0.00001', // 5 decimal places
        noiseSize: '1', // Integer values 1-10
        scratch: '0.0001', // 4 decimal places
        scratchDensity: '0.00001', // 5 decimal places
        scratchWidth: '1', // Integer values 1-10
        vignetting: '0.00001', // 5 decimal places
        vignettingAlpha: '0.00001', // 5 decimal places
        vignettingBlur: '0.00001', // 5 decimal places
        alpha: '0.01',
        flickerFrequency: '0.01',
        noiseVariation: '0.01',
        scratchVariation: '0.01',
        seedChangeRate: '0.1',
        seed: '0.01',
      };
      if (Object.prototype.hasOwnProperty.call(oldFilmStepValues, key)) {
        return oldFilmStepValues[key as keyof typeof oldFilmStepValues];
      }
    }

    // Special handling for outline filter properties
    if (filterName === 'outline') {
      const outlineStepValues: Record<string, string> = {
        thickness: '0.5',
        alpha: '0.01',
        quality: '0.01',
      };
      if (Object.prototype.hasOwnProperty.call(outlineStepValues, key)) {
        return outlineStepValues[key as keyof typeof outlineStepValues];
      }
    }

    // Special handling for pixelate filter properties
    if (filterName === 'pixelate') {
      const pixelateStepValues: Record<string, string> = {
        size: '1', // Integer steps for pixel size
      };
      if (Object.prototype.hasOwnProperty.call(pixelateStepValues, key)) {
        return pixelateStepValues[key as keyof typeof pixelateStepValues];
      }
    }

    // Special handling for radial blur filter properties
    if (filterName === 'radialBlur') {
      const radialBlurStepValues: Record<string, string> = {
        angle: '1', // Integer degrees for angle
        centerX: '10', // Pixel-based control for center position
        centerY: '10', // Pixel-based control for center position
        radius: '10', // Pixel-based control for radius
        kernelSize: '2', // Even integer steps for kernel size
      };
      if (Object.prototype.hasOwnProperty.call(radialBlurStepValues, key)) {
        return radialBlurStepValues[key as keyof typeof radialBlurStepValues];
      }
    }

    // Special handling for reflection filter properties
    if (filterName === 'reflection') {
      const reflectionStepValues: Record<string, string> = {
        boundary: '0.01', // Fine control for boundary
        amplitudeStart: '1', // Integer steps for amplitude
        amplitudeEnd: '1', // Integer steps for amplitude
        wavelengthStart: '1', // Integer steps for wavelength
        wavelengthEnd: '1', // Integer steps for wavelength
        alphaStart: '0.01', // Fine control for alpha
        alphaEnd: '0.01', // Fine control for alpha
        time: '0.1', // Fine control for time
      };
      if (Object.prototype.hasOwnProperty.call(reflectionStepValues, key)) {
        return reflectionStepValues[key as keyof typeof reflectionStepValues];
      }
    }

    // Special handling for RGB split filter properties
    if (filterName === 'rgbSplit') {
      const rgbSplitStepValues: Record<string, string> = {
        redX: '0.5', // Fine control for RGB offsets
        redY: '0.5', // Fine control for RGB offsets
        greenX: '0.5', // Fine control for RGB offsets
        greenY: '0.5', // Fine control for RGB offsets
        blueX: '0.5', // Fine control for RGB offsets
        blueY: '0.5', // Fine control for RGB offsets
      };
      if (Object.prototype.hasOwnProperty.call(rgbSplitStepValues, key)) {
        return rgbSplitStepValues[key as keyof typeof rgbSplitStepValues];
      }
    }

    // Special handling for shockwave filter properties
    if (filterName === 'shockwave') {
      const shockwaveStepValues: Record<string, string> = {
        speed: '10', // Integer steps for speed
        amplitude: '1', // Integer steps for amplitude
        wavelength: '2', // Integer steps for wavelength
        brightness: '0.01', // Fine control for brightness
        radius: '10', // Integer steps for radius
        centerX: '10', // Pixel-based control for center position
        centerY: '10', // Pixel-based control for center position
        time: '0.1', // Fine control for time
      };
      if (Object.prototype.hasOwnProperty.call(shockwaveStepValues, key)) {
        return shockwaveStepValues[key as keyof typeof shockwaveStepValues];
      }
    }

    // Special handling for simple lightmap filter properties
    if (filterName === 'simpleLightmap') {
      const simpleLightmapStepValues: Record<string, string> = {
        alpha: '0.01', // Fine control for alpha
      };
      if (Object.prototype.hasOwnProperty.call(simpleLightmapStepValues, key)) {
        return simpleLightmapStepValues[
          key as keyof typeof simpleLightmapStepValues
        ];
      }
    }

    // Special handling for simplex noise filter properties
    if (filterName === 'simplexNoise') {
      const simplexNoiseStepValues: Record<string, string> = {
        strength: '0.001', // 3 decimal places for strength
        noiseScale: '1', // Integer steps for noise scale
        offsetX: '0.001', // 3 decimal places for offset X
        offsetY: '0.001', // 3 decimal places for offset Y
        offsetZ: '0.001', // 3 decimal places for offset Z
        step: '0.001', // 3 decimal places for step
      };
      if (Object.prototype.hasOwnProperty.call(simplexNoiseStepValues, key)) {
        return simplexNoiseStepValues[
          key as keyof typeof simplexNoiseStepValues
        ];
      }
    }

    // Special handling for tilt shift filter properties
    if (filterName === 'tiltShift') {
      const tiltShiftStepValues: Record<string, string> = {
        blur: '0.0001', // 4 decimal places for blur
        gradientBlur: '1', // Integer steps for gradient blur
        startX: '1', // Pixel-based control for start X position
        startY: '1', // Pixel-based control for start Y position
        endX: '1', // Pixel-based control for end X position
        endY: '1', // Pixel-based control for end Y position
      };
      if (Object.prototype.hasOwnProperty.call(tiltShiftStepValues, key)) {
        return tiltShiftStepValues[key as keyof typeof tiltShiftStepValues];
      }
    }

    // Special handling for twist filter properties
    if (filterName === 'twist') {
      const twistStepValues: Record<string, string> = {
        angle: '0.1', // Smooth control for twist angle
        radius: '1', // Pixel-based control for radius
        offsetX: '1', // Pixel-based control for center X position
        offsetY: '1', // Pixel-based control for center Y position
      };
      if (Object.prototype.hasOwnProperty.call(twistStepValues, key)) {
        return twistStepValues[key as keyof typeof twistStepValues];
      }
    }
    // Special handling for zoomBlur filter properties
    if (filterName === 'zoomBlur') {
      const zoomBlurStepValues: Record<string, string> = {
        strength: '0.01', // Fine control for strength (matches min value)
        centerX: '1', // Pixel-based control for center X position
        centerY: '1', // Pixel-based control for center Y position
        innerRadius: '1', // Pixel-based control for inner radius
        radius: '1', // Pixel-based control for radius
      };
      if (Object.prototype.hasOwnProperty.call(zoomBlurStepValues, key)) {
        return zoomBlurStepValues[key as keyof typeof zoomBlurStepValues];
      }
    }

    const stepValues: Record<string, string> = {
      // Fine control for adjustment properties
      gamma: '0.05',
      saturation: '0.05',
      contrast: '0.05',
      brightness: '0.05',
      red: '0.05',
      green: '0.05',
      blue: '0.05',
      alpha: '0.001',
      intensity: '0.05',
      // AdvancedBloomFilter properties
      bloomScale: '0.1',
      blur: '0.1',
      pixelSizeX: '0.1',
      pixelSizeY: '0.1',
      threshold: '0.05',
      // Coarser control for size/distance
      size: '1',
      distance: '1',
      quality: '1',
      outerStrength: '0.1',
      innerStrength: '0.1',
      // BackdropBlur properties
      blurX: '1',
      blurY: '1',
      resolution: '0.1',
      // BevelFilter properties
      rotation: '1',
      thickness: '0.5',
      lightAlpha: '0.05',
      shadowAlpha: '0.05',
      // BloomFilter properties
      strengthX: '0.1',
      strengthY: '0.1',
      // BulgePinchFilter properties
      centerX: '0.01',
      centerY: '0.01',
      radius: '5',
      // BulgePinchFilter properties
      bulgePinchStrength: '0.1', // Step for bulge/pinch strength
      // ColorGradientFilter properties
      type: '1', // Step for gradient type (integer values)
      gradientAngle: '5', // Step for angle in degrees
      startOffset: '0.01', // Step for offset positions
      endOffset: '0.01', // Step for offset positions
      startAlpha: '0.05', // Step for color alpha
      endAlpha: '0.05', // Step for color alpha
      // ColorMapFilter properties
      mix: '0.05', // Step for blend amount
      nearest: '1', // Step for boolean (not used but required)
      // ColorMatrixFilter properties
      hue: '5', // Step for hue rotation
      // ColorReplaceFilter properties
      tolerance: '0.01', // Step for color matching tolerance
      // ConvolutionFilter properties
      width: '1', // Step for matrix width
      height: '1', // Step for matrix height
      // CRTFilter properties
      curvature: '0.1', // Step for screen curvature
      lineContrast: '0.05', // Step for scan line contrast
      lineWidth: '0.1', // Step for scan line width
      noise: '0.05', // Step for noise amount
      vignetting: '0.05', // Step for vignette strength
      // DisplacementFilter properties
      scaleX: '1', // Step for horizontal displacement
      scaleY: '1', // Step for vertical displacement
      // DotFilter properties
      scale: '0.01', // Step for dot size
      angle: '1', // Step for rotation angle
      // DropShadowFilter properties
      offsetX: '1', // Step for horizontal shadow offset
      offsetY: '1', // Step for vertical shadow offset
      // EmbossFilter properties
      strength: '0.5', // Step for emboss effect strength
      // GlitchFilter properties
      slices: '1', // Step for glitch slices
      offset: '1', // Step for displacement
      direction: '5', // Step for angle
      seed: '0.01', // Step for seed
      fillMode: '1', // Step for fill mode
      burstFrequency: '0.1', // Step for burst frequency
      burstDuration: '0.1', // Step for burst duration
      intensityMin: '0.1', // Step for animation intensity min
      intensityMax: '0.1', // Step for animation intensity max
      residualChance: '1', // Step for residual chance
      staticChance: '0.1', // Step for static chance
    };
    return Object.prototype.hasOwnProperty.call(stepValues, key)
      ? stepValues[key as keyof typeof stepValues]
      : '0.1';
  }

  // Get default settings for a filter
  function getDefaultSettings(
    filterName: string
  ): Record<string, number | string | boolean | object> {
    // Common filter settings - could be enhanced with filter-specific defaults
    const commonSettings: Record<
      string,
      Record<string, number | string | boolean | object>
    > = {
      glow: {
        distance: 15,
        outerStrength: 2,
        innerStrength: 0,
        color: '#ffffff',
        alpha: 1,
        knockout: false,
        quality: 0.1,
      },
      pixelate: {
        size: 10, // Pixel block size (1-100)
      },
      radialBlur: {
        angle: 10, // Blur angle in degrees (-180 to 180)
        centerX: 600, // Center X position in pixels (0 to display width) - centered at 1200/2
        centerY: 200, // Center Y position in pixels (0 to display height) - centered at 400/2
        radius: -1, // Blur radius (-1 for automatic, or pixel value)
        kernelSize: 7, // Blur quality/kernel size (5-25)
      },
      reflection: {
        animated: false, // Enable time-based animation
        mirror: true, // Mirror the reflection
        boundary: 0.5, // Reflection boundary (0-1)
        amplitudeStart: 0, // Start amplitude (0-50)
        amplitudeEnd: 20, // End amplitude (0-50)
        wavelengthStart: 30, // Start wavelength (10-200)
        wavelengthEnd: 100, // End wavelength (10-200)
        alphaStart: 1, // Start alpha (0-1)
        alphaEnd: 1, // End alpha (0-1)
        time: 0, // Animation time (0-20)
      },
      rgbSplit: {
        redX: -10, // Red channel X offset (-20 to 20)
        redY: 0, // Red channel Y offset (-20 to 20)
        greenX: 0, // Green channel X offset (-20 to 20)
        greenY: 10, // Green channel Y offset (-20 to 20)
        blueX: 0, // Blue channel X offset (-20 to 20)
        blueY: 0, // Blue channel Y offset (-20 to 20)
      },
      shockwave: {
        animated: true, // Enable time-based animation (default to animated)
        speed: 500, // Shockwave speed (500-2000) pixel-per-second
        amplitude: 30, // Wave amplitude (1-100)
        wavelength: 160, // Wave length (2-400)
        brightness: 1, // Brightness multiplier (0.2-2)
        radius: -1, // Shockwave radius (100-2000, -1 for infinite)
        centerX: 600, // Center X position in pixels (0 to display width) - centered at 1200/2
        centerY: 200, // Center Y position in pixels (0 to display height) - centered at 400/2
        time: 0, // Animation time offset
      },
      simpleLightmap: {
        color: '#666666', // Ambient color (hex color for color picker)
        alpha: 1, // Alpha value (0-1)
        customLightmapTexture: '', // Custom uploaded lightmap texture (empty string when using default)
      },
      simplexNoise: {
        animated: false, // Enable time-based animation
        strength: 0.5, // Noise intensity (0-1 with 3 decimal places)
        noiseScale: 10, // Noise map scale (0-50)
        offsetX: 0.0, // Horizontal noise offset (0-5 with 3 decimal places)
        offsetY: 0.0, // Vertical noise offset (0-5 with 3 decimal places)
        offsetZ: 0.0, // Depth noise offset (0-5 with 3 decimal places)
        step: -1.0, // Threshold for blocky noise effect (-1 to 1 with 3 decimal places)
      },
      tiltShift: {
        blur: 100.0, // Blur intensity (0-200 with 4 decimal places)
        gradientBlur: 600, // Gradient blur amount for smooth transitions (0-1000)
        startX: 0, // Starting X position of focus area (0 to stage width)
        endX: 1200, // Ending X position of focus area (0 to stage width) - full width
        startY: 150, // Starting Y position of focus area (0 to stage height) - centered at 400/2 - 50
        endY: 250, // Ending Y position of focus area (0 to stage height) - centered at 400/2 + 50
      },
      twist: {
        animated: true, // Enable time-based animation by default
        angle: 0, // Twist angle in radians (-10 to 10)
        radius: 200, // Radius of twist effect (0 to stage width)
        offsetX: 600, // Center X position in pixels (0 to stage width) - centered at 1200/2
        offsetY: 200, // Center Y position in pixels (0 to stage height) - centered at 400/2
      },
      zoomBlur: {
        strength: 0.1, // Blur strength (0.01-0.5)
        centerX: 600, // Center X position in pixels (0 to stage width) - centered at 1200/2
        centerY: 200, // Center Y position in pixels (0 to stage height) - centered at 400/2
        innerRadius: 150, // Inner radius (0 to stage height minus 100) - 400-100=300, default 150
        radius: 150, // Radius (-1 to stage height minus 100) - 400-100=300, default 150
      },
      colorMatrix: {
        matrixType: 'none', // Default to no preset
        brightness: 1,
        contrast: 1,
        saturation: 1,
        hue: 0,
        multiply: true, // Allow chaining effects
      },
      alpha: { alpha: 1.0 },
      vintage: { intensity: 0.7, sepia: 0.5 },
      displacement: {
        customDisplacementTexture: '', // Custom uploaded displacement texture
        scaleX: 20, // Horizontal displacement strength (0-100)
        scaleY: 20, // Vertical displacement strength (0-100)
      },
      adjustment: {
        gamma: 1,
        saturation: 1,
        contrast: 1,
        brightness: 1,
        red: 1,
        green: 1,
        blue: 1,
        alpha: 1,
      },
      advancedBloom: {
        bloomScale: 1,
        blur: 2,
        brightness: 1,
        pixelSizeX: 1,
        pixelSizeY: 1,
        quality: 4,
        threshold: 0.5,
      },
      ascii: {
        size: 12, // Match moderate intensity default that was working
        replaceColor: false,
        color: '#ffffff',
      },
      backdropBlur: {
        strength: 8, // Overall blur amount (maps to blur property)
        blurX: 8, // Horizontal blur strength
        blurY: 8, // Vertical blur strength
        quality: 4, // Quality/performance balance
        resolution: 1, // Filter resolution multiplier
      },
      bevel: {
        rotation: 45, // Angle of light in degrees
        thickness: 2, // Thickness of the bevel
        lightColor: '#ffffff', // Color of light (top/left)
        lightAlpha: 0.7, // Opacity of light
        shadowColor: '#000000', // Color of shadow (bottom/right)
        shadowAlpha: 0.7, // Opacity of shadow
      },
      bloom: {
        strengthX: 2, // Horizontal blur strength
        strengthY: 2, // Vertical blur strength
      },
      blur: {
        blurX: 4, // Horizontal blur amount
        blurY: 4, // Vertical blur amount
        quality: 4, // Blur quality level
      },
      bulgePinch: {
        centerX: 0.5, // X-axis center coordinate (normalized 0-1)
        centerY: 0.5, // Y-axis center coordinate (normalized 0-1)
        radius: 100, // Radius of the effect area
        bulgePinchStrength: 1, // Bulge/pinch intensity (-1 to 1)
      },
      colorGradient: {
        type: 0, // Gradient type (0 = linear, 1 = radial)
        gradientAngle: 0, // Angle in degrees for linear gradients
        alpha: 0.5, // Overall alpha of the gradient
        startColor: '#ff0000', // Start color (red)
        endColor: '#0000ff', // End color (blue)
        startOffset: 0, // Start position (0-1)
        endOffset: 1, // End position (0-1)
        startAlpha: 1, // Alpha for start color (0-1)
        endAlpha: 1, // Alpha for end color (0-1)
      },
      colorMap: {
        mix: 0.5, // Blend amount between original and color-mapped (0-1)
        nearest: false, // Use nearest neighbor sampling (vs linear)
        colorMapPreset: 'vintage', // Built-in preset selection
        customColorMap: '', // Custom uploaded texture (empty string when none)
      },
      colorOverlay: {
        color: '#4488ff', // Overlay color (default blue)
        alpha: 0.5, // Opacity of the overlay (0-1)
      },
      colorReplace: {
        originalColor: '#d9b94a', // Color to replace (default golden/beige)
        targetColor: '#00ff00', // Replacement color (default lime green)
        tolerance: 0.3, // Color matching tolerance (0-1)
      },
      convolution: {
        matrixType: 'sharpen', // Preset matrix type (sharpen, edge, emboss, etc.)
        customMatrix: '0,-0.5,0,-0.5,3,-0.5,0,-0.5,0', // Custom 3x3 matrix as comma-separated string
        width: 3, // Matrix width (typically 3)
        height: 3, // Matrix height (typically 3)
      },
      dot: {
        scale: 0.5, // Size of the dots (0.1-1.0)
        angle: 15, // Rotation angle of dot pattern (0-360 degrees)
        grayscale: false, // Apply grayscale effect (boolean)
      },
      dropShadow: {
        offsetX: 4, // Horizontal shadow offset (-20 to 20)
        offsetY: 4, // Vertical shadow offset (-20 to 20)
        blur: 2, // Shadow blur amount (0-10)
        alpha: 0.5, // Shadow opacity (0-1)
        color: '#000000', // Shadow color
        quality: 4, // Blur quality (1-10)
        shadowOnly: false, // Show only shadow (boolean)
      },
      emboss: {
        strength: 5, // Emboss effect strength (0-20)
      },
      glitch: {
        animated: true, // Master switch for animated vs static glitch
        // Static mode properties (used when animated = false)
        slices: 10, // Number of glitch slices (0-50)
        offset: 15, // Maximum displacement (0-100)
        direction: 0, // Angle of slices (0-360 degrees)
        seed: 0.5, // Randomization seed (0-1)
        fillMode: 0, // How empty areas are filled (0-3)
        // Animation mode properties (used when animated = true)
        burstFrequency: 4.5, // Time between bursts in seconds (1-15)
        burstDuration: 0.7, // Length of bursts in seconds (0.1-3)
        intensityMin: 0.3, // Minimum animation intensity (0.1-1)
        intensityMax: 2.0, // Maximum animation intensity (1-5)
        residualChance: 7.5, // Chance signal doesn't recover (0-50%)
        staticChance: 0.2, // Chance of minor static during quiet (0-10%)
      },
      crt: {
        curvature: 1, // Screen curvature amount (0-5)
        lineContrast: 0.25, // Contrast of scan lines (0-1)
        lineWidth: 1, // Width of scan lines (0.1-5)
        noise: 0.3, // Amount of noise/static (0-1)
        verticalLine: false, // Enable vertical line distortion
        vignetting: 0.3, // Vignette effect strength (0-1)
      },
      godray: {
        alpha: 1, // Overall filter opacity (0-1)
        angle: 30, // Light ray angle in degrees (-180 to 180)
        centerX: 0.5, // Horizontal center position (0-1)
        centerY: 0, // Vertical center position (0-1)
        gain: 0.5, // Ray intensity/brightness (0-1)
        lacunarity: 2.5, // Ray complexity/detail (1-5)
        parallel: true, // Parallel rays vs radial
        time: 0, // Animation time offset (0-100)
        animated: true, // Enable time-based animation
      },
      hslAdjustment: {
        alpha: 1, // Overall filter opacity (0-1)
        colorize: false, // Enable colorization mode
        hue: 0, // Hue shift in degrees (-180 to 180)
        lightness: 0, // Lightness adjustment (-1 to 1)
        saturation: 0, // Saturation adjustment (-1 to 1)
      },
      kawaseBlur: {
        strength: 8, // Blur strength (0-50)
        quality: 3, // Blur quality passes (1-20)
        pixelSizeX: 1, // X-axis pixel size (0.1-10)
        pixelSizeY: 1, // Y-axis pixel size (0.1-10)
        clamp: false, // Clamp edges to prevent wrapping
      },
      motionBlur: {
        velocityX: 20, // Horizontal motion blur velocity (-200 to 200)
        velocityY: 0, // Vertical motion blur velocity (-200 to 200)
        kernelSize: 5, // Blur kernel size (3-25)
        offset: 0, // Offset for the blur effect (0-10)
      },
      multiColorReplace: {
        // Color replacement pairs (up to 5)
        originalColor1: '#d9b94a', // First original color to replace
        targetColor1: '#00ff41', // First target color
        originalColor2: '#c34672', // Second original color
        targetColor2: '#ff1493', // Second target color
        originalColor3: '', // Third original color (optional)
        targetColor3: '', // Third target color (optional)
        originalColor4: '', // Fourth original color (optional)
        targetColor4: '', // Fourth target color (optional)
        originalColor5: '', // Fifth original color (optional)
        targetColor5: '', // Fifth target color (optional)
        epsilon: 0.05, // Global tolerance for color matching (0-1)
      },
      oldFilm: {
        animated: true, // Master switch for animated vs static film effect
        sepia: 0.35, // Sepia tone intensity (0-1) with 3 decimal precision
        noise: 0.15, // Film grain noise amount (0-1) with 5 decimal precision
        noiseSize: 1, // Noise grain size (1-10)
        scratch: 0.35, // Scratch/dust effect intensity (0-1) with 4 decimal precision
        scratchDensity: 0.15, // Density of scratches (0-1) with 5 decimal precision
        scratchWidth: 1, // Width of scratches (1-10)
        vignetting: 0.15, // Dark edge vignette effect (0-1) with 5 decimal precision
        vignettingAlpha: 1.0, // Vignette opacity (0-1) with 5 decimal precision
        vignettingBlur: 0.3, // Vignette blur amount (0-1) with 5 decimal precision
        // Animated mode properties
        flickerFrequency: 0.1, // Flicker effect frequency (0-1)
        noiseVariation: 0.1, // Random variation in noise (0-0.5)
        scratchVariation: 0.2, // Random variation in scratches (0-0.5)
        seedChangeRate: 24.0, // Changes per second for randomization (0.1-10) - 24fps for smooth film grain
        // Static mode properties
        seed: 0.5, // Fixed seed for consistent grain pattern (0-1)
      },
      outline: {
        thickness: 2, // Outline thickness in pixels (0-20)
        color: '#ffffff', // Outline color (hex color string for color picker)
        alpha: 1, // Outline opacity (0-1)
        quality: 0.1, // Filter quality/performance trade-off (0-1)
        knockout: false, // Knockout mode - show only outline (boolean)
      },
    };

    const validFilters = Object.keys(commonSettings);
    if (
      validFilters.includes(filterName) &&
      Object.prototype.hasOwnProperty.call(commonSettings, filterName)
    ) {
      return commonSettings[filterName as keyof typeof commonSettings];
    }

    // Filters that don't need any property controls
    const noPropertiesFilters = ['crosshatch', 'grayscale'];
    if (noPropertiesFilters.includes(filterName)) {
      return {};
    }

    return { intensity: 0.5 };
  }

  // Render filter settings panel
  const renderFilterSettings = (filter: FilterInstance): React.JSX.Element => {
    // Filter properties based on glitch animation state
    const shouldShowProperty = (
      key: string,
      filter: FilterInstance
    ): boolean => {
      // Handle glitch filter conditional properties
      if (filter.name === 'glitch') {
        const isAnimated = filter.settings.animated;
        const staticModeProps = [
          'slices',
          'offset',
          'direction',
          'seed',
          'fillMode',
        ];
        const animatedModeProps = [
          'burstFrequency',
          'burstDuration',
          'intensityMin',
          'intensityMax',
          'residualChance',
          'staticChance',
        ];

        // Always show animated toggle
        if (key === 'animated') return true;

        // Show appropriate properties based on mode
        if (isAnimated) {
          return animatedModeProps.includes(key);
        } else {
          return staticModeProps.includes(key);
        }
      }

      // Handle godray filter conditional properties
      if (filter.name === 'godray') {
        const isAnimated = filter.settings.animated;

        // Always show these properties
        const alwaysShowProps = [
          'animated',
          'alpha',
          'angle',
          'centerX',
          'centerY',
          'gain',
          'lacunarity',
          'parallel',
        ];

        // Only show time property when not animated (for manual control)
        if (key === 'time') {
          return !isAnimated;
        }

        return alwaysShowProps.includes(key);
      }

      // Handle reflection filter conditional properties
      if (filter.name === 'reflection') {
        const isAnimated = filter.settings.animated;
        // Always show these properties
        const alwaysShowProps = [
          'animated',
          'mirror',
          'boundary',
          'amplitudeStart',
          'amplitudeEnd',
          'wavelengthStart',
          'wavelengthEnd',
          'alphaStart',
          'alphaEnd',
        ];
        // Show time only when animated
        if (key === 'time') {
          return Boolean(isAnimated);
        }
        return alwaysShowProps.includes(key);
      }

      // Handle shockwave filter conditional properties
      if (filter.name === 'shockwave') {
        const isAnimated = filter.settings.animated;
        // Always show these properties
        const alwaysShowProps = [
          'animated',
          'speed',
          'amplitude',
          'wavelength',
          'brightness',
          'radius',
          'centerX',
          'centerY',
        ];
        // Show time only when animated
        if (key === 'time') {
          return Boolean(isAnimated);
        }
        return alwaysShowProps.includes(key);
      }

      // Handle old film filter conditional properties
      if (filter.name === 'oldFilm') {
        const isAnimated = filter.settings.animated;

        // Always show these properties in both modes
        const commonProps = [
          'animated',
          'sepia',
          'noise',
          'noiseSize',
          'scratch',
          'scratchDensity',
          'scratchWidth',
          'vignetting',
          'vignettingAlpha',
          'vignettingBlur',
        ];

        // Static mode specific properties
        const staticModeProps = [
          'seed', // Manual seed control for static effect
        ];

        // Animated mode specific properties
        const animatedModeProps = [
          'flickerFrequency',
          'noiseVariation',
          'scratchVariation',
          'seedChangeRate',
        ];

        // Always show common properties
        if (commonProps.includes(key)) return true;

        // Show appropriate mode-specific properties
        if (isAnimated) {
          return animatedModeProps.includes(key);
        } else {
          return staticModeProps.includes(key);
        }
      }

      // Show all properties for other filters
      return true;
    };

    const filteredSettings = Object.entries(filter.settings).filter(([key]) =>
      shouldShowProperty(key, filter)
    );

    return (
      <div
        style={{
          marginTop: '0.5rem',
          padding: '0.5rem',
          background: '#f9fafb',
          borderRadius: '4px',
        }}
      >
        {filteredSettings.map(([key, value]) => (
          <div key={key} style={{ marginBottom: '0.5rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                color: '#6b7280',
                marginBottom: '0.2rem',
              }}
            >
              {((): string => {
                // Provide user-friendly labels for certain properties
                const labelMap: Record<string, string> = {
                  strengthX: 'Horizontal Strength',
                  strengthY: 'Vertical Strength',
                  lightColor: 'Light Color',
                  shadowColor: 'Shadow Color',
                  lightAlpha: 'Light Opacity',
                  shadowAlpha: 'Shadow Opacity',
                  replaceColor: 'Replace Color',
                  blurX: 'Horizontal Blur',
                  blurY: 'Vertical Blur',
                  quality: 'Blur Quality',
                  centerX: 'Center X Position',
                  centerY: 'Center Y Position',
                  radius: 'Effect Radius',
                  // ColorGradientFilter labels
                  type: 'Gradient Type',
                  angle: 'Gradient Angle',
                  alpha: 'Overall Opacity',
                  startColor: 'Start Color',
                  endColor: 'End Color',
                  startOffset: 'Start Position',
                  endOffset: 'End Position',
                  // ReflectionFilter labels
                  // animated: 'Animated', // Already defined for GlitchFilter
                  mirror: 'Mirror Reflection',
                  boundary: 'Reflection Boundary',
                  amplitudeStart: 'Start Amplitude',
                  amplitudeEnd: 'End Amplitude',
                  wavelengthStart: 'Start Wavelength',
                  wavelengthEnd: 'End Wavelength',
                  alphaStart: 'Start Alpha',
                  alphaEnd: 'End Alpha',
                  // time: 'Animation Time', // Already defined for other filters
                  // RGBSplitFilter labels
                  redX: 'Red X Offset',
                  redY: 'Red Y Offset',
                  greenX: 'Green X Offset',
                  greenY: 'Green Y Offset',
                  blueX: 'Blue X Offset',
                  blueY: 'Blue Y Offset',
                  // ShockwaveFilter labels
                  speed: 'Wave Speed',
                  amplitude: 'Wave Amplitude',
                  wavelength: 'Wave Length',
                  brightness: 'Wave Brightness',
                  // radius: 'Shockwave Radius', // Already defined as 'Effect Radius'
                  // centerX: 'Center X Position', // Already defined
                  // centerY: 'Center Y Position', // Already defined
                  // time: 'Animation Time', // Already defined
                  // ColorMapFilter labels
                  mix: 'Effect Strength',
                  nearest: 'Sampling Method',
                  colorMapPreset: 'Colormap Preset',
                  customColorMap: 'Custom Colormap',
                  // SimpleLightmapFilter labels
                  customLightmapTexture: 'Custom Lightmap Texture',
                  // ColorMatrixFilter labels
                  matrixType: 'Matrix Type',
                  multiply: 'Chain Effects',
                  // ConvolutionFilter labels
                  customMatrix: 'Custom Matrix',
                  width: 'Matrix Width',
                  height: 'Matrix Height',
                  // DisplacementFilter labels
                  scaleX: 'Horizontal Displacement',
                  scaleY: 'Vertical Displacement',
                  customDisplacementTexture: 'Custom Displacement Texture',
                  // DropShadowFilter labels
                  offsetX: 'Horizontal Offset',
                  offsetY: 'Vertical Offset',
                  shadowOnly: 'Shadow Only Mode',
                  // GlitchFilter labels
                  animated: 'Animation Mode',
                  slices: 'Glitch Slices 🎲',
                  offset: 'Displacement 🎲',
                  direction: 'Slice Angle',
                  seed: 'Random Seed 🎲',
                  fillMode: 'Fill Mode',
                  burstFrequency: 'Burst Frequency ⏱️',
                  burstDuration: 'Burst Duration ⏱️',
                  intensityMin: 'Min Intensity 🎲',
                  intensityMax: 'Max Intensity 🎲',
                  residualChance: 'Residual Glitch %',
                  staticChance: 'Static Noise %',
                  // GodrayFilter labels
                  parallel: 'Ray Type',
                  gain: 'Ray Intensity',
                  lacunarity: 'Ray Complexity',
                  time: 'Time Offset',
                  // HslAdjustmentFilter labels
                  colorize: 'Color Mode',
                  lightness: 'Lightness',
                };
                return Object.prototype.hasOwnProperty.call(labelMap, key)
                  ? labelMap[key as keyof typeof labelMap]
                  : key.charAt(0).toUpperCase() + key.slice(1);
              })()}
            </label>
            {key === 'replaceColor' && typeof value === 'boolean' ? (
              // Special handling for replaceColor as radio buttons
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <input
                    type="radio"
                    name={`${filter.id}-replaceColor`}
                    checked={!value}
                    onChange={() => {
                      const updates = createSafeUpdate(key, false);
                      updateFilterSettings(filter.id, updates);
                    }}
                  />
                  <span style={{ fontSize: '0.8rem' }}>
                    No (original colors)
                  </span>
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <input
                    type="radio"
                    name={`${filter.id}-replaceColor`}
                    checked={value}
                    onChange={() => {
                      const updates = createSafeUpdate(key, true);
                      updateFilterSettings(filter.id, updates);
                    }}
                  />
                  <span style={{ fontSize: '0.8rem' }}>
                    Yes (replace with color)
                  </span>
                </label>
              </div>
            ) : (key === 'color' ||
                key === 'lightColor' ||
                key === 'shadowColor' ||
                key === 'startColor' ||
                key === 'endColor' ||
                key === 'originalColor' ||
                key === 'targetColor' ||
                key.endsWith('Color') ||
                key.match(/^(original|target)Color\d+$/)) && // Match originalColor1, targetColor2, etc.
              typeof value === 'string' ? (
              // Special handling for color property
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.3rem',
                  }}
                >
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => {
                      const updates = createSafeUpdate(key, e.target.value);
                      updateFilterSettings(filter.id, updates);
                    }}
                    style={{
                      width: '40px',
                      height: '30px',
                      border: '1px solid #d1d5db',
                      borderRadius: '3px',
                      cursor: 'pointer',
                    }}
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                      // Validate hex color format
                      const hexPattern = /^#[0-9A-Fa-f]{6}$/;
                      if (
                        hexPattern.test(e.target.value) ||
                        e.target.value === ''
                      ) {
                        const updates = createSafeUpdate(key, e.target.value);
                        updateFilterSettings(filter.id, updates);
                      }
                    }}
                    placeholder="#ffffff"
                    style={{
                      width: '80px',
                      padding: '0.2rem',
                      borderRadius: '3px',
                      border: '1px solid #d1d5db',
                      fontSize: '0.8rem',
                    }}
                  />
                  <button
                    onClick={() => {
                      const defaultSettings = getDefaultSettings(filter.name);
                      const defaultValue = Object.prototype.hasOwnProperty.call(
                        defaultSettings,
                        key
                      )
                        ? defaultSettings[key as keyof typeof defaultSettings]
                        : '#ffffff';
                      const updates = createSafeUpdate(key, defaultValue);
                      updateFilterSettings(filter.id, updates);
                    }}
                    style={{
                      width: '24px',
                      height: '24px',
                      padding: '0',
                      border: '1px solid #d1d5db',
                      borderRadius: '3px',
                      background: '#f9fafb',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title={`Reset ${key} to default`}
                  >
                    ↻
                  </button>
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: '#9ca3af',
                    fontStyle: 'italic',
                  }}
                >
                  Hex colors only (e.g., #ff0000)
                </div>
                {filter.settings.replaceColor === false && (
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: '#9ca3af',
                      fontStyle: 'italic',
                      marginTop: '0.2rem',
                    }}
                  >
                    (Color ignored when "Replace Color" is No)
                  </div>
                )}
              </div>
            ) : key === 'type' && typeof value === 'number' ? (
              // Special handling for gradient type as dropdown
              <div>
                <select
                  value={value}
                  onChange={(e) => {
                    const updates = createSafeUpdate(
                      key,
                      parseInt(e.target.value)
                    );
                    updateFilterSettings(filter.id, updates);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.2rem',
                    borderRadius: '3px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.8rem',
                  }}
                >
                  <option value={0}>Linear</option>
                  <option value={1}>Radial</option>
                </select>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: '#9ca3af',
                    fontStyle: 'italic',
                    marginTop: '0.2rem',
                  }}
                >
                  Linear: straight line gradient, Radial: circular gradient
                </div>
              </div>
            ) : key === 'colorMapPreset' && typeof value === 'string' ? (
              // Special handling for colormap preset selection
              <div>
                <select
                  value={value}
                  onChange={(e) => {
                    const updates = createSafeUpdate(key, e.target.value);
                    updateFilterSettings(filter.id, updates);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.2rem',
                    borderRadius: '3px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.8rem',
                  }}
                >
                  <option value="vintage">Vintage Film</option>
                  <option value="neon">Neon Dreams</option>
                  <option value="thermal">Thermal Vision</option>
                  <option value="rainbow">Rainbow Spectrum</option>
                  <option value="monochrome">Monochrome</option>
                  <option value="sepia">Sepia Tone</option>
                </select>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: '#9ca3af',
                    fontStyle: 'italic',
                    marginTop: '0.2rem',
                  }}
                >
                  Built-in color mapping presets for different visual styles
                </div>
              </div>
            ) : key === 'matrixType' &&
              typeof value === 'string' &&
              filter.name === 'colorMatrix' ? (
              // Special handling for color matrix type selection
              <div>
                <select
                  value={value}
                  onChange={(e) => {
                    // When matrix type changes, we need to force an update
                    // The filter itself will apply the preset based on matrixType
                    const newMatrixType = e.target.value;
                    const updates = createSafeUpdate(key, newMatrixType);

                    // Update settings and force re-application
                    updateFilterSettings(filter.id, updates);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.2rem',
                    borderRadius: '3px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.8rem',
                  }}
                >
                  <option value="none">None (Manual)</option>
                  <option value="blackAndWhite">Black & White</option>
                  <option value="browni">Browni</option>
                  <option value="cyberpunk">Cyberpunk</option>
                  <option value="desaturate">Desaturate</option>
                  <option value="grayscale">Grayscale</option>
                  <option value="hue">Hue Rotation</option>
                  <option value="kodachrome">Kodachrome</option>
                  <option value="lsd">LSD</option>
                  <option value="negative">Negative</option>
                  <option value="night">Night Vision</option>
                  <option value="polaroid">Polaroid</option>
                  <option value="predator">Predator</option>
                  <option value="sepia">Sepia</option>
                  <option value="technicolor">Technicolor</option>
                  <option value="toBGR">To BGR</option>
                  <option value="vintage">Vintage</option>
                </select>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: '#9ca3af',
                    fontStyle: 'italic',
                    marginTop: '0.2rem',
                  }}
                >
                  Select a preset color transformation or use None for manual
                  control
                </div>
              </div>
            ) : key === 'matrixType' &&
              typeof value === 'string' &&
              filter.name === 'convolution' ? (
              // Special handling for convolution matrix type selection
              <div>
                <select
                  value={value}
                  onChange={(e) => {
                    const updates = createSafeUpdate(key, e.target.value);
                    updateFilterSettings(filter.id, updates);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.2rem',
                    borderRadius: '3px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.8rem',
                  }}
                >
                  <option value="sharpen">Sharpen</option>
                  <option value="edge">Edge Detection</option>
                  <option value="emboss">Emboss</option>
                  <option value="strongSharpen">Strong Sharpen</option>
                  <option value="custom">Custom Matrix</option>
                </select>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: '#9ca3af',
                    fontStyle: 'italic',
                    marginTop: '0.2rem',
                  }}
                >
                  Select a convolution effect or use Custom Matrix for manual
                  control
                </div>
              </div>
            ) : key === 'customColorMap' ? (
              // Special handling for custom colormap upload
              <div>
                {/* Preview section */}
                <div
                  style={{
                    marginBottom: '0.5rem',
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    backgroundColor: '#f9fafb',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      marginBottom: '0.3rem',
                      color: '#374151',
                    }}
                  >
                    Current Colormap:
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {value &&
                    typeof value === 'object' &&
                    value !== null &&
                    'isCustomTexture' in value &&
                    (value as CustomTextureData).isCustomTexture ? (
                      <img
                        src={(value as CustomTextureData).dataUrl}
                        alt="Custom Colormap Preview"
                        style={{
                          width: '60px',
                          height: '60px',
                          objectFit: 'cover',
                          border: '1px solid #d1d5db',
                          borderRadius: '3px',
                          backgroundColor: '#fff',
                        }}
                      />
                    ) : (
                      <img
                        src="/images/colormap.png"
                        alt="Default Colormap Preview"
                        style={{
                          width: '60px',
                          height: '60px',
                          objectFit: 'cover',
                          border: '1px solid #d1d5db',
                          borderRadius: '3px',
                          backgroundColor: '#fff',
                        }}
                      />
                    )}
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {value &&
                      typeof value === 'object' &&
                      value !== null &&
                      'isCustomTexture' in value &&
                      (value as CustomTextureData).isCustomTexture ? (
                        <div>
                          <div>✅ Custom colormap active</div>
                          <div style={{ marginTop: '2px' }}>
                            {(value as CustomTextureData).fileName || 'Loaded'}
                          </div>
                          <div
                            style={{ fontSize: '0.65rem', color: '#9ca3af' }}
                          >
                            {(value as CustomTextureData).width}×
                            {(value as CustomTextureData).height}px
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div>🔄 Using built-in colormap</div>
                          <div style={{ marginTop: '2px' }}>
                            Upload custom colormap below
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    border: '2px dashed #d1d5db',
                    borderRadius: '6px',
                    padding: '1rem',
                    textAlign: 'center',
                    backgroundColor: '#f9fafb',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    marginBottom: '0.5rem',
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = '#10b981';
                    e.currentTarget.style.backgroundColor = '#ecfdf5';
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.backgroundColor = '#f9fafb';

                    const files = Array.from(e.dataTransfer.files);
                    const imageFile = files.find((file) =>
                      file.type.startsWith('image/')
                    );
                    if (imageFile) {
                      handleFileUpload(imageFile, filter.id, key);
                    }
                  }}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e): void => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        handleFileUpload(file, filter.id, key);
                      }
                    };
                    input.click();
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                    📁
                  </div>
                  <div
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 'medium',
                      marginBottom: '0.25rem',
                    }}
                  >
                    Drop colormap image here
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    or click to browse (PNG, JPG, WebP)
                  </div>
                </div>
                {value &&
                  typeof value === 'object' &&
                  value !== null &&
                  'isCustomTexture' in value &&
                  (value as CustomTextureData).isCustomTexture && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem',
                          backgroundImage: (value as CustomTextureData).dataUrl
                            ? `url(${(value as CustomTextureData).dataUrl})`
                            : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      >
                        {!(value as CustomTextureData).dataUrl && '🎨'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'medium' }}>
                          {(value as CustomTextureData).fileName ||
                            'Custom colormap loaded'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                          {(value as CustomTextureData).width}×
                          {(value as CustomTextureData).height}px
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const updates = createSafeUpdate(key, '');
                          updateFilterSettings(filter.id, updates);
                        }}
                        style={{
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title="Remove custom colormap"
                      >
                        ×
                      </button>
                    </div>
                  )}
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: '#9ca3af',
                    fontStyle: 'italic',
                    marginTop: '0.5rem',
                  }}
                >
                  Upload a custom colormap texture. Ideal size: 256x256px or
                  smaller.
                </div>
              </div>
            ) : key === 'customDisplacementTexture' ? (
              // Special handling for custom displacement texture upload
              <div>
                {/* Preview section */}
                <div
                  style={{
                    marginBottom: '0.5rem',
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    backgroundColor: '#f9fafb',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      marginBottom: '0.3rem',
                      color: '#374151',
                    }}
                  >
                    Current Displacement Texture:
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <img
                      src={typeof value === 'string' ? value || '/images/effects/cursor-displace.png' : '/images/effects/cursor-displace.png'}
                      alt="Displacement Texture Preview"
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'cover',
                        border: '1px solid #d1d5db',
                        borderRadius: '3px',
                        backgroundColor: '#fff',
                      }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {value ? (
                        <div>
                          <div>✅ Custom displacement active</div>
                          <div style={{ marginTop: '2px' }}>
                            Click below to change
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div>🔄 Using default displacement</div>
                          <div style={{ marginTop: '2px' }}>
                            Upload custom texture below
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    border: '2px dashed #d1d5db',
                    borderRadius: '4px',
                    padding: '1rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: '#fafafa',
                  }}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e): void => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        handleFileUpload(file, filter.id, key);
                      }
                    };
                    input.click();
                  }}
                >
                  📁 Click to upload displacement texture
                  {value && (
                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: '#666',
                        marginTop: '0.3rem',
                      }}
                    >
                      Replace current displacement texture
                    </div>
                  )}
                </div>

                {/* Clear button for custom textures */}
                {value && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const updates = createSafeUpdate(key, '');
                      updateFilterSettings(filter.id, updates);
                    }}
                    style={{
                      marginTop: '0.5rem',
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      borderRadius: '3px',
                      cursor: 'pointer',
                    }}
                  >
                    🗑️ Reset to default displacement
                  </button>
                )}

                <div
                  style={{
                    fontSize: '0.75rem',
                    color: '#666',
                    marginTop: '0.5rem',
                  }}
                >
                  Upload a custom displacement texture. Ideal size: 512x512px or
                  smaller. Black areas = no displacement, white areas = max
                  displacement.
                </div>
              </div>
            ) : key === 'customLightmapTexture' ? (
              // Special handling for custom lightmap texture upload
              <div>
                {/* Preview section */}
                <div
                  style={{
                    marginBottom: '0.5rem',
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    backgroundColor: '#f9fafb',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      marginBottom: '0.3rem',
                      color: '#374151',
                    }}
                  >
                    Current Lightmap:
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <img
                      src={typeof value === 'string' ? value || '/images/lightmap.png' : '/images/lightmap.png'}
                      alt="Lightmap Preview"
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'cover',
                        border: '1px solid #d1d5db',
                        borderRadius: '3px',
                        backgroundColor: '#fff',
                      }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {value ? (
                        <div>
                          <div>✅ Custom lightmap active</div>
                          <div style={{ marginTop: '2px' }}>
                            Click below to change
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div>🔄 Using default lightmap</div>
                          <div style={{ marginTop: '2px' }}>
                            Upload custom lightmap below
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    border: '2px dashed #d1d5db',
                    borderRadius: '4px',
                    padding: '1rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: '#fafafa',
                  }}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e): void => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        handleFileUpload(file, filter.id, key);
                      }
                    };
                    input.click();
                  }}
                >
                  📄 Click to upload custom lightmap texture
                  {value && (
                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: '#666',
                        marginTop: '0.3rem',
                      }}
                    >
                      Replace current lightmap
                    </div>
                  )}
                </div>

                {/* Clear button for custom textures */}
                {value && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const updates = createSafeUpdate(key, '');
                      updateFilterSettings(filter.id, updates);
                    }}
                    style={{
                      marginTop: '0.5rem',
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      borderRadius: '3px',
                      cursor: 'pointer',
                    }}
                  >
                    🗑️ Reset to default lightmap
                  </button>
                )}

                <div
                  style={{
                    fontSize: '0.75rem',
                    color: '#666',
                    marginTop: '0.5rem',
                  }}
                >
                  Upload a custom lightmap texture. Ideal size: 512x512px or
                  smaller. White areas = full lighting, black areas = no light.
                  Leave empty to use default lightmap.
                </div>
              </div>
            ) : key === 'fillMode' && typeof value === 'number' ? (
              // Special handling for glitch fillMode dropdown
              <div>
                <select
                  value={value}
                  onChange={(e) => {
                    const updates = createSafeUpdate(
                      key,
                      parseInt(e.target.value)
                    );
                    updateFilterSettings(filter.id, updates);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.2rem',
                    borderRadius: '3px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.8rem',
                  }}
                >
                  <option value={0}>Original (0)</option>
                  <option value={1}>Transparent (1)</option>
                  <option value={2}>Nearest (2)</option>
                  <option value={3}>Repeat (3)</option>
                </select>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: '#9ca3af',
                    fontStyle: 'italic',
                    marginTop: '0.2rem',
                  }}
                >
                  How empty areas are filled when slices are displaced
                </div>
              </div>
            ) : key === 'nearest' && typeof value === 'boolean' ? (
              // Special handling for nearest neighbor sampling
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <input
                    type="radio"
                    name={`${filter.id}-nearest`}
                    checked={!value}
                    onChange={() => {
                      const updates = createSafeUpdate(key, false);
                      updateFilterSettings(filter.id, updates);
                    }}
                  />
                  <span style={{ fontSize: '0.8rem' }}>Linear (smooth)</span>
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <input
                    type="radio"
                    name={`${filter.id}-nearest`}
                    checked={value}
                    onChange={() => {
                      const updates = createSafeUpdate(key, true);
                      updateFilterSettings(filter.id, updates);
                    }}
                  />
                  <span style={{ fontSize: '0.8rem' }}>
                    Nearest (pixelated)
                  </span>
                </label>
              </div>
            ) : key === 'multiply' && typeof value === 'boolean' ? (
              // Special handling for multiply boolean in ColorMatrix
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <input
                    type="radio"
                    name={`${filter.id}-multiply`}
                    checked={!value}
                    onChange={() => {
                      const updates = createSafeUpdate(key, false);
                      updateFilterSettings(filter.id, updates);
                    }}
                  />
                  <span style={{ fontSize: '0.8rem' }}>Replace</span>
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <input
                    type="radio"
                    name={`${filter.id}-multiply`}
                    checked={value}
                    onChange={() => {
                      const updates = createSafeUpdate(key, true);
                      updateFilterSettings(filter.id, updates);
                    }}
                  />
                  <span style={{ fontSize: '0.8rem' }}>Multiply (Chain)</span>
                </label>
              </div>
            ) : key === 'shadowOnly' && typeof value === 'boolean' ? (
              // Special handling for shadowOnly boolean in DropShadow
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <input
                    type="radio"
                    name={`${filter.id}-shadowOnly`}
                    checked={!value}
                    onChange={() => {
                      const updates = createSafeUpdate(key, false);
                      updateFilterSettings(filter.id, updates);
                    }}
                  />
                  <span style={{ fontSize: '0.8rem' }}>Object + Shadow</span>
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <input
                    type="radio"
                    name={`${filter.id}-shadowOnly`}
                    checked={value}
                    onChange={() => {
                      const updates = createSafeUpdate(key, true);
                      updateFilterSettings(filter.id, updates);
                    }}
                  />
                  <span style={{ fontSize: '0.8rem' }}>Shadow Only</span>
                </label>
              </div>
            ) : key === 'animated' && typeof value === 'boolean' ? (
              // Checkbox for animated boolean
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => {
                    const updates = createSafeUpdate(key, e.target.checked);
                    updateFilterSettings(filter.id, updates);
                  }}
                />
                <span style={{ fontSize: '0.8rem' }}>Animated</span>
              </label>
            ) : key === 'knockout' && typeof value === 'boolean' ? (
              // Special handling for knockout boolean in GlowFilter
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <input
                    type="radio"
                    name={`${filter.id}-knockout`}
                    checked={!value}
                    onChange={() => {
                      const updates = createSafeUpdate(key, false);
                      updateFilterSettings(filter.id, updates);
                    }}
                  />
                  <span style={{ fontSize: '0.8rem' }}>Normal Glow</span>
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <input
                    type="radio"
                    name={`${filter.id}-knockout`}
                    checked={value}
                    onChange={() => {
                      const updates = createSafeUpdate(key, true);
                      updateFilterSettings(filter.id, updates);
                    }}
                  />
                  <span style={{ fontSize: '0.8rem' }}>Knockout</span>
                </label>
              </div>
            ) : key === 'parallel' && typeof value === 'boolean' ? (
              // Special handling for parallel boolean in GodrayFilter
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <input
                    type="radio"
                    name={`${filter.id}-parallel`}
                    checked={!value}
                    onChange={() => {
                      const updates = createSafeUpdate(key, false);
                      updateFilterSettings(filter.id, updates);
                    }}
                  />
                  <span style={{ fontSize: '0.8rem' }}>Radial Rays</span>
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <input
                    type="radio"
                    name={`${filter.id}-parallel`}
                    checked={value}
                    onChange={() => {
                      const updates = createSafeUpdate(key, true);
                      updateFilterSettings(filter.id, updates);
                    }}
                  />
                  <span style={{ fontSize: '0.8rem' }}>Parallel Rays</span>
                </label>
              </div>
            ) : (key === 'colorize' || key === 'clamp') &&
              typeof value === 'boolean' ? (
              // Special handling for boolean properties (colorize, clamp)
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <input
                    type="radio"
                    name={`${filter.id}-${key}`}
                    checked={!value}
                    onChange={() => {
                      const updates = createSafeUpdate(key, false);
                      updateFilterSettings(filter.id, updates);
                    }}
                  />
                  <span style={{ fontSize: '0.8rem' }}>
                    {key === 'colorize'
                      ? 'Adjust Colors'
                      : key === 'clamp'
                        ? 'No Clamp'
                        : 'Off'}
                  </span>
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <input
                    type="radio"
                    name={`${filter.id}-${key}`}
                    checked={value}
                    onChange={() => {
                      const updates = createSafeUpdate(key, true);
                      updateFilterSettings(filter.id, updates);
                    }}
                  />
                  <span style={{ fontSize: '0.8rem' }}>
                    {key === 'colorize'
                      ? 'Colorize Mode'
                      : key === 'clamp'
                        ? 'Clamp Edges'
                        : 'On'}
                  </span>
                </label>
              </div>
            ) : typeof value === 'number' ? (
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <input
                  type="range"
                  min={getPropertyMin(key, filter.name)}
                  max={getPropertyMax(key, filter.name)}
                  step={getPropertyStep(key, filter.name)}
                  value={value}
                  onChange={(e) => {
                    const updates = createSafeUpdate(
                      key,
                      parseFloat(e.target.value)
                    );
                    updateFilterSettings(filter.id, updates);
                  }}
                  style={{ flex: '1' }}
                />
                <input
                  type="number"
                  min={getPropertyMin(key, filter.name)}
                  max={getPropertyMax(key, filter.name)}
                  step={getPropertyStep(key, filter.name)}
                  value={value}
                  onChange={(e) => {
                    const numValue = parseFloat(e.target.value);
                    if (!isNaN(numValue)) {
                      // Clamp the value within bounds
                      const minVal = parseFloat(
                        getPropertyMin(key, filter.name)
                      );
                      const maxVal = parseFloat(
                        getPropertyMax(key, filter.name)
                      );
                      const clampedValue = Math.max(
                        minVal,
                        Math.min(maxVal, numValue)
                      );

                      const updates = createSafeUpdate(key, clampedValue);
                      updateFilterSettings(filter.id, updates);
                    }
                  }}
                  style={{
                    width: '70px',
                    padding: '0.2rem',
                    borderRadius: '3px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.8rem',
                  }}
                />
                <button
                  onClick={() => {
                    const defaultSettings = getDefaultSettings(filter.name);
                    const defaultValue = Object.prototype.hasOwnProperty.call(
                      defaultSettings,
                      key
                    )
                      ? defaultSettings[key as keyof typeof defaultSettings]
                      : typeof value === 'number'
                        ? 1.0
                        : value;

                    if (typeof defaultValue === 'number') {
                      const updates = createSafeUpdate(key, defaultValue);
                      updateFilterSettings(filter.id, updates);
                    }
                  }}
                  style={{
                    width: '24px',
                    height: '24px',
                    padding: '0',
                    border: '1px solid #d1d5db',
                    borderRadius: '3px',
                    background: '#f9fafb',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={`Reset ${key} to default`}
                >
                  ↻
                </button>
              </div>
            ) : typeof value === 'boolean' ? (
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => {
                  const updates = createSafeUpdate(key, e.target.checked);
                  updateFilterSettings(filter.id, updates);
                }}
              />
            ) : (
              <input
                type="text"
                value={value as string}
                onChange={(e) => {
                  const updates = createSafeUpdate(key, e.target.value);
                  updateFilterSettings(filter.id, updates);
                }}
                style={{
                  width: '100%',
                  padding: '0.2rem',
                  borderRadius: '2px',
                  border: '1px solid #d1d5db',
                }}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      data-testid="filter-controls"
      style={{
        marginTop: '2rem',
        padding: '1rem',
        background: '#f8fafc',
        borderRadius: '8px',
        borderLeft: '4px solid #8b5cf6',
      }}
    >
      <h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>
        🎨 Advanced Filter Manager
      </h3>
      <p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '0.9rem' }}>
        Stack multiple filters with real-time preview and custom settings
      </p>

      {/* Active Filters List */}
      <div style={{ marginBottom: '1rem' }}>
        {activeFilters.length === 0 ? (
          <p style={{ color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>
            No filters active
          </p>
        ) : (
          activeFilters.map((filter) => (
            <div
              key={filter.id}
              style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '0.75rem',
                marginBottom: '0.5rem',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={filter.enabled}
                      onChange={() => toggleFilterEnabled(filter.id)}
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: '#10b981',
                        cursor: 'pointer',
                      }}
                    />
                    <span
                      style={{
                        fontWeight: 'medium',
                        color: filter.enabled ? '#374151' : '#9ca3af',
                        fontSize: '0.95rem',
                      }}
                    >
                      {filter.displayName}
                    </span>
                  </label>
                  {!filter.enabled && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        fontStyle: 'italic',
                        background: '#f3f4f6',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '0.25rem',
                      }}
                    >
                      disabled
                    </span>
                  )}
                </div>
                <button
                  onClick={async () => await removeFilter(filter.id)}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Remove filter"
                >
                  ×
                </button>
              </div>
              <div
                style={{
                  opacity: filter.enabled ? 1 : 0.5,
                  pointerEvents: filter.enabled ? 'auto' : 'none',
                }}
              >
                {renderFilterSettings(filter)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Filter Dropdown */}
      <div style={{ position: 'relative' }}>
        {availableFilters.length > 0 ? (
          <>
            <button
              data-testid="add-filter-button"
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>+</span>
              Add Filter ({availableFilters.length} available)
            </button>

            {showDropdown && (
              <div
                data-testid="filter-dropdown"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 10,
                  marginTop: '0.25rem',
                }}
              >
                {availableFilters.map((filterName) => (
                  <button
                    key={filterName}
                    data-testid={`filter-option-${filterName.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => addFilter(filterName)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      textAlign: 'left',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      color: '#374151',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {filterName.charAt(0).toUpperCase() + filterName.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>
            All filters are in use
          </p>
        )}
      </div>

      {/* Clear All Button */}
      {activeFilters.length > 0 && (
        <button
          data-testid="clear-filters-button"
          onClick={async () => {
            setActiveFilters([]);
            // Actually clear filters from slider when user clicks "Clear All"
            if (sliderEngine) {
              await sliderEngine.clearFilters();
              onFilterApplied([]);
            }
          }}
          style={{
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            fontSize: '0.9rem',
            marginTop: '1rem',
          }}
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
};
