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

// YAGNI: Removed unused interfaces for Phase 2+ features:
// - FilterConfig (filters not implemented yet)
// - DisplacementConfig (displacement effects not implemented yet)
// - SliderText (text system not implemented yet)
//
// These will be added back when we actually implement those features
// in Phase 2 and beyond to avoid premature optimization.
