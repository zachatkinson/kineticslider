import { Application, Sprite, Container, DisplacementFilter, Filter, Texture } from 'pixi.js';
import { AtlasManager } from "./managers/AtlasManager";
import type { RefObject } from "react";
import ResourceManager from "./managers/ResourceManager";
import { type BaseFilterConfig, type FilterConfig, type FilterType } from './filters/types';
import SlidingWindowManager from './managers/SlidingWindowManager';

// Re-export the types from filters/types
export { type FilterConfig, type FilterType };

/**
 * Navigation element selectors for external controls
 * @property {string} prev - CSS selector for the previous button
 * @property {string} next - CSS selector for the next button
 */
export type NavElement = {
    prev: string;
    next: string;
};

/**
 * Text content pair for slides containing title and subtitle
 * @typedef {[string, string]} TextPair
 * @description A tuple representing [title, subtitle] text content for a slide
 */
export type TextPair = [string, string];

/**
 * Represents a pending filter update in the batch queue
 * @property {string} filterId - Unique identifier for the filter
 * @property {Partial<BaseFilterConfig>} changes - The changes to apply to the filter
 * @property {number} timestamp - When the update was queued
 */
export interface PendingFilterUpdate {
    filterId: string;
    changes: Partial<BaseFilterConfig>;
    timestamp: number;
}

/**
 * Configuration for filter batching behavior
 * @property {number} bufferMs - How long to wait before applying updates (in milliseconds)
 * @property {number} maxBatchSize - Maximum number of updates to process in a single batch
 */
export interface FilterBatchConfig {
    bufferMs: number;
    maxBatchSize: number;
}

/**
 * Represents the difference between two filter states
 * @property {boolean} hasChanged - Whether any properties have changed
 * @property {Partial<BaseFilterConfig>} changedProperties - Only the properties that have changed
 */
export interface FilterDiff {
    hasChanged: boolean;
    changedProperties: Partial<BaseFilterConfig>;
}

/**
 * Options for cursor displacement sizing behavior
 * @typedef {('natural'|'fullscreen'|'custom')} CursorDisplacementSizingMode
 * @description
 * - 'natural': Uses the displacement image's natural dimensions
 * - 'fullscreen': Sizes the displacement effect to cover the entire viewport
 * - 'custom': Uses the provided width and height values
 */
export type CursorDisplacementSizingMode = 'natural' | 'fullscreen' | 'custom';

/**
 * Props for the KineticSlider component
 */
export interface KineticSliderProps {
    /** Array of image paths to display as slides */
    images: string[];

    /** Array of text pairs [title, subtitle] to display on slides */
    texts: TextPair[];

    /** Base path for slide images, used for atlas frame lookup */
    slidesBasePath?: string;

    /** Path to the background displacement sprite image */
    backgroundDisplacementSpriteLocation?: string;

    /** Path to the cursor displacement sprite image */
    cursorDisplacementSpriteLocation?: string;

    /** Whether to enable the cursor image displacement effect */
    cursorImgEffect?: boolean;

    /** Whether to enable the cursor text displacement effect */
    cursorTextEffect?: boolean;

    /** Scale intensity of the cursor displacement effect (default: 0.65) */
    cursorScaleIntensity?: number;

    /** Momentum factor for cursor movement (default: 0.14) */
    cursorMomentum?: number;

    /**
     * Controls how the cursor displacement texture is sized
     * - 'natural': Uses the image's natural dimensions
     * - 'fullscreen': Sizes to the viewport dimensions
     * - 'custom': Uses custom width/height values
     */
    cursorDisplacementSizing?: CursorDisplacementSizingMode;

    /** Custom width in pixels for the cursor displacement effect (used when sizing is 'custom') */
    cursorDisplacementWidth?: number;

    /** Custom height in pixels for the cursor displacement effect (used when sizing is 'custom') */
    cursorDisplacementHeight?: number;

    /** Filter configuration(s) to apply to slide images */
    imageFilters?: FilterConfig | FilterConfig[];

    /** Filter configuration(s) to apply to slide text */
    textFilters?: FilterConfig | FilterConfig[];

    /** Color of the title text */
    textTitleColor?: string;

    /** Font size of the title text in pixels */
    textTitleSize?: number;

    /** Font size of the title text on mobile devices */
    mobileTextTitleSize?: number;

    /** Letter spacing of the title text */
    textTitleLetterspacing?: number;

    /** Font family for the title text */
    textTitleFontFamily?: string;

    /** Color of the subtitle text */
    textSubTitleColor?: string;

    /** Font size of the subtitle text in pixels */
    textSubTitleSize?: number;

    /** Font size of the subtitle text on mobile devices */
    mobileTextSubTitleSize?: number;

    /** Letter spacing of the subtitle text */
    textSubTitleLetterspacing?: number;

    /** Vertical offset for the subtitle text from the title */
    textSubTitleOffsetTop?: number;

    /** Vertical offset for the subtitle text on mobile devices */
    mobileTextSubTitleOffsetTop?: number;

    /** Font family for the subtitle text */
    textSubTitleFontFamily?: string;

    /** Maximum fraction of container width/height to shift during mouse interaction */
    maxContainerShiftFraction?: number;

    /** Intensity of the displacement effect during swipe */
    swipeScaleIntensity?: number;

    /** Intensity of the displacement effect during transitions */
    transitionScaleIntensity?: number;

    /** Whether to use external navigation elements instead of built-in navigation */
    externalNav?: boolean;

    /** Selectors for external navigation elements */
    navElement?: NavElement;

    /** Whether to show the cursor as a pointer over slides */
    buttonMode?: boolean;

    /** Atlas name for slide textures */
    slidesAtlas?: string;

    /** Atlas name for effect textures */
    effectsAtlas?: string;

    /** Whether to use atlas for effect textures */
    useEffectsAtlas?: boolean;

    /** Whether to use atlas for slide textures */
    useSlidesAtlas?: boolean;
}

/**
 * Enhanced Sprite with additional properties for animation and scaling
 * @extends Sprite
 */
export interface EnhancedSprite extends Sprite {
    /** Base scale value for the sprite, used for animations */
    baseScale?: number;

    /** Flag indicating if this is a placeholder sprite */
    _isPlaceholder?: boolean;

    /** Index of the slide this placeholder represents */
    _placeholderIndex?: number;

    /** Original texture to restore when converting from placeholder back to full sprite */
    _originalTexture?: Texture;

    /** Loading state for the sprite */
    _loadingState?: 'uninitialized' | 'loading' | 'loaded' | 'error';

    /** Whether this sprite is within the current visibility window */
    _inVisibilityWindow?: boolean;
}

/**
 * References to core PIXI objects used across hooks
 */
export interface PixiRefs {
    /** Reference to the main PIXI Application instance */
    app: React.MutableRefObject<Application | null>;

    /** Reference to the array of slide sprites */
    slides: React.MutableRefObject<EnhancedSprite[]>;

    /** Reference to the array of text containers */
    textContainers: React.MutableRefObject<Container[]>;

    /** Reference to the background displacement sprite */
    backgroundDisplacementSprite: React.MutableRefObject<Sprite | null>;

    /** Reference to the cursor displacement sprite */
    cursorDisplacementSprite: React.MutableRefObject<Sprite | null>;

    /** Reference to the background displacement filter */
    bgDispFilter: React.MutableRefObject<DisplacementFilter | null>;

    /** Reference to the cursor displacement filter */
    cursorDispFilter: React.MutableRefObject<DisplacementFilter | null>;

    /** Reference to the index of the current slide */
    currentIndex: React.MutableRefObject<number>;
}

/**
 * Result of applying a filter, containing the filter instance and control methods
 */
export interface FilterApplicationResult {
    /** The PIXI filter instance */
    filter: Filter;

    /** Function to update the intensity of the filter */
    updateIntensity: (intensity: number) => void;

    /** Function to reset the filter to its default state */
    reset: () => void;
}

/**
 * Shared hook parameters containing refs and props for reuse across hooks
 */
export interface HookParams {
    /** Reference to the slider DOM element */
    sliderRef: React.RefObject<HTMLDivElement | null>;

    /** Object containing references to PIXI objects */
    pixi: PixiRefs;

    /** Component props */
    props: KineticSliderProps;

    /** Callback function for slide change */
    onSlideChange?: (index: number) => void;

    /** Sliding window manager for optimizing slide loading */
    slidingWindowManager?: SlidingWindowManager | null;
}

/**
 * Props for the loading indicator component
 */
export interface LoadingIndicatorProps {
    /** Optional message to display during loading */
    message?: string;
}

/**
 * Result of the usePixiApp hook, containing initialization state and resources
 * @interface UsePixiAppResult
 */
export interface UsePixiAppResult {
    /** References to PIXI objects */
    pixiRefs: PixiRefs;

    /** Atlas manager instance for texture management */
    atlasManager: AtlasManager | null;

    /** Whether the PIXI app is fully initialized */
    isInitialized: boolean;

    /** Whether the PIXI app is currently initializing */
    isInitializing: boolean;

    /** Loading progress information */
    loadingProgress: {
        /** Whether assets are currently loading */
        isLoading: boolean;

        /** Progress percentage (0-100) */
        progress: number;

        /** Number of assets that have been loaded */
        assetsLoaded: number;

        /** Total number of assets to load */
        assetsTotal: number;
    };
}

/**
 * Props for the useDisplacementEffects hook
 */
export interface UseDisplacementEffectsProps {
    /** Reference to the slider DOM element */
    sliderRef: RefObject<HTMLDivElement | null>;

    /** Reference to the background displacement filter */
    bgDispFilterRef: RefObject<DisplacementFilter | null>;

    /** Reference to the cursor displacement filter */
    cursorDispFilterRef: RefObject<DisplacementFilter | null>;

    /** Reference to the background displacement sprite */
    backgroundDisplacementSpriteRef: RefObject<Sprite | null>;

    /** Reference to the cursor displacement sprite */
    cursorDisplacementSpriteRef: RefObject<Sprite | null>;

    /** Reference to the PIXI application */
    appRef: RefObject<Application | null>;

    /** Path to the background displacement sprite image */
    backgroundDisplacementSpriteLocation: string;

    /** Path to the cursor displacement sprite image */
    cursorDisplacementSpriteLocation: string;

    /** Whether to enable the cursor image displacement effect */
    cursorImgEffect: boolean;

    /** Scale intensity of the cursor displacement effect */
    cursorScaleIntensity: number;

    /**
     * Controls how the cursor displacement texture is sized
     * - 'natural': Uses the image's natural dimensions
     * - 'fullscreen': Sizes to the viewport dimensions
     * - 'custom': Uses custom width/height values
     */
    cursorDisplacementSizing?: CursorDisplacementSizingMode;

    /** Custom width in pixels for the cursor displacement effect (used when sizing is 'custom') */
    cursorDisplacementWidth?: number;

    /** Custom height in pixels for the cursor displacement effect (used when sizing is 'custom') */
    cursorDisplacementHeight?: number;

    /** Resource manager instance for tracking and disposing resources */
    resourceManager?: ResourceManager | null;

    /** Atlas manager instance for texture management */
    atlasManager?: AtlasManager | null;

    /** Name of the effects atlas */
    effectsAtlas?: string;

    /** Whether to use atlas for effects instead of individual images */
    useEffectsAtlas?: boolean;
}