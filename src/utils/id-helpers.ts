/**
 * ID helper utility functions
 *
 * Functions for creating and managing branded ID types safely
 *
 * @returns {ReturnType} The return value
 *
 */
import {
  AnimationId,
  ComponentId,
  GestureId,
  SessionId,
  SliderId,
} from "../types/branded";

/**
 * Creates a new branded SliderId from a string
 *
 * @param id
 *
 * @returns {unknown} - The return value
 *
 */
export function createSlideId(id: string): SliderId {
  return id as SliderId;
}

/**
 * Creates a new branded ComponentId from a string
 *
 * @param id
 *
 * @returns {ReturnType} The return value
 *
 */
export function createComponentId(id: string): ComponentId {
  return id as ComponentId;
}

/**
 * Creates a new branded AnimationId from a string
 *
 * @param id
 *
 * @returns {ReturnType} The return value
 *
 */
export function createAnimationId(id: string): AnimationId {
  return id as AnimationId;
}

/**
 * Creates a new branded GestureId from a string
 *
 * @param id
 *
 * @returns {ReturnType} The return value
 *
 */
export function createGestureId(id: string): GestureId {
  return id as GestureId;
}

/**
 * Creates a new branded SessionId from a string
 *
 * @param id
 *
 * @returns {ReturnType} The return value
 *
 */
export function createSessionId(id: string): SessionId {
  return id as SessionId;
}

/**
 * Generates a random ID string
 *
 * @param prefix
 *
 * @returns {ReturnType} The return value
 *
 */
export function generateId(prefix = ""): string {
  return `${prefix}${Math.random().toString(36).substring(2, 9)}`;
}
