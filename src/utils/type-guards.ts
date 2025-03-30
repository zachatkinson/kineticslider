/**
 * Type guard utility functions
 *
 * These functions help validate and narrow types at runtime.
 */
import {
  AnimationId,
  ComponentId,
  GestureId,
  SessionId,
  SlideId,
} from '../types/branded';
import { Slide } from '../types/slider';

/**
 * Checks if a value is a valid SlideId
 */
export function isSlideId(value: unknown): value is SlideId {
  return typeof value === 'string';
}

/**
 * Checks if a value is a valid ComponentId
 */
export function isComponentId(value: unknown): value is ComponentId {
  return typeof value === 'string';
}

/**
 * Checks if a value is a valid AnimationId
 */
export function isAnimationId(value: unknown): value is AnimationId {
  return typeof value === 'string';
}

/**
 * Checks if a value is a valid GestureId
 */
export function isGestureId(value: unknown): value is GestureId {
  return typeof value === 'string';
}

/**
 * Checks if a value is a valid SessionId
 */
export function isSessionId(value: unknown): value is SessionId {
  return typeof value === 'string';
}

/**
 * Type guard for validating a Slide object
 */
export function isValidSlideSchema(value: unknown): value is Slide {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'title' in value &&
    typeof value.title === 'string' &&
    'image' in value &&
    typeof value.image === 'string' &&
    'alt' in value &&
    typeof value.alt === 'string'
  );
}
