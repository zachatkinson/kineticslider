import { ErrorInfo, ReactNode } from 'react';

import type { Slide } from './slider';

/**
 * Props for the ErrorBoundary component
 */
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, retry: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
}

/**
 * State for the ErrorBoundary component
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

/**
 * Props for the SlideForm component
 */
export interface SlideFormProps {
  initialSlide?: Partial<Slide>;
  onSave: (slide: Slide) => void;
  onCancel: () => void;
}
