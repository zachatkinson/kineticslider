/**
 * @fileoverview ScreenReaderSupport - Screen reader announcements and live regions
 *
 * Manages screen reader announcements, live regions, and contextual updates
 * for improved accessibility. Implements polite and assertive announcement strategies.
 *
 * @version 1.0.0
 */

import { SimpleEventEmitter } from '../core/event-emitter';
import { SLIDER_EVENTS } from '../core/constants';
import type { AriaLabelsConfig } from '../core/types';
import { debugLogger } from '../utils/debug-logger';

/**
 * Announcement priority levels
 */
export type AnnouncementPriority = 'polite' | 'assertive';

/**
 * Announcement queue item
 */
interface QueuedAnnouncement {
  message: string;
  priority: AnnouncementPriority;
  timestamp: number;
  id: string;
}

/**
 * Screen reader detection result
 */
interface ScreenReaderDetection {
  detected: boolean;
  type?: string;
  confidence: number;
}

/**
 * Live region configuration
 */
interface LiveRegionConfig {
  className: string;
  ariaLive: AnnouncementPriority;
  ariaAtomic: boolean;
  ariaRelevant: string;
  role: string;
}

/**
 * Manages screen reader support and announcements
 */
export class ScreenReaderSupport extends SimpleEventEmitter {
  private container: HTMLElement | null = null;
  private labels: AriaLabelsConfig;

  // Live regions
  private politeLiveRegion: HTMLElement | null = null;
  private assertiveLiveRegion: HTMLElement | null = null;
  private statusRegion: HTMLElement | null = null;

  // Announcement management
  private announcementQueue: QueuedAnnouncement[] = [];
  private isProcessingQueue = false;
  private announcementTimer: number | null = null;
  private lastAnnouncement = '';
  private announcementCount = 0;

  // Configuration
  private readonly ANNOUNCEMENT_DELAY = 250; // ms between announcements
  private readonly DUPLICATE_THRESHOLD = 1000; // ms to consider announcements duplicates
  private readonly MAX_QUEUE_SIZE = 10;
  private readonly THROTTLE_DELAY = 100; // ms to throttle rapid announcements

  constructor(labels: AriaLabelsConfig = {}) {
    super();

    this.labels = {
      sliderLabel: 'Image carousel',
      previousButton: 'Previous slide',
      nextButton: 'Next slide',
      playPauseButton: 'Play/Pause slideshow',
      slideLabel: 'Slide {index} of {total}',
      ...labels,
    };
  }

  /**
   * Initialize screen reader support
   */
  async initialize(container: HTMLElement): Promise<void> {
    this.container = container;

    try {
      // Create live regions
      this.createLiveRegions();

      // Detect screen reader if possible
      const detection = await this.detectScreenReader();
      if (detection.detected) {
        debugLogger.info(
          'Screen reader detected',
          'ScreenReaderSupport',
          detection
        );
      }

      debugLogger.info('Initialized successfully', 'ScreenReaderSupport');
    } catch (error) {
      debugLogger.error('ScreenReaderSupport', 'Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create live regions for announcements
   */
  private createLiveRegions(): void {
    if (!this.container) return;

    // Create polite live region
    this.politeLiveRegion = this.createLiveRegion({
      className: 'kinetic-slider__sr-polite',
      ariaLive: 'polite',
      ariaAtomic: true,
      ariaRelevant: 'additions text',
      role: 'status',
    });

    // Create assertive live region
    this.assertiveLiveRegion = this.createLiveRegion({
      className: 'kinetic-slider__sr-assertive',
      ariaLive: 'assertive',
      ariaAtomic: true,
      ariaRelevant: 'additions text',
      role: 'alert',
    });

    // Create status region for persistent state
    this.statusRegion = this.createLiveRegion({
      className: 'kinetic-slider__sr-status',
      ariaLive: 'polite',
      ariaAtomic: false,
      ariaRelevant: 'all',
      role: 'status',
    });

    // Append to container
    this.container.appendChild(this.politeLiveRegion);
    this.container.appendChild(this.assertiveLiveRegion);
    this.container.appendChild(this.statusRegion);
  }

  /**
   * Create a single live region element
   */
  private createLiveRegion(config: LiveRegionConfig): HTMLElement {
    const region = document.createElement('div');
    region.className = config.className;
    region.setAttribute('aria-live', config.ariaLive);
    region.setAttribute('aria-atomic', String(config.ariaAtomic));
    region.setAttribute('aria-relevant', config.ariaRelevant);
    region.setAttribute('role', config.role);

    // Apply screen reader only styles
    region.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;

    return region;
  }

  /**
   * Announce message to screen readers
   */
  announce(message: string, priority: AnnouncementPriority = 'polite'): void {
    if (!message || !this.politeLiveRegion || !this.assertiveLiveRegion) return;

    // Check for duplicate announcements
    if (this.isDuplicateAnnouncement(message)) {
      debugLogger.debug(
        'Skipping duplicate announcement',
        'ScreenReaderSupport',
        message
      );
      return;
    }

    // Add to queue
    const announcement: QueuedAnnouncement = {
      message,
      priority,
      timestamp: Date.now(),
      id: `announcement-${++this.announcementCount}`,
    };

    this.announcementQueue.push(announcement);

    // Limit queue size
    if (this.announcementQueue.length > this.MAX_QUEUE_SIZE) {
      this.announcementQueue.shift();
    }

    // Process queue
    this.processAnnouncementQueue();
  }

  /**
   * Process announcement queue
   */
  private processAnnouncementQueue(): void {
    if (this.isProcessingQueue || this.announcementQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    // Clear any existing timer
    if (this.announcementTimer !== null) {
      clearTimeout(this.announcementTimer);
    }

    // Process next announcement
    this.announcementTimer = window.setTimeout(() => {
      const announcement = this.announcementQueue.shift();
      if (!announcement) {
        this.isProcessingQueue = false;
        return;
      }

      // Make the announcement
      this.makeAnnouncement(announcement);

      // Continue processing
      this.isProcessingQueue = false;
      if (this.announcementQueue.length > 0) {
        this.processAnnouncementQueue();
      }
    }, this.THROTTLE_DELAY);
  }

  /**
   * Make an announcement to the appropriate live region
   */
  private makeAnnouncement(announcement: QueuedAnnouncement): void {
    const region =
      announcement.priority === 'assertive'
        ? this.assertiveLiveRegion
        : this.politeLiveRegion;

    if (!region) return;

    // Clear region first for better screen reader support
    region.textContent = '';

    // Use requestAnimationFrame for better timing, with fallback for Node.js environment
    const scheduleUpdate =
      typeof requestAnimationFrame !== 'undefined'
        ? requestAnimationFrame
        : (callback: () => void): number =>
            setTimeout(callback, 0) as unknown as number;

    scheduleUpdate(() => {
      region.textContent = announcement.message;
      this.lastAnnouncement = announcement.message;

      // Emit event
      this.emit(SLIDER_EVENTS.ACCESSIBILITY_ANNOUNCEMENT_MADE, {
        message: announcement.message,
        priority: announcement.priority,
        id: announcement.id,
      });

      debugLogger.debug('Announcement made', 'ScreenReaderSupport', {
        message: announcement.message,
        priority: announcement.priority,
      });
    });
  }

  /**
   * Check if announcement is a duplicate
   */
  private isDuplicateAnnouncement(message: string): boolean {
    if (message !== this.lastAnnouncement) {
      return false;
    }

    // Check if enough time has passed
    const lastAnnouncementTime =
      this.announcementQueue.length > 0
        ? this.announcementQueue[this.announcementQueue.length - 1].timestamp
        : 0;

    return Date.now() - lastAnnouncementTime < this.DUPLICATE_THRESHOLD;
  }

  /**
   * Announce slide change
   */
  announceSlideChange(index: number, total: number): void {
    const message = this.formatSlideLabel(index + 1, total);
    this.announce(message, 'polite');
  }

  /**
   * Announce play state change
   */
  announcePlayStateChange(isPlaying: boolean): void {
    const message = isPlaying
      ? 'Slideshow started. Playing automatically.'
      : 'Slideshow paused.';
    this.announce(message, 'polite');
  }

  /**
   * Announce loading state
   */
  announceLoadingState(isLoading: boolean, progress?: number): void {
    if (isLoading) {
      const message =
        progress !== undefined
          ? `Loading slides. ${Math.round(progress)}% complete.`
          : 'Loading slides...';
      this.announce(message, 'polite');
    } else {
      this.announce('Loading complete.', 'polite');
    }
  }

  /**
   * Announce error
   */
  announceError(error: string): void {
    this.announce(`Error: ${error}`, 'assertive');
  }

  /**
   * Update status region with persistent information
   */
  updateStatus(status: string): void {
    if (this.statusRegion) {
      this.statusRegion.textContent = status;
    }
  }

  /**
   * Format slide label
   */
  private formatSlideLabel(index: number, total: number): string {
    const template = this.labels.slideLabel || 'Slide {index} of {total}';
    return template
      .replace('{index}', String(index))
      .replace('{total}', String(total));
  }

  /**
   * Detect screen reader presence (best effort)
   */
  private async detectScreenReader(): Promise<ScreenReaderDetection> {
    const detection: ScreenReaderDetection = {
      detected: false,
      confidence: 0,
    };

    // Check for common screen reader indicators
    const indicators = [
      // NVDA
      (): boolean => navigator.userAgent.includes('NVDA'),
      // JAWS
      (): boolean => Object.prototype.hasOwnProperty.call(window, 'Jaws'),
      // VoiceOver
      (): boolean => navigator.userAgent.includes('VoiceOver'),
      // Check for aria-live regions being monitored
      (): boolean => {
        const testRegion = document.createElement('div');
        testRegion.setAttribute('aria-live', 'polite');
        testRegion.style.position = 'absolute';
        testRegion.style.left = '-10000px';
        document.body.appendChild(testRegion);

        let detected = false;
        const observer = new MutationObserver(() => {
          detected = true;
        });

        observer.observe(testRegion, { childList: true });
        testRegion.textContent = 'test';

        setTimeout(() => {
          observer.disconnect();
          testRegion.remove();
        }, 100);

        return detected;
      },
    ];

    // Check indicators
    for (const check of indicators) {
      try {
        if (check()) {
          detection.detected = true;
          detection.confidence += 0.25;
        }
      } catch {
        // Ignore errors in detection
      }
    }

    return detection;
  }

  /**
   * Clear all announcements
   */
  clearAnnouncements(): void {
    this.announcementQueue = [];

    if (this.politeLiveRegion) {
      this.politeLiveRegion.textContent = '';
    }

    if (this.assertiveLiveRegion) {
      this.assertiveLiveRegion.textContent = '';
    }

    if (this.announcementTimer !== null) {
      clearTimeout(this.announcementTimer);
      this.announcementTimer = null;
    }
  }

  /**
   * Update ARIA labels
   */
  updateLabels(labels: Partial<AriaLabelsConfig>): void {
    this.labels = { ...this.labels, ...labels };
  }

  /**
   * Get current labels
   */
  getLabels(): AriaLabelsConfig {
    return { ...this.labels };
  }

  /**
   * Destroy screen reader support
   */
  destroy(): void {
    debugLogger.info('Destroying...', 'ScreenReaderSupport');

    // Clear announcements
    this.clearAnnouncements();

    // Remove live regions
    this.politeLiveRegion?.remove();
    this.assertiveLiveRegion?.remove();
    this.statusRegion?.remove();

    // Reset state
    this.container = null;
    this.politeLiveRegion = null;
    this.assertiveLiveRegion = null;
    this.statusRegion = null;

    // Remove all listeners
    this.removeAllListeners();
  }
}
