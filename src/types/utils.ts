/**
 * Utility-related type definitions
 *
 * This module contains type definitions for utility functions,
 * including performance monitoring, form helpers, and other utilities.
 *
 * @module Utils
 * @version 1.0.0
 */

import type { ValidationResult, ValidationContext, Validator, AsyncValidator } from "./validation";

/**
 * Performance sample interface for monitoring
 *
 * @interface PerformanceSample
 * @example
 * ```typescript
 * const sample: PerformanceSample = {
 *   timestamp: Date.now(),
 *   fps: 60,
 *   memory: {
 *     used: 50000000,
 *     limit: 100000000
 *   }
 * };
 * ```
 */
export interface PerformanceSample {
  timestamp: number;
  fps: number;
  memory?: {
    used: number;
    limit: number;
  };
}

/**
 * Frame callback function type for animation loops
 *
 * @example
 * ```typescript
 * const frameCallback: FrameCallback = (timestamp) => {
 *   console.log('Frame at:', timestamp);
 * };
 * ```
 */
export type FrameCallback = (timestamp: number) => void;

/**
 * Field validation result interface
 *
 * @interface FieldValidationResult
 * @example
 * ```typescript
 * const result: FieldValidationResult = {
 *   isValid: true,
 *   message: 'Field is valid'
 * };
 * ```
 */
export interface FieldValidationResult {
  isValid: boolean;
  message: string;
}

/**
 * Validator function type for form fields
 *
 * @example
 * ```typescript
 * const emailValidator: FormValidator = (value) => ({
 *   isValid: /\S+@\S+\.\S+/.test(value),
 *   message: value ? '' : 'Please enter a valid email'
 * });
 * ```
 */
export type FormValidator = (value: string) => FieldValidationResult;

/**
 * Formatter function type for form fields
 *
 * @example
 * ```typescript
 * const phoneFormatter: Formatter = (value) => {
 *   return value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
 * };
 * ```
 */
export type Formatter = (value: string) => string;

/**
 * Error handler function type
 *
 * @example
 * ```typescript
 * const errorHandler: ErrorHandlerFunction = (error, errorType) => {
 *   console.error(`${errorType}:`, error.message);
 * };
 * ```
 */
export type ErrorHandlerFunction = (error: Error, errorType: string) => void;

/**
 * Error handling options interface
 *
 * @interface ErrorHandlingOptions
 * @example
 * ```typescript
 * const options: ErrorHandlingOptions = {
 *   capturePromiseRejections: true,
 *   captureConsoleErrors: false,
 *   reportToAnalytics: true,
 *   logToConsole: process.env.NODE_ENV !== 'production'
 * };
 * ```
 */
export interface ErrorHandlingOptions {
  capturePromiseRejections?: boolean;
  captureConsoleErrors?: boolean;
  reportToAnalytics?: boolean;
  logToConsole?: boolean;
}

/**
 * Performance data interface for internal tracking
 *
 * @interface PerformanceData
 * @example
 * ```typescript
 * const perfData: PerformanceData = {
 *   timestamp: Date.now(),
 *   metric: 'render-time',
 *   value: 16.7
 * };
 * ```
 */
export interface PerformanceData {
  timestamp: number;
  metric: string;
  value: number;
}

/**
 * Generic validator function type
 *
 * @example
 * ```typescript
 * const slideValidator: GenericValidator<Slide> = (slide, context) => {
 *   return slide.id && slide.title ? null : 'Invalid slide';
 * };
 * ```
 */
export type GenericValidator<T> = (
  value: T,
  context?: ValidationContext
) => string | null;

/**
 * Generic async validator function type
 *
 * @example
 * ```typescript
 * const asyncValidator: GenericAsyncValidator<string> = async (value) => {
 *   const response = await fetch(`/validate?value=${value}`);
 *   return response.ok ? null : 'Validation failed';
 * };
 * ```
 */
export type GenericAsyncValidator<T> = (
  value: T,
  context?: ValidationContext
) => Promise<string | null>;

// Re-export validation types for convenience
export type { ValidationResult, ValidationContext, Validator, AsyncValidator }; 