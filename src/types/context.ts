/**
 * Context type definitions and interfaces
 * @module
 * @version 1.0.0
 */

import type { ReactNode } from 'react';
import type { 
  SliderContextValue, 
  SliderConfig, 
  SliderState, 
  SlideItem,
  SliderAction,
  SlideIndex
} from './slider';
import type { GestureDelta } from './gesture';

/**
 * Props for the SliderProvider component
 * @version 1.0.0
 */
export interface SliderProviderProps {
  /** Child components to render */
  children: ReactNode;
  /** Array of slide items to display */
  items: SlideItem[];
  /** Optional configuration for the slider */
  config?: Partial<SliderConfig>;
}

/**
 * Props for context consumers using render prop pattern
 */
export interface ContextConsumerProps<T> {
  children: (context: T) => ReactNode;
}

/**
 * Slider-specific context consumer props
 */
export interface SliderConsumerProps extends ContextConsumerProps<SliderContextValue> {}

/**
 * Props for components wrapped with slider context
 */
export interface WithSliderProps {
  items: SlideItem[];
  config?: Partial<SliderConfig>;
}

// Re-export slider context types
export type { SliderContextValue }; 