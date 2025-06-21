/**
 * Core Domain Models for KineticSlider
 *
 * These models represent the essential business entities and value objects
 * in our domain. They are framework-agnostic and contain only business logic.
 */

// ===== VALUE OBJECTS =====

/**
 * Represents a slide dimension configuration
 */
export interface SlideDimensions {
  readonly width: number;
  readonly height: number;
  readonly aspectRatio: number;
}

/**
 * Represents animation timing configuration
 */
export interface AnimationTiming {
  readonly duration: number; // milliseconds
  readonly easing: string;
  readonly delay?: number;
}

/**
 * Represents slide transition configuration
 */
export interface SlideTransition {
  readonly type: 'fade' | 'slide' | 'zoom' | 'flip' | 'custom';
  readonly timing: AnimationTiming;
  readonly direction?: 'left' | 'right' | 'up' | 'down';
}

/**
 * Represents responsive breakpoint configuration
 */
export interface ResponsiveBreakpoint {
  readonly name: string;
  readonly minWidth: number;
  readonly maxWidth?: number;
  readonly dimensions: SlideDimensions;
}

// ===== ENTITIES =====

/**
 * Represents a single slide in the slider
 */
export interface Slide {
  readonly id: string;
  readonly type: 'image' | 'video' | 'html';
  readonly content: SlideContent;
  readonly metadata: SlideMetadata;
  readonly responsive: ResponsiveBreakpoint[];
}

/**
 * Content data for different slide types
 */
export type SlideContent = ImageContent | VideoContent | HtmlContent;

export interface ImageContent {
  readonly type: 'image';
  readonly src: string;
  readonly alt: string;
  readonly srcSet?: string;
  readonly sizes?: string;
}

export interface VideoContent {
  readonly type: 'video';
  readonly src: string;
  readonly poster?: string;
  readonly autoplay: boolean;
  readonly loop: boolean;
  readonly muted: boolean;
}

export interface HtmlContent {
  readonly type: 'html';
  readonly content: string;
  readonly css?: string;
}

/**
 * Metadata associated with a slide
 */
export interface SlideMetadata {
  readonly title?: string;
  readonly description?: string;
  readonly duration?: number; // Auto-advance timing
  readonly priority: 'low' | 'normal' | 'high';
  readonly preload: boolean;
}

/**
 * Represents the slider configuration
 */
export interface SliderConfig {
  readonly id: string;
  readonly slides: Slide[];
  readonly dimensions: SlideDimensions;
  readonly responsive: ResponsiveBreakpoint[];
  readonly transitions: SlideTransition;
  readonly autoplay: AutoplayConfig;
  readonly controls: ControlsConfig;
  readonly accessibility: AccessibilityConfig;
  readonly performance: PerformanceConfig;
}

/**
 * Autoplay configuration
 */
export interface AutoplayConfig {
  readonly enabled: boolean;
  readonly interval: number; // milliseconds
  readonly pauseOnHover: boolean;
  readonly pauseOnFocus: boolean;
  readonly stopOnInteraction: boolean;
}

/**
 * Controls configuration
 */
export interface ControlsConfig {
  readonly navigation: boolean;
  readonly pagination: boolean;
  readonly keyboard: boolean;
  readonly touch: boolean;
  readonly mouse: boolean;
}

/**
 * Accessibility configuration
 */
export interface AccessibilityConfig {
  readonly enabled: boolean;
  readonly announceSlides: boolean;
  readonly focusManagement: boolean;
  readonly keyboardNavigation: boolean;
  readonly reducedMotion: boolean;
}

/**
 * Performance configuration
 */
export interface PerformanceConfig {
  readonly preloadNext: number; // Number of slides to preload
  readonly lazyLoad: boolean;
  readonly virtualSlides: boolean; // For large datasets
  readonly maxConcurrentLoads: number;
}

// ===== AGGREGATES =====

/**
 * The main KineticSlider aggregate root
 */
export interface KineticSlider {
  readonly config: SliderConfig;
  readonly state: SliderState;
  readonly capabilities: SliderCapabilities;
}

/**
 * Current state of the slider
 */
export interface SliderState {
  readonly currentSlideIndex: number;
  readonly isPlaying: boolean;
  readonly isLoading: boolean;
  readonly loadedSlides: Set<string>;
  readonly error: SliderError | null;
  readonly lastInteraction: Date | null;
}

/**
 * Capabilities of the current environment
 */
export interface SliderCapabilities {
  readonly supportsWebGL: boolean;
  readonly supportsVideo: boolean;
  readonly supportsTouch: boolean;
  readonly supportsIntersectionObserver: boolean;
  readonly supportsResizeObserver: boolean;
  readonly prefersReducedMotion: boolean;
}

/**
 * Slider error representation
 */
export interface SliderError {
  readonly code: string;
  readonly message: string;
  readonly slideId?: string;
  readonly recoverable: boolean;
  readonly timestamp: Date;
}

// ===== DOMAIN EVENTS =====

/**
 * Base interface for all domain events
 */
export interface DomainEvent {
  readonly type: string;
  readonly timestamp: Date;
  readonly sliderId: string;
}

/**
 * Slide navigation events
 */
export interface SlideChangedEvent extends DomainEvent {
  readonly type: 'slide-changed';
  readonly previousIndex: number;
  readonly currentIndex: number;
  readonly trigger: 'user' | 'autoplay' | 'programmatic';
}

/**
 * Slide loading events
 */
export interface SlideLoadedEvent extends DomainEvent {
  readonly type: 'slide-loaded';
  readonly slideId: string;
  readonly loadTime: number;
}

export interface SlideErrorEvent extends DomainEvent {
  readonly type: 'slide-error';
  readonly slideId: string;
  readonly error: SliderError;
}

/**
 * Playback events
 */
export interface PlaybackStartedEvent extends DomainEvent {
  readonly type: 'playback-started';
  readonly trigger: 'user' | 'autoplay';
}

export interface PlaybackStoppedEvent extends DomainEvent {
  readonly type: 'playback-stopped';
  readonly trigger: 'user' | 'error' | 'end';
}

/**
 * Union type of all domain events
 */
export type SliderDomainEvent =
  | SlideChangedEvent
  | SlideLoadedEvent
  | SlideErrorEvent
  | PlaybackStartedEvent
  | PlaybackStoppedEvent;
