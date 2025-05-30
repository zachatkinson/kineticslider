import { useState, useCallback } from "react";
import { preloadImage } from "../utils/image";
import type { ImageError } from "../types/image";
import type { UseImagePreloadingOptions, UseImagePreloadingReturn } from "../types/hooks";

/**
 * Custom hook for managing image preloading in slider components
 *
 * @param options - Configuration options for image preloading
 *
 * @returns Object containing preloading state and utilities
 *
 * @example
 * ```tsx
 * const { preloadedImages, loadingStates, preloadImagesForSlide } = useImagePreloading({
 *   lazyLoad: true,
 *   onError: (error) => console.error('Image failed to load:', error),
 *   onAnalytics: () => trackImageLoad()
 * });
 * 
 * useEffect(() => {
 *   preloadImagesForSlide(currentSlide, slides);
 * }, [currentSlide, slides, preloadImagesForSlide]);
 * ```
 */
export function useImagePreloading(options: UseImagePreloadingOptions = {}): UseImagePreloadingReturn {
  const { lazyLoad = true, onError, onAnalytics } = options;

  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set());
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const preloadImagesForSlide = useCallback(
    (currentSlide: number, slides: Array<{ image?: string }>): (() => void) => {
      if (!lazyLoad) return () => {};

      // Preload current and adjacent slides
      const slidesToPreload = [
        slides[currentSlide]?.image,
        slides[(currentSlide + 1) % slides.length]?.image,
        slides[(currentSlide - 1 + slides.length) % slides.length]?.image,
      ].filter(Boolean) as string[];

      const cleanupFns = slidesToPreload.map((src) =>
        preloadImage(src, {
          onLoad: () => {
            setPreloadedImages((prev) => new Set([...prev, src]));
            setLoadingStates((prev) => ({ ...prev, [src]: false }));
          },
          onError: (error: ImageError) => {
            setLoadingStates((prev) => ({ ...prev, [src]: false }));
            onError?.(error);
          },
          onAnalytics: () => {
            onAnalytics?.();
          },
        }),
      );

      return () => {
        cleanupFns.forEach((cleanup) => cleanup());
      };
    },
    [lazyLoad, onError, onAnalytics],
  );

  return {
    preloadedImages,
    loadingStates,
    preloadImagesForSlide,
  };
} 