/**
 * @fileoverview LoopManager for KineticSlider
 *
 * Manages loop behavior including infinite loops, finite loops, bounce loops,
 * and virtual slide management for seamless transitions.
 *
 * @version 1.0.0
 */

import { SimpleEventEmitter } from '../core/event-emitter';
import {
  SLIDER_EVENTS,
  SLIDER_ERROR_CODES,
  ERROR_HANDLING_DEFAULTS,
} from '../core/constants';
import { SliderError } from '../core/types';
import { ErrorRecovery } from '../core/error-recovery';

/**
 * Loop mode types
 */
export enum LoopMode {
  INFINITE = 'infinite',
  FINITE = 'finite',
  BOUNCE = 'bounce',
}

/**
 * Configuration options for LoopManager
 */
export interface LoopConfig {
  /** Whether loop is enabled */
  enabled: boolean;
  /** Type of loop behavior */
  mode: LoopMode;
  /** Create virtual slides for smooth transitions */
  useVirtualSlides: boolean;
  /** Maximum number of virtual slides to maintain */
  maxVirtualSlides: number;
  /** Enable bounce animation effects */
  bounceEffects: boolean;
}

/**
 * Virtual slide information
 */
export interface VirtualSlide {
  id: string;
  originalIndex: number;
  position: 'before' | 'after';
  element?: HTMLElement;
}

/**
 * Loop transition result
 */
export interface LoopTransition {
  /** Whether navigation should proceed */
  shouldNavigate: boolean;
  /** Target index to navigate to */
  targetIndex: number;
  /** Whether this is a loop transition */
  isLoop: boolean;
  /** Direction of the loop */
  loopDirection: 'forward' | 'backward' | 'bounce';
}

/**
 * Manages loop behavior and virtual slide management
 */
export class LoopManager extends SimpleEventEmitter {
  private config: LoopConfig;
  private virtualSlides: Map<string, VirtualSlide> = new Map();
  private bounceDirection: 'forward' | 'backward' = 'forward';
  private isRapidChanging = false;
  private rapidChangeTimeout: number | null = null;
  private errorRecovery: ErrorRecovery;
  private errorCount = 0;
  private lastErrorTime = 0;

  constructor(config: Partial<LoopConfig> = {}) {
    super();

    this.config = {
      enabled: true,
      mode: LoopMode.INFINITE,
      useVirtualSlides: false,
      maxVirtualSlides: 4,
      bounceEffects: true,
      ...config,
    };

    // Initialize error recovery
    this.errorRecovery = new ErrorRecovery({
      maxAttempts: ERROR_HANDLING_DEFAULTS.MAX_RECOVERY_ATTEMPTS,
      baseDelay: ERROR_HANDLING_DEFAULTS.RECOVERY_BASE_DELAY,
      backoffMultiplier: ERROR_HANDLING_DEFAULTS.RECOVERY_BACKOFF_MULTIPLIER,
      maxDelay: ERROR_HANDLING_DEFAULTS.RECOVERY_MAX_DELAY,
      useExponentialBackoff: true,
      recoveryTimeout: ERROR_HANDLING_DEFAULTS.RECOVERY_TIMEOUT,
    });
  }

  /**
   * Calculate next index based on loop configuration
   */
  getNextIndex(
    currentIndex: number,
    totalSlides: number,
    direction: 'forward' | 'backward'
  ): LoopTransition {
    try {
      // If looping is disabled, handle normal navigation within bounds
      if (!this.config.enabled) {
        const isAtStart = currentIndex === 0;
        const isAtEnd = currentIndex === totalSlides - 1;

        if (direction === 'forward') {
          if (isAtEnd) {
            // Can't go past the end when loop is disabled
            return {
              shouldNavigate: false,
              targetIndex: currentIndex,
              isLoop: false,
              loopDirection: direction,
            };
          }
          // Normal forward navigation
          return {
            shouldNavigate: true,
            targetIndex: currentIndex + 1,
            isLoop: false,
            loopDirection: direction,
          };
        } else {
          if (isAtStart) {
            // Can't go before the start when loop is disabled
            return {
              shouldNavigate: false,
              targetIndex: currentIndex,
              isLoop: false,
              loopDirection: direction,
            };
          }
          // Normal backward navigation
          return {
            shouldNavigate: true,
            targetIndex: currentIndex - 1,
            isLoop: false,
            loopDirection: direction,
          };
        }
      }

      // Validate inputs
      if (!Number.isInteger(currentIndex) || currentIndex < 0) {
        throw new Error(`Invalid currentIndex: ${currentIndex}`);
      }
      if (!Number.isInteger(totalSlides) || totalSlides < 0) {
        throw new Error(`Invalid totalSlides: ${totalSlides}`);
      }

      // Defensive bounds checking: if currentIndex is already out of bounds,
      // clamp it to valid range to prevent further boundary violations
      if (totalSlides > 0 && currentIndex >= totalSlides) {
        // CurrentIndex is out of bounds - clamp to last valid slide
        const clampedIndex = Math.max(0, totalSlides - 1);
        // Emit warning event instead of console.warn
        this.emit(SLIDER_EVENTS.ERROR, {
          error: new SliderError(
            `CurrentIndex ${currentIndex} exceeds totalSlides ${totalSlides}, clamping to ${clampedIndex}`,
            SLIDER_ERROR_CODES.INVALID_SLIDE_INDEX,
            {
              currentIndex,
              totalSlides,
              clampedIndex,
              context: 'LoopManager.getNextIndex',
            }
          ),
          context: 'LoopManager.getNextIndex.bounds-check',
          recoverable: true,
        });
        currentIndex = clampedIndex;
      }

      // Handle single slide - bounce mode should still allow "bouncing" in place
      if (totalSlides <= 1) {
        if (this.config.mode === LoopMode.BOUNCE) {
          return {
            shouldNavigate: true,
            targetIndex: currentIndex,
            isLoop: true,
            loopDirection: 'bounce',
          };
        } else {
          return {
            shouldNavigate: false,
            targetIndex: currentIndex,
            isLoop: false,
            loopDirection: direction,
          };
        }
      }

      const isAtStart = currentIndex === 0;
      const isAtEnd = currentIndex === totalSlides - 1;

      if (direction === 'forward') {
        if (isAtEnd) {
          return this.handleEndBoundary(currentIndex, totalSlides);
        }
        return {
          shouldNavigate: true,
          targetIndex: currentIndex + 1,
          isLoop: false,
          loopDirection: direction,
        };
      } else {
        if (isAtStart) {
          return this.handleStartBoundary(currentIndex, totalSlides);
        }
        return {
          shouldNavigate: true,
          targetIndex: currentIndex - 1,
          isLoop: false,
          loopDirection: direction,
        };
      }
    } catch (error) {
      this.handleLoopError(
        error instanceof Error ? error : new Error(String(error)),
        'getNextIndex',
        { currentIndex, totalSlides, direction }
      );

      // Return safe fallback
      return {
        shouldNavigate: false,
        targetIndex: Math.max(0, Math.min(currentIndex, totalSlides - 1)),
        isLoop: false,
        loopDirection: direction,
      };
    }
  }

  /**
   * Handle navigation when at the end boundary
   */
  private handleEndBoundary(
    currentIndex: number,
    _totalSlides: number
  ): LoopTransition {
    switch (this.config.mode) {
      case LoopMode.INFINITE:
        this.emit(SLIDER_EVENTS.LOOP_FORWARD, {
          from: currentIndex,
          to: 0,
        });
        return {
          shouldNavigate: true,
          targetIndex: 0,
          isLoop: true,
          loopDirection: 'forward',
        };

      case LoopMode.BOUNCE:
        this.bounceDirection = 'backward';
        this.emit(SLIDER_EVENTS.LOOP_BOUNCE, {
          direction: 'backward',
          from: currentIndex,
          to: currentIndex - 1,
        });
        return {
          shouldNavigate: true,
          targetIndex: Math.max(0, currentIndex - 1),
          isLoop: true,
          loopDirection: 'bounce',
        };

      case LoopMode.FINITE:
      default:
        this.emit(SLIDER_EVENTS.LOOP_END_REACHED, {
          index: currentIndex,
        });
        return {
          shouldNavigate: false,
          targetIndex: currentIndex,
          isLoop: false,
          loopDirection: 'forward',
        };
    }
  }

  /**
   * Handle navigation when at the start boundary
   */
  private handleStartBoundary(
    currentIndex: number,
    totalSlides: number
  ): LoopTransition {
    switch (this.config.mode) {
      case LoopMode.INFINITE:
        this.emit(SLIDER_EVENTS.LOOP_BACKWARD, {
          from: currentIndex,
          to: totalSlides - 1,
        });
        return {
          shouldNavigate: true,
          targetIndex: totalSlides - 1,
          isLoop: true,
          loopDirection: 'backward',
        };

      case LoopMode.BOUNCE:
        this.bounceDirection = 'forward';
        this.emit(SLIDER_EVENTS.LOOP_BOUNCE, {
          direction: 'forward',
          from: currentIndex,
          to: currentIndex + 1,
        });
        return {
          shouldNavigate: true,
          targetIndex: Math.min(totalSlides - 1, currentIndex + 1),
          isLoop: true,
          loopDirection: 'bounce',
        };

      case LoopMode.FINITE:
      default:
        this.emit(SLIDER_EVENTS.LOOP_START_REACHED, {
          index: currentIndex,
        });
        return {
          shouldNavigate: false,
          targetIndex: currentIndex,
          isLoop: false,
          loopDirection: 'backward',
        };
    }
  }

  /**
   * Handle rapid direction changes
   */
  handleRapidDirectionChange(): void {
    this.isRapidChanging = true;

    // Clear previous timeout
    if (this.rapidChangeTimeout !== null) {
      clearTimeout(this.rapidChangeTimeout);
    }

    // Reset rapid changing flag after delay
    this.rapidChangeTimeout = window.setTimeout(() => {
      this.isRapidChanging = false;
      this.rapidChangeTimeout = null;
    }, 500);

    this.emit(SLIDER_EVENTS.RAPID_DIRECTION_CHANGE);
  }

  /**
   * Check if currently handling rapid changes
   */
  isRapidlyChanging(): boolean {
    return this.isRapidChanging;
  }

  /**
   * Create virtual slide for smooth loop transitions
   */
  createVirtualSlide(
    originalIndex: number,
    position: 'before' | 'after'
  ): VirtualSlide | null {
    try {
      if (!this.config.useVirtualSlides) {
        return null;
      }

      // Validate inputs
      if (!Number.isInteger(originalIndex) || originalIndex < 0) {
        throw new Error(`Invalid originalIndex: ${originalIndex}`);
      }
      if (position !== 'before' && position !== 'after') {
        throw new Error(`Invalid position: ${position}`);
      }

      // Check virtual slide limit
      if (this.virtualSlides.size >= this.config.maxVirtualSlides) {
        this.cleanupOldestVirtualSlide();
      }

      const virtualSlide: VirtualSlide = {
        id: `virtual-${originalIndex}-${position}-${Date.now()}`,
        originalIndex,
        position,
      };

      this.virtualSlides.set(virtualSlide.id, virtualSlide);

      this.emit(SLIDER_EVENTS.VIRTUAL_SLIDE_CREATED, {
        virtualSlide,
      });

      return virtualSlide;
    } catch (error) {
      this.handleLoopError(
        error instanceof Error ? error : new Error(String(error)),
        'createVirtualSlide',
        { originalIndex, position }
      );
      return null;
    }
  }

  /**
   * Remove virtual slide
   */
  removeVirtualSlide(slideId: string): void {
    const virtualSlide = this.virtualSlides.get(slideId);
    if (virtualSlide) {
      this.virtualSlides.delete(slideId);

      this.emit(SLIDER_EVENTS.VIRTUAL_SLIDE_REMOVED, {
        virtualSlide,
      });
    }
  }

  /**
   * Get all virtual slides
   */
  getVirtualSlides(): VirtualSlide[] {
    return Array.from(this.virtualSlides.values());
  }

  /**
   * Clean up oldest virtual slide
   */
  private cleanupOldestVirtualSlide(): void {
    const slides = Array.from(this.virtualSlides.entries());
    if (slides.length > 0) {
      const [oldestId] = slides[0];
      this.removeVirtualSlide(oldestId);
    }
  }

  /**
   * Clean up all virtual slides
   */
  cleanupAllVirtualSlides(): void {
    const slideIds = Array.from(this.virtualSlides.keys());
    slideIds.forEach((id) => this.removeVirtualSlide(id));

    this.emit(SLIDER_EVENTS.VIRTUAL_SLIDES_CLEANUP);
  }

  /**
   * Update loop configuration
   */
  updateConfig(updates: Partial<LoopConfig>): void {
    try {
      const oldMode = this.config.mode;
      const oldUseVirtualSlides = this.config.useVirtualSlides;
      this.config = { ...this.config, ...updates };

      // Reset bounce direction if mode changed
      if (oldMode !== this.config.mode) {
        this.bounceDirection = 'forward';
      }

      // Clean up virtual slides if disabled
      if (oldUseVirtualSlides && !this.config.useVirtualSlides) {
        this.cleanupAllVirtualSlides();
      }

      this.emit(SLIDER_EVENTS.LOOP_CONFIG_UPDATED, {
        config: { ...this.config },
        oldMode,
        newMode: this.config.mode,
      });
    } catch (error) {
      this.handleLoopError(
        error instanceof Error ? error : new Error(String(error)),
        'updateConfig',
        { updates }
      );
    }
  }

  /**
   * Get current loop configuration
   */
  getConfig(): LoopConfig {
    return { ...this.config };
  }

  /**
   * Get current bounce direction (for bounce mode)
   */
  getBounceDirection(): 'forward' | 'backward' {
    return this.bounceDirection;
  }

  /**
   * Check if loop is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Check if in infinite loop mode
   */
  isInfinite(): boolean {
    return this.config.enabled && this.config.mode === LoopMode.INFINITE;
  }

  /**
   * Check if in finite loop mode
   */
  isFinite(): boolean {
    return this.config.enabled && this.config.mode === LoopMode.FINITE;
  }

  /**
   * Check if in bounce loop mode
   */
  isBounce(): boolean {
    return this.config.enabled && this.config.mode === LoopMode.BOUNCE;
  }

  /**
   * Reset manager state
   */
  reset(): void {
    this.bounceDirection = 'forward';
    this.isRapidChanging = false;

    if (this.rapidChangeTimeout !== null) {
      clearTimeout(this.rapidChangeTimeout);
      this.rapidChangeTimeout = null;
    }

    this.cleanupAllVirtualSlides();

    this.emit(SLIDER_EVENTS.LOOP_RESET);
  }

  /**
   * Handle loop-related errors with recovery
   */
  private async handleLoopError(
    error: Error,
    context: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    this.errorCount++;
    this.lastErrorTime = Date.now();

    // Enhanced error with context
    const loopError = new SliderError(
      `Loop error in ${context}: ${error.message}`,
      SLIDER_ERROR_CODES.LOOP_ERROR,
      { originalError: error, context, data, manager: 'LoopManager' }
    );

    // Emit error event
    this.emit(SLIDER_EVENTS.ERROR, {
      error: loopError,
      context: `LoopManager.${context}`,
      recoverable: true,
    });

    // Attempt recovery if not too many recent errors
    const timeSinceLastError = Date.now() - this.lastErrorTime;
    if (
      this.errorCount < ERROR_HANDLING_DEFAULTS.MAX_RECOVERY_ATTEMPTS ||
      timeSinceLastError > ERROR_HANDLING_DEFAULTS.RECOVERY_TIMEOUT
    ) {
      try {
        const recoveryResult = await this.errorRecovery.attemptRecovery(
          loopError,
          {
            component: 'LoopManager',
            operation: context,
            timestamp: Date.now(),
            previousAttempts: this.errorCount,
            data: {
              config: this.config,
              virtualSlidesCount: this.virtualSlides.size,
              bounceDirection: this.bounceDirection,
              ...data,
            },
          }
        );

        if (recoveryResult.success) {
          // Reset error count on successful recovery
          this.errorCount = Math.max(0, this.errorCount - 1);

          this.emit(SLIDER_EVENTS.ERROR_RECOVERED, {
            originalError: loopError,
            recoveryResult,
            context: `LoopManager.${context}`,
          });
        }
      } catch (recoveryError) {
        // Recovery failed, but don't cascade errors
        // Use debugLogger or emit error event instead of console.warn
        this.emit(SLIDER_EVENTS.ERROR, {
          error: new SliderError(
            `Recovery failed: ${recoveryError instanceof Error ? recoveryError.message : String(recoveryError)}`,
            SLIDER_ERROR_CODES.RECOVERY_FAILED,
            {
              originalError: loopError,
              recoveryError,
              context: `LoopManager.${context}`,
            }
          ),
          context: `LoopManager.${context}.recovery`,
          recoverable: false,
        });
      }
    }
  }

  /**
   * Get error statistics for debugging
   */
  getErrorStats(): { errorCount: number; lastErrorTime: number } {
    return {
      errorCount: this.errorCount,
      lastErrorTime: this.lastErrorTime,
    };
  }

  /**
   * Reset error tracking
   */
  resetErrorTracking(): void {
    this.errorCount = 0;
    this.lastErrorTime = 0;
  }

  /**
   * Destroy the manager and cleanup resources
   */
  destroy(): void {
    // Emit destroy event before cleanup
    this.emit(SLIDER_EVENTS.LOOP_DESTROYED);

    this.reset();
    this.resetErrorTracking();
    this.removeAllListeners();
  }
}
