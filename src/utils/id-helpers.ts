/**
 * ID helper utility functions
 *
 * Functions for creating and managing branded ID types safely
 */
import {
  AnimationId,
  ComponentId,
  GestureId,
  SessionId,
  SlideId,
} from '../types/branded';

/**
 * Creates a new branded SlideId from a string
 */
export function createSlideId(id: string): SlideId {
  return id as SlideId;
}

/**
 * Creates a new branded ComponentId from a string
 */
export function createComponentId(id: string): ComponentId {
  return id as ComponentId;
}

/**
 * Creates a new branded AnimationId from a string
 */
export function createAnimationId(id: string): AnimationId {
  return id as AnimationId;
}

/**
 * Creates a new branded GestureId from a string
 */
export function createGestureId(id: string): GestureId {
  return id as GestureId;
}

/**
 * Creates a new branded SessionId from a string
 */
export function createSessionId(id: string): SessionId {
  return id as SessionId;
}

/**
 * Generates a random ID string
 */
export function generateId(prefix = ''): string {
  return `${prefix}${Math.random().toString(36).substring(2, 9)}`;
}
