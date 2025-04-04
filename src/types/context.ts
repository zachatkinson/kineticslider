/**
 * Context type definitions and interfaces
 * @module
 * @version 1.0.0
 */

import type { ReactNode } from 'react';
import type { 
  SliderContextValue, 
  SliderConfig, 
  SliderState as _SliderState, 
  SlideItem as _SlideItem,
  SliderAction as _SliderAction,
  SlideIndex as _SlideIndex
} from './slider';
import type { GestureDelta as _GestureDelta } from './gesture';

/**
 * Props for the SliderProvider component
 * @version 1.0.0
 * @example Example usage
 */
export interface SliderProviderProps {
  /** Child components to render */
  children: ReactNode;
  /** Array of slide items to display */
  items: _SlideItem[];
  /** Optional configuration for the slider */
  config?: Partial<SliderConfig>;
}

/**
 * Props for _context consumers using render prop pattern
 * @example Example usage
 */
export interface ContextConsumerProps<T> {
  children: (_context: T) => ReactNode;
}

/**
 * Slider-specific _context consumer props
 * @example Example usage
 */
export interface SliderConsumerProps extends ContextConsumerProps<SliderContextValue> {}

/**
 * Props for components wrapped with slider _context
 * @example Example usage
 */
export interface WithSliderProps {
  items: _SlideItem[];
  config?: Partial<SliderConfig>;
}

// Re-export slider _context types
export type { SliderContextValue }; 