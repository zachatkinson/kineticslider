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
 * Slider configuration options - YAGNI: Only implemented features
 */
export interface SliderConfig {
  /** Slides data */
  images: string[];
  /** Auto-play enabled */
  autoPlay?: boolean;
  /** Transition duration in seconds */
  duration?: number;
  /** GSAP easing function */
  easing?: string;
  /** Enable infinite loop */
  loop?: boolean;
  /** Enable mouse/touch interaction */
  interactive?: boolean;
  /** Physics configuration */
  physics: PhysicsConfig;
  /** Rendering configuration */
  rendering: RenderConfig;
  /** Input configuration */
  input: InputConfig;
  /** Preload count */
  preloadCount?: number;
  /** Enable virtualization */
  enableVirtualization?: boolean;
  /** Text overlays for slides - Phase 5+ */
  texts?: SliderText[];
  /** Filters for slides - Phase 4+ */
  filters?: FilterConfig[];
  /** Displacement effects - Phase 3+ */
  displacementEffects?: DisplacementConfig;
}

/**
 * Individual slide data
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
