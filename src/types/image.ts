/**
 * Image utility types
 */

export interface ImageError extends Error {
  code?: string;
  src?: string;
}

export interface ImageAnalyticsData {
  eventType: "_error" | "load";
  timestamp: string;
  _error?: ImageError;
  index?: number;
}

export interface PreloadImageOptions {
  onLoad?: () => void;
  onError?: (_error: ImageError) => void;
  onAnalytics?: (_data: ImageAnalyticsData) => void;
}
