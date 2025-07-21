/**
 * @fileoverview AutoPlay Manager for KineticSlider
 * 
 * Manages automatic slide progression with intelligent pause detection,
 * visibility handling, and performance optimization.
 * 
 * @version 1.0.0
 */

import { SimpleEventEmitter } from '../core/event-emitter';
import { SLIDER_EVENTS, ANIMATION_DURATION } from '../core/constants';

/**
 * Configuration options for AutoPlayManager
 */
export interface AutoPlayConfig {
  /** Whether auto-play is enabled */
  enabled: boolean;
  /** Interval between slides in milliseconds */
  interval: number;
  /** Pause auto-play when hovering over slider */
  pauseOnHover: boolean;
  /** Pause auto-play when slider has focus */
  pauseOnFocus: boolean;
  /** Pause auto-play on user interaction */
  pauseOnInteraction: boolean;
  /** Resume auto-play after user interaction timeout */
  resumeAfterInteraction: boolean;
  /** Time to wait before resuming after interaction (ms) */
  resumeDelay: number;
}

/**
 * Reasons for auto-play being paused
 */
export enum PauseReason {
  MANUAL = 'manual',
  HOVER = 'hover',
  FOCUS = 'focus',
  INTERACTION = 'interaction',
  VISIBILITY = 'visibility',
  BLUR = 'blur'
}

/**
 * Manages automatic slide progression with intelligent pause detection
 */
export class AutoPlayManager extends SimpleEventEmitter {
  private config: AutoPlayConfig;
  private timer: number | null = null;
  private isPlaying = false;
  private pauseReasons = new Set<PauseReason>();
  private resumeTimer: number | null = null;
  private lastInteractionTime = 0;

  constructor(config: Partial<AutoPlayConfig> = {}) {
    super();
    
    this.config = {
      enabled: false,
      interval: ANIMATION_DURATION.STANDARD,
      pauseOnHover: true,
      pauseOnFocus: true,
      pauseOnInteraction: true,
      resumeAfterInteraction: true,
      resumeDelay: 3000,
      ...config
    };

    this.setupVisibilityHandling();
    this.setupBlurHandling();
  }

  /**
   * Start auto-play
   */
  start(onNext: () => Promise<void>): void {
    if (!this.config.enabled || this.isPlaying) {
      return;
    }

    this.isPlaying = true;
    this.pauseReasons.clear();
    this.scheduleNext(onNext);
    this.emit(SLIDER_EVENTS.PLAY_STARTED);
  }

  /**
   * Pause auto-play with a specific reason
   */
  pause(reason: PauseReason = PauseReason.MANUAL): void {
    if (!this.isPlaying) {
      return;
    }

    this.pauseReasons.add(reason);
    this.clearTimer();
    this.clearResumeTimer();
    
    // Only emit pause event if this is the first pause reason
    if (this.pauseReasons.size === 1) {
      this.emit(SLIDER_EVENTS.PLAY_PAUSED, { reason });
    }
  }

  /**
   * Resume auto-play if a specific pause reason is cleared
   */
  resume(reason: PauseReason, onNext: () => Promise<void>): void {
    this.pauseReasons.delete(reason);

    // Only resume if there are no more pause reasons and we were playing
    if (this.pauseReasons.size === 0 && this.isPlaying) {
      this.scheduleNext(onNext);
      this.emit(SLIDER_EVENTS.PLAY_RESUMED, { reason });
    }
  }

  /**
   * Stop auto-play completely
   */
  stop(): void {
    this.isPlaying = false;
    this.pauseReasons.clear();
    this.clearTimer();
    this.clearResumeTimer();
    this.emit(SLIDER_EVENTS.PLAY_STOPPED);
  }

  /**
   * Toggle play/pause state
   */
  toggle(onNext: () => Promise<void>): void {
    if (this.isPlaying && this.pauseReasons.size === 0) {
      this.pause(PauseReason.MANUAL);
    } else if (!this.isPlaying) {
      this.config.enabled = true;
      this.start(onNext);
    } else {
      // Clear manual pause if it exists
      this.resume(PauseReason.MANUAL, onNext);
    }
  }

  /**
   * Handle hover state changes
   */
  handleHover(isHovering: boolean, onNext: () => Promise<void>): void {
    if (!this.config.pauseOnHover) return;

    if (isHovering) {
      this.pause(PauseReason.HOVER);
    } else {
      this.resume(PauseReason.HOVER, onNext);
    }
  }

  /**
   * Handle focus state changes
   */
  handleFocus(hasFocus: boolean, onNext: () => Promise<void>): void {
    if (!this.config.pauseOnFocus) return;

    if (hasFocus) {
      this.pause(PauseReason.FOCUS);
    } else {
      this.resume(PauseReason.FOCUS, onNext);
    }
  }

  /**
   * Handle user interaction
   */
  handleInteraction(onNext: () => Promise<void>): void {
    if (!this.config.pauseOnInteraction) return;

    this.lastInteractionTime = Date.now();
    this.pause(PauseReason.INTERACTION);

    // Clear any existing resume timer
    this.clearResumeTimer();

    // Schedule resume if enabled
    if (this.config.resumeAfterInteraction) {
      this.resumeTimer = window.setTimeout(() => {
        this.resume(PauseReason.INTERACTION, onNext);
      }, this.config.resumeDelay);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<AutoPlayConfig>): void {
    const wasEnabled = this.config.enabled;
    const oldInterval = this.config.interval;
    
    this.config = { ...this.config, ...updates };

    // Handle enabled state change
    if (!wasEnabled && this.config.enabled && !this.isPlaying) {
      // Auto-play was just enabled
      this.emit(SLIDER_EVENTS.CONFIG_UPDATED, { autoPlayEnabled: true });
    } else if (wasEnabled && !this.config.enabled && this.isPlaying) {
      // Auto-play was just disabled
      this.stop();
    }

    // Handle interval change
    if (oldInterval !== this.config.interval && this.isPlaying && this.pauseReasons.size === 0) {
      // Restart with new interval
      this.clearTimer();
      // Note: We need the onNext callback to restart, which should be provided by SliderCore
      this.emit(SLIDER_EVENTS.CONFIG_UPDATED, { intervalChanged: true });
    }
  }

  /**
   * Get current state
   */
  getState(): {
    isPlaying: boolean;
    isPaused: boolean;
    pauseReasons: string[];
    config: AutoPlayConfig;
  } {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.pauseReasons.size > 0,
      pauseReasons: Array.from(this.pauseReasons),
      config: { ...this.config }
    };
  }

  /**
   * Check if auto-play is currently active (playing and not paused)
   */
  isActive(): boolean {
    return this.isPlaying && this.pauseReasons.size === 0;
  }

  /**
   * Destroy the manager and cleanup resources
   */
  destroy(): void {
    this.stop();
    this.removeVisibilityHandling();
    this.removeBlurHandling();
    this.removeAllListeners();
  }

  /**
   * Schedule the next slide
   */
  private scheduleNext(onNext: () => Promise<void>): void {
    this.clearTimer();
    
    this.timer = window.setTimeout(async () => {
      if (this.isPlaying && this.pauseReasons.size === 0) {
        try {
          await onNext();
          
          // Continue scheduling if still playing and not paused
          if (this.isPlaying && this.pauseReasons.size === 0) {
            this.scheduleNext(onNext);
          }
        } catch (error) {
          this.emit(SLIDER_EVENTS.ERROR, {
            error,
            context: 'AutoPlayManager.scheduleNext'
          });
          // Stop auto-play on error
          this.stop();
        }
      }
    }, this.config.interval);
  }

  /**
   * Clear the auto-play timer
   */
  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * Clear the resume timer
   */
  private clearResumeTimer(): void {
    if (this.resumeTimer !== null) {
      clearTimeout(this.resumeTimer);
      this.resumeTimer = null;
    }
  }

  /**
   * Setup page visibility handling
   */
  private setupVisibilityHandling(): void {
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * Remove page visibility handling
   */
  private removeVisibilityHandling(): void {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * Handle page visibility changes
   */
  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.pause(PauseReason.VISIBILITY);
    } else {
      // We need the onNext callback, so we'll emit an event instead
      this.pauseReasons.delete(PauseReason.VISIBILITY);
      if (this.pauseReasons.size === 0 && this.isPlaying) {
        this.emit(SLIDER_EVENTS.VISIBILITY_RESUMED);
      }
    }
  };

  /**
   * Setup window blur handling
   */
  private setupBlurHandling(): void {
    this.handleWindowBlur = this.handleWindowBlur.bind(this);
    this.handleWindowFocus = this.handleWindowFocus.bind(this);
    
    window.addEventListener('blur', this.handleWindowBlur);
    window.addEventListener('focus', this.handleWindowFocus);
  }

  /**
   * Remove window blur handling
   */
  private removeBlurHandling(): void {
    window.removeEventListener('blur', this.handleWindowBlur);
    window.removeEventListener('focus', this.handleWindowFocus);
  }

  /**
   * Handle window blur
   */
  private handleWindowBlur = (): void => {
    this.pause(PauseReason.BLUR);
  };

  /**
   * Handle window focus
   */
  private handleWindowFocus = (): void => {
    this.pauseReasons.delete(PauseReason.BLUR);
    if (this.pauseReasons.size === 0 && this.isPlaying) {
      this.emit(SLIDER_EVENTS.WINDOW_FOCUS_RESUMED);
    }
  };
}