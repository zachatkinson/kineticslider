/**
 * @fileoverview StateManager for KineticSlider
 *
 * Manages slider state including current slide index, bounds management,
 * navigation history, state persistence, validation, and transition tracking.
 *
 * @version 1.0.0
 */

import { SimpleEventEmitter } from '../core/event-emitter';
import { SLIDER_EVENTS, SLIDER_ERROR_CODES, ERROR_HANDLING_DEFAULTS } from '../core/constants';
import { ErrorRecovery } from '../core/error-recovery';

/**
 * Core state properties
 */
export interface SliderState {
  /** Current slide index */
  currentIndex: number;
  /** Total number of slides */
  totalSlides: number;
  /** Whether the slider is playing */
  isPlaying: boolean;
  /** Whether the slider is transitioning */
  isTransitioning: boolean;
  /** Whether the slider is initialized */
  isInitialized: boolean;
  /** Whether the slider is loading */
  isLoading: boolean;
  /** Loading progress (0-100) */
  loadingProgress: number;
  /** Error state information */
  errorState?: {
    hasError: boolean;
    lastError?: Error;
    errorCount: number;
    recoveryAttempts: number;
    fallbackActive: boolean;
  };
}

/**
 * State change history entry
 */
export interface StateHistoryEntry {
  /** Timestamp of the state change */
  timestamp: number;
  /** Previous state */
  previousState: SliderState;
  /** New state */
  newState: SliderState;
  /** Context/reason for the change */
  context?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * State validation result
 */
export interface StateValidationResult {
  /** Whether the state is valid */
  isValid: boolean;
  /** Array of validation errors */
  errors: string[];
  /** Array of validation warnings */
  warnings: string[];
}

/**
 * State bounds information
 */
export interface StateBounds {
  /** Minimum valid slide index */
  minIndex: number;
  /** Maximum valid slide index */
  maxIndex: number;
  /** Whether at first slide */
  isAtFirst: boolean;
  /** Whether at last slide */
  isAtLast: boolean;
  /** Whether can navigate forward */
  canNavigateNext: boolean;
  /** Whether can navigate backward */
  canNavigatePrevious: boolean;
}

/**
 * State persistence configuration
 */
export interface StatePersistenceConfig {
  /** Enable state persistence */
  enabled: boolean;
  /** Storage key for persistence */
  storageKey: string;
  /** Properties to persist */
  persistedProperties: (keyof SliderState)[];
  /** Enable history tracking */
  enableHistory: boolean;
  /** Maximum history entries */
  maxHistoryEntries: number;
  /** Auto-save interval (0 = disabled) */
  autoSaveInterval: number;
}

/**
 * State manager configuration
 */
export interface StateManagerConfig {
  /** Initial state */
  initialState?: Partial<SliderState>;
  /** State persistence configuration */
  persistence?: Partial<StatePersistenceConfig>;
  /** Enable strict validation */
  strictValidation: boolean;
  /** Enable bounds checking */
  enableBoundsChecking: boolean;
  /** Allow invalid intermediate states during transitions */
  allowTransientStates: boolean;
  /** Enable state change notifications */
  enableNotifications: boolean;
}

/**
 * Manages slider state with validation, persistence, and history tracking
 */
export class StateManager extends SimpleEventEmitter {
  private state: SliderState;
  private config: StateManagerConfig;
  private persistenceConfig: StatePersistenceConfig;
  private history: StateHistoryEntry[] = [];
  private autoSaveTimer: number | null = null;
  private isValidating = false;
  private errorRecovery: ErrorRecovery;

  constructor(config: Partial<StateManagerConfig> = {}) {
    super();

    // Default configuration
    this.config = {
      strictValidation: true,
      enableBoundsChecking: true,
      allowTransientStates: false,
      enableNotifications: true,
      ...config,
    };

    // Default persistence configuration
    this.persistenceConfig = {
      enabled: false,
      storageKey: 'kineticslider-state',
      persistedProperties: ['currentIndex', 'isPlaying'],
      enableHistory: true,
      maxHistoryEntries: 50,
      autoSaveInterval: 0,
      ...config.persistence,
    };

    // Initialize error recovery
    this.errorRecovery = new ErrorRecovery({
      maxAttempts: ERROR_HANDLING_DEFAULTS.MAX_RECOVERY_ATTEMPTS,
      baseDelay: ERROR_HANDLING_DEFAULTS.RECOVERY_BASE_DELAY,
      backoffMultiplier: ERROR_HANDLING_DEFAULTS.RECOVERY_BACKOFF_MULTIPLIER,
      maxDelay: ERROR_HANDLING_DEFAULTS.RECOVERY_MAX_DELAY,
      useExponentialBackoff: true,
      recoveryTimeout: ERROR_HANDLING_DEFAULTS.RECOVERY_TIMEOUT
    });

    // Initialize state
    this.state = {
      currentIndex: 0,
      totalSlides: 0,
      isPlaying: false,
      isTransitioning: false,
      isInitialized: false,
      isLoading: false,
      loadingProgress: 0,
      errorState: {
        hasError: false,
        errorCount: 0,
        recoveryAttempts: 0,
        fallbackActive: false
      },
      ...config.initialState,
    };

    // Load persisted state if enabled
    if (this.persistenceConfig.enabled) {
      this.loadPersistedState();
    }

    // Setup auto-save if enabled
    if (this.persistenceConfig.autoSaveInterval > 0) {
      this.setupAutoSave();
    }
  }

  /**
   * Get current state (immutable copy)
   */
  getState(): SliderState {
    return { ...this.state };
  }

  /**
   * Update state with validation and persistence
   */
  updateState(
    updates: Partial<SliderState>,
    context?: string,
    metadata?: Record<string, unknown>
  ): void {
    const previousState = { ...this.state };
    const newState = { ...this.state, ...updates };

    // Validate state change if validation is enabled
    if (this.config.strictValidation && !this.isValidating) {
      const validation = this.validateState(newState);
      if (!validation.isValid) {
        const error = new Error(
          `${SLIDER_ERROR_CODES.INVALID_STATE}: ${validation.errors.join(', ')}`
        );
        this.emit(SLIDER_EVENTS.STATE_VALIDATION_ERROR, {
          errors: validation.errors,
          warnings: validation.warnings,
          attemptedState: newState,
          currentState: this.state,
        });
        throw error;
      }

      // Emit warnings if any
      if (validation.warnings.length > 0) {
        this.emit(SLIDER_EVENTS.STATE_VALIDATION_WARNING, {
          warnings: validation.warnings,
          state: newState,
        });
      }
    }

    // Update state
    this.state = newState;

    // Track history if enabled
    if (this.persistenceConfig.enableHistory) {
      this.addToHistory(previousState, newState, context, metadata);
    }

    // Emit state change event
    if (this.config.enableNotifications) {
      this.emit(SLIDER_EVENTS.STATE_CHANGED, {
        previousState,
        newState: this.state,
        changes: this.getStateChanges(previousState, newState),
        context,
        metadata,
      });
    }

    // Persist state if enabled
    if (this.persistenceConfig.enabled) {
      this.persistState();
    }
  }

  /**
   * Get current slide index
   */
  getCurrentIndex(): number {
    return this.state.currentIndex;
  }

  /**
   * Set current slide index with validation
   */
  setCurrentIndex(index: number, context?: string): void {
    // Only validate if bounds checking is enabled
    if (this.config.enableBoundsChecking) {
      this.validateSlideIndex(index);
    } else {
      // Still validate basic requirements (integer, non-negative)
      if (!Number.isInteger(index)) {
        throw new Error(
          `${SLIDER_ERROR_CODES.INVALID_SLIDE_INDEX}: Index must be an integer`
        );
      }
      if (index < 0) {
        throw new Error(
          `${SLIDER_ERROR_CODES.INVALID_SLIDE_INDEX}: Index cannot be negative`
        );
      }
    }
    this.updateState({ currentIndex: index }, context || 'setCurrentIndex');
  }

  /**
   * Get total slides count
   */
  getTotalSlides(): number {
    return this.state.totalSlides;
  }

  /**
   * Set total slides count
   */
  setTotalSlides(totalSlides: number, context?: string): void {
    if (totalSlides < 0) {
      throw new Error(
        `${SLIDER_ERROR_CODES.INVALID_CONFIG}: Total slides cannot be negative`
      );
    }

    const updates: Partial<SliderState> = { totalSlides };

    // Adjust current index if it's now out of bounds
    if (this.state.currentIndex >= totalSlides && totalSlides > 0) {
      updates.currentIndex = totalSlides - 1;
    } else if (totalSlides === 0) {
      updates.currentIndex = 0;
    }

    this.updateState(updates, context || 'setTotalSlides');
  }

  /**
   * Check if slider is transitioning
   */
  isTransitioning(): boolean {
    return this.state.isTransitioning;
  }

  /**
   * Set transition state
   */
  setTransitioning(isTransitioning: boolean, context?: string): void {
    this.updateState({ isTransitioning }, context || 'setTransitioning');
  }

  /**
   * Check if slider is playing
   */
  isPlaying(): boolean {
    return this.state.isPlaying;
  }

  /**
   * Set playing state
   */
  setPlaying(isPlaying: boolean, context?: string): void {
    this.updateState({ isPlaying }, context || 'setPlaying');
  }

  /**
   * Check if slider is initialized
   */
  isInitialized(): boolean {
    return this.state.isInitialized;
  }

  /**
   * Set initialized state
   */
  setInitialized(isInitialized: boolean, context?: string): void {
    this.updateState({ isInitialized }, context || 'setInitialized');
  }

  /**
   * Check if slider is loading
   */
  isLoading(): boolean {
    return this.state.isLoading;
  }

  /**
   * Set loading state with progress
   */
  setLoading(isLoading: boolean, progress?: number, context?: string): void {
    const updates: Partial<SliderState> = { isLoading };
    if (typeof progress === 'number') {
      updates.loadingProgress = Math.max(0, Math.min(100, progress));
    }
    this.updateState(updates, context || 'setLoading');
  }

  /**
   * Get loading progress
   */
  getLoadingProgress(): number {
    return this.state.loadingProgress;
  }

  /**
   * Set loading progress
   */
  setLoadingProgress(progress: number, context?: string): void {
    const clampedProgress = Math.max(0, Math.min(100, progress));
    this.updateState(
      { loadingProgress: clampedProgress },
      context || 'setLoadingProgress'
    );
  }

  /**
   * Validate slide index
   */
  validateSlideIndex(index: number): void {
    if (!Number.isInteger(index)) {
      throw new Error(
        `${SLIDER_ERROR_CODES.INVALID_SLIDE_INDEX}: Index must be an integer`
      );
    }

    if (index < 0) {
      throw new Error(
        `${SLIDER_ERROR_CODES.INVALID_SLIDE_INDEX}: Index cannot be negative`
      );
    }

    if (
      this.config.enableBoundsChecking &&
      this.state.totalSlides > 0 &&
      index >= this.state.totalSlides
    ) {
      throw new Error(
        `${SLIDER_ERROR_CODES.INVALID_SLIDE_INDEX}: Index ${index} is out of range (0-${this.state.totalSlides - 1})`
      );
    }
  }

  /**
   * Get state bounds information
   */
  getStateBounds(): StateBounds {
    const { currentIndex, totalSlides } = this.state;
    const maxIndex = Math.max(0, totalSlides - 1);

    return {
      minIndex: 0,
      maxIndex,
      isAtFirst: currentIndex === 0,
      isAtLast: currentIndex === maxIndex,
      canNavigateNext: currentIndex < maxIndex,
      canNavigatePrevious: currentIndex > 0,
    };
  }

  /**
   * Check if can navigate to next slide
   */
  canNavigateNext(): boolean {
    return this.getStateBounds().canNavigateNext;
  }

  /**
   * Check if can navigate to previous slide
   */
  canNavigatePrevious(): boolean {
    return this.getStateBounds().canNavigatePrevious;
  }

  /**
   * Validate complete state
   */
  validateState(state: SliderState): StateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate currentIndex
    if (!Number.isInteger(state.currentIndex)) {
      errors.push('currentIndex must be an integer');
    } else if (state.currentIndex < 0) {
      errors.push('currentIndex cannot be negative');
    } else if (
      state.totalSlides > 0 &&
      state.currentIndex >= state.totalSlides
    ) {
      if (this.config.allowTransientStates && state.isTransitioning) {
        warnings.push(
          `currentIndex ${state.currentIndex} is out of bounds but allowed during transition`
        );
      } else {
        errors.push(
          `currentIndex ${state.currentIndex} is out of bounds (max: ${state.totalSlides - 1})`
        );
      }
    }

    // Validate totalSlides
    if (!Number.isInteger(state.totalSlides)) {
      errors.push('totalSlides must be an integer');
    } else if (state.totalSlides < 0) {
      errors.push('totalSlides cannot be negative');
    }

    // Validate loadingProgress
    if (state.loadingProgress < 0 || state.loadingProgress > 100) {
      errors.push('loadingProgress must be between 0 and 100');
    }

    // Logical validations
    if (state.isPlaying && state.isTransitioning) {
      warnings.push('slider is both playing and transitioning');
    }

    if (
      state.isLoading &&
      state.isInitialized &&
      state.loadingProgress === 100
    ) {
      warnings.push('slider is loading but appears to be complete');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get state change history
   */
  getHistory(): StateHistoryEntry[] {
    return [...this.history];
  }

  /**
   * Clear state history
   */
  clearHistory(): void {
    this.history = [];
    this.emit(SLIDER_EVENTS.STATE_HISTORY_CLEARED);
  }

  /**
   * Revert to previous state
   */
  revertToPreviousState(): boolean {
    if (this.history.length === 0) {
      return false;
    }

    const lastEntry = this.history[this.history.length - 1];
    this.isValidating = true; // Prevent validation during revert

    try {
      this.state = { ...lastEntry.previousState };
      this.history.pop(); // Remove the reverted entry

      this.emit(SLIDER_EVENTS.STATE_REVERTED, {
        revertedState: lastEntry.newState,
        currentState: this.state,
        context: 'revert',
      });

      return true;
    } finally {
      this.isValidating = false;
    }
  }

  /**
   * Reset state to initial values
   */
  reset(): void {
    const initialState: SliderState = {
      currentIndex: 0,
      totalSlides: 0,
      isPlaying: false,
      isTransitioning: false,
      isInitialized: false,
      isLoading: false,
      loadingProgress: 0,
      ...this.config.initialState,
    };

    this.updateState(initialState, 'reset');
    this.clearHistory();
  }

  /**
   * Update manager configuration
   */
  updateConfig(updates: Partial<StateManagerConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...updates };

    // Update persistence config if provided
    if (updates.persistence) {
      this.persistenceConfig = {
        ...this.persistenceConfig,
        ...updates.persistence,
      };

      // Setup or clear auto-save based on new config
      if (this.persistenceConfig.autoSaveInterval > 0) {
        this.setupAutoSave();
      } else {
        this.clearAutoSave();
      }
    }

    this.emit(SLIDER_EVENTS.STATE_CONFIG_UPDATED, {
      oldConfig,
      newConfig: this.config,
      changes: updates,
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): StateManagerConfig {
    return {
      ...this.config,
      persistence: { ...this.persistenceConfig },
    };
  }

  /**
   * Add entry to state history
   */
  private addToHistory(
    previousState: SliderState,
    newState: SliderState,
    context?: string,
    metadata?: Record<string, unknown>
  ): void {
    const entry: StateHistoryEntry = {
      timestamp: Date.now(),
      previousState,
      newState,
      context,
      metadata,
    };

    this.history.push(entry);

    // Limit history size
    if (this.history.length > this.persistenceConfig.maxHistoryEntries) {
      this.history.shift();
    }
  }

  /**
   * Get changes between two states
   */
  private getStateChanges(
    prev: SliderState,
    current: SliderState
  ): Partial<SliderState> {
    const changes: Partial<SliderState> = {};

    const stateKeys = Object.keys(current) as (keyof SliderState)[];
    for (const key of stateKeys) {
      if (!(key in current) || !(key in prev)) continue;

      // eslint-disable-next-line security/detect-object-injection
      const prevValue = prev[key];
      // eslint-disable-next-line security/detect-object-injection
      const currentValue = current[key];
      if (prevValue !== currentValue) {
        // eslint-disable-next-line security/detect-object-injection
        (changes as Record<keyof SliderState, unknown>)[key] = currentValue;
      }
    }

    return changes;
  }

  /**
   * Persist current state to storage
   */
  private persistState(): void {
    if (!this.persistenceConfig.enabled) {
      return;
    }

    try {
      const stateToPersist: Partial<SliderState> = {};

      this.persistenceConfig.persistedProperties.forEach((prop) => {
        if (prop in this.state) {
          // eslint-disable-next-line security/detect-object-injection
          (stateToPersist as Record<string, unknown>)[prop] = this.state[prop];
        }
      });

      localStorage.setItem(
        this.persistenceConfig.storageKey,
        JSON.stringify({
          state: stateToPersist,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      this.emit(SLIDER_EVENTS.STATE_PERSISTENCE_ERROR, {
        error,
        context: 'persistState',
      });
    }
  }

  /**
   * Load persisted state from storage
   */
  private loadPersistedState(): void {
    if (!this.persistenceConfig.enabled) {
      return;
    }

    try {
      const stored = localStorage.getItem(this.persistenceConfig.storageKey);
      if (!stored) {
        return;
      }

      const { state: persistedState } = JSON.parse(stored);

      // Merge persisted state with current state
      this.state = { ...this.state, ...persistedState };

      this.emit(SLIDER_EVENTS.STATE_LOADED, {
        persistedState,
        currentState: this.state,
      });
    } catch (error) {
      this.emit(SLIDER_EVENTS.STATE_PERSISTENCE_ERROR, {
        error,
        context: 'loadPersistedState',
      });
    }
  }

  /**
   * Setup auto-save timer
   */
  private setupAutoSave(): void {
    this.clearAutoSave();

    this.autoSaveTimer = window.setInterval(() => {
      this.persistState();
    }, this.persistenceConfig.autoSaveInterval);
  }

  /**
   * Clear auto-save timer
   */
  private clearAutoSave(): void {
    if (this.autoSaveTimer !== null) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  // =============================================================================
  // Error Handling Methods  
  // =============================================================================

  /**
   * Record an error in the state
   */
  recordError(error: Error, context?: string): void {
    const errorState = this.state.errorState || {
      hasError: false,
      errorCount: 0,
      recoveryAttempts: 0,
      fallbackActive: false
    };

    this.updateState({
      errorState: {
        ...errorState,
        hasError: true,
        lastError: error,
        errorCount: errorState.errorCount + 1
      }
    }, `error-recorded: ${context || 'unknown'}`);

    this.emit(SLIDER_EVENTS.ERROR, {
      error,
      context: context || 'StateManager',
      state: this.state
    });
  }

  /**
   * Attempt to recover from an error
   */
  async attemptErrorRecovery(error: Error, context: string): Promise<boolean> {
    const errorState = this.state.errorState;
    if (!errorState) return false;

    try {
      const recoveryResult = await this.errorRecovery.attemptRecovery(error, {
        component: 'StateManager',
        operation: context,
        timestamp: Date.now(),
        previousAttempts: errorState.recoveryAttempts,
        data: { currentState: this.state }
      });

      // Update recovery attempts
      this.updateState({
        errorState: {
          ...errorState,
          recoveryAttempts: errorState.recoveryAttempts + 1
        }
      }, `recovery-attempt: ${context}`);

      if (recoveryResult.success) {
        this.clearErrorState();
        this.emit(SLIDER_EVENTS.ERROR_RECOVERED, {
          originalError: error,
          recoveryResult,
          context
        });
        return true;
      }

      return false;
    } catch (recoveryError) {
      this.recordError(
        recoveryError instanceof Error ? recoveryError : new Error(String(recoveryError)),
        'error-recovery-failed'
      );
      return false;
    }
  }

  /**
   * Clear error state
   */
  clearErrorState(): void {
    this.updateState({
      errorState: {
        hasError: false,
        errorCount: this.state.errorState?.errorCount || 0,
        recoveryAttempts: 0,
        fallbackActive: false
      }
    }, 'error-cleared');
  }

  /**
   * Activate fallback mode
   */
  activateFallbackMode(): void {
    const errorState = this.state.errorState || {
      hasError: false,
      errorCount: 0,
      recoveryAttempts: 0,
      fallbackActive: false
    };

    this.updateState({
      errorState: {
        ...errorState,
        fallbackActive: true
      }
    }, 'fallback-activated');

    this.emit(SLIDER_EVENTS.FALLBACK_ACTIVATED, {
      state: this.state,
      timestamp: Date.now()
    });
  }

  /**
   * Get current error state
   */
  getErrorState(): SliderState['errorState'] {
    return this.state.errorState;
  }

  /**
   * Check if slider is in error state
   */
  hasError(): boolean {
    return this.state.errorState?.hasError || false;
  }

  /**
   * Check if fallback mode is active
   */
  isFallbackActive(): boolean {
    return this.state.errorState?.fallbackActive || false;
  }

  /**
   * Destroy the manager and cleanup resources
   */
  destroy(): void {
    this.emit(SLIDER_EVENTS.STATE_MANAGER_DESTROYED);

    // Clear timers
    this.clearAutoSave();

    // Final persist if enabled
    if (this.persistenceConfig.enabled) {
      this.persistState();
    }

    // Clear history and state
    this.clearHistory();

    // Reset state to initial values
    this.state = {
      currentIndex: 0,
      totalSlides: 0,
      isInitialized: false,
      isLoading: false,
      isTransitioning: false,
      isPlaying: false,
      loadingProgress: 0,
    };

    // Remove all listeners
    this.removeAllListeners();
  }
}
