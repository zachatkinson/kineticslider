/**
 * @fileoverview MotionPreferences - Motion preference handling
 *
 * Detects and respects user motion preferences (prefers-reduced-motion),
 * provides motion preference change listeners, and manages GSAP animation modifications.
 *
 * @version 1.0.0
 */

import { SimpleEventEmitter } from '../core/event-emitter';
import { SLIDER_EVENTS } from '../core/constants';
import { debugLogger } from '../utils/debug-logger';

/**
 * Motion preference settings
 */
export interface MotionPreferenceSettings {
  /** Current preference state */
  prefersReducedMotion: boolean;
  /** Whether real-time monitoring is enabled */
  monitorChanges: boolean;
  /** Duration scale factor for reduced motion (0-1) */
  durationScale?: number;
  /** Whether to disable auto-play with reduced motion */
  disableAutoPlay?: boolean;
  /** Alternative transition type for reduced motion */
  alternativeTransition?: 'fade' | 'none' | 'instant';
}

/**
 * Motion preference change event data
 */
interface MotionPreferenceChangeEvent {
  prefersReducedMotion: boolean;
  previousState: boolean;
  timestamp: number;
  source: 'initialization' | 'media-query-change' | 'manual';
}

/**
 * GSAP animation modification options
 */
interface AnimationModification {
  /** Scale factor for duration (0-1) */
  durationScale: number;
  /** Ease function override */
  ease?: string;
  /** Whether to disable the animation entirely */
  disable: boolean;
}

/**
 * Manages user motion preferences and animation modifications
 */
export class MotionPreferences extends SimpleEventEmitter {
  private mediaQuery: MediaQueryList | null = null;
  private settings: MotionPreferenceSettings;
  private isInitialized = false;

  constructor(initialSettings: Partial<MotionPreferenceSettings> = {}) {
    super();

    // Default settings
    this.settings = {
      prefersReducedMotion: false,
      monitorChanges: true,
      durationScale: 0.1, // 10% of original duration
      disableAutoPlay: true,
      alternativeTransition: 'fade',
      ...initialSettings,
    };
  }

  /**
   * Initialize motion preference detection
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      debugLogger.warn('MotionPreferences', 'Already initialized');
      return;
    }

    try {
      // Check if matchMedia is available
      if (typeof window === 'undefined' || !window.matchMedia) {
        debugLogger.warn('MotionPreferences', 'matchMedia not available');
        this.isInitialized = true;
        return;
      }

      // Create media query for reduced motion
      this.mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

      // Set initial state
      const initialState = this.settings.prefersReducedMotion;
      this.settings.prefersReducedMotion = this.mediaQuery.matches;

      // Emit initial state if changed
      if (initialState !== this.settings.prefersReducedMotion) {
        this.emitPreferenceChange(initialState, 'initialization');
      }

      // Setup monitoring if enabled
      if (this.settings.monitorChanges) {
        this.setupChangeMonitoring();
      }

      this.isInitialized = true;

      debugLogger.info('Initialized', 'MotionPreferences', {
        prefersReducedMotion: this.settings.prefersReducedMotion,
        monitorChanges: this.settings.monitorChanges,
      });
    } catch (error) {
      debugLogger.error('MotionPreferences', 'Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Setup media query change monitoring
   */
  private setupChangeMonitoring(): void {
    if (!this.mediaQuery) return;

    const handleChange = (event: MediaQueryListEvent): void => {
      const previousState = this.settings.prefersReducedMotion;
      this.settings.prefersReducedMotion = event.matches;

      debugLogger.info('Preference changed', 'MotionPreferences', {
        previous: previousState,
        current: this.settings.prefersReducedMotion,
      });

      this.emitPreferenceChange(previousState, 'media-query-change');
    };

    // Use modern addEventListener if available, fallback to deprecated addListener
    if (this.mediaQuery.addEventListener) {
      this.mediaQuery.addEventListener('change', handleChange);
    } else if (this.mediaQuery.addListener) {
      this.mediaQuery.addListener(handleChange);
    }
  }

  /**
   * Emit motion preference change event
   */
  private emitPreferenceChange(
    previousState: boolean,
    source: MotionPreferenceChangeEvent['source']
  ): void {
    const eventData: MotionPreferenceChangeEvent = {
      prefersReducedMotion: this.settings.prefersReducedMotion,
      previousState,
      timestamp: Date.now(),
      source,
    };

    this.emit(SLIDER_EVENTS.ACCESSIBILITY_MOTION_PREFERENCE_CHANGED, eventData);

    // Also emit the simplified event that's used by AccessibilityManager
    this.emit(SLIDER_EVENTS.ACCESSIBILITY_MOTION_REDUCED, {
      reduced: this.settings.prefersReducedMotion,
    });
  }

  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion(): boolean {
    return this.settings.prefersReducedMotion;
  }

  /**
   * Manually set motion preference (for testing or user override)
   */
  setMotionPreference(prefersReducedMotion: boolean): void {
    const previousState = this.settings.prefersReducedMotion;
    this.settings.prefersReducedMotion = prefersReducedMotion;

    if (previousState !== prefersReducedMotion) {
      this.emitPreferenceChange(previousState, 'manual');
    }
  }

  /**
   * Get animation modifications for current preference
   */
  getAnimationModifications(): AnimationModification {
    return {
      durationScale: this.settings.prefersReducedMotion
        ? this.settings.durationScale || 0.1
        : 1.0,
      ease: this.settings.prefersReducedMotion ? 'none' : undefined,
      disable:
        this.settings.prefersReducedMotion &&
        this.settings.alternativeTransition === 'none',
    };
  }

  /**
   * Modify GSAP timeline for motion preferences
   */
  modifyGSAPTimeline(timeline: gsap.core.Timeline): gsap.core.Timeline {
    if (!this.settings.prefersReducedMotion) {
      return timeline;
    }

    const modifications = this.getAnimationModifications();

    if (modifications.disable) {
      // Disable animations entirely
      timeline.duration(0);
      timeline.progress(1);
      return timeline;
    }

    // Scale duration
    if (modifications.durationScale !== 1.0) {
      const originalDuration = timeline.duration();
      timeline.duration(originalDuration * modifications.durationScale);
    }

    // Modify easing if specified
    if (modifications.ease) {
      timeline.getChildren().forEach((child) => {
        if (child && typeof child === 'object' && 'ease' in child) {
          const tween = child as { ease?: (value: string) => void };
          if (typeof tween.ease === 'function') {
            tween.ease(modifications.ease!);
          }
        }
      });
    }

    return timeline;
  }

  /**
   * Get CSS media query string
   */
  getMediaQueryString(): string {
    return '(prefers-reduced-motion: reduce)';
  }

  /**
   * Check if auto-play should be disabled
   */
  shouldDisableAutoPlay(): boolean {
    return (
      this.settings.prefersReducedMotion &&
      this.settings.disableAutoPlay !== false
    );
  }

  /**
   * Get alternative transition type
   */
  getAlternativeTransition(): string {
    return this.settings.prefersReducedMotion
      ? this.settings.alternativeTransition || 'fade'
      : 'default';
  }

  /**
   * Update settings
   */
  updateSettings(newSettings: Partial<MotionPreferenceSettings>): void {
    const oldSettings = { ...this.settings };
    this.settings = { ...this.settings, ...newSettings };

    // If monitoring setting changed, update monitoring
    if (oldSettings.monitorChanges !== this.settings.monitorChanges) {
      if (this.settings.monitorChanges && this.isInitialized) {
        this.setupChangeMonitoring();
      }
    }

    debugLogger.info('Settings updated', 'MotionPreferences', this.settings);
  }

  /**
   * Get current settings
   */
  getSettings(): MotionPreferenceSettings {
    return { ...this.settings };
  }

  /**
   * Add CSS custom properties for motion preferences
   */
  addCSSCustomProperties(): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    // Set motion preference custom property
    root.style.setProperty(
      '--prefers-reduced-motion',
      this.settings.prefersReducedMotion ? 'reduce' : 'no-preference'
    );

    // Set duration scale
    root.style.setProperty(
      '--motion-duration-scale',
      String(this.getAnimationModifications().durationScale)
    );

    // Set transition type
    root.style.setProperty(
      '--motion-transition-type',
      this.getAlternativeTransition()
    );
  }

  /**
   * Create CSS rules for reduced motion
   */
  createReducedMotionCSS(): string {
    return `
      @media (prefers-reduced-motion: reduce) {
        .kinetic-slider * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
        
        .kinetic-slider__slide {
          transform: none !important;
        }
        
        .kinetic-slider--reduced-motion .kinetic-slider__slide {
          transition: opacity 0.3s ease !important;
        }
      }
      
      :root {
        --prefers-reduced-motion: ${this.settings.prefersReducedMotion ? 'reduce' : 'no-preference'};
        --motion-duration-scale: ${this.getAnimationModifications().durationScale};
        --motion-transition-type: ${this.getAlternativeTransition()};
      }
    `;
  }

  /**
   * Inject CSS rules into document
   */
  injectCSS(): void {
    if (typeof document === 'undefined') return;

    // Check if styles already exist
    const existingStyle = document.getElementById(
      'kinetic-slider-motion-preferences'
    );
    if (existingStyle) {
      existingStyle.textContent = this.createReducedMotionCSS();
      return;
    }

    // Create new style element
    const style = document.createElement('style');
    style.id = 'kinetic-slider-motion-preferences';
    style.textContent = this.createReducedMotionCSS();

    document.head.appendChild(style);
  }

  /**
   * Destroy motion preferences manager
   */
  destroy(): void {
    debugLogger.info('Destroying...', 'MotionPreferences');

    // Remove media query listener
    if (this.mediaQuery) {
      // Note: We can't remove specific listeners without keeping references
      // The MediaQuery will be garbage collected when the component is destroyed
      try {
        // Try to remove listeners if possible (modern browsers)
        if (typeof this.mediaQuery.removeEventListener === 'function') {
          // Listeners will be automatically cleaned up when object is destroyed
        }
      } catch {
        // Ignore cleanup errors
      }
    }

    // Remove injected CSS
    const style = document.getElementById('kinetic-slider-motion-preferences');
    if (style) {
      style.remove();
    }

    // Reset state
    this.mediaQuery = null;
    this.isInitialized = false;

    // Remove all listeners
    this.removeAllListeners();
  }
}
