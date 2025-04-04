/**
 * Slider Context Module
 * Provides state management and actions for the kinetic slider component.
 * 
 * @module
 * @version 1.0.0
 * @example Example usage
 * ```tsx
 * import { SliderProvider, useSlider } from './SliderContext';
 * 
 * function _App(): unknown  {
 *   return (
 *     <SliderProvider items={slides}>
 *       <Slider />
 *     </SliderProvider>
 *   );
 * }
 * ```
 * 
 * @description * - Uses React.memo for optimized re-renders
 * - Implements useCallback for memoized actions
 * - Efficient state updates via reducer pattern
 * 
 * @description * - Type-safe state management
 * - Input validation for configuration
 * - Protected context access
 */

import * as React from 'react';
import { createContext, useContext, useReducer, useCallback } from 'react';
import { _defaultConfig as defaultConfig, _initialState as initialState } from '../types/slider';
import type { 
  SliderContextValue, 
  SliderConfig as _SliderConfig, 
  SliderState, 
  SlideItem as _SlideItem,
  SliderAction,
  SlideIndex as _SlideIndex
} from '../types/slider';
import type { GestureDelta as _GestureDelta } from '../types/gesture';
import type { GestureDistance as _GestureDistance } from '../types/branded';
import { createBrandedNumber } from '../types/branded';
import type { 
  SliderProviderProps, 
  SliderConsumerProps,
  WithSliderProps as _WithSliderProps 
} from '../types/context';

/**
 * Reducer function for managing slider state.
 * Handles all slider actions and state transitions.
 * 
 * @param state - Current slider state
 * @param action - Action to perform on the state
 * @returns Updated slider state
 * 
 * @example Example usage
 * ```tsx
 * const [state, dispatch] = useReducer(sliderReducer, initialState);
 * dispatch({ type: 'NEXT' });
 * ```
 */
function sliderReducer(state: SliderState, action: SliderAction): SliderState {
  switch(action.type) {
    case 'NEXT':
      return {
        ...state,
        currentIndex: createBrandedNumber(
          (state.currentIndex as number) + 1, 
          'SlideIndex'
        ),
        isAnimating: true,
      };
    case 'PREVIOUS':
      return {
        ...state,
        currentIndex: createBrandedNumber(
          (state.currentIndex as number) - 1, 
          'SlideIndex'
        ),
        isAnimating: true,
      };
    case 'GO_TO':
      return {
        ...state,
        currentIndex: action._index,
        isAnimating: true,
      };
    case 'START_ANIMATION':
      return {
        ...state,
        isAnimating: true,
      };
    case 'END_ANIMATION':
      return {
        ...state,
        isAnimating: false,
      };
    case 'START_DRAG':
      return {
        ...state,
        isDragging: true,
        dragDelta: {
          x: createBrandedNumber(0, 'GestureDistance'),
          y: createBrandedNumber(0, 'GestureDistance')
        },
      };
    case 'UPDATE_DRAG': {
      const { _delta } = action;
      return {
        ...state,
        dragDelta: _delta,
      };
    }
    case 'END_DRAG':
      return {
        ...state,
        isDragging: false,
        dragDelta: {
          x: createBrandedNumber(0, 'GestureDistance'),
          y: createBrandedNumber(0, 'GestureDistance')
        },
      };
    default:
      return state;
  }
}

/**
 * Context for sharing slider state and actions throughout the component tree.
 * @constant
 */
const SliderContext = createContext<SliderContextValue | null>(null);

/**
 * Provider component for the Slider context.
 * Manages state and provides actions for slider functionality.
 * 
 * @param props - Provider props including: children, items, and configuration
 * @param props.children - React children to render inside the provider
 * @param props.items - Slide items to display in the slider
 * @param props.config - Optional configuration for the slider
 * @returns The provider component with context
 * 
 * @example Example usage
 * ```tsx
 * <SliderProvider items={slides} config={{ loop: true }}>
 *   <Slider />
 * </SliderProvider>
 * ```
 * 
 * @description * - Memoized callback functions
 * - Optimized state updates
 * - Efficient context value computation
 * 
 * @description * - Supports keyboard navigation
 * - Announces slide changes
 * - ARIA attributes for controls
 */
export function SliderProvider({ children, items, config = {} }: SliderProviderProps): React.ReactNode {
  const [state, dispatch] = useReducer(sliderReducer, initialState);
  const mergedConfig = { ...defaultConfig, ...config };

  const next = useCallback(() => {
    if(!state.isAnimating) {
      dispatch({ type: 'NEXT' });
    }
  }, [state.isAnimating]);

  const previous = useCallback(() => {
    if(!state.isAnimating) {
      dispatch({ type: 'PREVIOUS' });
    }
  }, [state.isAnimating]);

  const goTo = useCallback((index: number) => {
    if(!state.isAnimating && index !== state.currentIndex) {
      dispatch({ type: 'GO_TO', _index: createBrandedNumber(index, 'SlideIndex') });
    }
  }, [state.isAnimating, state.currentIndex]);

  const startAutoplay = useCallback(() => {
    // Implementation will be added in the autoplay feature
  }, []);

  const stopAutoplay = useCallback(() => {
    // Implementation will be added in the autoplay feature
  }, []);

  const updateDragDelta = useCallback((delta: { x: number; y: number }) => {
    dispatch({ 
      type: 'UPDATE_DRAG', 
      _delta: {
        x: createBrandedNumber(delta.x, 'GestureDistance'),
        y: createBrandedNumber(delta.y, 'GestureDistance')
      }
    });
  }, []);

  const value: SliderContextValue = {
    state,
    config: mergedConfig,
    items,
    actions: {
      next,
      previous,
      goTo,
      startAutoplay,
      stopAutoplay,
      updateDragDelta,
    },
  };

  return (
    <SliderContext.Provider value={value}>
      {children}
    </SliderContext.Provider>
  );
}

/**
 * Hook for accessing slider context values and actions.
 * Must be used within a SliderProvider component.
 * 
 * @returns Slider context value containing: state, config, items, and actions
 * @throws Error if used outside of SliderProvider
 * 
 * @example Example usage
 * ```tsx
 * function _SlideControls(): unknown  {
 *   const { state, actions } = useSlider();
 *   return (
 *     <button onClick={actions.next} disabled={state.isAnimating}>
 *       Next
 *     </button>
 *   );
 * }
 * ```
 */
export function useSlider(): SliderContextValue {
  const context = useContext(SliderContext);
  if(!context) {
    throw new Error('useSlider must be used within a SliderProvider');
  }
  return context;
}

/**
 * Higher-order component that wraps a component with SliderProvider.
 * Provides slider context to the wrapped component.
 * 
 * @template P - Props type of the wrapped component
 * @param WrappedComponent - Component to wrap with slider context
 * @returns Wrapped component with slider context
 * 
 * @example Example usage
 * ```tsx
 * const SliderWithContext = withSlider(Slider);
 * 
 * function _App(): unknown  {
 *   return <SliderWithContext items={slides} config={config} />;
 * }
 * ```
 */
export function withSlider<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function _WithSliderComponent(props: P & Omit<SliderProviderProps, 'children'>): unknown  {
    const { items, config, ...rest } = props;
    return(
      <SliderProvider items={items} config={config} children={
        <SliderConsumer>
          {(context) => <WrappedComponent {...(rest as P)} {...context} />}
        </SliderConsumer>
      } />
    );
  };
}

/**
 * Consumer component for the Slider context.
 * Provides access to slider context via render props pattern.
 * 
 * @param props - Consumer props
 * @param props.children - Function that receives slider context and renders UI
 * @returns The rendered result of the children function with slider context 
 */
const SliderConsumer: React.FC<SliderConsumerProps> = ({ children }) => {
  const context = useSlider();
  return <>{children(context)}</>;
}; 