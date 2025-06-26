import type {
  ISliderController,
  InputConfig,
  InputCallbacks,
} from '../core/types';
import {
  DEFAULT_INPUT_CONFIG,
  PHYSICS,
  EVENT_NAMES,
  HTML_TAGS,
  HTML_ATTRIBUTES,
  KEYBOARD_KEYS,
} from '../core';

/**
 * SliderController - Input handling for mouse, touch, and keyboard
 *
 * Extracted from main branch useMouseDrag.ts and optimized for performance.
 * Handles all user interactions with smooth gesture recognition.
 *
 * Key Features:
 * - Mouse and touch support with unified API
 * - Swipe gesture detection with velocity calculation
 * - Keyboard navigation (arrow keys, WASD)
 * - Configurable thresholds and sensitivity
 * - Performance-optimized event handling
 * - Passive event listeners where possible
 *
 * @example
 * ```typescript
 * const controller = new SliderController();
 * controller.initialize(element, {
 *   onSwipeLeft: () => nextSlide(),
 *   onSwipeRight: () => prevSlide()
 * });
 * ```
 */
export class SliderController implements ISliderController {
  private config: InputConfig = DEFAULT_INPUT_CONFIG;

  private callbacks: InputCallbacks | null = null;
  private element: HTMLElement | null = null;
  private isEnabled = false;

  // Touch/Mouse state
  private isPointerDown = false;
  private startX = 0;
  private startY = 0;
  private currentX = 0;
  private currentY = 0;
  private startTime = 0;

  // Event listeners for cleanup
  private boundHandlers = new Map<string, EventListener>();

  /**
   * Initialize input handling on target element
   */
  initialize(element: HTMLElement, callbacks: InputCallbacks): void {
    this.element = element;
    this.callbacks = callbacks;

    this.setupEventListeners();
    this.enable();
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
   * Set input configuration
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
   * Destroy input controller and cleanup
   */
  destroy(): void {
    this.removeEventListeners();
    this.element = null;
    this.callbacks = null;
    this.isEnabled = false;
  }

  /**
   * Setup all event listeners with proper options
   */
  private setupEventListeners(): void {
    if (!this.element) return;

    // Mouse events
    if (this.config.enableMouse) {
      this.addEventListenerWithCleanup(EVENT_NAMES.MOUSE_DOWN, (e) =>
        this.handlePointerStart(e as MouseEvent)
      );
      this.addEventListenerWithCleanup(
        EVENT_NAMES.MOUSE_MOVE,
        (e) => this.handlePointerMove(e as MouseEvent),
        { passive: true }
      );
      this.addEventListenerWithCleanup(EVENT_NAMES.MOUSE_UP, (e) =>
        this.handlePointerEnd(e as MouseEvent)
      );
      this.addEventListenerWithCleanup(EVENT_NAMES.MOUSE_LEAVE, (e) =>
        this.handlePointerEnd(e as MouseEvent)
      );
    }

    // Touch events
    if (this.config.enableTouch) {
      this.addEventListenerWithCleanup(
        EVENT_NAMES.TOUCH_START,
        (e) => this.handleTouchStart(e as TouchEvent),
        { passive: false }
      );
      this.addEventListenerWithCleanup(
        EVENT_NAMES.TOUCH_MOVE,
        (e) => this.handleTouchMove(e as TouchEvent),
        { passive: true }
      );
      this.addEventListenerWithCleanup(EVENT_NAMES.TOUCH_END, (e) =>
        this.handleTouchEnd(e as TouchEvent)
      );
      this.addEventListenerWithCleanup(EVENT_NAMES.TOUCH_CANCEL, (e) =>
        this.handleTouchEnd(e as TouchEvent)
      );
    }

    // Keyboard events (on document for global access)
    if (this.config.enableKeyboard) {
      const keyHandler = (e: Event): void =>
        this.handleKeyDown(e as KeyboardEvent);
      document.addEventListener(EVENT_NAMES.KEY_DOWN, keyHandler);
      this.boundHandlers.set(EVENT_NAMES.KEY_DOWN, keyHandler);
    }

    // Prevent context menu on touch devices
    this.addEventListenerWithCleanup(
      EVENT_NAMES.CONTEXT_MENU,
      (e: Event): void => {
        e.preventDefault();
      }
    );
  }

  /**
   * Remove all event listeners
   */
  private removeEventListeners(): void {
    if (!this.element) return;

    // Remove element events
    this.boundHandlers.forEach((handler, event) => {
      if (event === EVENT_NAMES.KEY_DOWN) {
        document.removeEventListener(event, handler);
      } else {
        this.element!.removeEventListener(event, handler);
      }
    });

    this.boundHandlers.clear();
  }

  /**
   * Helper to add event listener with cleanup tracking
   */
  private addEventListenerWithCleanup(
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions
  ): void {
    if (!this.element) return;

    this.element.addEventListener(event, handler, options);
    this.boundHandlers.set(event, handler);
  }

  /**
   * Handle mouse down events
   */
  private handlePointerStart(e: MouseEvent): void {
    if (!this.isEnabled || !this.callbacks) return;

    this.isPointerDown = true;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.currentX = e.clientX;
    this.currentY = e.clientY;
    this.startTime = performance.now();

    this.callbacks.onDragStart(this.startX, this.startY);

    // Prevent text selection
    e.preventDefault();
  }

  /**
   * Handle mouse move events
   */
  private handlePointerMove(e: MouseEvent): void {
    if (!this.isEnabled || !this.isPointerDown || !this.callbacks) return;

    const deltaX = e.clientX - this.currentX;
    const deltaY = e.clientY - this.currentY;

    this.currentX = e.clientX;
    this.currentY = e.clientY;

    this.callbacks.onDragMove(this.currentX, this.currentY, deltaX, deltaY);
  }

  /**
   * Handle mouse up events
   */
  private handlePointerEnd(_e: MouseEvent): void {
    if (!this.isEnabled || !this.isPointerDown || !this.callbacks) return;

    this.isPointerDown = false;

    const deltaX = this.currentX - this.startX;
    const deltaTime = performance.now() - this.startTime;

    // Calculate velocity for momentum
    const velocity = Math.abs(deltaX) / deltaTime;

    // Check for swipe gesture
    if (
      Math.abs(deltaX) > this.config.swipeThreshold &&
      velocity > PHYSICS.VELOCITY_THRESHOLD
    ) {
      if (deltaX > 0) {
        this.callbacks.onSwipeRight();
      } else {
        this.callbacks.onSwipeLeft();
      }
    }

    this.callbacks.onDragEnd(this.currentX, this.currentY);
  }

  /**
   * Handle touch start events
   */
  private handleTouchStart(e: TouchEvent): void {
    if (!this.isEnabled || !this.callbacks) return;

    // Only handle single touch
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    this.isPointerDown = true;
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.currentX = touch.clientX;
    this.currentY = touch.clientY;
    this.startTime = performance.now();

    this.callbacks.onDragStart(this.startX, this.startY);

    // Prevent scrolling on vertical swipes within threshold
    if (Math.abs(this.startY - touch.clientY) < this.config.dragThreshold) {
      e.preventDefault();
    }
  }

  /**
   * Handle touch move events
   */
  private handleTouchMove(e: TouchEvent): void {
    if (!this.isEnabled || !this.isPointerDown || !this.callbacks) return;

    if (e.touches.length !== 1) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - this.currentX;
    const deltaY = touch.clientY - this.currentY;

    this.currentX = touch.clientX;
    this.currentY = touch.clientY;

    this.callbacks.onDragMove(this.currentX, this.currentY, deltaX, deltaY);
  }

  /**
   * Handle touch end events
   */
  private handleTouchEnd(_e: TouchEvent): void {
    if (!this.isEnabled || !this.isPointerDown || !this.callbacks) return;

    this.isPointerDown = false;

    const deltaX = this.currentX - this.startX;
    const deltaTime = performance.now() - this.startTime;

    // Calculate velocity for momentum
    const velocity = Math.abs(deltaX) / deltaTime;

    // Check for swipe gesture
    if (
      Math.abs(deltaX) > this.config.swipeThreshold &&
      velocity > PHYSICS.VELOCITY_THRESHOLD
    ) {
      if (deltaX > 0) {
        this.callbacks.onSwipeRight();
      } else {
        this.callbacks.onSwipeLeft();
      }
    }

    this.callbacks.onDragEnd(this.currentX, this.currentY);
  }

  /**
   * Handle keyboard events
   */
  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.isEnabled || !this.callbacks) return;

    // Only handle if no input elements are focused
    const activeElement = document.activeElement;
    if (
      activeElement &&
      (activeElement.tagName === HTML_TAGS.INPUT ||
        activeElement.tagName === HTML_TAGS.TEXTAREA ||
        activeElement.tagName === HTML_TAGS.SELECT ||
        activeElement.getAttribute(HTML_ATTRIBUTES.CONTENT_EDITABLE) ===
          HTML_ATTRIBUTES.TRUE)
    ) {
      return;
    }

    switch (e.key) {
      case KEYBOARD_KEYS.ARROW_LEFT:
      case 'a':
      case 'A':
        this.callbacks.onKeyLeft();
        e.preventDefault();
        break;
      case KEYBOARD_KEYS.ARROW_RIGHT:
      case 'd':
      case 'D':
        this.callbacks.onKeyRight();
        e.preventDefault();
        break;
    }
  }
}
