/**
 * Accessibility Announcements Hook
 * 
 * Custom hook for managing accessibility announcements and live regions.
 * Provides a centralized way to handle screen reader announcements.
 * 
 * @module useAccessibilityAnnouncements
 * @version 1.0.0
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { UseAccessibilityAnnouncementsOptions, UseAccessibilityAnnouncementsReturn } from '../types/hooks/index';

/**
 * Hook for managing accessibility announcements
 * 
 * @param options - Configuration options
 *
 * @returns Object with announcement state and functions
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { announcement, announce, liveRegionProps } = useAccessibilityAnnouncements({
 *     politeness: 'polite',
 *     autoClear: true,
 *     clearDelay: 3000
 *   });
 * 
 *   const handleNavigation = () => {
 *     announce('Navigated to slide 2 of 5');
 *   };
 * 
 *   return (
 *     <div>
 *       <button onClick={handleNavigation}>Next</button>
 *       <div {...liveRegionProps} style={{ position: 'absolute', left: '-10000px' }}>
 *         {announcement}
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
export function useAccessibilityAnnouncements(
  options: UseAccessibilityAnnouncementsOptions = {}
): UseAccessibilityAnnouncementsReturn {
  const {
    politeness = 'polite',
    autoClear = true,
    clearDelay = 3000,
    deduplicate = true
  } = options;

  const [announcement, setAnnouncement] = useState('');
  const lastAnnouncementRef = useRef<string>('');
  const clearTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Make an accessibility announcement
   */
  const announce = useCallback((message: string) => {
    // Skip if deduplicating and message is the same as last
    if (deduplicate && message === lastAnnouncementRef.current) {
      return;
    }

    // Clear any existing timeout
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
      clearTimeoutRef.current = null;
    }

    // Set the announcement
    setAnnouncement(message);
    lastAnnouncementRef.current = message;

    // Auto-clear if enabled
    if (autoClear && clearDelay > 0) {
      clearTimeoutRef.current = setTimeout(() => {
        setAnnouncement('');
        clearTimeoutRef.current = null;
      }, clearDelay);
    }
  }, [deduplicate, autoClear, clearDelay]);

  /**
   * Clear the current announcement
   */
  const clearAnnouncement = useCallback(() => {
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current);
      clearTimeoutRef.current = null;
    }
    setAnnouncement('');
    lastAnnouncementRef.current = '';
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clearTimeoutRef.current) {
        clearTimeout(clearTimeoutRef.current);
      }
    };
  }, []);

  return {
    announcement,
    announce,
    clearAnnouncement,
    liveRegionProps: {
      'aria-live': politeness,
      'aria-atomic': true,
      role: 'status'
    }
  };
}

/**
 * Utility functions for common announcement patterns
 */
export const announcementHelpers = {
  /**
   * Generate navigation announcement
   * 
   * @param slideIndex - Current slide index (0-based)
   *
   * @param totalSlides - Total number of slides
   *
   * @param context - Additional context (e.g., 'first', 'last')
   * 
   * @returns Formatted announcement string
   *
   */
  generateNavigationAnnouncement(
    slideIndex: number,
    totalSlides: number,
    context?: 'first' | 'last' | string
  ): string {
    const slideNumber = slideIndex + 1;
    const base = `Slide ${slideNumber} of ${totalSlides}`;
    
    if (context === 'first') {
      return `${base}, first slide`;
    } else if (context === 'last') {
      return `${base}, last slide`;
    } else if (context) {
      return `${base}, ${context}`;
    }
    
    return base;
  },

  /**
   * Generate slide content announcement
   * 
   * @param slideIndex - Current slide index (0-based)
   *
   * @param totalSlides - Total number of slides
   *
   * @param title - Slide title
   *
   * @param description - Optional slide description
   * 
   * @returns Formatted announcement string
   *
   */
  generateSlideContentAnnouncement(
    slideIndex: number,
    totalSlides: number,
    title?: string,
    description?: string
  ): string {
    const slideNumber = slideIndex + 1;
    let announcement = `Slide ${slideNumber} of ${totalSlides}`;
    
    if (title) {
      announcement += `, ${title}`;
    }
    
    if (description) {
      announcement += `, ${description}`;
    }
    
    return announcement;
  },

  /**
   * Generate loading announcement
   * 
   * @param isLoading - Whether content is loading
   *
   * @param loadingText - Custom loading text
   * 
   * @returns Formatted announcement string
   *
   */
  generateLoadingAnnouncement(
    isLoading: boolean,
    loadingText: string = 'Loading content'
  ): string {
    return isLoading ? loadingText : 'Content loaded';
  },

  /**
   * Generate error announcement
   * 
   * @param error - Error object or message
   *
   * @param context - Additional context
   * 
   * @returns Formatted announcement string
   *
   */
  generateErrorAnnouncement(
    error: Error | string,
    context?: string
  ): string {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const base = `Error: ${errorMessage}`;
    
    return context ? `${base} in ${context}` : base;
  }
}; 