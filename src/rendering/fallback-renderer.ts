/**
 * @fileoverview Fallback Renderer for KineticSlider
 * 
 * Provides graceful degradation when PIXI.js or WebGL is unavailable.
 * Falls back to CSS-based animations and basic HTML slider functionality
 * while maintaining core slider behavior and API compatibility.
 * 
 * @version 1.0.0 - Phase 4.4 Error Handling & Recovery
 */

import type { SliderConfig, SlideConfig } from '../core/types';
import { SliderError } from '../core/types';
import { SLIDER_ERROR_CODES } from '../core/constants';

/**
 * Fallback rendering modes
 */
export type FallbackMode = 'static' | 'basic' | 'css-animations';

/**
 * Renderer capability detection results
 */
export interface RendererCapabilities {
  /** Whether WebGL is available */
  webgl: boolean;
  /** Whether WebGL2 is available */
  webgl2: boolean;
  /** Whether CSS transforms are supported */
  cssTransforms: boolean;
  /** Whether CSS animations are supported */
  cssAnimations: boolean;
  /** Whether touch events are supported */
  touchEvents: boolean;
  /** Device pixel ratio */
  devicePixelRatio: number;
  /** Estimated performance tier (1-3, 3 being best) */
  performanceTier: number;
}

/**
 * Fallback configuration options
 */
export interface FallbackConfig {
  /** Preferred fallback mode */
  mode?: FallbackMode;
  /** Whether to show fallback indicator */
  showFallbackIndicator?: boolean;
  /** Whether to auto-upgrade when full renderer becomes available */
  autoUpgrade?: boolean;
  /** Polling interval for upgrade detection (ms) */
  upgradeCheckInterval?: number;
  /** CSS class prefix for fallback styles */
  cssPrefix?: string;
  /** Whether to use reduced motion */
  reducedMotion?: boolean;
}

/**
 * Slide element data for HTML fallback
 */
interface SlideElement {
  element: HTMLElement;
  config: SlideConfig;
  index: number;
  loaded: boolean;
}

/**
 * Fallback renderer for graceful degradation when WebGL/PIXI is unavailable
 * 
 * @example
 * ```typescript
 * const fallbackRenderer = new FallbackRenderer(container, sliderConfig, {
 *   mode: 'css-animations',
 *   showFallbackIndicator: true,
 *   autoUpgrade: true
 * });
 * 
 * fallbackRenderer.renderStaticSlider();
 * 
 * // Check if upgrade is possible
 * if (fallbackRenderer.canUpgradeToFullRenderer()) {
 *   await fallbackRenderer.upgradeRenderer();
 * }
 * ```
 */
export class FallbackRenderer {
  private container: HTMLElement;
  private config: SliderConfig;
  private fallbackConfig: Required<FallbackConfig>;
  private capabilities: RendererCapabilities;
  private slideElements: SlideElement[] = [];
  private currentSlideIndex = 0;
  private isTransitioning = false;
  private upgradeTimer: number | null = null;
  private cssPrefix: string;

  constructor(
    container: HTMLElement,
    config: SliderConfig,
    fallbackConfig: FallbackConfig = {}
  ) {
    this.container = container;
    this.config = config;
    this.cssPrefix = fallbackConfig.cssPrefix || 'kinetic-slider-fallback';
    
    // Set up fallback configuration with defaults
    this.fallbackConfig = {
      mode: fallbackConfig.mode || 'css-animations',
      showFallbackIndicator: fallbackConfig.showFallbackIndicator ?? true,
      autoUpgrade: fallbackConfig.autoUpgrade ?? true,
      upgradeCheckInterval: fallbackConfig.upgradeCheckInterval || 5000,
      cssPrefix: this.cssPrefix,
      reducedMotion: fallbackConfig.reducedMotion ?? this.detectReducedMotion(),
    };

    // Detect renderer capabilities
    this.capabilities = this.detectCapabilities();

    // Adjust fallback mode based on capabilities
    this.adjustFallbackMode();

    // Set up container
    this.setupContainer();

    // Start upgrade monitoring if enabled
    if (this.fallbackConfig.autoUpgrade) {
      this.startUpgradeMonitoring();
    }
  }

  /**
   * Render static slider (no animations)
   */
  renderStaticSlider(): void {
    this.clearContainer();
    this.createStaticSlides();
    this.addFallbackStyles();
    
    if (this.fallbackConfig.showFallbackIndicator) {
      this.addFallbackIndicator();
    }
  }

  /**
   * Render basic HTML slider with simple transitions
   */
  renderBasicHTMLSlider(): void {
    this.clearContainer();
    this.createBasicSlider();
    this.addBasicStyles();
    this.setupBasicInteractions();
    
    if (this.fallbackConfig.showFallbackIndicator) {
      this.addFallbackIndicator();
    }
  }

  /**
   * Check if upgrade to full renderer is possible
   */
  canUpgradeToFullRenderer(): boolean {
    const newCapabilities = this.detectCapabilities();
    
    // Check if WebGL has become available
    return newCapabilities.webgl && !this.capabilities.webgl;
  }

  /**
   * Attempt to upgrade to full renderer
   */
  async upgradeRenderer(): Promise<void> {
    try {
      // Re-detect capabilities
      const newCapabilities = this.detectCapabilities();
      
      if (!newCapabilities.webgl) {
        throw new SliderError(
          'WebGL still not available for upgrade',
          SLIDER_ERROR_CODES.RENDERER_ERROR,
          { capabilities: newCapabilities }
        );
      }

      // Stop upgrade monitoring
      this.stopUpgradeMonitoring();

      // Clear fallback content
      this.clearContainer();

      // Signal that upgrade is possible
      this.container.dispatchEvent(new CustomEvent('kinetic-slider-upgrade-ready', {
        detail: { capabilities: newCapabilities }
      }));

    } catch (error) {
      throw new SliderError(
        `Failed to upgrade renderer: ${error instanceof Error ? error.message : 'Unknown error'}`,
        SLIDER_ERROR_CODES.RENDERER_ERROR,
        { originalError: error }
      );
    }
  }

  /**
   * Navigate to specific slide
   */
  goToSlide(index: number): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (index < 0 || index >= this.config.slides.length) {
          throw new SliderError(
            `Invalid slide index: ${index}`,
            SLIDER_ERROR_CODES.INVALID_SLIDE_INDEX,
            { index, maxIndex: this.config.slides.length - 1 }
          );
        }

        if (this.isTransitioning) {
          throw new SliderError(
            'Transition already in progress',
            SLIDER_ERROR_CODES.TRANSITION_IN_PROGRESS
          );
        }

        this.isTransitioning = true;
        const previousIndex = this.currentSlideIndex;
        this.currentSlideIndex = index;

        // Perform transition based on fallback mode
        this.performTransition(previousIndex, index)
          .then(() => {
            this.isTransitioning = false;
            resolve();
          })
          .catch((error) => {
            this.isTransitioning = false;
            reject(error);
          });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Navigate to next slide
   */
  nextSlide(): Promise<void> {
    const nextIndex = (this.currentSlideIndex + 1) % this.config.slides.length;
    return this.goToSlide(nextIndex);
  }

  /**
   * Navigate to previous slide
   */
  previousSlide(): Promise<void> {
    const prevIndex = this.currentSlideIndex === 0 
      ? this.config.slides.length - 1 
      : this.currentSlideIndex - 1;
    return this.goToSlide(prevIndex);
  }

  /**
   * Get current slide index
   */
  getCurrentSlideIndex(): number {
    return this.currentSlideIndex;
  }

  /**
   * Get renderer capabilities
   */
  getCapabilities(): RendererCapabilities {
    return { ...this.capabilities };
  }

  /**
   * Destroy fallback renderer and clean up resources
   */
  destroy(): void {
    this.stopUpgradeMonitoring();
    this.clearContainer();
    this.slideElements = [];
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  /**
   * Detect browser/device capabilities
   */
  private detectCapabilities(): RendererCapabilities {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    const gl2 = canvas.getContext('webgl2');

    return {
      webgl: !!gl,
      webgl2: !!gl2,
      cssTransforms: this.supportsCSSTransforms(),
      cssAnimations: this.supportsCSSAnimations(),
      touchEvents: 'ontouchstart' in window,
      devicePixelRatio: window.devicePixelRatio || 1,
      performanceTier: this.estimatePerformanceTier()
    };
  }

  /**
   * Check if CSS transforms are supported
   */
  private supportsCSSTransforms(): boolean {
    const testElement = document.createElement('div');
    const transforms = ['transform', 'webkitTransform', 'mozTransform', 'msTransform'];
    
    return transforms.some(prop => prop in testElement.style);
  }

  /**
   * Check if CSS animations are supported
   */
  private supportsCSSAnimations(): boolean {
    const testElement = document.createElement('div');
    const animations = ['animation', 'webkitAnimation', 'mozAnimation'];
    
    return animations.some(prop => prop in testElement.style);
  }

  /**
   * Estimate device performance tier
   */
  private estimatePerformanceTier(): number {
    // Basic heuristics for performance estimation
    const memory = (navigator as { deviceMemory?: number }).deviceMemory || 4; // GB
    const cores = navigator.hardwareConcurrency || 4;
    // Device pixel ratio available for future use
    // const pixelRatio = window.devicePixelRatio || 1;

    if (memory >= 8 && cores >= 8) return 3; // High-end
    if (memory >= 4 && cores >= 4) return 2; // Mid-range
    return 1; // Low-end
  }

  /**
   * Detect if user prefers reduced motion
   */
  private detectReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Adjust fallback mode based on capabilities
   */
  private adjustFallbackMode(): void {
    // Downgrade mode if capabilities are insufficient
    if (this.fallbackConfig.mode === 'css-animations' && !this.capabilities.cssAnimations) {
      this.fallbackConfig.mode = 'basic';
    }
    
    if (this.fallbackConfig.mode === 'basic' && !this.capabilities.cssTransforms) {
      this.fallbackConfig.mode = 'static';
    }

    // Force static mode for very low-end devices
    if (this.capabilities.performanceTier === 1) {
      this.fallbackConfig.mode = 'static';
    }

    // Respect reduced motion preference
    if (this.fallbackConfig.reducedMotion) {
      this.fallbackConfig.mode = 'static';
    }
  }

  /**
   * Set up container with basic structure
   */
  private setupContainer(): void {
    this.container.classList.add(this.cssPrefix);
    this.container.classList.add(`${this.cssPrefix}--${this.fallbackConfig.mode}`);
    
    // Set ARIA attributes for accessibility
    this.container.setAttribute('role', 'region');
    this.container.setAttribute('aria-label', 'Image slider');
    this.container.setAttribute('aria-live', 'polite');
  }

  /**
   * Clear container content
   */
  private clearContainer(): void {
    this.container.innerHTML = '';
    this.slideElements = [];
  }

  /**
   * Create static slides
   */
  private createStaticSlides(): void {
    const slidesContainer = document.createElement('div');
    slidesContainer.className = `${this.cssPrefix}__slides`;

    this.config.slides.forEach((slideConfig, index) => {
      const slideElement = this.createSlideElement(slideConfig, index);
      slideElement.style.display = index === this.currentSlideIndex ? 'block' : 'none';
      
      slidesContainer.appendChild(slideElement);
      this.slideElements.push({
        element: slideElement,
        config: slideConfig,
        index,
        loaded: false
      });
    });

    this.container.appendChild(slidesContainer);
    this.addNavigationControls();
  }

  /**
   * Create basic slider with transitions
   */
  private createBasicSlider(): void {
    const viewport = document.createElement('div');
    viewport.className = `${this.cssPrefix}__viewport`;

    const slidesContainer = document.createElement('div');
    slidesContainer.className = `${this.cssPrefix}__slides`;
    slidesContainer.style.display = 'flex';
    slidesContainer.style.transition = this.fallbackConfig.reducedMotion ? 'none' : 'transform 0.3s ease';

    this.config.slides.forEach((slideConfig, index) => {
      const slideElement = this.createSlideElement(slideConfig, index);
      slideElement.style.flexShrink = '0';
      slideElement.style.width = '100%';
      
      slidesContainer.appendChild(slideElement);
      this.slideElements.push({
        element: slideElement,
        config: slideConfig,
        index,
        loaded: false
      });
    });

    viewport.appendChild(slidesContainer);
    this.container.appendChild(viewport);
    this.addNavigationControls();
  }

  /**
   * Create individual slide element
   */
  private createSlideElement(slideConfig: SlideConfig, index: number): HTMLElement {
    const slide = document.createElement('div');
    slide.className = `${this.cssPrefix}__slide`;
    slide.setAttribute('data-slide-index', String(index));
    slide.setAttribute('role', 'img');
    slide.setAttribute('aria-label', slideConfig.alt || `Slide ${index + 1}`);

    if (slideConfig.src) {
      const img = document.createElement('img');
      img.src = slideConfig.src;
      img.alt = slideConfig.alt || '';
      img.className = `${this.cssPrefix}__image`;
      img.loading = 'lazy';
      
      img.onload = (): void => {
        const slideElement = this.slideElements.find(s => s.index === index);
        if (slideElement) {
          slideElement.loaded = true;
        }
      };

      slide.appendChild(img);
    }

    // Add overlay content if specified
    if (slideConfig.title || slideConfig.description) {
      const overlay = document.createElement('div');
      overlay.className = `${this.cssPrefix}__overlay`;

      if (slideConfig.title) {
        const title = document.createElement('h3');
        title.className = `${this.cssPrefix}__title`;
        title.textContent = slideConfig.title;
        overlay.appendChild(title);
      }

      if (slideConfig.description) {
        const description = document.createElement('p');
        description.className = `${this.cssPrefix}__description`;
        description.textContent = slideConfig.description;
        overlay.appendChild(description);
      }

      slide.appendChild(overlay);
    }

    return slide;
  }

  /**
   * Add navigation controls
   */
  private addNavigationControls(): void {
    const controls = document.createElement('div');
    controls.className = `${this.cssPrefix}__controls`;

    // Previous button
    const prevButton = document.createElement('button');
    prevButton.className = `${this.cssPrefix}__button ${this.cssPrefix}__button--prev`;
    prevButton.textContent = '‹';
    prevButton.setAttribute('aria-label', 'Previous slide');
    prevButton.onclick = (): void => { this.previousSlide(); };

    // Next button
    const nextButton = document.createElement('button');
    nextButton.className = `${this.cssPrefix}__button ${this.cssPrefix}__button--next`;
    nextButton.textContent = '›';
    nextButton.setAttribute('aria-label', 'Next slide');
    nextButton.onclick = (): void => { this.nextSlide(); };

    // Slide indicators
    const indicators = document.createElement('div');
    indicators.className = `${this.cssPrefix}__indicators`;

    this.config.slides.forEach((_, index) => {
      const indicator = document.createElement('button');
      indicator.className = `${this.cssPrefix}__indicator`;
      indicator.setAttribute('aria-label', `Go to slide ${index + 1}`);
      indicator.onclick = (): void => { this.goToSlide(index); };
      
      if (index === this.currentSlideIndex) {
        indicator.classList.add(`${this.cssPrefix}__indicator--active`);
      }

      indicators.appendChild(indicator);
    });

    controls.appendChild(prevButton);
    controls.appendChild(indicators);
    controls.appendChild(nextButton);
    this.container.appendChild(controls);
  }

  /**
   * Add fallback indicator
   */
  private addFallbackIndicator(): void {
    const indicator = document.createElement('div');
    indicator.className = `${this.cssPrefix}__fallback-indicator`;
    indicator.innerHTML = `
      <span class="${this.cssPrefix}__fallback-text">Basic mode</span>
      <span class="${this.cssPrefix}__fallback-reason">${this.getFallbackReason()}</span>
    `;
    
    this.container.appendChild(indicator);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      indicator.style.opacity = '0';
      setTimeout(() => indicator.remove(), 300);
    }, 5000);
  }

  /**
   * Get reason for fallback mode
   */
  private getFallbackReason(): string {
    if (!this.capabilities.webgl) {
      return 'WebGL not supported';
    }
    if (this.capabilities.performanceTier === 1) {
      return 'Performance optimization';
    }
    if (this.fallbackConfig.reducedMotion) {
      return 'Reduced motion preferred';
    }
    return 'Compatibility mode';
  }

  /**
   * Perform slide transition
   */
  private async performTransition(fromIndex: number, toIndex: number): Promise<void> {
    this.updateIndicators(toIndex);

    switch (this.fallbackConfig.mode) {
      case 'static':
        return this.performStaticTransition(fromIndex, toIndex);
      
      case 'basic':
        return this.performBasicTransition(fromIndex, toIndex);
      
      case 'css-animations':
        return this.performCSSTransition(fromIndex, toIndex);
    }
  }

  /**
   * Perform static transition (instant)
   */
  private async performStaticTransition(fromIndex: number, toIndex: number): Promise<void> {
    const fromSlide = this.slideElements.find(slide => slide.index === fromIndex);
    const toSlide = this.slideElements.find(slide => slide.index === toIndex);
    
    if (fromSlide) {
      fromSlide.element.style.display = 'none';
    }
    if (toSlide) {
      toSlide.element.style.display = 'block';
    }
  }

  /**
   * Perform basic CSS transform transition
   */
  private async performBasicTransition(fromIndex: number, toIndex: number): Promise<void> {
    return new Promise((resolve): void => {
      const slidesContainer = this.container.querySelector(`.${this.cssPrefix}__slides`) as HTMLElement;
      if (!slidesContainer) {
        resolve();
        return;
      }

      const translateX = -toIndex * 100;
      slidesContainer.style.transform = `translateX(${translateX}%)`;

      // Wait for transition to complete
      const transitionDuration = this.fallbackConfig.reducedMotion ? 0 : 300;
      setTimeout(resolve, transitionDuration);
    });
  }

  /**
   * Perform CSS animation transition
   */
  private async performCSSTransition(fromIndex: number, toIndex: number): Promise<void> {
    return this.performBasicTransition(fromIndex, toIndex);
  }

  /**
   * Update slide indicators
   */
  private updateIndicators(activeIndex: number): void {
    const indicators = this.container.querySelectorAll(`.${this.cssPrefix}__indicator`);
    indicators.forEach((indicator, idx): void => {
      indicator.classList.toggle(`${this.cssPrefix}__indicator--active`, idx === activeIndex);
    });
  }

  /**
   * Set up basic interactions (keyboard, swipe)
   */
  private setupBasicInteractions(): void {
    // Keyboard navigation
    this.container.addEventListener('keydown', (event): void => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          this.previousSlide();
          break;
        case 'ArrowRight':
          event.preventDefault();
          this.nextSlide();
          break;
      }
    });

    // Basic touch/swipe support
    if (this.capabilities.touchEvents) {
      this.setupTouchInteractions();
    }
  }

  /**
   * Set up touch interactions
   */
  private setupTouchInteractions(): void {
    let startX = 0;
    let startY = 0;
    let isDragging = false;

    this.container.addEventListener('touchstart', (event) => {
      const touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      isDragging = true;
    });

    this.container.addEventListener('touchmove', (event) => {
      if (!isDragging) return;
      event.preventDefault();
    });

    this.container.addEventListener('touchend', (event) => {
      if (!isDragging) return;
      isDragging = false;

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;

      // Check if it's a horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          this.previousSlide();
        } else {
          this.nextSlide();
        }
      }
    });
  }

  /**
   * Add fallback styles
   */
  private addFallbackStyles(): void {
    if (document.querySelector(`#${this.cssPrefix}-styles`)) return;

    const styles = document.createElement('style');
    styles.id = `${this.cssPrefix}-styles`;
    styles.textContent = this.generateFallbackCSS();
    document.head.appendChild(styles);
  }

  /**
   * Add basic slider styles
   */
  private addBasicStyles(): void {
    this.addFallbackStyles(); // Includes basic styles
  }

  /**
   * Generate fallback CSS
   */
  private generateFallbackCSS(): string {
    return `
      .${this.cssPrefix} {
        position: relative;
        width: 100%;
        height: 400px;
        overflow: hidden;
        background-color: #f0f0f0;
        border-radius: 8px;
      }

      .${this.cssPrefix}__viewport {
        width: 100%;
        height: 100%;
        overflow: hidden;
      }

      .${this.cssPrefix}__slides {
        height: 100%;
      }

      .${this.cssPrefix}__slide {
        width: 100%;
        height: 100%;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .${this.cssPrefix}__image {
        max-width: 100%;
        max-height: 100%;
        object-fit: cover;
      }

      .${this.cssPrefix}__overlay {
        position: absolute;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 15px;
        border-radius: 4px;
      }

      .${this.cssPrefix}__title {
        margin: 0 0 10px 0;
        font-size: 18px;
        font-weight: bold;
      }

      .${this.cssPrefix}__description {
        margin: 0;
        font-size: 14px;
        opacity: 0.9;
      }

      .${this.cssPrefix}__controls {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(0, 0, 0, 0.5);
        padding: 10px;
        border-radius: 20px;
      }

      .${this.cssPrefix}__button {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 18px;
        font-weight: bold;
        transition: background-color 0.2s;
      }

      .${this.cssPrefix}__button:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .${this.cssPrefix}__indicators {
        display: flex;
        gap: 8px;
      }

      .${this.cssPrefix}__indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: none;
        background: rgba(255, 255, 255, 0.4);
        cursor: pointer;
        transition: background-color 0.2s;
      }

      .${this.cssPrefix}__indicator--active {
        background: rgba(255, 255, 255, 0.9);
      }

      .${this.cssPrefix}__fallback-indicator {
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        transition: opacity 0.3s;
      }

      .${this.cssPrefix}__fallback-text {
        display: block;
        font-weight: bold;
      }

      .${this.cssPrefix}__fallback-reason {
        display: block;
        opacity: 0.8;
        margin-top: 2px;
      }

      @media (prefers-reduced-motion: reduce) {
        .${this.cssPrefix}__slides {
          transition: none !important;
        }
      }
    `;
  }

  /**
   * Start monitoring for upgrade opportunities
   */
  private startUpgradeMonitoring(): void {
    this.upgradeTimer = window.setInterval(() => {
      if (this.canUpgradeToFullRenderer()) {
        // eslint-disable-next-line no-console
        this.upgradeRenderer().catch(console.error);
      }
    }, this.fallbackConfig.upgradeCheckInterval);
  }

  /**
   * Stop upgrade monitoring
   */
  private stopUpgradeMonitoring(): void {
    if (this.upgradeTimer) {
      clearInterval(this.upgradeTimer);
      this.upgradeTimer = null;
    }
  }
}