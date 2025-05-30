/**
 * Branded type utility helper functions
 *
 * Helper functions for creating and working with branded types safely
 *
 * @module BrandedHelpers
 * @version 1.0.0
 */

import type {
  Brand,
  SliderId,
  ComponentId,
  AnimationId,
  GestureId,
  SessionId,
  ElementId,
} from "../types/branded";

/**
 * Helper function for creating branded types
 *
 * @param value - The value to brand
 *
 * @param _brand - The brand to apply (unused)
 *
 * @returns The branded value
 *
 * @example
 * ```ts
 * const id = createBrandedId("user-123", "UserId");
 * ```
 */
export function createBrandedId<T extends string>(
  value: string,
  _brand: T,
): Brand<string, T> {
  return value as Brand<string, T>;
}

/**
 * Helper for creating branded number types
 *
 * @param value - The value to brand
 *
 * @param _brand - The brand to apply (unused)
 *
 * @returns The branded value
 *
 * @example
 * ```ts
 * const duration = createBrandedNumber(1000, "Duration");
 * ```
 */
export function createBrandedNumber<T extends string>(
  value: number,
  _brand: T,
): Brand<number, T> {
  return value as Brand<number, T>;
}

/**
 * Creates a branded slider ID from a string or number
 *
 * @param value - The value to convert to a slider ID
 *
 * @returns The branded slider ID
 *
 * @example
 * ```ts
 * const sliderId = createSliderId("slide-1");
 * const slideIdFromNumber = createSliderId(123);
 * ```
 */
export function createSliderId(value: string | number): SliderId {
  return String(value) as SliderId;
}

/**
 * Creates a branded component ID from a string or number
 *
 * @param value - The value to convert to a component ID
 *
 * @returns The branded component ID
 *
 * @example
 * ```ts
 * const componentId = createComponentId("button-1");
 * ```
 */
export function createComponentId(value: string | number): ComponentId {
  return String(value) as ComponentId;
}

/**
 * Creates a branded animation ID from a string or number
 *
 * @param value - The value to convert to an animation ID
 *
 * @returns The branded animation ID
 *
 * @example
 * ```ts
 * const animationId = createAnimationId("fade-in");
 * ```
 */
export function createAnimationId(value: string | number): AnimationId {
  return String(value) as AnimationId;
}

/**
 * Creates a branded gesture ID from a string or number
 *
 * @param value - The value to convert to a gesture ID
 *
 * @returns The branded gesture ID
 *
 * @example
 * ```ts
 * const gestureId = createGestureId("swipe-left");
 * ```
 */
export function createGestureId(value: string | number): GestureId {
  return String(value) as GestureId;
}

/**
 * Creates a branded session ID from a string or number
 *
 * @param value - The value to convert to a session ID
 *
 * @returns The branded session ID
 *
 * @example
 * ```ts
 * const sessionId = createSessionId("session-abc123");
 * ```
 */
export function createSessionId(value: string | number): SessionId {
  return String(value) as SessionId;
}

/**
 * Creates a branded element ID from a string or number
 *
 * @param value - The value to convert to an element ID
 *
 * @returns The branded element ID
 *
 * @example
 * ```ts
 * const elementId = createElementId("element-1");
 * ```
 */
export function createElementId(value: string | number): ElementId {
  return String(value) as ElementId;
}

/**
 * Type guard for SliderId
 *
 * @param value - The value to check
 *
 * @returns True if the value is a valid SliderId
 *
 * @example
 * ```ts
 * if (isSliderId(someValue)) {
 *   // someValue is now typed as SliderId
 * }
 * ```
 */
export function isSliderId(value: unknown): value is SliderId {
  return typeof value === "string" && value.length > 0;
}

/**
 * Type guard for ComponentId
 *
 * @param value - The value to check
 *
 * @returns True if the value is a valid ComponentId
 *
 * @example
 * ```ts
 * if (isComponentId(someValue)) {
 *   // someValue is now typed as ComponentId
 * }
 * ```
 */
export function isComponentId(value: unknown): value is ComponentId {
  return typeof value === "string" && value.length > 0;
}

/**
 * Validates and creates a SliderId with error checking
 *
 * @param id - The ID string to convert to a SliderId
 *
 * @returns The branded SliderId
 *
 * @throws Error if the ID is invalid
 *
 * @example
 * ```ts
 * try {
 *   const sliderId = validateAndCreateSliderId("slide-1");
 * } catch (error) {
 *   console.error("Invalid slider ID");
 * }
 * ```
 */
export function validateAndCreateSliderId(id: string): SliderId {
  if (!id || typeof id !== "string" || id.trim().length === 0) {
    throw new Error("Invalid slider id: must be a non-empty string");
  }
  return id.trim() as SliderId;
} 