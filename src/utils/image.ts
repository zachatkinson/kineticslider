/**
 * Image utility functions
 */

import {
  ImageError,
  ImageAnalyticsData,
  PreloadImageOptions,
} from "../types/image";

/**
 * Preloads an image and tracks its loading state
 *
 * @param src The source URL of the image to preload
 *
 * @param options Configuration options for preloading
 *
 * @returns A cleanup function to abort loading if needed
 *
 */
export const preloadImage = (
  src: string,
  options: PreloadImageOptions = {},
) => {
  const { onLoad, onError, onAnalytics } = options;
  const img = new Image();
  img.src = src;

  img.onload = () => {
    onLoad?.();
    onAnalytics?.({
      eventType: "load",
      timestamp: new Date().toISOString(),
    });
  };

  img.onerror = () => {
    const error: ImageError = new Error(`Failed to preload image: ${src}`);
    error.code = "IMAGE_PRELOAD_ERROR";
    error.src = src;

    const analyticsData: ImageAnalyticsData = {
      eventType: "_error",
      timestamp: new Date().toISOString(),
      _error: error,
    };

    onAnalytics?.(analyticsData);
    onError?.(error);
  };

  return () => {
    img.src = "";
    img.onload = null;
    img.onerror = null;
  };
};
