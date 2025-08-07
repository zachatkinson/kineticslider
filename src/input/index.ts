/**
 * @fileoverview Enhanced Input Handling System
 *
 * @version 1.0.0
 */

import type {
  ISliderController,
  InputConfig,
  InputCallbacks,
} from '../core/types';
import { KeyboardNavigator, KeyboardCallbacks } from './keyboard-navigator';

/**
 * Enhanced SliderController integrating world-class GSAP physics engine
 */
export class SliderController implements ISliderController {
  private element: HTMLElement | null = null;
  private callbacks: InputCallbacks | null = null;
  private config: InputConfig = {
    enableMouse: true,
    enableTouch: true,
    enableKeyboard: true,
    swipeThreshold: 50,
    dragThreshold: 10,
  };
  private isEnabled = false;

  // Enhanced input components
  private keyboardNavigator: KeyboardNavigator | null = null;
  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private totalSlides = 0;

  /**
   * Initialize enhanced input handling on target element
   */
  initialize(element: HTMLElement, callbacks: InputCallbacks): void {
    this.element = element;
    this.callbacks = callbacks;

    // Initialize enhanced components
    this.setupKeyboardNavigator();
    this.setupMouseAndTouchEvents();

    this.enable();
  }

  /**
   * Setup accessible keyboard navigation
   * Only enabled if accessibility manager is not handling keyboard navigation
   */
  private setupKeyboardNavigator(): void {
    if (!this.element || !this.callbacks || !this.config.enableKeyboard) return;

    const keyboardCallbacks: KeyboardCallbacks = {
      onNext: () => this.callbacks?.onKeyRight(), // Next slide (right arrow)
      onPrevious: () => this.callbacks?.onKeyLeft(), // Previous slide (left arrow)
      onFirst: () => {
        // Go to first slide (index 0)
        if (this.callbacks?.onGoToSlide) {
          this.callbacks.onGoToSlide(0);
        }
      },
      onLast: () => {
        // Go to last slide (totalSlides - 1)
        if (this.callbacks?.onGoToSlide && this.totalSlides > 0) {
          this.callbacks.onGoToSlide(this.totalSlides - 1);
        }
      },
      onTogglePlayPause: () => {
        // Delegate to input callbacks which connect to SliderEngine
        if (this.callbacks?.onTogglePlayPause) {
          this.callbacks.onTogglePlayPause();
        }
      },
      onGoToSlide: (index: number) => {
        // Delegate to input callbacks which connect to SliderEngine
        if (this.callbacks?.onGoToSlide) {
          this.callbacks.onGoToSlide(index);
        }
      },
      onEscape: () => {
        // Delegate to input callbacks which connect to SliderEngine
        if (this.callbacks?.onEscape) {
          this.callbacks.onEscape();
        }
      },
    };

    this.keyboardNavigator = new KeyboardNavigator(
      this.element,
      keyboardCallbacks,
      {
        enableArrowKeys: this.config.enableKeyboard,
        enableWASD: this.config.enableKeyboard,
        respectMotionPreferences: true,
        enableAnnouncements: true, // KeyboardNavigator handles its own accessibility
      }
    );
  }

  /**
   * Enable input handling
   */
  enable(): void {
    this.isEnabled = true;
  }

  /**
   * Disable input handling
   */
  disable(): void {
    this.isEnabled = false;
  }

  /**
   * Update input configuration
   */
  setInputConfig(config: Partial<InputConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current input configuration
   */
  getInputConfig(): InputConfig {
    return { ...this.config };
  }

  /**
   * Update slider state for accessibility
   */
  updateSlideState(currentIndex: number, totalSlides: number): void {
    this.totalSlides = totalSlides;
    if (this.keyboardNavigator) {
      this.keyboardNavigator.setCurrentSlide(currentIndex);
      this.keyboardNavigator.setTotalSlides(totalSlides);
    }
  }

  /**
   * Update play state
   */
  updatePlayState(isPlaying: boolean): void {
    if (this.keyboardNavigator) {
      this.keyboardNavigator.setPlayingState(isPlaying);
    }
  }

  /**
   * Setup mouse and touch event handling for gestures
   */
  private setupMouseAndTouchEvents(): void {
    if (!this.element || !this.callbacks) return;

    // Mouse events
    this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.element.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.element.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.element.addEventListener('mouseleave', this.handleMouseUp.bind(this));

    // Touch events - crucial for Mobile Safari
    this.element.addEventListener(
      'touchstart',
      this.handleTouchStart.bind(this),
      { passive: false }
    );
    this.element.addEventListener(
      'touchmove',
      this.handleTouchMove.bind(this),
      { passive: false }
    );
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this));
    this.element.addEventListener(
      'touchcancel',
      this.handleTouchEnd.bind(this)
    );

    // Prevent default behaviors that might interfere
    this.element.addEventListener('contextmenu', (e) => e.preventDefault());
    this.element.addEventListener('selectstart', (e) => e.preventDefault());
    this.element.addEventListener('dragstart', (e) => e.preventDefault());
  }

  private handleMouseDown(event: MouseEvent): void {
    if (!this.isEnabled || !this.config.enableMouse) return;

    this.isDragging = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    event.preventDefault();
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.isDragging || !this.isEnabled || !this.config.enableMouse) return;

    const deltaX = event.clientX - this.startX;

    // Check if we've moved far enough to be considered a swipe
    if (Math.abs(deltaX) > this.config.swipeThreshold) {
      this.isDragging = false;

      if (deltaX > 0) {
        // Swipe right (previous slide)
        this.callbacks?.onSwipeRight();
      } else {
        // Swipe left (next slide)
        this.callbacks?.onSwipeLeft();
      }

      // Prevent default to avoid interference
      event.preventDefault();
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    this.isDragging = false;
    event.preventDefault();
  }

  private handleTouchStart(event: TouchEvent): void {
    if (!this.isEnabled || !this.config.enableTouch) return;

    const touch = event.touches[0];
    this.isDragging = true;
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    event.preventDefault();
  }

  private handleTouchMove(event: TouchEvent): void {
    if (!this.isDragging || !this.isEnabled || !this.config.enableTouch) return;

    const touch = event.touches[0];
    if (!touch) return;

    const deltaX = touch.clientX - this.startX;

    // Check if we've moved far enough to be considered a swipe
    if (Math.abs(deltaX) > this.config.swipeThreshold) {
      this.isDragging = false;

      if (deltaX > 0) {
        // Swipe right (previous slide)
        this.callbacks?.onSwipeRight();
      } else {
        // Swipe left (next slide)
        this.callbacks?.onSwipeLeft();
      }

      // Prevent default to stop any browser scrolling/navigation
      event.preventDefault();
      event.stopPropagation();
    }

    // Always prevent default for touchmove to avoid scrolling issues
    event.preventDefault();
  }

  private handleTouchEnd(event: TouchEvent): void {
    this.isDragging = false;
    event.preventDefault();
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Event listeners are handled by the individual components
    // (GestureRecognizer and KeyboardNavigator)
  }

  /**
   * Cleanup and destroy
   */
  destroy(): void {
    this.disable();

    // Clean up event listeners
    if (this.element) {
      this.element.removeEventListener(
        'mousedown',
        this.handleMouseDown.bind(this)
      );
      this.element.removeEventListener(
        'mousemove',
        this.handleMouseMove.bind(this)
      );
      this.element.removeEventListener(
        'mouseup',
        this.handleMouseUp.bind(this)
      );
      this.element.removeEventListener(
        'mouseleave',
        this.handleMouseUp.bind(this)
      );
      this.element.removeEventListener(
        'touchstart',
        this.handleTouchStart.bind(this)
      );
      this.element.removeEventListener(
        'touchmove',
        this.handleTouchMove.bind(this)
      );
      this.element.removeEventListener(
        'touchend',
        this.handleTouchEnd.bind(this)
      );
      this.element.removeEventListener(
        'touchcancel',
        this.handleTouchEnd.bind(this)
      );
    }

    if (this.keyboardNavigator) {
      this.keyboardNavigator.destroy();
      this.keyboardNavigator = null;
    }

    // Reset state
    this.element = null;
    this.callbacks = null;
    this.isEnabled = false;
    this.isDragging = false;
  }
}
