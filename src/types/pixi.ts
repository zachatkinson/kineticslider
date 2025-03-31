/**
 * Types related to Pixi.js components and functionality
 */

import type { Application, Container, Sprite, Texture } from 'pixi.js';

/**
 * Represents the data for a slide
 */
export interface SlideData {
  /** Unique identifier for the slide */
  id: string;
  /** URL or path to the slide image */
  image: string;
  /** Accessible description of the slide */
  alt: string;
}

/**
 * Props for the PixiApp component
 */
export interface PixiAppProps {
  /** Width of the Pixi application */
  width: number;
  /** Height of the Pixi application */
  height: number;
  /** Background color in hexadecimal format */
  backgroundColor?: number;
  /** Child components */
  children?: React.ReactNode;
  /** Array of slides to display */
  slides: Array<SlideData>;
  /** Callback when the current slide changes */
  onSlideChange?: (index: number) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
}

/**
 * Represents a slide in the Pixi.js context
 */
export interface PixiSlide {
  /** Unique identifier for the slide */
  id?: string;
  /** The Pixi.js sprite instance */
  sprite: Sprite;
  /** The container holding the sprite */
  container: Container;
  /** The Pixi.js application instance (optional) */
  app?: Application;
  /** The texture used by the sprite */
  texture: Texture;
}