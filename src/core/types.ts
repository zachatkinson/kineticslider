/**
 * @fileoverview Core Types for KineticSlider
 *
 * Essential type definitions for the slider component.
 * Following YAGNI principle - only what we actually need for Phase 1.2.
 * Includes interfaces for planned Phase 2-4 features.
 *
 * @version 1.0.0
 */

import type { Application, Sprite, Filter, Texture } from 'pixi.js';
import type { gsap } from 'gsap';

/**
 * Core slider state interface
 */
export interface SliderState {
  /** Current slide index */
  currentIndex: number;
  /** Total number of slides */
  totalSlides: number;
  /** Whether the slider is playing */
  isPlaying: boolean;
  /** Whether the slider is transitioning */
  isTransitioning: boolean;
  /** Whether the slider is initialized */
  isInitialized: boolean;
  /** Whether the slider is loading */
  isLoading: boolean;
  /** Loading progress */
  loadingProgress: number;
}

/**
 * Comprehensive slider configuration interface with complete type safety
 *
 * @version 2.0.0 - Phase 4.2 Enhanced Configuration System
 */
export interface SliderConfig {
  /** Array of slide configurations */
  slides: SlideConfig[];

  // Core playback settings
  /** Enable auto-play functionality */
  autoPlay?: boolean;
  /** Auto-play interval in milliseconds */
  autoPlayInterval?: number;
  /** Transition duration in milliseconds */
  duration?: number;
  /** GSAP easing function */
  easing?: string;
  /** Enable infinite loop */
  loop?: boolean;

  // Interaction settings
  /** Enable mouse/touch interaction */
  interactive?: boolean;
  /** Pause on hover */
  pauseOnHover?: boolean;
  /** Pause on focus */
  pauseOnFocus?: boolean;
  /** Pause on user interaction */
  pauseOnInteraction?: boolean;

  // Performance settings
  /** Number of slides to preload */
  preloadCount?: number;
  /** Enable slide virtualization for large datasets */
  enableVirtualization?: boolean;
  /** Memory management configuration */
  memoryManagement?: MemoryManagementConfig;

  // Visual settings
  /** Physics animation configuration */
  physics?: Partial<PhysicsConfig>;
  /** Rendering system configuration */
  rendering?: Partial<RenderConfig>;
  /** Visual effects configuration */
  effects?: VisualEffectsConfig;

  // Input handling
  /** Input system configuration */
  input?: Partial<InputConfig>;
  /** Accessibility configuration */
  accessibility?: AccessibilityConfig;

  // Responsive behavior
  /** Responsive configuration for different breakpoints */
  responsive?: ResponsiveConfig;

  // Advanced features (Phase 4+ compatibility)
  /** Text overlays for slides */
  texts?: SliderText[];
  /** Visual filters for slides */
  filters?: FilterConfig[];
  /** Displacement effects configuration */
  displacementEffects?: DisplacementConfig;

  // Development and debugging
  /** Enable debug mode */
  debug?: boolean;
  /** Performance monitoring configuration */
  performance?: PerformanceConfig;
  /** Error handling and recovery configuration */
  errorHandling?: ErrorHandlingConfig;

  // Legacy compatibility (deprecated, use slides instead)
  /** @deprecated Use slides instead */
  images?: SlideData[];
}

/**
 * Individual slide data (legacy interface)
 * @deprecated Use SlideConfig instead
 */
export interface SlideData {
  /** Unique slide identifier */
  id: string;
  /** Image source URL */
  src: string;
  /** Optional alt text for accessibility */
  alt?: string;
  /** Optional title */
  title?: string;
}

/**
 * Comprehensive slide configuration interface
 *
 * @version 2.0.0 - Phase 4.2 Enhanced Configuration System
 */
export interface SlideConfig extends SlideData {
  /** Slide description for accessibility */
  description?: string;
  /** Additional slide metadata */
  metadata?: SlideMetadata;
  /** Slide-specific animations */
  animations?: SlideAnimationConfig;
  /** Slide-specific effects */
  effects?: SlideEffectsConfig;
  /** Loading configuration for this slide */
  loading?: SlideLoadingConfig;
  /** Slide-specific responsive settings */
  responsive?: SlideResponsiveConfig;
  /** Slide timing overrides */
  timing?: SlideTiming;
}

/**
 * Slide metadata configuration
 */
export interface SlideMetadata {
  /** Slide description for screen readers */
  description?: string;
  /** Slide tags/categories */
  tags?: string[];
  /** Slide priority for loading (higher = load first) */
  priority?: number;
  /** Custom data attributes */
  data?: Record<string, unknown>;
}

/**
 * Slide-specific animation configuration
 */
export interface SlideAnimationConfig {
  /** Entry animation override */
  enter?: AnimationConfig;
  /** Exit animation override */
  exit?: AnimationConfig;
  /** Custom transition effects */
  transition?: TransitionEffectConfig;
}

/**
 * Slide-specific visual effects
 */
export interface SlideEffectsConfig {
  /** Slide-specific filters */
  filters?: FilterConfig[];
  /** Blend mode for this slide */
  blendMode?: string;
  /** Opacity override */
  opacity?: number;
  /** Scale override */
  scale?: number;
}

/**
 * Slide loading configuration
 */
export interface SlideLoadingConfig {
  /** Enable lazy loading for this slide */
  lazy?: boolean;
  /** Preload priority */
  priority?: 'high' | 'normal' | 'low';
  /** Fallback image URL */
  fallback?: string;
  /** Loading timeout in milliseconds */
  timeout?: number;
}

/**
 * Slide-specific responsive configuration
 */
export interface SlideResponsiveConfig {
  /** Responsive image sources */
  sources?: ResponsiveImageSource[];
  /** Responsive aspect ratio */
  aspectRatio?: ResponsiveAspectRatio;
}

/**
 * Slide timing configuration
 */
export interface SlideTiming {
  /** Duration override for this slide in milliseconds */
  duration?: number;
  /** Delay before showing this slide */
  delay?: number;
  /** Custom easing for this slide */
  easing?: string;
}

/**
 * Simple error class for slider-specific errors
 */
export class SliderError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'SliderError';
  }
}

/**
 * Physics Animation Configuration
 */
export interface PhysicsConfig {
  /** Transition duration in seconds */
  transitionDuration: number;
  /** Transition ease function */
  transitionEase: string;
  /** Swipe threshold */
  swipeThreshold: number;
  /** Scale intensity */
  scaleIntensity: number;
  /** Momentum damping */
  momentumDamping: number;
}

/**
 * Scale mode for sprite sizing
 */
export enum ScaleMode {
  /** Scale to cover entire stage (may crop edges) */
  COVER = 'cover',
  /** Scale to fit within stage (may show letterbox/pillarbox) */
  CONTAIN = 'contain',
  /** Scale to cover with extra margin for effects (slight crop) */
  OVERSCAN = 'overscan',
}

/**
 * Rendering Configuration
 */
export interface RenderConfig {
  /** Width of the slider */
  width: number;
  /** Height of the slider */
  height: number;
  /** Background color */
  backgroundColor: number;
  /** Whether to use antialiasing */
  antialias: boolean;
  /** Resolution */
  resolution: number;
  /** Scale mode for sprite sizing */
  scaleMode?: ScaleMode;
  /** Amount of overscan when using OVERSCAN mode (1.1 = 110% scale) */
  overscanAmount?: number;
  /** UI panels configuration */
  uiPanels?: UIPanelConfig[];
}

/**
 * UI Panel Configuration for backdrop blur effects
 */
export interface UIPanelConfig {
  /** Unique panel identifier */
  id: string;
  /** Panel position */
  position:
    | { x: number; y: number }
    | 'center'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right';
  /** Panel size */
  size: { width: number; height: number };
  /** Panel content configuration */
  content: {
    /** Text content to display */
    text?: string;
    /** Background color */
    backgroundColor?: number;
    /** Text color */
    textColor?: number;
    /** Border radius for rounded corners */
    borderRadius?: number;
    /** Internal padding */
    padding?: number;
    /** Font size */
    fontSize?: number;
  };
  /** Backdrop blur configuration */
  backdropBlur?: {
    /** Whether backdrop blur is enabled */
    enabled: boolean;
    /** Blur intensity */
    intensity: number;
    /** Blur quality */
    quality?: number;
  };
}

/**
 * Input Handling Configuration
 */
export interface InputConfig {
  /** Enable mouse interaction */
  enableMouse: boolean;
  /** Enable touch interaction */
  enableTouch: boolean;
  /** Enable keyboard interaction */
  enableKeyboard: boolean;
  /** Swipe threshold */
  swipeThreshold: number;
  /** Drag threshold */
  dragThreshold: number;
}

// =============================================================================
// 🎯 Phase 4.2 Enhanced Configuration Interfaces
// =============================================================================

/**
 * Memory management configuration
 */
export interface MemoryManagementConfig {
  /** Maximum memory usage in MB */
  maxMemoryUsage?: number;
  /** Enable automatic garbage collection */
  autoGarbageCollection?: boolean;
  /** Memory cleanup threshold (0-1) */
  cleanupThreshold?: number;
  /** Cache size for textures */
  textureCacheSize?: number;
}

/**
 * Visual effects configuration
 */
export interface VisualEffectsConfig {
  /** Global opacity */
  opacity?: number;
  /** Global scale factor */
  scale?: number;
  /** Blur effects */
  blur?: BlurEffectConfig;
  /** Color adjustments */
  colorAdjustments?: ColorAdjustmentConfig;
  /** Particle effects */
  particles?: ParticleEffectConfig;
}

/**
 * Blur effect configuration
 */
export interface BlurEffectConfig {
  /** Enable blur effect */
  enabled?: boolean;
  /** Blur intensity (0-10) */
  intensity?: number;
  /** Blur quality */
  quality?: 'low' | 'medium' | 'high';
}

/**
 * Color adjustment configuration
 */
export interface ColorAdjustmentConfig {
  /** Brightness (-1 to 1) */
  brightness?: number;
  /** Contrast (-1 to 1) */
  contrast?: number;
  /** Saturation (-1 to 1) */
  saturation?: number;
  /** Hue rotation in degrees */
  hue?: number;
}

/**
 * Particle effect configuration
 */
export interface ParticleEffectConfig {
  /** Enable particle effects */
  enabled?: boolean;
  /** Particle count */
  count?: number;
  /** Particle size range */
  size?: { min: number; max: number };
  /** Particle speed range */
  speed?: { min: number; max: number };
}

/**
 * Accessibility configuration
 */
export interface AccessibilityConfig {
  /** Enable screen reader support */
  screenReader?: boolean;
  /** Enable keyboard navigation */
  keyboardNavigation?: boolean;
  /** Enable high contrast mode */
  highContrast?: boolean;
  /** Reduce motion for accessibility */
  reduceMotion?: boolean;
  /** Focus management */
  focusManagement?: FocusManagementConfig;
  /** ARIA labels configuration */
  ariaLabels?: AriaLabelsConfig;
}

/**
 * Focus management configuration
 */
export interface FocusManagementConfig {
  /** Auto-focus on slide change */
  autoFocus?: boolean;
  /** Focus trap enabled */
  trapFocus?: boolean;
  /** Focus outline style */
  outlineStyle?: string;
}

/**
 * ARIA labels configuration
 */
export interface AriaLabelsConfig {
  /** Slider container label */
  sliderLabel?: string;
  /** Previous button label */
  previousButton?: string;
  /** Next button label */
  nextButton?: string;
  /** Play/pause button label */
  playPauseButton?: string;
  /** Slide label template */
  slideLabel?: string;
}

/**
 * Responsive configuration
 */
export interface ResponsiveConfig {
  /** Responsive breakpoints */
  breakpoints?: ResponsiveBreakpoint[];
  /** Enable responsive behavior */
  enabled?: boolean;
  /** Responsive strategy */
  strategy?: 'mobile-first' | 'desktop-first';
}

/**
 * Responsive breakpoint configuration
 */
export interface ResponsiveBreakpoint {
  /** Breakpoint name */
  name: string;
  /** Minimum width for this breakpoint */
  minWidth: number;
  /** Maximum width for this breakpoint */
  maxWidth?: number;
  /** Configuration overrides for this breakpoint */
  config: Partial<SliderConfig>;
}

/**
 * Responsive image source
 */
export interface ResponsiveImageSource {
  /** Image source URL */
  src: string;
  /** Media query for this source */
  media: string;
  /** Image width descriptor */
  width?: number;
  /** Image density descriptor */
  density?: number;
}

/**
 * Responsive aspect ratio configuration
 */
export interface ResponsiveAspectRatio {
  /** Default aspect ratio */
  default: number;
  /** Breakpoint-specific aspect ratios */
  breakpoints?: { [breakpoint: string]: number };
}

/**
 * Performance monitoring configuration
 */
export interface PerformanceConfig {
  /** Enable performance monitoring */
  enabled?: boolean;
  /** Performance metrics to track */
  metrics?: PerformanceMetric[];
  /** Performance warning thresholds */
  warnings?: PerformanceWarnings;
  /** Enable performance logging */
  logging?: boolean;
}

/**
 * Error handling and recovery configuration
 */
export interface ErrorHandlingConfig {
  /** Enable error handling system */
  enabled?: boolean;
  /** Error handling mode */
  mode?: 'full' | 'basic' | 'disabled';
  /** Maximum recovery attempts per error */
  maxRecoveryAttempts?: number;
  /** Base delay between recovery attempts (ms) */
  recoveryBaseDelay?: number;
  /** Exponential backoff multiplier */
  recoveryBackoffMultiplier?: number;
  /** Maximum delay between attempts (ms) */
  recoveryMaxDelay?: number;
  /** Recovery operation timeout (ms) */
  recoveryTimeout?: number;
  /** Whether to show fallback indicator */
  showFallbackIndicator?: boolean;
  /** Whether to auto-upgrade from fallback */
  autoUpgrade?: boolean;
  /** Upgrade check interval (ms) */
  upgradeCheckInterval?: number;
  /** Whether to log errors to console */
  logErrors?: boolean;
  /** Custom error handler */
  onError?: (error: Error, context: string) => void;
  /** Custom recovery handler */
  onRecovery?: (error: Error, successful: boolean) => void;
  /** Fallback renderer configuration */
  fallback?: FallbackRendererConfig;
  /** Error boundary configuration */
  boundary?: ErrorBoundaryConfig;
}

/**
 * Fallback renderer configuration
 */
export interface FallbackRendererConfig {
  /** Fallback rendering mode */
  mode?: 'static' | 'basic' | 'css-animations';
  /** CSS class prefix for fallback styles */
  cssPrefix?: string;
  /** Whether to use reduced motion */
  reducedMotion?: boolean;
  /** Whether to log errors to console */
  logErrors?: boolean;
}

/**
 * Error boundary configuration
 */
export interface ErrorBoundaryConfig {
  /** Maximum number of errors before disabling recovery */
  maxErrors?: number;
  /** Whether to attempt automatic recovery */
  enableAutoRecovery?: boolean;
  /** Delay before attempting recovery (ms) */
  recoveryDelay?: number;
  /** Custom fallback UI generator */
  fallbackUI?: (error: Error) => HTMLElement;
  /** Whether to log errors to console */
  logErrors?: boolean;
  /** Whether to show fallback indicator */
  showFallbackIndicator?: boolean;
}

/**
 * Performance metrics to monitor
 */
export type PerformanceMetric =
  | 'fps'
  | 'memory'
  | 'renderTime'
  | 'loadTime'
  | 'animationTime';

/**
 * Performance warning thresholds
 */
export interface PerformanceWarnings {
  /** FPS warning threshold */
  fpsWarning?: number;
  /** Memory warning threshold (MB) */
  memoryWarning?: number;
  /** Render time warning threshold (ms) */
  renderTimeWarning?: number;
}

/**
 * Transition effect configuration
 */
export interface TransitionEffectConfig {
  /** Transition type */
  type?: 'fade' | 'slide' | 'scale' | 'rotate' | 'custom';
  /** Transition direction */
  direction?: 'left' | 'right' | 'up' | 'down';
  /** Custom transition properties */
  custom?: AnimationConfig;
}

/**
 * Core Engine Interface
 */
export interface ISliderEngine {
  // State Management
  getState(): SliderState;
  getCurrentIndex(): number;
  getTotalSlides(): number;
  isTransitioning(): boolean;

  // Navigation
  goToSlide(index: number, animated?: boolean): Promise<void>;
  nextSlide(): Promise<void>;
  previousSlide(): Promise<void>;

  // Playback Control
  togglePlayPause(): void;
  isPlaying(): boolean;

  // Accessibility
  handleEscape(): void;

  // Lifecycle
  initialize(config: SliderConfig): Promise<void>;
  destroy(): void;

  // Events
  on(event: string, callback: (...args: unknown[]) => void): void;
  off(event: string, callback: (...args: unknown[]) => void): void;
  emit(event: string, ...args: unknown[]): void;
}

/**
 * Physics Engine Interface
 */
export interface ISliderPhysics {
  // Animation Control
  animateTransition(
    fromIndex: number,
    toIndex: number,
    sprites: Sprite[]
  ): gsap.core.Timeline;
  animateSwipe(
    sprite: Sprite,
    direction: number,
    intensity: number
  ): gsap.core.Timeline;
  animateScale(
    sprite: Sprite,
    scale: number,
    duration?: number
  ): gsap.core.Timeline;

  // Physics Properties
  setPhysicsConfig(config: Partial<PhysicsConfig>): void;
  getPhysicsConfig(): PhysicsConfig;

  // Cleanup
  killAllAnimations(): void;
  cleanup(): void;
}

/**
 * Rendering Engine Interface
 */
export interface ISliderRenderer {
  // Application Management
  initialize(container: HTMLElement, config: RenderConfig): Promise<void>;
  getApplication(): Application | null;
  resize(width: number, height: number): void;

  // Sprite Management
  createSprite(texture: string | Texture, index: number): Promise<Sprite>;
  removeSprite(sprite: Sprite): void;
  getSprites(): Sprite[];

  // UI Panel Management
  createUIPanel(config: UIPanelConfig): Promise<Sprite>;
  removeUIPanel(panelId: string): void;
  getUIPanels(): Sprite[];
  clearUIPanels(): void;

  // Filter Management - Phase 4+ feature
  applyFilter(sprite: Sprite, filter: Filter): void;
  removeFilter(sprite: Sprite, filter: Filter): void;
  clearFilters(sprite: Sprite): void;

  // Rendering Control
  render(): void;
  setVisible(sprite: Sprite, visible: boolean): void;

  // Cleanup
  destroy(): void;
}

/**
 * Input Controller Interface
 */
export interface ISliderController {
  // Input Setup
  initialize(element: HTMLElement, callbacks: InputCallbacks): void;
  enable(): void;
  disable(): void;

  // Configuration
  setInputConfig(config: Partial<InputConfig>): void;
  getInputConfig(): InputConfig;

  // Accessibility Updates
  updateSlideState(currentIndex: number, totalSlides: number): void;
  updatePlayState(isPlaying: boolean): void;

  // Cleanup
  destroy(): void;
}

/**
 * Input Event Callbacks
 */
export interface InputCallbacks {
  /** Callback for swipe left */
  onSwipeLeft: () => void;
  /** Callback for swipe right */
  onSwipeRight: () => void;
  /** Callback for drag start */
  onDragStart: (x: number, y: number) => void;
  /** Callback for drag move */
  onDragMove: (x: number, y: number, deltaX: number, deltaY: number) => void;
  /** Callback for drag end */
  onDragEnd: (x: number, y: number) => void;
  /** Callback for key left */
  onKeyLeft: () => void;
  /** Callback for key right */
  onKeyRight: () => void;
  /** Callback for toggle play/pause */
  onTogglePlayPause: () => void;
  /** Callback for direct slide navigation */
  onGoToSlide: (index: number) => void;
  /** Callback for escape key */
  onEscape: () => void;
}

/**
 * Filter Configuration - Phase 4+ (Filter System Architecture)
 *
 * Will be implemented in Phase 4.1-4.2 for the modular filter framework.
 * Keeping interface now to guide upcoming development and reduce churn.
 */
export interface FilterConfig {
  /** Filter type (blur, color, distortion, etc.) */
  type: string;
  /** Target for the filter */
  target: 'sprites' | 'stage';
  /** Filter-specific options */
  options: Record<string, unknown>;
  /** Whether the filter is enabled */
  enabled: boolean;
}

/**
 * Displacement Effect Configuration - Phase 3+ (Advanced Visual Effects)
 *
 * Will be implemented in Phase 3.3 for displacement effect management.
 * From main branch displacement effects, enhanced and optimized.
 */
export interface DisplacementConfig {
  /** Background texture for displacement map */
  backgroundTexture: string;
  /** Cursor texture for interactive effects */
  cursorTexture: string;
  /** Whether the displacement effect is enabled */
  enabled: boolean;
  /** Effect intensity (0-1) */
  intensity: number;
}

/**
 * Text Configuration for Slides - Phase 5+ (Advanced Features)
 *
 * Will be implemented in Phase 5+ for text overlay system.
 * Keeping interface to guide upcoming text feature development.
 */
export interface SliderText {
  /** Main title text */
  title?: string;
  /** Subtitle text */
  subtitle?: string;
  /** Text color (hex or named) */
  color?: string;
  /** Font family */
  fontFamily?: string;
  /** Font size in pixels */
  fontSize?: number;
}

/**
 * Event System
 */
export interface EventEmitter {
  /** Subscribe to an event */
  on(event: string, callback: (...args: unknown[]) => void): void;
  /** Unsubscribe from an event */
  off(event: string, callback: (...args: unknown[]) => void): void;
  /** Emit an event */
  emit(event: string, ...args: unknown[]): void;
}

/**
 * Service Keys for Dependency Injection
 */
export const SERVICE_KEYS = {
  ENGINE: 'slider-engine',
  PHYSICS: 'slider-physics',
  RENDERER: 'slider-renderer',
  CONTROLLER: 'slider-controller',
  EVENT_EMITTER: 'event-emitter',
} as const;

export type ServiceKey = (typeof SERVICE_KEYS)[keyof typeof SERVICE_KEYS];

// =============================================================================
// 🎯 PIXI.js Integration Types
// =============================================================================

/**
 * Configuration for PIXI.js application initialization
 */
export interface PixiConfig {
  /** Maximum initialization time in milliseconds */
  maxInitTime?: number;
  /** Enable development mode features */
  developmentMode?: boolean;
  /** Shader cache configuration */
  shaderCache?: {
    enabled: boolean;
    maxSize: number;
  };
  /** Texture pool configuration */
  texturePool?: {
    initialSize: number;
    maxSize: number;
  };
}

/**
 * Texture loading and caching configuration
 */
export interface TextureConfig {
  /** Supported image formats */
  supportedFormats: readonly string[];
  /** Default quality setting */
  quality: number;
  /** Cache size for preloaded textures */
  cacheSize: number;
  /** Lazy loading threshold */
  lazyLoadThreshold: number;
  /** Loading timeout in milliseconds */
  loadTimeout: number;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Retry delay configuration */
  retryDelay: {
    base: number;
    multiplier: number;
  };
}

/**
 * Resource loading progress information
 */
export interface LoadingProgress {
  /** Current number of loaded resources */
  loaded: number;
  /** Total number of resources to load */
  total: number;
  /** Loading progress as percentage (0-100) */
  percentage: number;
  /** Currently loading resource URL */
  currentResource?: string;
  /** Estimated time remaining in milliseconds */
  estimatedTimeRemaining?: number;
}

/**
 * Resource management configuration
 */
export interface ResourceConfig {
  /** Cleanup interval in milliseconds */
  cleanupInterval: number;
  /** Idle timeout before cleanup */
  idleTimeout: number;
  /** Memory pressure threshold (0-1) */
  memoryPressureThreshold: number;
  /** Critical memory threshold (0-1) */
  criticalMemoryThreshold: number;
  /** Enable reference tracking */
  trackReferences: boolean;
  /** Enable automatic cleanup */
  autoCleanup: boolean;
}

/**
 * Sprite pool configuration
 */
export interface SpritePoolConfig {
  /** Initial pool size */
  initialSize: number;
  /** Maximum pool size */
  maxSize: number;
  /** Growth factor for pool expansion */
  growthFactor: number;
  /** Shrink threshold for pool reduction */
  shrinkThreshold: number;
  /** Properties to reset when returning sprite to pool */
  resetProperties: readonly string[];
}

/**
 * Shader management configuration
 */
export interface ShaderConfig {
  /** Compilation timeout in milliseconds */
  compileTimeout: number;
  /** Cache expiration time */
  cacheExpiry: number;
  /** Maximum number of cached shaders */
  maxCached: number;
  /** Maximum recompilation attempts */
  maxRecompiles: number;
  /** Enable shader debugging */
  enableDebugging?: boolean;
}

/**
 * Performance monitoring metrics
 */
export interface PerformanceMetrics {
  /** Frames per second statistics */
  fps: {
    current: number;
    average: number;
    min: number;
    max: number;
  };
  /** Memory usage statistics */
  memory: {
    used: number;
    total: number;
    percentage: number;
    peak: number;
  };
  /** Rendering statistics */
  rendering: {
    drawCalls: number;
    triangles: number;
    textures: number;
    shaders: number;
  };
  /** Loading statistics */
  loading: {
    totalAssets: number;
    loadedAssets: number;
    failedAssets: number;
    averageLoadTime: number;
  };
}

/**
 * Resource information for tracking and management
 */
export interface ResourceInfo {
  /** Unique resource identifier */
  id: string;
  /** Resource type */
  type: 'texture' | 'sprite' | 'shader' | 'filter' | 'audio';
  /** Resource URL or source */
  source: string;
  /** Memory size in bytes */
  memorySize: number;
  /** Creation timestamp */
  createdAt: number;
  /** Last accessed timestamp */
  lastAccessed: number;
  /** Reference count */
  refCount: number;
  /** Whether resource is actively used */
  isActive: boolean;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Core PixiRenderer interface for clean PIXI.js application management
 */
export interface IPixiRenderer {
  /** Initialize PIXI application */
  initialize(container: HTMLElement, config?: PixiConfig): Promise<void>;
  /** Create sprite from texture */
  createSlide(texture: string | Texture): Promise<Sprite>;
  /** Update viewport dimensions */
  updateViewport(width: number, height: number): void;
  /** Get current performance metrics */
  getPerformanceMetrics(): PerformanceMetrics;
  /** Dispose of renderer and cleanup resources */
  dispose(): void;
}

/**
 * TextureManager interface for efficient texture loading and caching
 */
export interface ITextureManager {
  /** Load single texture with progress tracking */
  loadTexture(url: string, priority?: number): Promise<Texture>;
  /** Load multiple textures with progress */
  loadTextures(
    urls: string[],
    onProgress?: (progress: LoadingProgress) => void
  ): Promise<Texture[]>;
  /** Preload textures for future use */
  preloadTextures(urls: string[]): Promise<void>;
  /** Get cached texture */
  getCachedTexture(url: string): Texture | null;
  /** Clear texture cache */
  clearCache(): void;
  /** Get memory usage statistics */
  getMemoryUsage(): { used: number; cached: number; total: number };
  /** Dispose of texture manager */
  dispose(): void;
}

/**
 * ResourceLoader interface for progressive loading with error handling
 */
export interface IResourceLoader {
  /** Load resources with progress tracking */
  loadResources(
    resources: Array<{ url: string; type: string }>,
    onProgress?: (progress: LoadingProgress) => void
  ): Promise<Map<string, unknown>>;
  /** Load single resource with retry logic */
  loadResource(url: string, type: string): Promise<unknown>;
  /** Cancel ongoing loading operations */
  cancelLoading(): void;
  /** Get loading statistics */
  getLoadingStats(): { pending: number; completed: number; failed: number };
  /** Dispose of resource loader */
  dispose(): void;
}

/**
 * SpritePool interface for object pooling and performance optimization
 */
export interface ISpritePool {
  /** Get sprite from pool (creates new if pool is empty) */
  getSprite(texture?: Texture): Sprite;
  /** Return sprite to pool for reuse */
  returnSprite(sprite: Sprite): void;
  /** Clear all sprites from pool */
  clear(): void;
  /** Get pool statistics */
  getStats(): { available: number; inUse: number; total: number };
  /** Resize pool capacity */
  resize(newSize: number): void;
  /** Dispose of sprite pool */
  dispose(): void;
}

/**
 * ShaderManager interface for optimized shader compilation and reuse
 */
export interface IShaderManager {
  /** Compile and cache shader */
  compileShader(
    vertexSrc: string,
    fragmentSrc: string,
    name?: string
  ): Promise<unknown>;
  /** Get cached shader */
  getShader(name: string): unknown | null;
  /** Clear shader cache */
  clearCache(): void;
  /** Get compilation statistics */
  getStats(): { cached: number; compiled: number; failed: number };
  /** Dispose of shader manager */
  dispose(): void;
}

/**
 * Performance monitoring interface for FPS and memory tracking
 */
export interface IPerformanceMonitor {
  /** Start performance monitoring */
  start(): void;
  /** Stop performance monitoring */
  stop(): void;
  /** Get current performance metrics */
  getMetrics(): PerformanceMetrics;
  /** Get performance history */
  getHistory(duration?: number): PerformanceMetrics[];
  /** Reset performance counters */
  reset(): void;
  /** Set performance warning thresholds */
  setThresholds(
    warning: Partial<PerformanceMetrics>,
    critical: Partial<PerformanceMetrics>
  ): void;
  /** Dispose of performance monitor */
  dispose(): void;
}

// =============================================================================
// 🎬 Phase 2.3 Animation Coordination Types
// =============================================================================

/**
 * Animation configuration for the coordination system
 */
export interface AnimationConfig {
  /** Array of animation steps */
  animations?: Array<{
    targets: gsap.TweenTarget;
    properties: Record<string, unknown>;
    duration?: number;
    ease?: string;
    delay?: number;
  }>;
  /** Overall animation duration */
  duration?: number;
  /** Animation easing function */
  ease?: string;
  /** Animation delay */
  delay?: number;
  /** Custom properties */
  [key: string]: unknown;
}

/**
 * Animation priority levels for queue management
 */
export type AnimationPriority = number;

/**
 * Animation context for debugging and tracking
 */
export interface AnimationContext {
  /** Context group identifier */
  groupId?: string;
  /** Whether this is a grouped animation */
  isGroup?: boolean;
  /** Animation source identifier */
  source?: string;
  /** Additional context data */
  data?: unknown;
}

/**
 * Timeline group for coordinated animations
 */
export interface TimelineGroup {
  /** Unique group identifier */
  id: string;
  /** Master timeline coordinating all child timelines */
  masterTimeline: gsap.core.Timeline;
  /** Map of child timelines */
  childTimelines: Map<string, gsap.core.Timeline>;
  /** Dependency graph for execution order */
  dependencies: Map<string, string[]>;
  /** Set of completed timeline IDs */
  completedTimelines: Set<string>;
  /** Whether group should execute sequentially */
  isSequential: boolean;
  /** Delay between sequential timelines */
  staggerDelay: number;
}

/**
 * Animation system state for debugging
 */
export interface AnimationState {
  /** Whether queue is currently being processed */
  isProcessingQueue: boolean;
  /** List of active animation IDs */
  activeAnimations: string[];
  /** List of queued animations with metadata */
  queuedAnimations: Array<{
    id: string;
    priority: AnimationPriority;
    context: AnimationContext;
  }>;
  /** List of active timeline group IDs */
  timelineGroups: string[];
  /** Current performance statistics */
  performanceStats: {
    activeAnimations: number;
    queueLength: number;
    activeTimelines: number;
    activeTimelineGroups: number;
    currentAnimationCount: number;
  };
}

/**
 * Animation event data
 */
export interface AnimationEventData {
  /** Animation identifier */
  id: string;
  /** Event-specific data */
  data?: unknown;
}

// YAGNI: Removed unused interfaces for Phase 2+ features:
// - FilterConfig (filters not implemented yet)
// - DisplacementConfig (displacement effects not implemented yet)
// - SliderText (text system not implemented yet)
//
// These will be added back when we actually implement those features
// in Phase 2 and beyond to avoid premature optimization.
