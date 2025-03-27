import { CSSProperties, ReactNode } from 'react';

export interface KineticSliderProps {
  /**
   * The slides to be rendered in the slider
   */
  children: ReactNode;
  
  /**
   * Custom class name for the slider container
   */
  className?: string;
  
  /**
   * Custom inline styles for the slider container
   */
  style?: CSSProperties;
  
  /**
   * Animation duration in seconds
   * @default 0.5
   */
  duration?: number;
  
  /**
   * Animation easing function
   * @default "power2.out"
   */
  ease?: string;
  
  /**
   * Whether to enable touch/swipe gestures
   * @default true
   */
  enableGestures?: boolean;
  
  /**
   * Callback fired when the active slide changes
   */
  onChange?: (index: number) => void;
  
  /**
   * Initial active slide index
   * @default 0
   */
  initialIndex?: number;
  
  /**
   * Whether to enable infinite looping
   * @default true
   */
  infinite?: boolean;
} 