/**
 * Accessibility utilities for screen reader announcements and focus management
 * Provides a singleton announcer class and helper functions for ARIA announcements
 */
import { AnnouncementPriority, AnnouncerOptions } from "../types/a11y";

/**
 * AriaAnnouncer class for managing screen reader announcements
 *
 * @example Example usage
 */
export class AriaAnnouncer {
  private static instance: AriaAnnouncer;
  private politeRegion: HTMLElement | null = null;
  private assertiveRegion: HTMLElement | null = null;
  private options: Required<AnnouncerOptions>;
  private clearTimeouts: Map<string, number> = new Map();

  private constructor(options: AnnouncerOptions = {}) {
    this.options = {
      politeLiveRegionId: options.politeLiveRegionId || "aria-announcer-polite",
      assertiveLiveRegionId:
        options.assertiveLiveRegionId || "aria-announcer-assertive",
      createRegions:
        options.createRegions !== undefined ? options.createRegions : true,
      politeDuration: options.politeDuration || 5000,
      assertiveDuration: options.assertiveDuration || 3000,
    };

    // Initialize live regions on client side only
    if (typeof document !== "undefined") {
      this.initLiveRegions();
    }
  }

  /**
   * Gets or creates the singleton instance of AriaAnnouncer
   *
   * @param options Configuration options for the announcer
   *
   * @returns {AriaAnnouncer} The singleton AriaAnnouncer instance
   *
   */
  public static getInstance(options?: AnnouncerOptions): AriaAnnouncer {
    if (!AriaAnnouncer.instance) {
      AriaAnnouncer.instance = new AriaAnnouncer(options);
    }
    return AriaAnnouncer.instance;
  }

  /**
   * Make an announcement to screen readers
   *
   * @param message The message to announce
   *
   * @param priority The announcement priority (polite or assertive)
   *
   */
  public announce(
    message: string,
    priority: AnnouncementPriority = AnnouncementPriority.POLITE,
  ): void {
    if (typeof document === "undefined") return;

    const region =
      priority === AnnouncementPriority.ASSERTIVE
        ? this.assertiveRegion
        : this.politeRegion;

    if (!region) {
      console.warn("Live region not available for screen reader announcement");
      return;
    }

    // Clear any existing timeout for this region
    const timeoutId = this.clearTimeouts.get(priority);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }

    // To ensure announcement is: made, we first clear the region
    region.textContent = "";

    // Then set the message after a short delay - this ensures screen readers detect the change
    setTimeout(() => {
      region.textContent = message;

      // Clear message after duration to avoid repeated announcements
      const clearTimeout = window.setTimeout(
        () => {
          if (region) region.textContent = "";
        },
        priority === AnnouncementPriority.ASSERTIVE
          ? this.options.assertiveDuration
          : this.options.politeDuration,
      );

      this.clearTimeouts.set(priority, clearTimeout);
    }, 50);
  }

  /**
   * Creates or finds live regions for screen reader announcements
   */
  private initLiveRegions(): void {
    // First try to find existing regions
    this.politeRegion = document.getElementById(
      this.options.politeLiveRegionId,
    );
    this.assertiveRegion = document.getElementById(
      this.options.assertiveLiveRegionId,
    );

    // Create regions if needed
    if (!this.politeRegion && this.options.createRegions) {
      this.politeRegion = this.createLiveRegion(
        this.options.politeLiveRegionId,
        AnnouncementPriority.POLITE,
      );
      document.body.appendChild(this.politeRegion);
    }

    if (!this.assertiveRegion && this.options.createRegions) {
      this.assertiveRegion = this.createLiveRegion(
        this.options.assertiveLiveRegionId,
        AnnouncementPriority.ASSERTIVE,
      );
      document.body.appendChild(this.assertiveRegion);
    }
  }

  /**
   * Creates a live region element with appropriate ARIA attributes
   *
   * @param id The ID to assign to the live region
   *
   * @param priority The announcement priority (polite or assertive)
   *
   * @returns {HTMLElement} The created live region element
   *
   */
  private createLiveRegion(
    id: string,
    priority: AnnouncementPriority,
  ): HTMLElement {
    const region = document.createElement("div");
    region.id = id;
    region.setAttribute("aria-live", priority);
    region.setAttribute("aria-atomic", "true");
    region.setAttribute("role", "status");

    // Visually hide but keep available to screen readers
    Object.assign(region.style, {
      position: "absolute",
      width: "1px",
      height: "1px",
      padding: "0",
      overflow: "hidden",
      clip: "rect(0, 0, 0, 0)",
      whiteSpace: "nowrap",
      border: "0",
    });

    return region;
  }

  /**
   * Cleanup announcer resources
   */
  public dispose(): void {
    this.clearTimeouts.forEach((id) => window.clearTimeout(id));

    if (this.politeRegion?.parentNode && this.options.createRegions) {
      this.politeRegion.parentNode.removeChild(this.politeRegion);
    }

    if (this.assertiveRegion?.parentNode && this.options.createRegions) {
      this.assertiveRegion.parentNode.removeChild(this.assertiveRegion);
    }
  }
}

// Helper hook for React components
export const announcer = AriaAnnouncer.getInstance();

/**
 * Announce a message to screen readers
 *
 * @param message Message to announce
 *
 * @param priority Priority of the announcement
 *
 */
export function announce(
  message: string,
  priority: AnnouncementPriority = AnnouncementPriority.POLITE,
): void {
  announcer.announce(message, priority);
}

/**
 * Announce errors to screen readers in an assertive manner
 *
 * @param error Error to announce
 *
 * @returns {ReturnType} The return value
 *
 */
export function _announceError(error: Error | string): void {
  const message = typeof error === "string" ? error : error.message;
  announcer.announce(`Error: ${message}`, AnnouncementPriority.ASSERTIVE);
}

/**
 * Announce slide changes to screen readers
 *
 * @param slideIndex Current slide index
 *
 * @param totalSlides Total number of slides
 *
 * @param slideTitle Optional slide title
 *
 * @returns {ReturnType} The return value
 *
 */
export function _announceSlideChange(
  slideIndex: number,
  totalSlides: number,
  slideTitle?: string,
): void {
  const slideNumber = slideIndex + 1;
  let message = `Slide ${slideNumber} of ${totalSlides}`;

  if (slideTitle) {
    message += `, ${slideTitle}`;
  }

  announcer.announce(message);
}
