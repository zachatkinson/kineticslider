/**
 * Accessibility utility helper functions
 *
 * Utilities for generating accessibility announcements and messages
 *
 * @module AccessibilityHelpers
 * @version 1.0.0
 */

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
    const navigation = this.generateNavigationAnnouncement(slideIndex, totalSlides);
    
    if (title && description) {
      return `${navigation}. ${title}. ${description}`;
    } else if (title) {
      return `${navigation}. ${title}`;
    } else if (description) {
      return `${navigation}. ${description}`;
    }
    
    return navigation;
  },

  /**
   * Generate loading announcement
   * 
   * @param isLoading - Whether content is loading
   *
   * @param loadingText - Custom loading message
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
    const errorMessage = error instanceof Error ? error.message : error;
    const base = `Error: ${errorMessage}`;
    
    return context ? `${base} in ${context}` : base;
  }
}; 