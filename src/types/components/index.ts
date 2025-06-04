/**
 * Component-specific type definitions
 * 
 * This file centralizes all component-specific type definitions to improve
 * organization and reduce duplication across the codebase.
 */

import type { ReactNode } from 'react';
import type { Slide } from '../slider';
import type { ErrorInfo } from '../error';

/**
 * Error boundary component props
 * 
 * @example
 * ```tsx
 * const props: ErrorBoundaryProps = {
 *   children: <MyComponent />,
 *   fallback: <ErrorMessage />,
 *   onError: (error, errorInfo) => console.error(error),
 *   maxRetries: 3
 * };
 * ```
 */
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, retry: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  skipRecoveryUi?: boolean;
  nestLevel?: string;
}

/**
 * Error boundary component state
 * 
 * @example
 * ```tsx
 * const state: ErrorBoundaryState = {
 *   hasError: false,
 *   error: null,
 *   errorInfo: null,
 *   retryCount: 0
 * };
 * ```
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

/**
 * PIXI error boundary component state
 *
 * @example
 * ```tsx
 * const state: PixiErrorBoundaryState = {
 *   hasError: false,
 *   error: null
 * };
 * ```
 */
export interface PixiErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Slide form component props
 * 
 * @example
 * ```tsx
 * const props: SlideFormProps = {
 *   slide: {
 *     id: '1',
 *     title: 'Sample Slide',
 *     description: 'Description',
 *     imageUrl: 'image.jpg'
 *   },
 *   onSubmit: (slide) => console.log(slide),
 *   isLoading: false
 * };
 * ```
 */
export interface SlideFormProps {
  slide?: Slide;
  onSubmit: (slide: Slide) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
  validationRules?: Record<string, unknown>;
}

/**
 * Props for the base slider component
 *
 * @example
 * ```tsx
 * const props: BaseSliderProps = {
 *   slides: [
 *     {
 *       id: '1',
 *       content: <div>Slide 1</div>,
 *       metadata: { title: 'First Slide' }
 *     }
 *   ],
 *   slideWidth: 800,
 *   slideHeight: 600,
 *   config: {
 *     initialSlide: 0,
 *     loop: true,
 *     autoplay: false
 *   }
 * };
 * ```
 */
export interface BaseSliderProps {
  slides: Array<{
    id: string;
    content: ReactNode;
    metadata?: Record<string, unknown>;
  }>;
  slideWidth: number;
  slideHeight: number;
  config?: {
    initialSlide?: number;
    loop?: boolean;
    autoplay?: boolean;
    autoplayDelay?: number;
    gestureThreshold?: number;
    gestureDirection?: 'horizontal' | 'vertical';
  };
}

/**
 * Window interface extensions for testing utilities
 *
 * @example
 * ```tsx
 * // Usage in tests
 * window.setErrorBoundaryRecovery?.(true);
 * window.shouldRecover = false;
 * ```
 */
export interface WindowExtensions {
  setErrorBoundaryRecovery?: (value: boolean) => void;
  shouldRecover?: boolean;
}

// Extend global Window interface
declare global {
  interface Window extends WindowExtensions {}
}

/**
 * Navigation component props
 * 
 * @example
 * ```tsx
 * const props: NavigationProps = {
 *   currentIndex: 0,
 *   totalSlides: 5,
 *   onNavigate: (index) => console.log(index),
 *   disabled: false
 * };
 * ```
 */
export interface NavigationProps {
  currentIndex: number;
  totalSlides: number;
  onNavigate: (index: number) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  disabled?: boolean;
  showIndicators?: boolean;
  ariaLabel?: string;
}

/**
 * Loading component props
 * 
 * @example
 * ```tsx
 * const props: LoadingProps = {
 *   isLoading: true,
 *   message: 'Loading content...',
 *   size: 'medium',
 *   overlay: true
 * };
 * ```
 */
export interface LoadingProps {
  isLoading: boolean;
  message?: string;
  size?: 'small' | 'medium' | 'large';
  overlay?: boolean;
  className?: string;
  children?: ReactNode;
} 