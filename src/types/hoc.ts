/**
 * Higher-order component type definitions
 *
 * @module
 * @version 1.0.0
 */

import type { ComponentType, FC } from "react";
import type { ErrorBoundaryProps } from "./components";

/**
 * Type for a component wrapped with an error boundary
 */
export type WithErrorBoundary = <P extends object>(
  Component: ComponentType<P>,
  errorBoundaryProps: Omit<ErrorBoundaryProps, "children">,
) => FC<P>;

/**
 * Type for a component wrapped with performance monitoring
 */
export type WithPerformanceMonitoring = <P extends object>(
  Component: ComponentType<P>,
  options?: {
    measureRender?: boolean;
    measureEffects?: boolean;
    measureUpdates?: boolean;
  },
) => FC<P>;
