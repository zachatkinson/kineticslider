/**
 * Image utility types
 */

export interface ImageError extends Error {
  code?: string;
  src?: string;
}

export interface ImageAnalyticsData {
  eventType: 'error' | 'load';
  timestamp: string;
  error?: ImageError;
  index?: number;
}

export interface PreloadImageOptions {
  onLoad?: () => void;
  onError?: (error: ImageError) => void;
  onAnalytics?: (data: ImageAnalyticsData) => void;
} 