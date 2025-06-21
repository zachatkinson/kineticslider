/**
 * State Management Architecture
 *
 * A Redux-inspired state management system with immutability,
 * time-travel debugging, and React integration.
 */

import type { SliderState, SliderError } from '../domain/models';
import { createLogger, LogLevel } from './logging.js';

// Create a logger for state management
const stateLogger = createLogger(
  { component: 'StateManager' },
  { level: LogLevel.Info }
);

// ===== STATE TYPES =====

/**
 * Base action interface
 */
export interface Action {
  type: string;
  payload?: unknown;
  meta?: {
    timestamp: number;
    source?: string;
  };
}

/**
 * State reducer function
 */
export type Reducer<TState = unknown, TAction extends Action = Action> = (
  state: TState | undefined,
  action: TAction
) => TState;

/**
 * State selector function
 */
export type Selector<TState, TResult> = (state: TState) => TResult;

/**
 * State subscriber function
 */
export type Subscriber<TState> = (state: TState, prevState: TState) => void;

/**
 * Middleware function
 */
export type Middleware<TState> = (
  store: Store<TState>
) => (next: Dispatch) => (action: Action) => Action;

/**
 * Dispatch function
 */
export type Dispatch = (action: Action) => Action;

/**
 * Store enhancer
 */
export type StoreEnhancer<TState> = (
  createStore: StoreCreator<TState>
) => StoreCreator<TState>;

/**
 * Store creator function
 */
export type StoreCreator<TState> = (
  reducer: Reducer<TState>,
  initialState?: TState
) => Store<TState>;

// ===== STORE INTERFACE =====

export interface Store<TState = unknown> {
  /**
   * Get current state
   */
  getState(): TState;

  /**
   * Dispatch an action
   */
  dispatch(action: Action): Action;

  /**
   * Subscribe to state changes
   */
  subscribe(listener: Subscriber<TState>): () => void;

  /**
   * Replace the reducer
   */
  replaceReducer(nextReducer: Reducer<TState>): void;
}

/**
 * Observable interface for RxJS compatibility
 */
export interface Observable<T> {
  subscribe(observer: {
    next?: (value: T) => void;
    error?: (error: Error) => void;
    complete?: () => void;
  }): { unsubscribe(): void };
}

// ===== STORE IMPLEMENTATION =====

export class StateStore<TState = unknown> implements Store<TState> {
  private currentState!: TState;
  private currentReducer!: Reducer<TState>;
  private listeners: Set<Subscriber<TState>> = new Set();
  private isDispatching = false;
  private actionHistory: Action[] = [];
  private stateHistory: TState[] = [];
  private maxHistorySize = 50;

  constructor(
    reducer: Reducer<TState>,
    initialState?: TState,
    enhancer?: StoreEnhancer<TState>
  ) {
    if (enhancer) {
      const enhancedStore = enhancer(this.createStore.bind(this))(
        reducer,
        initialState
      );
      // Copy properties from enhanced store
      Object.assign(this, enhancedStore);
      return;
    }

    this.currentReducer = reducer;
    this.currentState =
      initialState ??
      this.currentReducer(undefined, { type: '@@INIT' } as Action);
    this.stateHistory.push(this.currentState);
  }

  getState(): TState {
    if (this.isDispatching) {
      throw new Error(
        'You may not call store.getState() while the reducer is executing'
      );
    }
    return this.currentState;
  }

  dispatch(action: Action): Action {
    if (this.isDispatching) {
      throw new Error('Reducers may not dispatch actions');
    }

    try {
      this.isDispatching = true;

      // Add metadata
      const enhancedAction: Action = {
        ...action,
        meta: {
          timestamp: Date.now(),
          ...action.meta,
        },
      };

      // Store previous state
      const prevState = this.currentState;

      // Apply reducer
      this.currentState = this.currentReducer(
        this.currentState,
        enhancedAction
      );

      // Update history
      this.updateHistory(enhancedAction, this.currentState);

      // Notify subscribers
      this.notifySubscribers(this.currentState, prevState);

      return enhancedAction;
    } finally {
      this.isDispatching = false;
    }
  }

  subscribe(listener: Subscriber<TState>): () => void {
    if (typeof listener !== 'function') {
      throw new Error('Expected listener to be a function');
    }

    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  replaceReducer(nextReducer: Reducer<TState>): void {
    this.currentReducer = nextReducer;
    this.dispatch({ type: '@@REDUCER_REPLACED' });
  }

  // ===== DEBUGGING METHODS =====

  /**
   * Get action history for debugging
   */
  getActionHistory(): Action[] {
    return [...this.actionHistory];
  }

  /**
   * Get state history for time-travel debugging
   */
  getStateHistory(): TState[] {
    return [...this.stateHistory];
  }

  /**
   * Jump to a specific state in history
   */
  jumpToState(index: number): void {
    if (index < 0 || index >= this.stateHistory.length) {
      throw new Error('Invalid state history index');
    }

    const prevState = this.currentState;
    // Use array method instead of bracket notation
    const targetState = this.stateHistory.at(index);
    if (targetState !== undefined) {
      this.currentState = targetState;
      this.notifySubscribers(this.currentState, prevState);
    }
  }

  /**
   * Clear history to free memory
   */
  clearHistory(): void {
    this.actionHistory = [];
    this.stateHistory = [this.currentState];
  }

  // ===== PRIVATE METHODS =====

  private createStore(
    reducer: Reducer<TState>,
    initialState?: TState
  ): Store<TState> {
    return new StateStore(reducer, initialState);
  }

  private updateHistory(action: Action, state: TState): void {
    this.actionHistory.push(action);
    this.stateHistory.push(state);

    // Limit history size
    if (this.actionHistory.length > this.maxHistorySize) {
      this.actionHistory.shift();
      this.stateHistory.shift();
    }
  }

  private notifySubscribers(state: TState, prevState: TState): void {
    for (const listener of this.listeners) {
      try {
        listener(state, prevState);
      } catch (error) {
        stateLogger.error('Error in state subscriber:', error);
      }
    }
  }
}

// ===== SLIDER ACTION TYPES =====

interface SliderGoToSlidePayload {
  index: number;
  trigger?: string;
}

interface SliderLoadingPayload {
  slideId: string;
}

interface SliderErrorPayload {
  error: SliderError;
}

interface SliderInteractionPayload {
  timestamp: Date;
}

// ===== SLIDER-SPECIFIC ACTIONS =====

export const SliderActions = {
  // Navigation actions
  goToSlide: (index: number, trigger?: string) => ({
    type: 'SLIDER_GO_TO_SLIDE',
    payload: { index, trigger },
  }),

  nextSlide: (trigger?: string) => ({
    type: 'SLIDER_NEXT_SLIDE',
    payload: { trigger },
  }),

  previousSlide: (trigger?: string) => ({
    type: 'SLIDER_PREVIOUS_SLIDE',
    payload: { trigger },
  }),

  // Playback actions
  startAutoplay: () => ({
    type: 'SLIDER_START_AUTOPLAY',
  }),

  stopAutoplay: () => ({
    type: 'SLIDER_STOP_AUTOPLAY',
  }),

  pauseAutoplay: () => ({
    type: 'SLIDER_PAUSE_AUTOPLAY',
  }),

  resumeAutoplay: () => ({
    type: 'SLIDER_RESUME_AUTOPLAY',
  }),

  // Loading actions
  startLoading: (slideId: string) => ({
    type: 'SLIDER_START_LOADING',
    payload: { slideId },
  }),

  finishLoading: (slideId: string) => ({
    type: 'SLIDER_FINISH_LOADING',
    payload: { slideId },
  }),

  // Error actions
  setError: (error: SliderError) => ({
    type: 'SLIDER_SET_ERROR',
    payload: { error },
  }),

  clearError: () => ({
    type: 'SLIDER_CLEAR_ERROR',
  }),

  // Interaction actions
  recordInteraction: () => ({
    type: 'SLIDER_RECORD_INTERACTION',
    payload: { timestamp: new Date() },
  }),
} as const;

// ===== SLIDER REDUCER =====

export function sliderReducer(
  state: SliderState | undefined,
  action: Action
): SliderState {
  if (!state) {
    return {
      currentSlideIndex: 0,
      isPlaying: false,
      isLoading: false,
      loadedSlides: new Set(),
      error: null,
      lastInteraction: null,
    };
  }

  switch (action.type) {
    case 'SLIDER_GO_TO_SLIDE':
      return {
        ...state,
        currentSlideIndex: (action.payload as SliderGoToSlidePayload).index,
        lastInteraction: new Date(),
      };

    case 'SLIDER_NEXT_SLIDE':
      return {
        ...state,
        currentSlideIndex: state.currentSlideIndex + 1,
        lastInteraction: new Date(),
      };

    case 'SLIDER_PREVIOUS_SLIDE':
      return {
        ...state,
        currentSlideIndex: Math.max(0, state.currentSlideIndex - 1),
        lastInteraction: new Date(),
      };

    case 'SLIDER_START_AUTOPLAY':
      return {
        ...state,
        isPlaying: true,
      };

    case 'SLIDER_STOP_AUTOPLAY':
      return {
        ...state,
        isPlaying: false,
      };

    case 'SLIDER_PAUSE_AUTOPLAY':
      return {
        ...state,
        isPlaying: false,
      };

    case 'SLIDER_RESUME_AUTOPLAY':
      return {
        ...state,
        isPlaying: true,
      };

    case 'SLIDER_START_LOADING':
      return {
        ...state,
        isLoading: true,
      };

    case 'SLIDER_FINISH_LOADING': {
      const slideId = (action.payload as SliderLoadingPayload).slideId;
      const newLoadedSlides = new Set(state.loadedSlides);
      newLoadedSlides.add(slideId);

      return {
        ...state,
        isLoading: false,
        loadedSlides: newLoadedSlides,
      };
    }

    case 'SLIDER_SET_ERROR':
      return {
        ...state,
        error: (action.payload as SliderErrorPayload).error,
      };

    case 'SLIDER_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'SLIDER_RECORD_INTERACTION':
      return {
        ...state,
        lastInteraction: (action.payload as SliderInteractionPayload).timestamp,
      };

    default:
      return state;
  }
}

// ===== SELECTORS =====

export const SliderSelectors = {
  getCurrentSlideIndex: (state: SliderState) => state.currentSlideIndex,
  getIsPlaying: (state: SliderState) => state.isPlaying,
  getIsLoading: (state: SliderState) => state.isLoading,
  getLoadedSlides: (state: SliderState) => state.loadedSlides,
  getError: (state: SliderState) => state.error,
  getLastInteraction: (state: SliderState) => state.lastInteraction,

  // Computed selectors
  getIsSlideLoaded:
    (slideId: string): ((state: SliderState) => boolean) =>
    (state: SliderState) =>
      state.loadedSlides.has(slideId),

  getHasError: (state: SliderState) => state.error !== null,

  getTimeSinceLastInteraction: (state: SliderState): number | null =>
    state.lastInteraction ? Date.now() - state.lastInteraction.getTime() : null,
} as const;

// ===== MIDDLEWARE =====

/**
 * Logging middleware for debugging
 */
export function createLoggingMiddleware<TState>(): Middleware<TState> {
  return (store) => (next) => (action) => {
    stateLogger.debug(`Action: ${action.type}`, {
      previousState: store.getState(),
      action,
    });

    const result = next(action);

    stateLogger.debug(`Action completed: ${action.type}`, {
      nextState: store.getState(),
    });

    return result;
  };
}

/**
 * Performance monitoring middleware
 */
export function createPerformanceMiddleware<TState>(): Middleware<TState> {
  return () => (next) => (action) => {
    const start = performance.now();
    const result = next(action);
    const end = performance.now();
    const duration = end - start;

    stateLogger.debug(`Action: ${action.type}`, {
      action,
      duration,
    });

    if (duration > 16) {
      // Warn if action takes longer than one frame
      stateLogger.warn(
        `Slow action detected: ${action.type} took ${duration}ms`
      );
    }

    return result;
  };
}

/**
 * Event synchronization middleware
 */
export function createEventSyncMiddleware<TState>(eventService: {
  publish: (event: unknown) => void;
}): Middleware<TState> {
  return () => (next) => (action) => {
    const result = next(action);

    // Publish domain events based on actions
    if (action.type.startsWith('SLIDER_')) {
      eventService.publish({
        type: action.type.toLowerCase().replace('slider_', ''),
        timestamp: new Date(),
        sliderId: 'current', // TODO: Get from context
        ...(action.payload || {}),
      });
    }

    return result;
  };
}

// ===== STORE FACTORY =====

/**
 * Create a configured store for the slider
 */
export function createSliderStore(
  initialState?: SliderState,
  middleware: Middleware<SliderState>[] = []
): Store<SliderState> {
  // Apply middleware
  let enhancer: StoreEnhancer<SliderState> | undefined;

  if (middleware.length > 0) {
    enhancer =
      (createStore: StoreCreator<SliderState>) =>
      (
        reducer: Reducer<SliderState>,
        preloadedState?: SliderState
      ): Store<SliderState> => {
        const store = createStore(reducer, preloadedState);

        let dispatch = store.dispatch;

        // Apply middleware in reverse order using safe array methods
        const reversedMiddleware = [...middleware].reverse();
        reversedMiddleware.forEach((middlewareItem) => {
          dispatch = middlewareItem(store)(dispatch);
        });

        return {
          ...store,
          dispatch,
        };
      };
  }

  return new StateStore(sliderReducer, initialState, enhancer);
}
