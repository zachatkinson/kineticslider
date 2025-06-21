/**
 * Service Layer Contracts
 *
 * These interfaces define the contracts for all services in our application.
 * They are implementation-agnostic and focus on behavior rather than implementation.
 */

import type {
  SliderConfig,
  SliderCapabilities,
  SliderDomainEvent,
  SliderError,
  SlideDimensions,
} from '../domain/models';

// ===== CORE SERVICES =====

/**
 * Manages slide loading, caching, and lifecycle
 */
export interface ISlideService {
  /**
   * Load a slide's content
   */
  loadSlide(slideId: string): Promise<void>;

  /**
   * Preload multiple slides
   */
  preloadSlides(slideIds: string[]): Promise<void>;

  /**
   * Check if a slide is loaded
   */
  isSlideLoaded(slideId: string): boolean;

  /**
   * Get slide loading progress (0-1)
   */
  getLoadingProgress(slideId: string): number;

  /**
   * Unload slide to free memory
   */
  unloadSlide(slideId: string): void;

  /**
   * Get slide content dimensions
   */
  getSlideDimensions(slideId: string): Promise<SlideDimensions>;
}

/**
 * Manages slider navigation and state transitions
 */
export interface INavigationService {
  /**
   * Navigate to a specific slide
   */
  goToSlide(
    index: number,
    trigger?: 'user' | 'autoplay' | 'programmatic'
  ): Promise<void>;

  /**
   * Navigate to next slide
   */
  nextSlide(trigger?: 'user' | 'autoplay'): Promise<void>;

  /**
   * Navigate to previous slide
   */
  previousSlide(trigger?: 'user'): Promise<void>;

  /**
   * Check if navigation is possible
   */
  canNavigate(direction: 'next' | 'previous'): boolean;

  /**
   * Get current slide index
   */
  getCurrentIndex(): number;

  /**
   * Get total number of slides
   */
  getTotalSlides(): number;
}

/**
 * Manages autoplay functionality
 */
export interface IAutoplayService {
  /**
   * Start autoplay
   */
  start(): void;

  /**
   * Stop autoplay
   */
  stop(): void;

  /**
   * Pause autoplay temporarily
   */
  pause(): void;

  /**
   * Resume autoplay
   */
  resume(): void;

  /**
   * Check if autoplay is active
   */
  isPlaying(): boolean;

  /**
   * Check if autoplay is paused
   */
  isPaused(): boolean;

  /**
   * Reset autoplay timer
   */
  reset(): void;
}

/**
 * Manages animations and transitions
 */
export interface IAnimationService {
  /**
   * Execute slide transition
   */
  executeTransition(
    fromIndex: number,
    toIndex: number,
    direction: 'forward' | 'backward'
  ): Promise<void>;

  /**
   * Check if animation is in progress
   */
  isAnimating(): boolean;

  /**
   * Cancel current animation
   */
  cancelAnimation(): void;

  /**
   * Set animation speed multiplier
   */
  setSpeed(multiplier: number): void;

  /**
   * Enable/disable reduced motion
   */
  setReducedMotion(enabled: boolean): void;
}

/**
 * Manages responsive behavior and layout
 */
export interface IResponsiveService {
  /**
   * Get current breakpoint
   */
  getCurrentBreakpoint(): string;

  /**
   * Get dimensions for current breakpoint
   */
  getCurrentDimensions(): SlideDimensions;

  /**
   * Check if viewport matches breakpoint
   */
  matchesBreakpoint(breakpoint: string): boolean;

  /**
   * Register breakpoint change listener
   */
  onBreakpointChange(callback: (breakpoint: string) => void): () => void;

  /**
   * Update slider dimensions
   */
  updateDimensions(dimensions: SlideDimensions): void;
}

// ===== INFRASTRUCTURE SERVICES =====

/**
 * Manages event publishing and subscription
 */
export interface IEventService {
  /**
   * Publish a domain event
   */
  publish<T extends SliderDomainEvent>(event: T): void;

  /**
   * Subscribe to domain events
   */
  subscribe<T extends SliderDomainEvent>(
    eventType: T['type'],
    handler: (event: T) => void
  ): () => void;

  /**
   * Subscribe to all events
   */
  subscribeAll(handler: (event: SliderDomainEvent) => void): () => void;

  /**
   * Clear all subscriptions
   */
  clear(): void;
}

/**
 * Manages logging throughout the application
 */
export interface ILoggerService {
  /**
   * Log debug information
   */
  debug(message: string, data?: unknown): void;

  /**
   * Log informational message
   */
  info(message: string, data?: unknown): void;

  /**
   * Log warning
   */
  warn(message: string, data?: unknown): void;

  /**
   * Log error
   */
  error(message: string, error?: Error | unknown): void;

  /**
   * Set log level
   */
  setLevel(level: 'debug' | 'info' | 'warn' | 'error'): void;

  /**
   * Create child logger with context
   */
  child(context: Record<string, unknown>): ILoggerService;
}

/**
 * Manages performance monitoring and metrics
 */
export interface IPerformanceService {
  /**
   * Start performance measurement
   */
  startMeasurement(name: string): void;

  /**
   * End performance measurement
   */
  endMeasurement(name: string): number;

  /**
   * Record custom metric
   */
  recordMetric(name: string, value: number, unit?: string): void;

  /**
   * Mark performance milestone
   */
  mark(name: string): void;

  /**
   * Get performance metrics
   */
  getMetrics(): Record<string, number>;

  /**
   * Clear all measurements
   */
  clear(): void;
}

/**
 * Manages error handling and recovery
 */
export interface IErrorService {
  /**
   * Handle and process errors
   */
  handleError(error: Error, context?: Record<string, unknown>): SliderError;

  /**
   * Check if error is recoverable
   */
  isRecoverable(error: SliderError): boolean;

  /**
   * Attempt error recovery
   */
  recover(error: SliderError): Promise<boolean>;

  /**
   * Report error to external service
   */
  reportError(error: SliderError): void;

  /**
   * Set error recovery strategy
   */
  setRecoveryStrategy(
    errorCode: string,
    strategy: (error: SliderError) => Promise<boolean>
  ): void;
}

// ===== OBSERVABILITY SERVICES =====

/**
 * Manages analytics and user behavior tracking
 */
export interface IAnalyticsService {
  /**
   * Track user interaction
   */
  trackInteraction(action: string, properties?: Record<string, unknown>): void;

  /**
   * Track slide view
   */
  trackSlideView(slideId: string, duration: number): void;

  /**
   * Track performance metric
   */
  trackPerformance(metric: string, value: number): void;

  /**
   * Track error occurrence
   */
  trackError(error: SliderError): void;

  /**
   * Set user properties
   */
  setUserProperties(properties: Record<string, unknown>): void;

  /**
   * Flush pending events
   */
  flush(): Promise<void>;
}

/**
 * Manages real user monitoring
 */
export interface IMonitoringService {
  /**
   * Start monitoring session
   */
  startSession(): void;

  /**
   * End monitoring session
   */
  endSession(): void;

  /**
   * Record page view
   */
  recordPageView(url: string): void;

  /**
   * Record user interaction
   */
  recordInteraction(element: string, action: string): void;

  /**
   * Record performance timing
   */
  recordTiming(name: string, duration: number): void;

  /**
   * Record error
   */
  recordError(error: Error, context?: Record<string, unknown>): void;

  /**
   * Set session properties
   */
  setSessionProperties(properties: Record<string, unknown>): void;
}

// ===== CAPABILITY DETECTION =====

/**
 * Detects browser and environment capabilities
 */
export interface ICapabilityService {
  /**
   * Detect all capabilities
   */
  detectCapabilities(): Promise<SliderCapabilities>;

  /**
   * Check specific capability
   */
  hasCapability(capability: keyof SliderCapabilities): boolean;

  /**
   * Get capability details
   */
  getCapabilityDetails(): Record<string, unknown>;

  /**
   * Update capabilities on environment change
   */
  updateCapabilities(): Promise<void>;
}

// ===== SERVICE REGISTRY =====

/**
 * Central registry for all services
 */
export interface IServiceRegistry {
  /**
   * Register a service
   */
  register<T>(key: string, service: T): void;

  /**
   * Get a service
   */
  get<T>(key: string): T;

  /**
   * Check if service is registered
   */
  has(key: string): boolean;

  /**
   * Unregister a service
   */
  unregister(key: string): void;

  /**
   * Clear all services
   */
  clear(): void;
}

// ===== SERVICE FACTORY =====

/**
 * Factory for creating service instances
 */
export interface IServiceFactory {
  /**
   * Create slide service
   */
  createSlideService(config: SliderConfig): ISlideService;

  /**
   * Create navigation service
   */
  createNavigationService(config: SliderConfig): INavigationService;

  /**
   * Create autoplay service
   */
  createAutoplayService(config: SliderConfig): IAutoplayService;

  /**
   * Create animation service
   */
  createAnimationService(config: SliderConfig): IAnimationService;

  /**
   * Create responsive service
   */
  createResponsiveService(config: SliderConfig): IResponsiveService;

  /**
   * Create all core services
   */
  createCoreServices(config: SliderConfig): {
    slideService: ISlideService;
    navigationService: INavigationService;
    autoplayService: IAutoplayService;
    animationService: IAnimationService;
    responsiveService: IResponsiveService;
  };
}
