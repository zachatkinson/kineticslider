/**
 * @fileoverview AccessibilityManager - Central coordination hub for accessibility
 *
 * Coordinates all accessibility features including ARIA attributes, keyboard navigation,
 * screen reader support, and motion preferences. Follows WCAG 2.1 AA compliance standards.
 *
 * @version 1.0.0
 */

import { SimpleEventEmitter } from '../core/event-emitter';
import { SLIDER_EVENTS } from '../core/constants';
import type { AccessibilityConfig, ISliderEngine } from '../core/types';
import { ScreenReaderSupport } from './screen-reader-support';
import { KeyboardNavigator } from '../input/keyboard-navigator';
import { MotionPreferences } from './motion-preferences';
import { FocusManager } from './focus-manager';
import { debugLogger } from '../utils/debug-logger';

/**
 * Accessibility event data
 */
export interface AccessibilityEvent {
  type: string;
  data?: unknown;
  timestamp: number;
}

/**
 * ARIA attribute configuration
 */
interface ARIAAttributes {
  role?: string;
  'aria-label'?: string;
  'aria-live'?: 'polite' | 'assertive' | 'off';
  'aria-atomic'?: 'true' | 'false';
  'aria-relevant'?: string;
  'aria-current'?:
    | 'true'
    | 'false'
    | 'page'
    | 'step'
    | 'location'
    | 'date'
    | 'time';
  'aria-roledescription'?: string;
  'aria-valuenow'?: string;
  'aria-valuemin'?: string;
  'aria-valuemax'?: string;
  'aria-valuetext'?: string;
  'aria-controls'?: string;
  'aria-describedby'?: string;
  'aria-hidden'?: 'true' | 'false';
  tabindex?: string;
}

/**
 * Central accessibility management hub
 */
export class AccessibilityManager extends SimpleEventEmitter {
  private config: AccessibilityConfig;
  private container: HTMLElement | null = null;
  private engine: ISliderEngine | null = null;

  // Sub-managers
  private screenReaderSupport: ScreenReaderSupport | null = null;
  private keyboardNavigator: KeyboardNavigator | null = null;
  private motionPreferences: MotionPreferences | null = null;
  private focusManager: FocusManager | null = null;

  // State
  private isInitialized = false;
  private currentSlideIndex = 0;
  private totalSlides = 0;

  // ARIA elements
  private liveRegion: HTMLElement | null = null;
  private slideListElement: HTMLElement | null = null;

  constructor(config: AccessibilityConfig = {}) {
    super();

    // Default configuration
    this.config = {
      screenReader: true,
      keyboardNavigation: true,
      highContrast: false,
      reduceMotion: false,
      focusManagement: {
        autoFocus: true,
        trapFocus: false,
        outlineStyle: '2px solid #0066cc',
      },
      ariaLabels: {
        sliderLabel: 'Image carousel',
        previousButton: 'Previous slide',
        nextButton: 'Next slide',
        playPauseButton: 'Play/Pause slideshow',
        slideLabel: 'Slide {index} of {total}',
      },
      ...config,
    };

    debugLogger.info(
      'Initialized with config',
      'AccessibilityManager',
      this.config
    );
  }

  /**
   * Initialize accessibility features
   */
  async initialize(
    container: HTMLElement,
    engine: ISliderEngine
  ): Promise<void> {
    if (this.isInitialized) {
      debugLogger.warn('AccessibilityManager', 'Already initialized');
      return;
    }

    this.container = container;
    this.engine = engine;

    // Debug log container details
    debugLogger.info(
      'AccessibilityManager',
      `Initializing with container: ${container?.tagName || 'null'}, data-testid: ${container?.getAttribute('data-testid') || 'none'}, id: ${container?.id || 'none'}, className: ${container?.className || 'none'}`
    );

    try {
      // Setup ARIA attributes
      this.setupARIA(container);

      // Initialize sub-managers if enabled
      if (this.config.screenReader) {
        this.screenReaderSupport = new ScreenReaderSupport(
          this.config.ariaLabels
        );
        await this.screenReaderSupport.initialize(container);
      }

      if (this.config.keyboardNavigation) {
        // Create keyboard callbacks that delegate to the engine
        // Note: Engine methods are async but KeyboardNavigator expects sync callbacks
        // We use fire-and-forget pattern to avoid blocking the UI
        const keyboardCallbacks = {
          onNext: (): void => {
            engine.nextSlide().catch((error) => {
              debugLogger.error('Failed to navigate to next slide:', error);
            });
          },
          onPrevious: (): void => {
            engine.previousSlide().catch((error) => {
              debugLogger.error('Failed to navigate to previous slide:', error);
            });
          },
          onFirst: (): void => {
            engine.goToSlide(0).catch((error) => {
              debugLogger.error('Failed to navigate to first slide:', error);
            });
          },
          onLast: (): void => {
            engine.goToSlide(engine.getTotalSlides() - 1).catch((error) => {
              debugLogger.error('Failed to navigate to last slide:', error);
            });
          },
          onTogglePlayPause: (): void => engine.togglePlayPause(),
          onGoToSlide: (index: number): void => {
            engine.goToSlide(index).catch((error) => {
              debugLogger.error(`Failed to navigate to slide ${index + 1}:`, error);
            });
          },
          onEscape: (): void => engine.handleEscape(),
        };

        this.keyboardNavigator = new KeyboardNavigator(
          container,
          keyboardCallbacks,
          {
            enableArrowKeys: true,
            enableTabNavigation: true,
            respectMotionPreferences: true,
            enableAnnouncements: false, // We handle announcements separately
          }
        );
      }

      if (this.config.reduceMotion || this.shouldRespectMotionPreferences()) {
        this.motionPreferences = new MotionPreferences();
        await this.motionPreferences.initialize();
      }

      if (this.config.focusManagement) {
        this.focusManager = new FocusManager(this.config.focusManagement);
        await this.focusManager.initialize(container);
      }

      // Setup event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      this.emit(SLIDER_EVENTS.ACCESSIBILITY_INITIALIZED);

      debugLogger.info('Initialization complete', 'AccessibilityManager');
    } catch (error) {
      debugLogger.error(
        'AccessibilityManager',
        'Initialization failed:',
        error
      );
      throw error;
    }
  }

  /**
   * Setup ARIA attributes on container
   */
  setupARIA(container: HTMLElement): void {
    if (!container) return;

    // Main container ARIA attributes
    const containerAttrs: ARIAAttributes = {
      role: 'region',
      'aria-label': this.config.ariaLabels?.sliderLabel || 'Image carousel',
      'aria-roledescription': 'carousel',
      tabindex: '0',
      // Add initial dynamic attributes that will be updated by announceSlideChange
      'aria-valuenow': '1',
      'aria-valuemin': '1',
      'aria-valuemax': '1', // Will be updated when we know total slides
      'aria-valuetext': 'Slide 1 of 1', // Will be updated when we know total slides
    };

    this.applyARIAAttributes(container, containerAttrs);

    // Force immediate verification that attributes were actually set
    const verification = {
      role: container.getAttribute('role'),
      'aria-label': container.getAttribute('aria-label'),
      tabindex: container.getAttribute('tabindex'),
      'data-testid': container.getAttribute('data-testid'),
    };
    debugLogger.info(
      'AccessibilityManager',
      'setupARIA verification after applying attributes:',
      verification
    );

    // Create slide list container if it doesn't exist
    this.slideListElement = container.querySelector(
      '[role="list"]'
    ) as HTMLElement;
    if (!this.slideListElement) {
      this.slideListElement = document.createElement('div');
      this.slideListElement.className = 'kinetic-slider__slides';
      const listAttrs: ARIAAttributes = {
        role: 'list',
        'aria-label': 'Slides',
      };
      this.applyARIAAttributes(this.slideListElement, listAttrs);
      container.appendChild(this.slideListElement);
    }

    // Create live region for announcements
    this.liveRegion = container.querySelector('[aria-live]') as HTMLElement;
    if (!this.liveRegion) {
      this.liveRegion = document.createElement('div');
      this.liveRegion.className = 'kinetic-slider__live-region sr-only';
      const liveRegionAttrs: ARIAAttributes = {
        'aria-live': 'polite',
        'aria-atomic': 'true',
        'aria-relevant': 'additions text',
        role: 'status',
      };
      this.applyARIAAttributes(this.liveRegion, liveRegionAttrs);

      // Apply screen reader only styles
      this.liveRegion.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      `;

      container.appendChild(this.liveRegion);
    }

    debugLogger.info('ARIA attributes setup complete', 'AccessibilityManager');
  }

  /**
   * Handle keyboard navigation
   */
  handleKeyboardNavigation(event: KeyboardEvent): void {
    // The KeyboardNavigator handles its own events through its event listeners
    // We just emit the accessibility event here
    this.emit(SLIDER_EVENTS.ACCESSIBILITY_KEYBOARD_EVENT, {
      key: event.key,
      code: event.code,
      handled: !event.defaultPrevented,
    });
  }

  /**
   * Announce slide change to screen readers
   */
  announceSlideChange(index: number, total: number): void {
    debugLogger.info(
      'AccessibilityManager',
      `announceSlideChange called: index=${index}, total=${total}, initialized=${this.isInitialized}, container exists=${!!this.container}`
    );

    this.currentSlideIndex = index;
    this.totalSlides = total;

    // Update keyboard navigator state if it exists
    if (this.keyboardNavigator) {
      this.keyboardNavigator.setCurrentSlide(index);
      this.keyboardNavigator.setTotalSlides(total);
    }

    // Update ARIA attributes
    this.updateSlideARIA(index, total);

    // Announce via screen reader support
    if (this.screenReaderSupport) {
      const slideLabel = this.formatSlideLabel(index + 1, total);
      this.screenReaderSupport.announce(slideLabel, 'polite');
    }

    // Update live region
    if (this.liveRegion) {
      const announcement = this.formatSlideLabel(index + 1, total);
      this.liveRegion.textContent = announcement;
    }

    // Emit event
    this.emit(SLIDER_EVENTS.ACCESSIBILITY_SLIDE_ANNOUNCED, {
      index,
      total,
      announcement: this.formatSlideLabel(index + 1, total),
    });
  }

  /**
   * Respect user motion preferences
   */
  respectMotionPreferences(): void {
    if (!this.motionPreferences) {
      this.motionPreferences = new MotionPreferences();
      this.motionPreferences.initialize();
    }

    const prefersReducedMotion = this.motionPreferences.prefersReducedMotion();

    if (prefersReducedMotion) {
      // Notify engine to use reduced motion
      this.engine?.emit(SLIDER_EVENTS.ACCESSIBILITY_MOTION_REDUCED, {
        reduced: true,
      });
    }

    debugLogger.info('Motion preferences updated', 'AccessibilityManager', {
      prefersReducedMotion,
    });
  }

  /**
   * Update ARIA attributes for current slide
   */
  private updateSlideARIA(index: number, total: number): void {
    if (!this.container) {
      debugLogger.warn(
        'AccessibilityManager',
        'updateSlideARIA called but container is null'
      );
      return;
    }

    debugLogger.info(
      'AccessibilityManager',
      `Updating ARIA attributes for slide ${index + 1} of ${total}`
    );

    // Update slides with aria-current
    const slides = this.container.querySelectorAll('[role="listitem"]');
    slides.forEach((slide, i) => {
      if (i === index) {
        slide.setAttribute('aria-current', 'true');
        slide.setAttribute('tabindex', '0');
      } else {
        slide.removeAttribute('aria-current');
        slide.setAttribute('tabindex', '-1');
      }
    });

    // Update container aria-valuenow
    const valueAttrs: ARIAAttributes = {
      'aria-valuenow': String(index + 1),
      'aria-valuemin': '1',
      'aria-valuemax': String(total),
      'aria-valuetext': this.formatSlideLabel(index + 1, total),
    };

    this.applyARIAAttributes(this.container, valueAttrs);

    // Verify attributes were set immediately after applying
    const verifyAria = {
      'aria-valuenow': this.container.getAttribute('aria-valuenow'),
      'aria-valuetext': this.container.getAttribute('aria-valuetext'),
      'aria-valuemin': this.container.getAttribute('aria-valuemin'),
      'aria-valuemax': this.container.getAttribute('aria-valuemax'),
    };

    debugLogger.info(
      'AccessibilityManager',
      `ARIA attributes verification:`,
      verifyAria
    );

    // Also check if this is the element tests are looking for
    const testId = this.container.getAttribute('data-testid');
    debugLogger.info(
      'AccessibilityManager',
      `Container test-id: ${testId}, attributes applied to: ${this.container.tagName}`
    );
  }

  /**
   * Format slide label for announcements
   */
  private formatSlideLabel(index: number, total: number): string {
    const template =
      this.config.ariaLabels?.slideLabel || 'Slide {index} of {total}';
    return template
      .replace('{index}', String(index))
      .replace('{total}', String(total));
  }

  /**
   * Apply ARIA attributes to element
   */
  private applyARIAAttributes(
    element: HTMLElement,
    attributes: ARIAAttributes
  ): void {
    const entries = Object.entries(attributes) as Array<
      [keyof ARIAAttributes, string]
    >;
    entries.forEach(([key, value]) => {
      if (value !== undefined) {
        element.setAttribute(key, value);
      }
    });
  }

  /**
   * Check if should respect motion preferences
   */
  private shouldRespectMotionPreferences(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.engine || !this.container) return;

    // Listen for slider state changes
    this.engine.on(SLIDER_EVENTS.SLIDE_CHANGED, (...args: unknown[]) => {
      const data = args[0] as { currentIndex: number; previousIndex: number };
      if (data && typeof data.currentIndex === 'number') {
        this.announceSlideChange(
          data.currentIndex,
          this.engine!.getTotalSlides()
        );
      }
    });

    // Listen for play state changes
    this.engine.on(SLIDER_EVENTS.PLAY_STATE_CHANGED, (...args: unknown[]) => {
      const data = args[0] as { isPlaying: boolean };
      if (data && typeof data.isPlaying === 'boolean') {
        // Update keyboard navigator state if it exists
        if (this.keyboardNavigator) {
          this.keyboardNavigator.setPlayingState(data.isPlaying);
        }

        // Announce to screen readers
        if (this.screenReaderSupport) {
          const message = data.isPlaying
            ? 'Slideshow playing'
            : 'Slideshow paused';
          this.screenReaderSupport.announce(message, 'polite');
        }
      }
    });

    // Note: KeyboardNavigator handles its own keyboard events
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...config };

    // Update sub-managers if needed
    if (this.screenReaderSupport && config.ariaLabels) {
      this.screenReaderSupport.updateLabels(config.ariaLabels);
    }

    if (this.focusManager && config.focusManagement) {
      this.focusManager.updateConfig(config.focusManagement);
    }

    debugLogger.info(
      'Configuration updated',
      'AccessibilityManager',
      this.config
    );
  }

  /**
   * Get current configuration
   */
  getConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  /**
   * Check if accessibility is enabled
   */
  isEnabled(): boolean {
    return this.isInitialized;
  }

  /**
   * Enable specific accessibility feature
   */
  enableFeature(feature: keyof AccessibilityConfig): void {
    if (feature === 'screenReader') {
      this.config = { ...this.config, screenReader: true };
      this.emit(SLIDER_EVENTS.ACCESSIBILITY_FEATURE_ENABLED, { feature });
    } else if (feature === 'keyboardNavigation') {
      this.config = { ...this.config, keyboardNavigation: true };
      this.emit(SLIDER_EVENTS.ACCESSIBILITY_FEATURE_ENABLED, { feature });
    } else if (feature === 'highContrast') {
      this.config = { ...this.config, highContrast: true };
      this.emit(SLIDER_EVENTS.ACCESSIBILITY_FEATURE_ENABLED, { feature });
    } else if (feature === 'reduceMotion') {
      this.config = { ...this.config, reduceMotion: true };
      this.emit(SLIDER_EVENTS.ACCESSIBILITY_FEATURE_ENABLED, { feature });
    }
  }

  /**
   * Disable specific accessibility feature
   */
  disableFeature(feature: keyof AccessibilityConfig): void {
    if (feature === 'screenReader') {
      this.config = { ...this.config, screenReader: false };
      this.emit(SLIDER_EVENTS.ACCESSIBILITY_FEATURE_DISABLED, { feature });
    } else if (feature === 'keyboardNavigation') {
      this.config = { ...this.config, keyboardNavigation: false };
      this.emit(SLIDER_EVENTS.ACCESSIBILITY_FEATURE_DISABLED, { feature });
    } else if (feature === 'highContrast') {
      this.config = { ...this.config, highContrast: false };
      this.emit(SLIDER_EVENTS.ACCESSIBILITY_FEATURE_DISABLED, { feature });
    } else if (feature === 'reduceMotion') {
      this.config = { ...this.config, reduceMotion: false };
      this.emit(SLIDER_EVENTS.ACCESSIBILITY_FEATURE_DISABLED, { feature });
    }
  }

  /**
   * Destroy the accessibility manager
   */
  destroy(): void {
    debugLogger.info('Destroying...', 'AccessibilityManager');

    // Note: KeyboardNavigator handles its own cleanup

    // Destroy sub-managers
    this.screenReaderSupport?.destroy();
    this.keyboardNavigator?.destroy();
    this.motionPreferences?.destroy();
    this.focusManager?.destroy();

    // Clean up ARIA elements
    this.liveRegion?.remove();

    // Reset state
    this.container = null;
    this.engine = null;
    this.screenReaderSupport = null;
    this.keyboardNavigator = null;
    this.motionPreferences = null;
    this.focusManager = null;
    this.isInitialized = false;

    // Remove all listeners
    this.removeAllListeners();

    this.emit(SLIDER_EVENTS.ACCESSIBILITY_DESTROYED);
  }
}
