import type { AnimationEase as _AnimationEase } from "./common";
import type { Brand as _Brand, Duration, Delay, FPS } from "./branded";
import gsap from "gsap";
import type { Container, Filter } from 'pixi.js';

/**
 * Animation-specific types and interfaces
 *
 * This module contains type definitions for animations used throughout the application.
 * It includes configuration types, metrics, events, and other animation-related interfaces.
 *
 * @module Animation
 * @group Types
 */

/**
 * Enhanced Animation System Types for Phase 3
 * 
 * Provides type-safe interfaces for GSAP integration, timeline management,
 * and configurable distortion effects with custom shader support.
 */

/**
 * Extended animation configuration that includes custom properties
 *
 * This interface extends GSAP's TweenVars to include our application-specific
 * animation requirements.
 *
 * @interface ExtendedAnimationConfig
 * @augments {gsap.TweenVars}
 *
 * @example
 * ```ts
 * const animConfig: ExtendedAnimationConfig = {
 *   target: element,
 *   duration: 0.5,
 *   ease: "power2.out",
 *   x: 100,
 *   opacity: 1
 * };
 * ```
 */
export interface ExtendedAnimationConfig extends gsap.TweenVars {
  /** The target element to animate */
  target: gsap.TweenTarget;
}

/**
 * Base animation configuration type
 *
 * This is the primary animation configuration type used throughout the application.
 *
 * @typedef {ExtendedAnimationConfig} AnimationConfig
 */
export type AnimationConfig = ExtendedAnimationConfig;

/**
 * Configuration for GSAP timelines
 *
 * Used to configure animation sequences using GSAP's Timeline feature.
 *
 * @typedef {gsap.TimelineVars} TimelineConfig
 */
export type TimelineConfig = gsap.TimelineVars;

/**
 * Animation options for basic animations
 *
 * Contains the necessary configuration to create and execute animations.
 *
 * @interface AnimationOptions
 *
 * @example
 * ```ts
 * const options: AnimationOptions = {
 *   target: document.querySelector('.my-element'),
 *   config: {
 *     duration: 0.8,
 *     ease: "back.out(1.7)"
 *   },
 *   onComplete: () => console.log('Animation complete')
 * };
 * ```
 */
export interface AnimationOptions {
  /** Target element to animate */
  target: gsap.TweenTarget;
  /** Animation configuration */
  config: {
    /** Animation duration in seconds */
    duration: number;
    /** Animation easing function */
    ease: string;
  };
  /** Callback when animation completes */
  onComplete?: () => void;
}

/**
 * Animation metrics for performance tracking
 *
 * Contains performance measurements collected during animation playback.
 * Used for performance monitoring and optimization.
 *
 * @interface AnimationMetrics
 *
 * @example
 * ```ts
 * function logMetrics(metrics: AnimationMetrics) {
 *   console.log(`Average FPS: ${metrics.fps}`);
 *   console.log(`Duration: ${metrics.duration}ms`);
 *   console.log(`Frames: ${metrics.frames}`);
 *
 *   if (metrics.memory) {
 *     console.log(`Memory usage: ${metrics.memory.usedJSHeapSize / 1024 / 1024}MB`);
 *   }
 * }
 * ```
 */
export interface AnimationMetrics {
  /** Average frame rate during animation */
  fps: number;
  /** Duration of the animation in milliseconds */
  duration: number;
  /** Number of frames rendered */
  frames: number;
  /** Memory usage during animation (if available) */
  memory?: {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
  };
}

/**
 * Animation lifecycle event handlers
 *
 * Defines callbacks for animation lifecycle events.
 *
 * @interface AnimationEvents
 *
 * @example
 * ```ts
 * const events: AnimationEvents = {
 *   onAnimationStart: () => console.log('Animation started'),
 *   onAnimationComplete: () => console.log('Animation completed'),
 *   onAnimationCancel: () => console.log('Animation cancelled')
 * };
 * ```
 */
export interface AnimationEvents {
  /** Called when the animation starts */
  onAnimationStart?: () => void;
  /** Called when the animation completes */
  onAnimationComplete?: () => void;
  /** Called when the animation is cancelled */
  onAnimationCancel?: () => void;
}

// Re-export branded types for backward compatibility
export type { Duration, Delay, FPS };

/**
 * Available slide transition animation types
 *
 * Enum defining the supported transition effects between slides.
 *
 * @enum {string}
 *
 * @example
 * ```ts
 * function transition(slide: Slide, type: TransitionType) {
 *   switch (type) {
 *     case TransitionType.FADE:
 *       fadeTransition(slide);
 *       break;
 *     case TransitionType.SLIDE:
 *       slideTransition(slide);
 *       break;
 *     case TransitionType.ZOOM:
 *       zoomTransition(slide);
 *       break;
 *   }
 * }
 * ```
 */
export enum TransitionType {
  /** Fade transition (opacity-based) */
  FADE = "fade",
  /** Slide transition (position-based) */
  SLIDE = "slide",
  /** Zoom transition (scale-based) */
  ZOOM = "zoom",
}

/**
 * Return type for useAnimation hook
 *
 * Defines the API returned by the useAnimation hook for creating and
 * controlling animations.
 *
 * @interface BasicAnimationReturn
 *
 * @example
 * ```ts
 * const { animate } = useAnimation();
 *
 * const startAnimation = () => {
 *   const cleanup = animate({
 *     target: elementRef.current,
 *     config: { duration: 0.5, ease: 'power2.out' },
 *     onComplete: () => console.log('Animation finished')
 *   });
 *
 *   // Later, if needed
 *   // cleanup(); // Stop animation
 * };
 * ```
 */
export interface BasicAnimationReturn {
  /**
   * Function to start an animation
   *
   * @param options - Animation options object
   *
   * @returns A cleanup function that can be called to stop the animation
   *
   */
  animate: (options: AnimationOptions) => () => void;
}

// Core Animation Types
export type AnimationEasing = 
  | 'none' | 'power1' | 'power2' | 'power3' | 'power4'
  | 'back' | 'bounce' | 'circ' | 'elastic' | 'expo' | 'sine'
  | 'power1.in' | 'power1.out' | 'power1.inOut'
  | 'power2.in' | 'power2.out' | 'power2.inOut'
  | 'power3.in' | 'power3.out' | 'power3.inOut'
  | 'power4.in' | 'power4.out' | 'power4.inOut'
  | 'back.in' | 'back.out' | 'back.inOut'
  | 'bounce.in' | 'bounce.out' | 'bounce.inOut'
  | 'circ.in' | 'circ.out' | 'circ.inOut'
  | 'elastic.in' | 'elastic.out' | 'elastic.inOut'
  | 'expo.in' | 'expo.out' | 'expo.inOut'
  | 'sine.in' | 'sine.out' | 'sine.inOut'
  | string; // Allow custom easing functions

export enum AnimationType {
  SLIDE_TRANSITION = 'slide_transition',
  FADE = 'fade',
  SCALE = 'scale',
  ROTATE = 'rotate',
  DISPLACEMENT = 'displacement',
  FILTER_EFFECT = 'filter_effect',
  TEXT_ANIMATION = 'text_animation',
  MOUSE_FOLLOW = 'mouse_follow',
  IDLE_EFFECT = 'idle_effect',
  CUSTOM = 'custom'
}

export enum AnimationPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  NORMAL = 'normal',
  LOW = 'low'
}

export enum TimelineState {
  IDLE = 'idle',
  PLAYING = 'playing',
  PAUSED = 'paused',
  REVERSED = 'reversed',
  COMPLETED = 'completed',
  KILLED = 'killed'
}

// Animation Configuration Interfaces
export interface BaseAnimationConfig {
  duration: number;
  delay?: number;
  ease?: AnimationEasing;
  repeat?: number;
  repeatDelay?: number;
  yoyo?: boolean;
  onStart?: () => void;
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
  onInterrupt?: () => void;
}

export interface SlideTransitionConfig extends BaseAnimationConfig {
  type: AnimationType.SLIDE_TRANSITION;
  scaleIntensity?: number;
  direction?: 'forward' | 'backward';
  stagger?: number;
}

export interface DisplacementConfig extends BaseAnimationConfig {
  type: AnimationType.DISPLACEMENT;
  intensity: number;
  momentum?: number;
  target: 'image' | 'text' | 'both';
  interactive?: boolean;
}

export interface FilterEffectConfig extends BaseAnimationConfig {
  type: AnimationType.FILTER_EFFECT;
  filterType: string;
  intensity: number;
  properties?: Record<string, unknown>;
}

export interface CustomAnimationConfig extends BaseAnimationConfig {
  type: AnimationType.CUSTOM;
  properties: Record<string, unknown>;
  target: Container | Container[];
}

export type EnhancedAnimationConfig = 
  | SlideTransitionConfig 
  | DisplacementConfig 
  | FilterEffectConfig 
  | CustomAnimationConfig;

// Timeline Management
export interface TimelineOptions {
  autoRemoveChildren?: boolean;
  delay?: number;
  onComplete?: () => void;
  onInterrupt?: () => void;
  onReverseComplete?: () => void;
  onStart?: () => void;
  onUpdate?: (progress: number) => void;
  paused?: boolean;
  repeat?: number;
  repeatDelay?: number;
  smoothChildTiming?: boolean;
  yoyo?: boolean;
}

export interface TimelineGroup {
  id: string;
  name?: string;
  priority: AnimationPriority;
  timeline: gsap.core.Timeline;
  state: TimelineState;
  animations: AnimationInstance[];
  metadata?: Record<string, unknown>;
  createdAt: number;
  lastUpdated: number;
}

export interface AnimationInstance {
  id: string;
  type: AnimationType;
  config: EnhancedAnimationConfig;
  tween: gsap.core.Tween;
  target: Container | Container[];
  state: TimelineState;
  progress: number;
  startTime: number;
  duration: number;
}

// Distortion Effects
export interface DistortionEffect {
  id: string;
  name: string;
  type: 'displacement' | 'wave' | 'noise' | 'custom';
  enabled: boolean;
  intensity: number;
  properties: Record<string, unknown>;
}

export interface ImageDistortionConfig {
  enabled: boolean;
  effects: DistortionEffect[];
  globalIntensity: number;
  interactive: boolean;
  momentum: number;
  scaleIntensity: number;
}

export interface TextDistortionConfig {
  enabled: boolean;
  effects: DistortionEffect[];
  globalIntensity: number;
  interactive: boolean;
  separateFromImage: boolean;
  customProperties?: {
    blur?: number;
    offset?: { x: number; y: number };
    tilt?: number;
  };
}

export interface DistortionManager {
  imageConfig: ImageDistortionConfig;
  textConfig: TextDistortionConfig;
  globalEnabled: boolean;
  performanceMode: 'high' | 'balanced' | 'performance';
}

// Custom Shader Support
export interface ShaderConfig {
  fragmentShader?: string;
  vertexShader?: string;
  uniforms?: Record<string, unknown>;
  enabled?: boolean;
}

export interface CustomShader {
  id: string;
  name: string;
  config: ShaderConfig;
  filter?: Filter;
  isLoaded: boolean;
  metadata?: {
    author?: string;
    description?: string;
    version?: string;
    tags?: string[];
  };
}

// Advanced animation profiling metrics
export interface AnimationProfilerMetrics {
  totalAnimations: number;
  activeAnimations: number;
  averageFPS: number;
  frameDrops: number;
  memoryUsage: number;
  gpuUtilization?: number;
  renderTime: number;
  lastFrameTime: number;
  performanceScore: number; // 0-100
}

export interface AnimationProfiler {
  startProfiling(): void;
  stopProfiling(): AnimationProfilerMetrics;
  getMetrics(): AnimationProfilerMetrics;
  resetMetrics(): void;
  isRunning(): boolean;
}

// Enhanced Animation Hook Types
export interface AnimationHookConfig {
  enableProfiling?: boolean;
  maxConcurrentAnimations?: number;
  defaultEasing?: AnimationEasing;
  defaultDuration?: number;
  performanceMode?: 'high' | 'balanced' | 'performance';
  debugMode?: boolean;
}

export interface AnimationHookReturn {
  // Timeline Management
  createTimeline: (options?: TimelineOptions) => string;
  getTimeline: (id: string) => gsap.core.Timeline | null;
  killTimeline: (id: string) => void;
  pauseTimeline: (id: string) => void;
  resumeTimeline: (id: string) => void;
  
  // Animation Creation
  animate: (target: Container | Container[], config: EnhancedAnimationConfig) => string;
  animateSlideTransition: (fromIndex: number, toIndex: number, config?: Partial<SlideTransitionConfig>) => string;
  animateDisplacement: (config: DisplacementConfig) => string;
  animateFilter: (config: FilterEffectConfig) => string;
  
  // Distortion Controls
  setImageDistortion: (config: Partial<ImageDistortionConfig>) => void;
  setTextDistortion: (config: Partial<TextDistortionConfig>) => void;
  updateDistortionIntensity: (target: 'image' | 'text' | 'both', intensity: number) => void;
  
  // Performance & Metrics
  getMetrics: () => AnimationMetrics;
  startProfiling: () => void;
  stopProfiling: () => void;
  
  // State
  isAnimating: boolean;
  activeTimelineCount: number;
  performance: AnimationMetrics;
}

// Event Types
export interface AnimationEvent {
  type: 'start' | 'update' | 'complete' | 'interrupt' | 'pause' | 'resume';
  animationId: string;
  timelineId?: string;
  target?: Container | Container[];
  progress?: number;
  timestamp: number;
}

export type AnimationEventHandler = (event: AnimationEvent) => void;

// Error Types
/**
 * Custom error class for animation-related errors
 * 
 * @example
 * ```typescript
 * throw new AnimationError('Invalid target', AnimationErrorCode.INVALID_TARGET);
 * ```
 */
export class AnimationError extends Error {
  /**
   *
   */
  constructor(
    message: string,
    public code: string,
    public animationId?: string,
    public timelineId?: string
  ) {
    super(message);
    this.name = 'AnimationError';
  }
}

export enum AnimationErrorCode {
  INVALID_TARGET = 'INVALID_TARGET',
  INVALID_CONFIG = 'INVALID_CONFIG',
  TIMELINE_NOT_FOUND = 'TIMELINE_NOT_FOUND',
  ANIMATION_NOT_FOUND = 'ANIMATION_NOT_FOUND',
  GSAP_NOT_AVAILABLE = 'GSAP_NOT_AVAILABLE',
  PERFORMANCE_LIMIT_EXCEEDED = 'PERFORMANCE_LIMIT_EXCEEDED',
  SHADER_COMPILATION_FAILED = 'SHADER_COMPILATION_FAILED'
}

export interface EnhancedAnimationHookConfig extends AnimationHookConfig {
  timelineManager?: import('../utils/animation/TimelineManager').TimelineManager;
  enableDistortionEffects?: boolean;
  onAnimationEvent?: AnimationEventHandler;
}
