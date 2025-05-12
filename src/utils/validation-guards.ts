/**
 * Validation type guard utility functions
 *
 * This file contains type guards that are specific to validating the
 * domain models in the: application, specifically for testing purposes.
 */

import type { Slide, KineticSliderProps } from "../types/slider";
import type { ErrorInfo } from "react";
import { isObject } from "./type-checks";
import { _isValidSlideSchema } from "./type-guards";

/**
 * Type guard for validating a Slide object
 *
 * @param value - Value to check
 *
 * @returns Whether the value is a valid Slide
 *
 */
export function isValidSlide(value: unknown): value is Slide {
  return _isValidSlideSchema(value);
}

/**
 * Type guard for validating KineticSlider props
 *
 * @param value - Value to check
 *
 * @returns Whether the value is valid KineticSliderProps
 *
 */
export function isValidProps(value: unknown): value is KineticSliderProps {
  if (!isObject(value)) return false;

  // Check if slides property exists and is an array
  if (!("slides" in value) || !Array.isArray(value.slides)) {
    return false;
  }

  // Verify all slides are valid
  return value.slides.every((slide) => isValidSlide(slide));
}

/**
 * Type guard for validating ErrorInfo objects
 *
 * @param value - Value to check
 *
 * @returns Whether the value is a valid ErrorInfo
 *
 */
export function isValidErrorInfo(value: unknown): value is ErrorInfo {
  if (!isObject(value)) return false;

  return (
    "name" in value &&
    typeof value.name === "string" &&
    "message" in value &&
    typeof value.message === "string" &&
    "componentStack" in value &&
    typeof value.componentStack === "string"
  );
}
