import React from 'react';

/**
 * A simple loading indicator component for general use.
 * Displays a basic text-based loading message with proper ARIA attributes.
 *
 * @component
 * @version 1.0.0
 * @example
 * ```tsx
 * <Loading />
 * ```
 *
 * @accessibility
 * - Uses progressbar role for semantic meaning
 * - Provides descriptive ARIA label for screen readers
 * - Announces loading state to assistive technologies
 * 
 * @returns A div element with loading text and appropriate ARIA attributes
 * 
 * @see LoadingIndicator - For a more visual loading indicator with spinner
 * @see KineticSlider - Parent component where this loading state is commonly used
 */
export const Loading = () => (
  <div role="progressbar" aria-label="Loading slides" className="kinetic-slider-loading">
    Loading...
  </div>
);

/**
 * A centered loading indicator component with spinner animation.
 * Provides a more visually appealing loading state with a centered spinner animation.
 *
 * @component
 * @version 1.0.0
 * @example
 * ```tsx
 * <LoadingIndicator />
 * ```
 *
 * @accessibility
 * - Uses progressbar role for semantic meaning
 * - Provides descriptive ARIA label for screen readers
 * - Announces loading state to assistive technologies
 * - Maintains visibility during slide transitions
 *
 * @styling
 * - Absolutely positioned in center of container
 * - Uses z-index: 10 to ensure visibility above other content
 * - Includes animated spinner for visual feedback
 * - Maintains consistent positioning during transitions
 * 
 * @returns A centered div containing a spinning loading indicator with appropriate ARIA attributes
 * 
 * @see Loading - For a simpler text-based loading indicator
 * @see KineticSlider - Parent component where this loading state is commonly used
 */
export const LoadingIndicator = () => (
  <div 
    className="kinetic-slider-loading" 
    role="progressbar" 
    aria-label="Loading slide"
    style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 10
    }}
  >
    <div className="kinetic-slider-loading-spinner"></div>
  </div>
); 