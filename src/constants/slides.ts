import { Slide } from '../types';

/**
 * Slide configuration module.
 * Provides default configuration for slide creation and management.
 * 
 * @module
 * @version 1.0.0
 * @example
 * ```typescript
 * import { DEFAULT_SLIDE } from './slides';
 * 
 * const newSlide = {
 *   ...DEFAULT_SLIDE,
 *   title: 'New Slide',
 *   image: '/path/to/image.jpg'
 * };
 * ```
 * 
 * @see {@link Slide} for the complete slide type definition
 */

/**
 * Default slide properties used when creating a new slide.
 * Provides empty string defaults for required slide properties.
 * 
 * @constant
 * @type {Partial<Slide>}
 * 
 * @example
 * ```typescript
 * import { DEFAULT_SLIDE } from './slides';
 * 
 * function createSlide(title: string): Slide {
 *   return {
 *     ...DEFAULT_SLIDE,
 *     title,
 *     id: generateUniqueId()
 *   };
 * }
 * ```
 * 
 * @accessibility
 * - Includes alt text field for images
 * - Supports descriptive titles
 * 
 * @performance
 * - Minimal default properties
 * - Type-safe partial implementation
 */
export const DEFAULT_SLIDE: Partial<Slide> = {
  title: '',
  description: '',
  image: '',
  alt: '',
};
