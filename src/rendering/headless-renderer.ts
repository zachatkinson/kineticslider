/**
 * @fileoverview Headless Fallback Renderer for E2E Testing
 *
 * A minimal renderer implementation that doesn't require PIXI.js/WebGL
 * for use in headless browser environments where full graphics aren't available.
 * This enables navigation testing without requiring full rendering pipeline.
 *
 * @version 1.0.0
 */

import type { ISliderRenderer, RenderConfig } from '../core/types';
import type {
  AnimationSequence,
  SwipeAnimation,
  ScaleAnimation,
} from '../physics/engine';

// Mock PIXI-compatible types for headless mode
type HeadlessSprite = import('pixi.js').Sprite & {
  index: number;
  element: Element;
  isHeadlessSprite: true;
};

/**
 * Headless Fallback Renderer
 *
 * Provides minimal functionality needed for navigation testing
 * without requiring PIXI.js or WebGL context.
 */
export class HeadlessRenderer implements ISliderRenderer {
  private container: HTMLElement | null = null;
  private config: RenderConfig | null = null;
  private isInitialized = false;
  private slideCount = 0;
  private currentSlideIndex = 0;

  async initialize(
    container: HTMLElement,
    config: RenderConfig
  ): Promise<void> {
    if (!container) {
      throw new Error(
        'Container element is required for renderer initialization'
      );
    }

    this.config = config;
    this.container = container;

    // Create minimal DOM structure for testing
    this.createFallbackSlideStructure();

    this.isInitialized = true;
  }

  async createSprite(
    imageSrc: string,
    index: number
  ): Promise<import('pixi.js').Sprite> {
    if (!this.container) {
      throw new Error('Renderer not initialized');
    }

    // Create a simple div element to represent the slide
    const slideElement = document.createElement('div');
    slideElement.className = 'slide headless-slide';
    slideElement.setAttribute('data-slide-index', index.toString());
    slideElement.setAttribute('data-src', imageSrc);
    slideElement.style.cssText = `
      position: absolute;
      width: 100%;
      height: 100%;
      background: #f0f0f0;
      display: ${index === 0 ? 'block' : 'none'};
      opacity: ${index === 0 ? '1' : '0'};
    `;

    // Add some content to make it testable
    slideElement.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 24px; color: #666;">
        Slide ${index + 1}
      </div>
    `;

    this.container.appendChild(slideElement);
    this.slideCount = Math.max(this.slideCount, index + 1);

    // Return a mock sprite that satisfies the interface
    return {
      index,
      element: slideElement,
      isHeadlessSprite: true,
      visible: index === 0,
      alpha: index === 0 ? 1 : 0,
      scale: {
        x: 1,
        y: 1,
        set: function (value: number) {
          this.x = value;
          this.y = value;
        },
      },
      x: 0,
      y: 0,
    } as unknown as import('pixi.js').Sprite;
  }

  private createFallbackSlideStructure(): void {
    if (!this.container) return;

    // Ensure container has proper structure for testing
    this.container.style.cssText = `
      position: relative;
      width: 100%;
      height: 400px;
      overflow: hidden;
      background: #fafafa;
    `;

    // Add data attribute for test identification
    this.container.setAttribute('data-renderer', 'headless');
  }

  // Minimal animation implementations that just update DOM
  async executeSequence(sequence: AnimationSequence): Promise<void> {
    // Simple implementation for headless renderer
    const sequenceData = sequence as unknown as { animations?: unknown[] };
    if (sequenceData.animations) {
      for (const animation of sequenceData.animations) {
        await this.executeAnimation(
          animation as SwipeAnimation | ScaleAnimation
        );
      }
    }
  }

  async executeSwipe(animation: SwipeAnimation): Promise<void> {
    const animationData = animation as unknown as { targetIndex?: number };
    const targetIndex = animationData.targetIndex ?? 0;
    await this.updateSlideVisibility(targetIndex);
  }

  async executeScale(_animation: ScaleAnimation): Promise<void> {
    // Scale animations don't affect slide index, so no action needed
  }

  private async executeAnimation(
    animation: SwipeAnimation | ScaleAnimation
  ): Promise<void> {
    if ('targetIndex' in animation) {
      const animationData = animation as unknown as { targetIndex?: number };
      const targetIndex = animationData.targetIndex ?? 0;
      await this.updateSlideVisibility(targetIndex);
    }
  }

  private async updateSlideVisibility(targetIndex: number): Promise<void> {
    if (!this.container) return;

    const slides = this.container.querySelectorAll('.slide');

    slides.forEach((slide, index) => {
      const slideElement = slide as HTMLElement;
      if (index === targetIndex) {
        slideElement.style.display = 'block';
        slideElement.style.opacity = '1';
        slideElement.classList.add('active');
      } else {
        slideElement.style.display = 'none';
        slideElement.style.opacity = '0';
        slideElement.classList.remove('active');
      }
    });

    this.currentSlideIndex = targetIndex;
  }

  // Cleanup method
  destroy(): void {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.isInitialized = false;
  }

  // Required method for compatibility with SliderRenderer interface
  getSprites(): import('pixi.js').Sprite[] {
    // Return array of slide elements as sprite-like objects
    if (!this.container) return [];

    const slides = this.container.querySelectorAll('.slide');
    return Array.from(slides).map(
      (slide, index) =>
        ({
          index,
          element: slide,
          isHeadlessSprite: true,
          visible: slide.classList.contains('active'),
          alpha: slide.classList.contains('active') ? 1 : 0,
          scale: {
            x: 1,
            y: 1,
            set: function (value: number) {
              this.x = value;
              this.y = value;
            },
          },
          x: 0,
          y: 0,
        }) as unknown as import('pixi.js').Sprite
    );
  }

  // Required method for sprite visibility control
  setVisible(sprite: import('pixi.js').Sprite, visible: boolean): void {
    if (sprite && (sprite as HeadlessSprite).element) {
      const slideElement = (sprite as HeadlessSprite).element as HTMLElement;
      slideElement.style.display = visible ? 'block' : 'none';
      slideElement.style.opacity = visible ? '1' : '0';

      if (visible) {
        slideElement.classList.add('active');
        this.currentSlideIndex = (sprite as HeadlessSprite).index;
      } else {
        slideElement.classList.remove('active');
      }
    }
  }

  // Getters for testing
  get initialized(): boolean {
    return this.isInitialized;
  }

  get totalSlides(): number {
    return this.slideCount;
  }

  get currentIndex(): number {
    return this.currentSlideIndex;
  }

  // Required ISliderRenderer methods
  getApplication(): import('pixi.js').Application | null {
    return null; // No PIXI application in headless mode
  }

  resize(_width: number, _height: number): void {
    // No-op for headless renderer
  }

  removeSprite(_sprite: import('pixi.js').Sprite): void {
    // No-op for headless renderer
  }

  applyFilter(
    _sprite: import('pixi.js').Sprite,
    _filter: import('pixi.js').Filter
  ): void {
    // No-op for headless renderer
  }

  removeFilter(
    _sprite: import('pixi.js').Sprite,
    _filter: import('pixi.js').Filter
  ): void {
    // No-op for headless renderer
  }

  clearFilters(_sprite: import('pixi.js').Sprite): void {
    // No-op for headless renderer
  }

  render(): void {
    // No-op for headless renderer
  }
}
