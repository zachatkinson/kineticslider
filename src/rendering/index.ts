/**
 * ⚠️ PHASE 1.2 DEVELOPMENT STUB ⚠️
 *
 * This is a temporary stub implementation to avoid PIXI.js import issues during E2E testing.
 * Full PIXI.js integration will be completed in Phase 1.3.
 *
 * @version 1.0.0 (Phase 1.2 Stub)
 */

import { Application, Assets, Sprite, Filter, Texture } from 'pixi.js';
import type { ISliderRenderer, RenderConfig } from '../core/types';
import { RENDERING, SCALE, ERROR_MESSAGES } from '../core';

/**
 * DOM operations interface for testing separation
 */
interface DOMOperations {
  appendChild(container: HTMLElement, canvas: HTMLCanvasElement): void;
  removeChild(container: HTMLElement, canvas: HTMLCanvasElement): void;
  contains(container: HTMLElement, canvas: HTMLCanvasElement): boolean;
}

/**
 * Default DOM operations for production
 */
const defaultDOMOperations: DOMOperations = {
  appendChild: (container: HTMLElement, canvas: HTMLCanvasElement) => {
    container.appendChild(canvas);
  },
  removeChild: (container: HTMLElement, canvas: HTMLCanvasElement) => {
    container.removeChild(canvas);
  },
  contains: (container: HTMLElement, canvas: HTMLCanvasElement) => {
    return container.contains(canvas);
  },
};

/**
 * SliderRenderer - PIXI.js rendering engine for the slider
 *
 * Extracted and optimized from main branch PIXI logic.
 * Manages PIXI Application, sprite creation, and filter effects.
 *
 * Key Features:
 * - Hardware-accelerated PIXI.js Application
 * - Efficient sprite management with pooling
 * - Built-in filter support (displacement, blur, etc.)
 * - Asset loading and caching
 * - Resolution and viewport management
 * - Memory-efficient cleanup
 * - Testable DOM operations separation
 *
 * @example
 * ```typescript
 * const renderer = new SliderRenderer();
 * await renderer.initialize(container, config);
 * const sprite = await renderer.createSprite('image.jpg', 0);
 * ```
 */
export class SliderRenderer implements ISliderRenderer {
  private app: Application | null = null;
  private sprites: Sprite[] = [];
  private container: HTMLElement | null = null;
  private config: RenderConfig | null = null;
  private assetCache = new Map<string, Texture>();
  private domOps: DOMOperations;

  /**
   * Create renderer with optional DOM operations injection for testing
   */
  constructor(domOperations?: DOMOperations) {
    this.domOps = domOperations || defaultDOMOperations;
  }

  /**
   * Initialize PIXI Application with optimized settings
   */
  async initialize(
    container: HTMLElement,
    config: RenderConfig
  ): Promise<void> {
    try {
      this.container = container;
      this.config = config;

      // Create PIXI Application with optimized settings
      this.app = new Application();

      await this.app.init({
        width: config.width,
        height: config.height,
        backgroundColor: config.backgroundColor,
        antialias: config.antialias,
        resolution: config.resolution,
        // Optimizations for slider use case
        autoDensity: true,
        powerPreference: 'high-performance',
        backgroundAlpha: 1,
      });

      // Add canvas to container using injected DOM operations
      this.domOps.appendChild(container, this.app.canvas);

      // Set up resize handler
      this.setupResizeHandler();

      // Initialize asset cache
      Assets.init();
    } catch (error) {
      throw new Error(ERROR_MESSAGES.PIXI_INIT_FAILED(error));
    }
  }

  /**
   * Get PIXI Application instance
   */
  getApplication(): Application | null {
    return this.app;
  }

  /**
   * Resize the renderer and adjust sprites
   */
  resize(width: number, height: number): void {
    if (!this.app || !this.config) return;

    // Update config
    this.config.width = width;
    this.config.height = height;

    // Resize PIXI app
    this.app.renderer.resize(width, height);

    // Adjust sprite positions and scales
    this.sprites.forEach((sprite, index) => {
      this.positionSprite(sprite, index);
    });
  }

  /**
   * Create and manage sprite with optimized loading
   */
  async createSprite(
    texture: string | Texture,
    index: number
  ): Promise<Sprite> {
    if (!this.app) {
      throw new Error(ERROR_MESSAGES.RENDERER_NOT_INITIALIZED);
    }

    try {
      let pixiTexture: Texture;

      if (typeof texture === 'string') {
        // Check cache first
        if (this.assetCache.has(texture)) {
          pixiTexture = this.assetCache.get(texture)!;
        } else {
          // Load and cache texture
          pixiTexture = await Assets.load(texture);
          this.assetCache.set(texture, pixiTexture);
        }
      } else {
        pixiTexture = texture;
      }

      // Create sprite
      const sprite = new Sprite(pixiTexture);

      // Set sprite properties for slider optimization
      sprite.anchor.set(RENDERING.CENTER_ANCHOR); // Center anchor for smooth scaling
      sprite.eventMode = 'static'; // Enable interactions
      sprite.cursor = 'pointer';

      // Add data attribute for GSAP targeting
      sprite.label = `slider-sprite-${Number(index)}`;

      // Position sprite
      this.positionSprite(sprite, index);

      // Add to stage (initially hidden)
      sprite.visible = index === 0; // Only show first sprite initially
      this.app.stage.addChild(sprite);

      // Store in sprites array using proper method
      if (index >= this.sprites.length) {
        // Extend array if needed
        this.sprites.length = index + 1;
      }
      this.sprites.splice(index, 1, sprite);

      return sprite;
    } catch (error) {
      throw new Error(ERROR_MESSAGES.SPRITE_CREATE_FAILED(error));
    }
  }

  /**
   * Remove sprite from stage and sprites array
   */
  removeSprite(sprite: Sprite): void {
    if (!this.app) return;

    // Remove from stage
    this.app.stage.removeChild(sprite);

    // Remove from sprites array
    const index = this.sprites.indexOf(sprite);
    if (index > -1) {
      this.sprites.splice(index, 1);
    }

    // Destroy sprite to free memory
    sprite.destroy();
  }

  /**
   * Get all managed sprites
   */
  getSprites(): Sprite[] {
    return [...this.sprites]; // Return copy to prevent external modification
  }

  /**
   * Apply filter to sprite
   * Supports both built-in PIXI filters and pixi-filters library
   */
  applyFilter(sprite: Sprite, filter: Filter): void {
    if (!sprite.filters) {
      sprite.filters = [filter];
    } else if (Array.isArray(sprite.filters)) {
      sprite.filters.push(filter);
    } else {
      sprite.filters = [sprite.filters, filter];
    }
  }

  /**
   * Remove specific filter from sprite
   */
  removeFilter(sprite: Sprite, filter: Filter): void {
    if (!sprite.filters) return;

    if (Array.isArray(sprite.filters)) {
      const index = sprite.filters.indexOf(filter);
      if (index > -1) {
        sprite.filters.splice(index, 1);
        if (sprite.filters.length === 0) {
          sprite.filters = [];
        }
      }
    } else if (sprite.filters === filter) {
      sprite.filters = [];
    }
  }

  /**
   * Clear all filters from sprite
   */
  clearFilters(sprite: Sprite): void {
    sprite.filters = [];
  }

  /**
   * Manual render call (usually handled by PIXI ticker)
   */
  render(): void {
    this.app?.render();
  }

  /**
   * Set sprite visibility
   */
  setVisible(sprite: Sprite, visible: boolean): void {
    sprite.visible = visible;
  }

  /**
   * Destroy renderer and cleanup resources
   */
  destroy(): void {
    // Destroy all sprites
    this.sprites.forEach((sprite) => {
      sprite.destroy();
    });
    this.sprites = [];

    // Clear asset cache
    this.assetCache.clear();

    // Remove canvas from container first using injected DOM operations
    if (
      this.container &&
      this.app?.canvas &&
      this.domOps.contains(this.container, this.app.canvas)
    ) {
      this.domOps.removeChild(this.container, this.app.canvas);
    }

    // Destroy PIXI application
    if (this.app) {
      this.app.destroy(true, {
        children: true,
        texture: false, // Keep textures for potential reuse
      });
      this.app = null;
    }

    this.container = null;
    this.config = null;
  }

  /**
   * Position sprite optimally within viewport
   * Handles aspect ratio and scaling for "world's best slider" experience
   */
  private positionSprite(sprite: Sprite, index: number): void {
    if (!this.config) return;

    const { width, height } = this.config;

    // Center sprite in viewport
    sprite.x = width / 2;
    sprite.y = height / 2;

    // Calculate scale to fit/fill viewport while maintaining aspect ratio
    const textureAspect = sprite.texture.width / sprite.texture.height;
    const viewportAspect = width / height;

    let scale: number;

    if (textureAspect > viewportAspect) {
      // Texture is wider - fit to height
      scale = height / sprite.texture.height;
    } else {
      // Texture is taller - fit to width
      scale = width / sprite.texture.width;
    }

    // Apply scale with slight oversizing for better visual impact
    sprite.scale.set(scale * SCALE.EMPHASIS);

    // Offset non-current slides for sliding effect
    if (index > 0) {
      sprite.x += width * index;
    }
  }

  /**
   * Setup responsive resize handling
   */
  private setupResizeHandler(): void {
    if (!this.container) return;

    // Use ResizeObserver for efficient resize detection
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        this.resize(width, height);
      }
    });

    resizeObserver.observe(this.container);
  }
}
