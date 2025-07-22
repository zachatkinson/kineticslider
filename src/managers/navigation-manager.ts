/**
 * @fileoverview NavigationManager for KineticSlider
 *
 * Manages navigation coordination including keyboard, mouse, touch, gesture inputs,
 * slide transitions, validation, and accessibility features.
 *
 * @version 1.0.0
 */

import { SimpleEventEmitter } from '../core/event-emitter';
import { SLIDER_EVENTS } from '../core/constants';

/**
 * Navigation input types
 */
export enum NavigationInputType {
  KEYBOARD = 'keyboard',
  MOUSE = 'mouse',
  TOUCH = 'touch',
  GESTURE = 'gesture',
  API = 'api',
}

/**
 * Navigation direction
 */
export enum NavigationDirection {
  NEXT = 'next',
  PREVIOUS = 'previous',
  FIRST = 'first',
  LAST = 'last',
  DIRECT = 'direct',
}

/**
 * Navigation configuration options
 */
export interface NavigationConfig {
  /** Enable keyboard navigation */
  enableKeyboard: boolean;
  /** Enable mouse navigation */
  enableMouse: boolean;
  /** Enable touch navigation */
  enableTouch: boolean;
  /** Enable gesture navigation */
  enableGesture: boolean;
  /** Enable WASD keys for navigation */
  enableWASD: boolean;
  /** Enable Home/End keys for navigation */
  enableHomeEnd: boolean;
  /** Enable spacebar for play/pause toggle */
  enableSpacebarToggle: boolean;
  /** Enable escape key for emergency stop */
  enableEscapeStop: boolean;
  /** Prevent navigation during transitions */
  preventDuringTransition: boolean;
  /** Navigation debounce delay in milliseconds */
  debounceDelay: number;
  /** Enable accessibility announcements */
  enableA11yAnnouncements: boolean;
}

/**
 * Navigation request information
 */
export interface NavigationRequest {
  /** Target slide index or direction */
  target: number | NavigationDirection;
  /** Input type that triggered the navigation */
  inputType: NavigationInputType;
  /** Whether animation should be used */
  animated: boolean;
  /** Additional context data */
  context?: Record<string, unknown>;
  /** Timestamp when request was created */
  timestamp: number;
}

/**
 * Navigation result information
 */
export interface NavigationResult {
  /** Whether navigation was successful */
  success: boolean;
  /** Previous slide index */
  fromIndex: number;
  /** Target slide index */
  toIndex: number;
  /** Actual slide index after navigation */
  actualIndex: number;
  /** Navigation input type */
  inputType: NavigationInputType;
  /** Time taken for navigation */
  duration: number;
  /** Error message if navigation failed */
  error?: string;
}

/**
 * Slide bounds information
 */
export interface SlideBounds {
  /** Current slide index */
  currentIndex: number;
  /** Total number of slides */
  totalSlides: number;
  /** Whether at first slide */
  isAtFirst: boolean;
  /** Whether at last slide */
  isAtLast: boolean;
}

/**
 * Manages navigation coordination and input handling
 */
export class NavigationManager extends SimpleEventEmitter {
  private config: NavigationConfig;
  private isTransitioning = false;
  private currentIndex = 0;
  private totalSlides = 0;
  private lastNavigationTime = 0;
  private pendingNavigation: NavigationRequest | null = null;

  constructor(config: Partial<NavigationConfig> = {}) {
    super();

    this.config = {
      enableKeyboard: true,
      enableMouse: true,
      enableTouch: true,
      enableGesture: true,
      enableWASD: true,
      enableHomeEnd: true,
      enableSpacebarToggle: true,
      enableEscapeStop: true,
      preventDuringTransition: true,
      debounceDelay: 50,
      enableA11yAnnouncements: true,
      ...config,
    };
  }

  /**
   * Update slide bounds information
   */
  updateSlideBounds(currentIndex: number, totalSlides: number): void {
    const prevIndex = this.currentIndex;
    this.currentIndex = currentIndex;
    this.totalSlides = totalSlides;

    if (prevIndex !== currentIndex) {
      this.emit(SLIDER_EVENTS.NAVIGATION_BOUNDS_UPDATED, {
        currentIndex,
        totalSlides,
        previousIndex: prevIndex,
        bounds: this.getSlideBounds(),
      });
    }
  }

  /**
   * Update transition state
   */
  updateTransitionState(isTransitioning: boolean): void {
    const wasTransitioning = this.isTransitioning;
    this.isTransitioning = isTransitioning;

    if (wasTransitioning && !isTransitioning) {
      // Transition completed - process any pending navigation
      if (this.pendingNavigation) {
        const pending = this.pendingNavigation;
        this.pendingNavigation = null;

        this.emit(SLIDER_EVENTS.NAVIGATION_DEFERRED_EXECUTED, {
          request: pending,
        });
      }
    }

    this.emit(SLIDER_EVENTS.NAVIGATION_TRANSITION_STATE_CHANGED, {
      isTransitioning,
      wasTransitioning,
    });
  }

  /**
   * Request navigation to a specific slide or direction
   */
  requestNavigation(
    target: number | NavigationDirection,
    inputType: NavigationInputType,
    animated: boolean = true,
    context?: Record<string, unknown>
  ): NavigationRequest | null {
    const request: NavigationRequest = {
      target,
      inputType,
      animated,
      context,
      timestamp: Date.now(),
    };

    // Check debouncing
    if (this.shouldDebounce(request)) {
      return null;
    }

    // Check if navigation is currently allowed
    if (!this.isNavigationAllowed(request)) {
      if (this.config.preventDuringTransition && this.isTransitioning) {
        // Store for later execution
        this.pendingNavigation = request;
        this.emit(SLIDER_EVENTS.NAVIGATION_DEFERRED, { request });
      } else {
        this.emit(SLIDER_EVENTS.NAVIGATION_BLOCKED, {
          request,
          reason: 'Navigation not allowed',
        });
      }
      return null;
    }

    // Validate and process the request
    const validatedRequest = this.validateNavigationRequest(request);
    if (!validatedRequest) {
      return null;
    }

    this.lastNavigationTime = request.timestamp;
    this.emit(SLIDER_EVENTS.NAVIGATION_REQUESTED, {
      request: validatedRequest,
    });

    return validatedRequest;
  }

  /**
   * Handle keyboard navigation input
   */
  handleKeyboardInput(
    key: string,
    context?: Record<string, unknown>
  ): NavigationRequest | null {
    if (!this.config.enableKeyboard) {
      return null;
    }

    let target: number | NavigationDirection | null = null;

    switch (key) {
      case 'ArrowRight':
        target = NavigationDirection.NEXT;
        break;
      case 'ArrowLeft':
        target = NavigationDirection.PREVIOUS;
        break;
      case 'Home':
        if (this.config.enableHomeEnd) {
          target = NavigationDirection.FIRST;
        }
        break;
      case 'End':
        if (this.config.enableHomeEnd) {
          target = NavigationDirection.LAST;
        }
        break;
      case 'KeyD':
      case 'KeyS':
        if (this.config.enableWASD) {
          target = NavigationDirection.NEXT;
        }
        break;
      case 'KeyA':
      case 'KeyW':
        if (this.config.enableWASD) {
          target = NavigationDirection.PREVIOUS;
        }
        break;
      case 'Space':
        if (this.config.enableSpacebarToggle) {
          this.emit(SLIDER_EVENTS.NAVIGATION_PLAY_PAUSE_REQUESTED, {
            inputType: NavigationInputType.KEYBOARD,
            context,
          });
          return null;
        }
        break;
      case 'Escape':
        if (this.config.enableEscapeStop) {
          this.emit(SLIDER_EVENTS.NAVIGATION_EMERGENCY_STOP_REQUESTED, {
            inputType: NavigationInputType.KEYBOARD,
            context,
          });
          return null;
        }
        break;
    }

    if (target !== null) {
      return this.requestNavigation(
        target,
        NavigationInputType.KEYBOARD,
        true,
        context
      );
    }

    return null;
  }

  /**
   * Handle mouse navigation input
   */
  handleMouseInput(
    action: 'click' | 'wheel',
    data: Record<string, unknown>
  ): NavigationRequest | null {
    if (!this.config.enableMouse) {
      return null;
    }

    let target: number | NavigationDirection | null = null;

    switch (action) {
      case 'click':
        if (typeof data.targetIndex === 'number') {
          target = data.targetIndex;
        } else if (data.direction === 'next') {
          target = NavigationDirection.NEXT;
        } else if (data.direction === 'previous') {
          target = NavigationDirection.PREVIOUS;
        }
        break;
      case 'wheel':
        if (typeof data.deltaY === 'number') {
          target =
            data.deltaY > 0
              ? NavigationDirection.NEXT
              : NavigationDirection.PREVIOUS;
        }
        break;
    }

    if (target !== null) {
      return this.requestNavigation(target, NavigationInputType.MOUSE, true, {
        action,
        ...data,
      });
    }

    return null;
  }

  /**
   * Handle touch/gesture navigation input
   */
  handleTouchInput(
    gesture: 'swipe' | 'tap' | 'pinch',
    data: Record<string, unknown>
  ): NavigationRequest | null {
    const inputType =
      gesture === 'swipe'
        ? NavigationInputType.GESTURE
        : NavigationInputType.TOUCH;

    if (
      (!this.config.enableTouch && inputType === NavigationInputType.TOUCH) ||
      (!this.config.enableGesture && inputType === NavigationInputType.GESTURE)
    ) {
      return null;
    }

    let target: number | NavigationDirection | null = null;

    switch (gesture) {
      case 'swipe':
        if (data.direction === 'left') {
          target = NavigationDirection.NEXT;
        } else if (data.direction === 'right') {
          target = NavigationDirection.PREVIOUS;
        }
        break;
      case 'tap':
        if (typeof data.targetIndex === 'number') {
          target = data.targetIndex;
        }
        break;
      case 'pinch':
        // Pinch gestures might be used for zoom, but we'll emit a custom event
        this.emit(SLIDER_EVENTS.NAVIGATION_PINCH_GESTURE, {
          inputType,
          data,
        });
        return null;
    }

    if (target !== null) {
      return this.requestNavigation(target, inputType, true, {
        gesture,
        ...data,
      });
    }

    return null;
  }

  /**
   * Resolve navigation direction to specific index
   * Note: For navigation directions that would go out of bounds, returns the target
   * anyway so that LoopManager can handle the looping logic during integration
   */
  resolveNavigationTarget(target: number | NavigationDirection): number | null {
    if (typeof target === 'number') {
      // Reject obviously invalid direct indices (negative or non-integer)
      if (!Number.isInteger(target) || target < 0) {
        return null;
      }

      // Allow direct indices that are out of bounds for LoopManager handling
      return target;
    }

    switch (target) {
      case NavigationDirection.NEXT:
        return this.currentIndex + 1; // Allow out-of-bounds for LoopManager
      case NavigationDirection.PREVIOUS:
        return this.currentIndex - 1; // Allow out-of-bounds for LoopManager
      case NavigationDirection.FIRST:
        return 0;
      case NavigationDirection.LAST:
        return this.totalSlides > 0 ? this.totalSlides - 1 : 0;
      default:
        return null;
    }
  }

  /**
   * Validate slide index
   */
  validateSlideIndex(index: number): boolean {
    return Number.isInteger(index) && index >= 0 && index < this.totalSlides;
  }

  /**
   * Check if navigation is currently allowed
   */
  private isNavigationAllowed(_request: NavigationRequest): boolean {
    if (this.config.preventDuringTransition && this.isTransitioning) {
      return false;
    }

    if (this.totalSlides <= 1) {
      return false;
    }

    return true;
  }

  /**
   * Check if request should be debounced
   */
  private shouldDebounce(request: NavigationRequest): boolean {
    if (this.config.debounceDelay <= 0) {
      return false;
    }

    const timeSinceLastNavigation = request.timestamp - this.lastNavigationTime;
    return timeSinceLastNavigation < this.config.debounceDelay;
  }

  /**
   * Validate and normalize navigation request
   */
  private validateNavigationRequest(
    request: NavigationRequest
  ): NavigationRequest | null {
    const targetIndex = this.resolveNavigationTarget(request.target);

    if (targetIndex === null) {
      this.emit(SLIDER_EVENTS.NAVIGATION_INVALID_TARGET, {
        request,
        reason: 'Invalid navigation target',
      });
      return null;
    }

    // For direct index navigation, check if it's the same as current
    if (
      typeof request.target === 'number' &&
      targetIndex === this.currentIndex
    ) {
      this.emit(SLIDER_EVENTS.NAVIGATION_NO_CHANGE, {
        request,
        currentIndex: this.currentIndex,
      });
      return null;
    }

    // For out-of-bounds navigation (like next from last slide), allow it
    // The LoopManager or actual navigation handler will determine what to do

    // Return normalized request with resolved target
    return {
      ...request,
      target: targetIndex,
    };
  }

  /**
   * Get current slide bounds information
   */
  getSlideBounds(): SlideBounds {
    return {
      currentIndex: this.currentIndex,
      totalSlides: this.totalSlides,
      isAtFirst: this.currentIndex === 0,
      isAtLast: this.currentIndex === this.totalSlides - 1,
    };
  }

  /**
   * Update navigation configuration
   */
  updateConfig(updates: Partial<NavigationConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...updates };

    this.emit(SLIDER_EVENTS.NAVIGATION_CONFIG_UPDATED, {
      config: { ...this.config },
      oldConfig,
      changes: updates,
    });
  }

  /**
   * Get current navigation configuration
   */
  getConfig(): NavigationConfig {
    return { ...this.config };
  }

  /**
   * Create navigation result
   */
  createNavigationResult(
    success: boolean,
    fromIndex: number,
    toIndex: number,
    actualIndex: number,
    inputType: NavigationInputType,
    startTime: number,
    error?: string
  ): NavigationResult {
    const result: NavigationResult = {
      success,
      fromIndex,
      toIndex,
      actualIndex,
      inputType,
      duration: Date.now() - startTime,
      error,
    };

    // Emit accessibility announcement if enabled
    if (this.config.enableA11yAnnouncements && success) {
      this.emit(SLIDER_EVENTS.NAVIGATION_A11Y_ANNOUNCE, {
        announcement: `Navigated to slide ${actualIndex + 1} of ${this.totalSlides}`,
        slideIndex: actualIndex,
        totalSlides: this.totalSlides,
      });
    }

    return result;
  }

  /**
   * Get navigation statistics
   */
  getNavigationStats(): {
    currentIndex: number;
    totalSlides: number;
    isTransitioning: boolean;
    canNavigateNext: boolean;
    canNavigatePrevious: boolean;
    hasPendingNavigation: boolean;
    config: NavigationConfig;
  } {
    return {
      currentIndex: this.currentIndex,
      totalSlides: this.totalSlides,
      isTransitioning: this.isTransitioning,
      canNavigateNext: this.currentIndex < this.totalSlides - 1,
      canNavigatePrevious: this.currentIndex > 0,
      hasPendingNavigation: this.pendingNavigation !== null,
      config: { ...this.config },
    };
  }

  /**
   * Reset navigation state
   */
  reset(): void {
    this.currentIndex = 0;
    this.totalSlides = 0;
    this.isTransitioning = false;
    this.lastNavigationTime = 0;
    this.pendingNavigation = null;

    this.emit(SLIDER_EVENTS.NAVIGATION_RESET);
  }

  /**
   * Destroy the manager and cleanup resources
   */
  destroy(): void {
    // Emit destroy event before cleanup
    this.emit(SLIDER_EVENTS.NAVIGATION_DESTROYED);

    this.reset();
    this.removeAllListeners();
  }
}
