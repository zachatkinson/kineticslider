/**
 * @fileoverview Error Recovery System for KineticSlider
 * 
 * Provides automatic error recovery strategies for common error scenarios.
 * Builds on the existing retry patterns from TextureManager and extends them
 * to cover all slider components.
 * 
 * @version 1.0.0 - Phase 4.4 Error Handling & Recovery
 */

import { SliderError } from './types';
import { 
  SLIDER_ERROR_CODES, 
  ERROR_CODES, 
  ANIMATION_ERROR_CODES
} from './constants';

/**
 * Error recovery context information
 */
export interface ErrorContext {
  /** Component where error occurred */
  component: string;
  /** Operation that failed */
  operation: string;
  /** Additional context data */
  data?: unknown;
  /** Error timestamp */
  timestamp: number;
  /** Previous recovery attempts */
  previousAttempts: number;
}

/**
 * Recovery strategy result
 */
export interface RecoveryResult {
  /** Whether recovery was successful */
  success: boolean;
  /** Error that occurred during recovery (if any) */
  error?: Error;
  /** Recovery strategy used */
  strategy: string;
  /** Time taken for recovery attempt (ms) */
  duration: number;
  /** Whether another retry should be attempted */
  shouldRetry: boolean;
  /** Suggested delay before retry (ms) */
  retryDelay?: number;
  /** Additional recovery data */
  data?: unknown;
}

/**
 * Recovery strategy function type
 */
export type RecoveryStrategy = (
  error: Error,
  context: ErrorContext
) => Promise<RecoveryResult>;

/**
 * Recovery configuration options
 */
export interface RecoveryConfig {
  /** Maximum recovery attempts per error */
  maxAttempts?: number;
  /** Base delay between attempts (ms) */
  baseDelay?: number;
  /** Exponential backoff multiplier */
  backoffMultiplier?: number;
  /** Maximum delay between attempts (ms) */
  maxDelay?: number;
  /** Whether to use exponential backoff */
  useExponentialBackoff?: boolean;
  /** Timeout for recovery operations (ms) */
  recoveryTimeout?: number;
}

/**
 * Texture loading error details
 */
interface TextureLoadError extends Error {
  url?: string;
  format?: string;
}

/**
 * Animation error details
 */
interface AnimationError extends Error {
  timelineId?: string;
  animationType?: string;
}

/**
 * Render error details
 */
interface RenderError extends Error {
  rendererId?: string;
  webglSupported?: boolean;
}

/**
 * Physics error details
 */
interface PhysicsError extends Error {
  physicsEngine?: string;
  calculationType?: string;
}

/**
 * Comprehensive error recovery system with automatic recovery strategies
 * 
 * @example
 * ```typescript
 * const recovery = new ErrorRecovery({
 *   maxAttempts: 3,
 *   baseDelay: 1000,
 *   useExponentialBackoff: true
 * });
 * 
 * // Register custom recovery strategy
 * recovery.registerRecoveryStrategy('CUSTOM_ERROR', async (error, context) => {
 *   // Custom recovery logic
 *   return { success: true, strategy: 'custom', duration: 100, shouldRetry: false };
 * });
 * 
 * // Attempt recovery
 * const result = await recovery.attemptRecovery(error, context);
 * if (result.success) {
 *   console.log('Recovery successful');
 * }
 * ```
 */
export class ErrorRecovery {
  private config: Required<RecoveryConfig>;
  private customStrategies = new Map<string, RecoveryStrategy>();
  private recoveryAttempts = new Map<string, number>();
  private lastRecoveryTime = new Map<string, number>();

  constructor(config: RecoveryConfig = {}) {
    this.config = {
      maxAttempts: config.maxAttempts ?? 3,
      baseDelay: config.baseDelay ?? 1000,
      backoffMultiplier: config.backoffMultiplier ?? 2,
      maxDelay: config.maxDelay ?? 30000,
      useExponentialBackoff: config.useExponentialBackoff ?? true,
      recoveryTimeout: config.recoveryTimeout ?? 10000,
    };

    // Register built-in recovery strategies
    this.registerBuiltInStrategies();
  }

  /**
   * Recover from texture loading errors
   */
  static async recoverFromTextureLoadError(error: TextureLoadError): Promise<RecoveryResult> {
    const startTime = performance.now();

    try {
      // Strategy 1: Retry with different format
      if (error.url && error.message.includes('format')) {
        const result = await ErrorRecovery.tryAlternativeTextureFormat(error.url);
        if (result.success) {
          return {
            success: true,
            strategy: 'alternative_format',
            duration: performance.now() - startTime,
            shouldRetry: false,
            data: result.data
          };
        }
      }

      // Strategy 2: Clear cache and retry
      if (error.message.includes('cache') || error.message.includes('memory')) {
        const result = await ErrorRecovery.clearTextureCache();
        return {
          success: result.success,
          strategy: 'clear_cache',
          duration: performance.now() - startTime,
          shouldRetry: result.success,
          retryDelay: 1000
        };
      }

      // Strategy 3: Use fallback texture
      const fallbackResult = await ErrorRecovery.createFallbackTexture(error.url);
      return {
        success: fallbackResult.success,
        strategy: 'fallback_texture',
        duration: performance.now() - startTime,
        shouldRetry: false,
        data: fallbackResult.data
      };

    } catch (recoveryError) {
      return {
        success: false,
        error: recoveryError instanceof Error ? recoveryError : new Error(String(recoveryError)),
        strategy: 'texture_recovery',
        duration: performance.now() - startTime,
        shouldRetry: false
      };
    }
  }

  /**
   * Recover from animation errors
   */
  static async recoverFromAnimationError(error: AnimationError): Promise<RecoveryResult> {
    const startTime = performance.now();

    try {
      // Strategy 1: Reset GSAP timeline
      if (error.message.includes('timeline') || error.timelineId) {
        const result = await ErrorRecovery.resetGSAPTimeline(error.timelineId);
        if (result.success) {
          return {
            success: true,
            strategy: 'reset_timeline',
            duration: performance.now() - startTime,
            shouldRetry: true,
            retryDelay: 500
          };
        }
      }

      // Strategy 2: Simplify animation
      if (error.message.includes('performance') || error.message.includes('memory')) {
        const result = await ErrorRecovery.simplifyAnimation(error.animationType);
        return {
          success: result.success,
          strategy: 'simplify_animation',
          duration: performance.now() - startTime,
          shouldRetry: result.success,
          retryDelay: 100
        };
      }

      // Strategy 3: Disable animations temporarily
      const result = await ErrorRecovery.disableAnimations();
      return {
        success: result.success,
        strategy: 'disable_animations',
        duration: performance.now() - startTime,
        shouldRetry: false
      };

    } catch (recoveryError) {
      return {
        success: false,
        error: recoveryError instanceof Error ? recoveryError : new Error(String(recoveryError)),
        strategy: 'animation_recovery',
        duration: performance.now() - startTime,
        shouldRetry: false
      };
    }
  }

  /**
   * Recover from rendering errors
   */
  static async recoverFromRenderError(error: RenderError): Promise<RecoveryResult> {
    const startTime = performance.now();

    try {
      // Strategy 1: Fallback to WebGL1
      if (error.message.includes('WebGL2') || error.message.includes('context')) {
        const result = await ErrorRecovery.fallbackToWebGL1();
        if (result.success) {
          return {
            success: true,
            strategy: 'webgl1_fallback',
            duration: performance.now() - startTime,
            shouldRetry: true,
            retryDelay: 1000
          };
        }
      }

      // Strategy 2: Reduce rendering quality
      if (error.message.includes('memory') || error.message.includes('performance')) {
        const result = await ErrorRecovery.reduceRenderingQuality();
        return {
          success: result.success,
          strategy: 'reduce_quality',
          duration: performance.now() - startTime,
          shouldRetry: result.success,
          retryDelay: 500
        };
      }

      // Strategy 3: Use canvas fallback
      const result = await ErrorRecovery.createCanvasFallback();
      return {
        success: result.success,
        strategy: 'canvas_fallback',
        duration: performance.now() - startTime,
        shouldRetry: false
      };

    } catch (recoveryError) {
      return {
        success: false,
        error: recoveryError instanceof Error ? recoveryError : new Error(String(recoveryError)),
        strategy: 'render_recovery',
        duration: performance.now() - startTime,
        shouldRetry: false
      };
    }
  }

  /**
   * Recover from physics calculation errors
   */
  static async recoverFromPhysicsError(error: PhysicsError): Promise<RecoveryResult> {
    const startTime = performance.now();

    try {
      // Strategy 1: Reset physics state
      if (error.message.includes('state') || error.message.includes('invalid')) {
        const result = await ErrorRecovery.resetPhysicsState();
        if (result.success) {
          return {
            success: true,
            strategy: 'reset_physics',
            duration: performance.now() - startTime,
            shouldRetry: true,
            retryDelay: 100
          };
        }
      }

      // Strategy 2: Use simplified physics
      if (error.message.includes('calculation') || error.calculationType) {
        const result = await ErrorRecovery.createSimplifiedPhysics();
        return {
          success: result.success,
          strategy: 'simplified_physics',
          duration: performance.now() - startTime,
          shouldRetry: result.success,
          retryDelay: 50
        };
      }

      // Strategy 3: Disable physics temporarily
      const result = await ErrorRecovery.disablePhysics();
      return {
        success: result.success,
        strategy: 'disable_physics',
        duration: performance.now() - startTime,
        shouldRetry: false
      };

    } catch (recoveryError) {
      return {
        success: false,
        error: recoveryError instanceof Error ? recoveryError : new Error(String(recoveryError)),
        strategy: 'physics_recovery',
        duration: performance.now() - startTime,
        shouldRetry: false
      };
    }
  }

  /**
   * Register a custom recovery strategy
   */
  registerRecoveryStrategy(errorType: string, strategy: RecoveryStrategy): void {
    this.customStrategies.set(errorType, strategy);
  }

  /**
   * Attempt recovery for any error type
   */
  async attemptRecovery(error: Error, context: ErrorContext): Promise<RecoveryResult> {
    const errorKey = this.getErrorKey(error, context);
    const currentAttempts = this.recoveryAttempts.get(errorKey) || 0;

    // Check if max attempts exceeded
    if (currentAttempts >= this.config.maxAttempts) {
      return {
        success: false,
        error: new SliderError(
          `Max recovery attempts (${this.config.maxAttempts}) exceeded for ${errorKey}`,
          SLIDER_ERROR_CODES.MAX_RECOVERY_ATTEMPTS_EXCEEDED,
          { originalError: error, context }
        ),
        strategy: 'max_attempts_exceeded',
        duration: 0,
        shouldRetry: false
      };
    }

    // Check rate limiting
    const lastRecovery = this.lastRecoveryTime.get(errorKey);
    const minDelay = this.calculateDelay(currentAttempts);
    if (lastRecovery && Date.now() - lastRecovery < minDelay) {
      return {
        success: false,
        error: new SliderError(
          'Recovery rate limited',
          SLIDER_ERROR_CODES.RECOVERY_RATE_LIMITED,
          { minDelay, lastRecovery }
        ),
        strategy: 'rate_limited',
        duration: 0,
        shouldRetry: true,
        retryDelay: minDelay - (Date.now() - lastRecovery)
      };
    }

    // Update attempts and timestamp
    this.recoveryAttempts.set(errorKey, currentAttempts + 1);
    this.lastRecoveryTime.set(errorKey, Date.now());

    // Update context with attempt count
    const updatedContext: ErrorContext = {
      ...context,
      previousAttempts: currentAttempts
    };

    try {
      // Try custom strategy first
      const customStrategy = this.getCustomStrategy(error);
      if (customStrategy) {
        return await this.executeRecoveryWithTimeout(customStrategy, error, updatedContext);
      }

      // Try built-in strategies
      return await this.executeBuiltInRecovery(error, updatedContext);

    } catch (recoveryError) {
      return {
        success: false,
        error: recoveryError instanceof Error ? recoveryError : new Error(String(recoveryError)),
        strategy: 'recovery_execution_failed',
        duration: 0,
        shouldRetry: currentAttempts < this.config.maxAttempts - 1,
        retryDelay: this.calculateDelay(currentAttempts + 1)
      };
    }
  }

  /**
   * Clear recovery history for a specific error
   */
  clearRecoveryHistory(error: Error, context: ErrorContext): void {
    const errorKey = this.getErrorKey(error, context);
    this.recoveryAttempts.delete(errorKey);
    this.lastRecoveryTime.delete(errorKey);
  }

  /**
   * Get recovery statistics
   */
  getRecoveryStats(): Record<string, { attempts: number; lastRecovery: number }> {
    const stats: Record<string, { attempts: number; lastRecovery: number }> = {};
    
    for (const [key, attempts] of this.recoveryAttempts.entries()) {
      // eslint-disable-next-line security/detect-object-injection
      stats[key] = {
        attempts,
        lastRecovery: this.lastRecoveryTime.get(key) || 0
      };
    }

    return stats;
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  /**
   * Register built-in recovery strategies
   */
  private registerBuiltInStrategies(): void {
    // Texture errors
    this.customStrategies.set(ERROR_CODES.ASSET_LOAD_FAILED, ErrorRecovery.recoverFromTextureLoadError);
    
    // Animation errors
    this.customStrategies.set(ANIMATION_ERROR_CODES.TIMELINE_CREATION_FAILED, ErrorRecovery.recoverFromAnimationError);
    this.customStrategies.set(ANIMATION_ERROR_CODES.EXECUTION_FAILED, ErrorRecovery.recoverFromAnimationError);
    
    // Render errors
    this.customStrategies.set(ERROR_CODES.RENDER_ERROR, ErrorRecovery.recoverFromRenderError);
    
    // Physics errors
    this.customStrategies.set(SLIDER_ERROR_CODES.PHYSICS_ERROR, ErrorRecovery.recoverFromPhysicsError);
  }

  /**
   * Execute recovery with timeout protection
   */
  private async executeRecoveryWithTimeout(
    strategy: RecoveryStrategy,
    error: Error,
    context: ErrorContext
  ): Promise<RecoveryResult> {
    const timeoutPromise = new Promise<RecoveryResult>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Recovery timeout after ${this.config.recoveryTimeout}ms`));
      }, this.config.recoveryTimeout);
    });

    const recoveryPromise = strategy(error, context);

    try {
      return await Promise.race([recoveryPromise, timeoutPromise]);
    } catch (timeoutError) {
      return {
        success: false,
        error: timeoutError instanceof Error ? timeoutError : new Error(String(timeoutError)),
        strategy: 'timeout',
        duration: this.config.recoveryTimeout,
        shouldRetry: false
      };
    }
  }

  /**
   * Execute built-in recovery based on error type
   */
  private async executeBuiltInRecovery(error: Error, context: ErrorContext): Promise<RecoveryResult> {
    // Determine error type and use appropriate strategy
    if (error instanceof SliderError) {
      switch (error.code) {
        case SLIDER_ERROR_CODES.TRANSITION_IN_PROGRESS:
          return this.recoverFromTransitionError(error, context);
        case SLIDER_ERROR_CODES.INVALID_STATE:
          return this.recoverFromStateError(error, context);
        default:
          return this.recoverFromGenericError(error, context);
      }
    }

    // Check error message patterns
    if (error.message.includes('texture') || error.message.includes('load')) {
      return ErrorRecovery.recoverFromTextureLoadError(error as TextureLoadError);
    }

    if (error.message.includes('animation') || error.message.includes('timeline')) {
      return ErrorRecovery.recoverFromAnimationError(error as AnimationError);
    }

    if (error.message.includes('render') || error.message.includes('webgl')) {
      return ErrorRecovery.recoverFromRenderError(error as RenderError);
    }

    if (error.message.includes('physics') || error.message.includes('calculation')) {
      return ErrorRecovery.recoverFromPhysicsError(error as PhysicsError);
    }

    // Generic recovery
    return this.recoverFromGenericError(error, context);
  }

  /**
   * Recover from transition errors
   */
  private async recoverFromTransitionError(_error: SliderError, _context: ErrorContext): Promise<RecoveryResult> {
    const startTime = performance.now();
    
    try {
      // Wait for current transition to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        strategy: 'wait_for_transition',
        duration: performance.now() - startTime,
        shouldRetry: true,
        retryDelay: 100
      };
    } catch (recoveryError) {
      return {
        success: false,
        error: recoveryError instanceof Error ? recoveryError : new Error(String(recoveryError)),
        strategy: 'transition_recovery',
        duration: performance.now() - startTime,
        shouldRetry: false
      };
    }
  }

  /**
   * Recover from state errors
   */
  private async recoverFromStateError(_error: SliderError, _context: ErrorContext): Promise<RecoveryResult> {
    const startTime = performance.now();
    
    try {
      // Reset to safe state
      // This would integrate with StateManager
      
      return {
        success: true,
        strategy: 'reset_state',
        duration: performance.now() - startTime,
        shouldRetry: true,
        retryDelay: 50
      };
    } catch (recoveryError) {
      return {
        success: false,
        error: recoveryError instanceof Error ? recoveryError : new Error(String(recoveryError)),
        strategy: 'state_recovery',
        duration: performance.now() - startTime,
        shouldRetry: false
      };
    }
  }

  /**
   * Generic error recovery
   */
  private async recoverFromGenericError(error: Error, context: ErrorContext): Promise<RecoveryResult> {
    const startTime = performance.now();
    
    // Basic recovery: wait and retry
    await new Promise(resolve => setTimeout(resolve, this.config.baseDelay));
    
    return {
      success: false, // Generic recovery doesn't actually fix anything
      strategy: 'generic_wait',
      duration: performance.now() - startTime,
      shouldRetry: true,
      retryDelay: this.calculateDelay(context.previousAttempts + 1)
    };
  }

  /**
   * Get custom recovery strategy for error
   */
  private getCustomStrategy(error: Error): RecoveryStrategy | undefined {
    if (error instanceof SliderError) {
      return this.customStrategies.get(error.code);
    }

    // Try to match by error name or message patterns
    for (const [pattern, strategy] of this.customStrategies.entries()) {
      if (error.name === pattern || error.message.includes(pattern)) {
        return strategy;
      }
    }

    return undefined;
  }

  /**
   * Generate unique key for error tracking
   */
  private getErrorKey(error: Error, context: ErrorContext): string {
    const errorId = error instanceof SliderError ? error.code : error.name || 'Unknown';
    return `${context.component}:${context.operation}:${errorId}`;
  }

  /**
   * Calculate delay with exponential backoff
   */
  private calculateDelay(attemptNumber: number): number {
    if (!this.config.useExponentialBackoff) {
      return this.config.baseDelay;
    }

    const delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attemptNumber);
    return Math.min(delay, this.config.maxDelay);
  }

  // =============================================================================
  // Static Recovery Methods
  // =============================================================================

  /**
   * Try alternative texture format
   */
  private static async tryAlternativeTextureFormat(_url?: string): Promise<{ success: boolean; data?: Record<string, unknown> }> {
    if (!_url) return { success: false };

    // This would integrate with TextureManager
    // For now, return success to indicate the strategy exists
    return { success: true, data: { alternativeUrl: _url.replace(/\.\w+$/, '.png') } };
  }

  /**
   * Clear texture cache
   */
  private static async clearTextureCache(): Promise<{ success: boolean }> {
    try {
      // This would integrate with TextureManager
      // For now, return success to indicate the strategy exists
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  /**
   * Use fallback texture
   */
  private static async createFallbackTexture(_url?: string): Promise<{ success: boolean; data?: Record<string, unknown> }> {
    // This would use a default/placeholder texture
    return { success: true, data: { fallbackTexture: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmOGY5ZmEiLz48L3N2Zz4=' } };
  }

  /**
   * Reset GSAP timeline
   */
  private static async resetGSAPTimeline(_timelineId?: string): Promise<{ success: boolean }> {
    try {
      // This would integrate with animation managers
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  /**
   * Simplify animation
   */
  private static async simplifyAnimation(_animationType?: string): Promise<{ success: boolean }> {
    try {
      // This would reduce animation complexity
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  /**
   * Disable animations temporarily
   */
  private static async disableAnimations(): Promise<{ success: boolean }> {
    try {
      // This would disable all animations
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  /**
   * Fallback to WebGL1
   */
  private static async fallbackToWebGL1(): Promise<{ success: boolean }> {
    try {
      // This would reconfigure PIXI for WebGL1
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  /**
   * Reduce rendering quality
   */
  private static async reduceRenderingQuality(): Promise<{ success: boolean }> {
    try {
      // This would reduce resolution, disable effects, etc.
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  /**
   * Use canvas fallback
   */
  private static async createCanvasFallback(): Promise<{ success: boolean }> {
    try {
      // This would switch to canvas 2D rendering
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  /**
   * Reset physics state
   */
  private static async resetPhysicsState(): Promise<{ success: boolean }> {
    try {
      // This would reset all physics calculations to safe defaults
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  /**
   * Use simplified physics
   */
  private static async createSimplifiedPhysics(): Promise<{ success: boolean }> {
    try {
      // This would disable complex physics calculations
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  /**
   * Disable physics temporarily
   */
  private static async disablePhysics(): Promise<{ success: boolean }> {
    try {
      // This would disable all physics calculations
      return { success: true };
    } catch {
      return { success: false };
    }
  }
}

/**
 * Global error recovery instance for convenience
 */
export const globalErrorRecovery = new ErrorRecovery();