/**
 * @fileoverview Sprite Helper Utilities
 *
 * Utility functions for common sprite operations to eliminate DRY violations.
 * Provides type-safe access to extended sprite properties and common calculations.
 *
 * @version 1.0.0
 */

import type { Sprite } from 'pixi.js';
import { SCALE } from './constants';

// Type-safe sprite with baseScale property
type SpriteWithBaseScale = Sprite & { baseScale?: number };

/**
 * Get the base scale value from a sprite, with fallback to default
 *
 * Eliminates DRY violation: (sprite as any).baseScale || SCALE.DEFAULT
 * Used throughout physics calculations for consistent scale references.
 */
export const getBaseScale = (sprite: Sprite): number => {
  return (sprite as SpriteWithBaseScale).baseScale || SCALE.DEFAULT;
};

/**
 * Set the base scale value on a sprite
 *
 * Provides type-safe way to set the custom baseScale property
 * that physics calculations rely on.
 */
export const setBaseScale = (sprite: Sprite, scale: number): void => {
  (sprite as SpriteWithBaseScale).baseScale = scale;
};

/**
 * Calculate final scale value from base scale and multiplier
 *
 * Common pattern used in scale animations and transitions.
 */
export const calculateFinalScale = (
  sprite: Sprite,
  scaleMultiplier: number
): number => {
  const baseScale = getBaseScale(sprite);
  return baseScale * scaleMultiplier;
};

/**
 * Apply scale to both X and Y axes of a sprite
 *
 * Common pattern for uniform scaling operations.
 */
export const applyUniformScale = (sprite: Sprite, scale: number): void => {
  sprite.scale.set(scale, scale);
};

/**
 * Normalize sprite scale values to ensure they're within valid bounds
 *
 * Prevents invalid scale values that could break rendering.
 */
export const normalizeScale = (scale: number): number => {
  return Math.max(SCALE.MIN, Math.min(SCALE.MAX, scale));
};

/**
 * Get normalized scale factor from drag distance
 *
 * Common calculation pattern used in drag interactions.
 */
export const calculateDragScaleFactor = (
  dragDistance: number,
  threshold: number,
  intensity: number
): number => {
  const normalizedFactor = Math.min(Math.abs(dragDistance) / threshold, 1);
  return 1 + normalizedFactor * intensity;
};
