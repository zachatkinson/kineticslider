/**
 * @fileoverview VirtualRenderer - Virtual scrolling for large datasets
 *
 * High-performance virtual rendering system that only renders visible items
 * and efficiently manages off-screen content. Supports large datasets with
 * minimal memory footprint and maintains 60fps performance.
 *
 * @version 1.0.0
 */

import type { Container, Texture } from 'pixi.js';
import { Sprite } from 'pixi.js';
import { SimpleEventEmitter } from '../core/event-emitter';
import type { ISliderRenderer } from '../core/types';
import { PERFORMANCE } from '../core/constants';
import { debugLogger } from '../utils/debug-logger';

/**
 * Virtual item configuration
 */
export interface VirtualItem {
  id: string;
  index: number;
  data: unknown;
  width: number;
  height: number;
  x: number;
  y: number;
}

/**
 * Virtual renderer configuration
 */
export interface VirtualRendererConfig {
  /** Container width */
  containerWidth: number;
  /** Container height */
  containerHeight: number;
  /** Item width */
  itemWidth: number;
  /** Item height */
  itemHeight: number;
  /** Buffer size (number of items to render outside viewport) */
  bufferSize: number;
  /** Enable recycling of sprites */
  enableRecycling: boolean;
  /** Maximum items in pool */
  maxPoolSize: number;
  /** Enable smooth scrolling */
  smoothScrolling: boolean;
  /** Scroll threshold for updates */
  scrollThreshold: number;
  /** Enable debug mode */
  debug: boolean;
}

/**
 * Viewport information
 */
export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
}

/**
 * Render statistics
 */
export interface RenderStats {
  totalItems: number;
  visibleItems: number;
  renderedItems: number;
  pooledItems: number;
  recycledItems: number;
  frameTime: number;
  updateTime: number;
  memoryUsage: number;
}

/**
 * Virtual scroll events
 */
export interface VirtualScrollEvents {
  'viewport-change': (viewport: Viewport) => void;
  'items-update': (items: VirtualItem[]) => void;
  'performance-warning': (stats: RenderStats) => void;
  'scroll-start': () => void;
  'scroll-end': () => void;
}

/**
 * VirtualRenderer - Efficient virtual scrolling for large datasets
 */
export class VirtualRenderer extends SimpleEventEmitter {
  private config: Required<VirtualRendererConfig>;
  private items: VirtualItem[] = [];
  private visibleItems = new Set<string>();
  private renderedSprites = new Map<string, Sprite>();
  private spritePool: Sprite[] = [];
  private viewport: Viewport;
  private container: Container | null = null;
  private renderer: ISliderRenderer | null = null;
  private isScrolling = false;
  private scrollTimeout: NodeJS.Timeout | null = null;
  private lastUpdateTime = 0;
  private updateScheduled = false;
  private stats: RenderStats;

  constructor(config: Partial<VirtualRendererConfig> = {}) {
    super();

    this.config = {
      containerWidth: config.containerWidth ?? 800,
      containerHeight: config.containerHeight ?? 600,
      itemWidth: config.itemWidth ?? 200,
      itemHeight: config.itemHeight ?? 150,
      bufferSize: config.bufferSize ?? 2,
      enableRecycling: config.enableRecycling ?? true,
      maxPoolSize: config.maxPoolSize ?? 50,
      smoothScrolling: config.smoothScrolling ?? true,
      scrollThreshold: config.scrollThreshold ?? 5,
      debug: config.debug ?? false,
    };

    this.viewport = {
      x: 0,
      y: 0,
      width: this.config.containerWidth,
      height: this.config.containerHeight,
      scrollX: 0,
      scrollY: 0,
    };

    this.stats = this.createDefaultStats();
  }

  /**
   * Initialize virtual renderer with container and renderer
   */
  initialize(container: Container, renderer: ISliderRenderer): void {
    this.container = container;
    this.renderer = renderer;

    if (this.config.enableRecycling) {
      this.initializeSpritePool();
    }

    debugLogger.info('VirtualRenderer initialized', 'VirtualRenderer', {
      config: this.config,
      poolSize: this.spritePool.length,
    });
  }

  /**
   * Set items for virtual rendering
   */
  setItems(
    items: unknown[],
    createItem?: (data: unknown, index: number) => VirtualItem
  ): void {
    this.items = items.map((data, index) => {
      if (createItem) {
        return createItem(data, index);
      }

      // Default item creation
      const col =
        index % Math.floor(this.config.containerWidth / this.config.itemWidth);
      const row = Math.floor(
        index / Math.floor(this.config.containerWidth / this.config.itemWidth)
      );

      return {
        id: `item-${index}`,
        index,
        data,
        width: this.config.itemWidth,
        height: this.config.itemHeight,
        x: col * this.config.itemWidth,
        y: row * this.config.itemHeight,
      };
    });

    this.stats.totalItems = this.items.length;
    this.scheduleUpdate();
  }

  /**
   * Update viewport position
   */
  updateViewport(scrollX: number, scrollY: number): void {
    const deltaX = Math.abs(scrollX - this.viewport.scrollX);
    const deltaY = Math.abs(scrollY - this.viewport.scrollY);

    // Check if scroll change is significant enough
    if (
      deltaX < this.config.scrollThreshold &&
      deltaY < this.config.scrollThreshold
    ) {
      return;
    }

    this.viewport.scrollX = scrollX;
    this.viewport.scrollY = scrollY;
    this.viewport.x = scrollX;
    this.viewport.y = scrollY;

    // Handle scroll events
    if (!this.isScrolling) {
      this.isScrolling = true;
      this.emit('scroll-start');
    }

    // Reset scroll end timer
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    this.scrollTimeout = setTimeout(() => {
      this.isScrolling = false;
      this.emit('scroll-end');
    }, 150);

    this.scheduleUpdate();
    this.emit('viewport-change', { ...this.viewport });
  }

  /**
   * Resize viewport
   */
  resizeViewport(width: number, height: number): void {
    this.config.containerWidth = width;
    this.config.containerHeight = height;
    this.viewport.width = width;
    this.viewport.height = height;

    this.scheduleUpdate();
  }

  /**
   * Force update of visible items
   */
  forceUpdate(): void {
    this.updateVisibleItems();
  }

  /**
   * Get current render statistics
   */
  getStats(): RenderStats {
    return { ...this.stats };
  }

  /**
   * Clear all rendered items
   */
  clear(): void {
    // Return sprites to pool
    if (this.config.enableRecycling) {
      this.renderedSprites.forEach((sprite) => {
        this.returnToPool(sprite);
      });
    } else {
      // Destroy sprites if not recycling
      this.renderedSprites.forEach((sprite) => {
        sprite.destroy();
      });
    }

    this.renderedSprites.clear();
    this.visibleItems.clear();
    this.stats.visibleItems = 0;
    this.stats.renderedItems = 0;
  }

  /**
   * Dispose of virtual renderer
   */
  dispose(): void {
    this.clear();

    // Destroy sprite pool
    this.spritePool.forEach((sprite) => {
      sprite.destroy();
    });
    this.spritePool = [];

    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    this.container = null;
    this.renderer = null;
    this.items = [];
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  /**
   * Create default statistics
   */
  private createDefaultStats(): RenderStats {
    return {
      totalItems: 0,
      visibleItems: 0,
      renderedItems: 0,
      pooledItems: 0,
      recycledItems: 0,
      frameTime: 0,
      updateTime: 0,
      memoryUsage: 0,
    };
  }

  /**
   * Initialize sprite pool for recycling
   */
  private initializeSpritePool(): void {
    const initialPoolSize = Math.min(
      this.config.maxPoolSize,
      Math.ceil(
        (this.viewport.width / this.config.itemWidth) *
          (this.viewport.height / this.config.itemHeight) *
          1.5
      )
    );

    for (let i = 0; i < initialPoolSize; i++) {
      const sprite = this.createPooledSprite();
      this.spritePool.push(sprite);
    }

    this.stats.pooledItems = this.spritePool.length;
  }

  /**
   * Create a pooled sprite
   */
  private createPooledSprite(): Sprite {
    // Create empty sprite that will be configured later
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sprite = new (require('pixi.js').Sprite)();
    sprite.visible = false;
    return sprite;
  }

  /**
   * Get sprite from pool or create new one
   */
  private getFromPool(): Sprite | null {
    if (this.spritePool.length > 0) {
      const sprite = this.spritePool.pop()!;
      this.stats.pooledItems = this.spritePool.length;
      this.stats.recycledItems++;
      return sprite;
    }

    // Create new sprite if pool is empty and under max size
    if (
      this.stats.pooledItems + this.renderedSprites.size <
      this.config.maxPoolSize
    ) {
      return this.createPooledSprite();
    }

    return null;
  }

  /**
   * Return sprite to pool
   */
  private returnToPool(sprite: Sprite): void {
    sprite.visible = false;
    sprite.texture = null as unknown as Texture;
    sprite.x = 0;
    sprite.y = 0;
    sprite.scale.set(1);
    sprite.alpha = 1;
    sprite.tint = 0xffffff;

    if (this.spritePool.length < this.config.maxPoolSize) {
      this.spritePool.push(sprite);
      this.stats.pooledItems = this.spritePool.length;
    } else {
      sprite.destroy();
    }
  }

  /**
   * Schedule update on next animation frame
   */
  private scheduleUpdate(): void {
    if (this.updateScheduled) return;

    this.updateScheduled = true;
    requestAnimationFrame(() => {
      this.updateScheduled = false;
      this.updateVisibleItems();
    });
  }

  /**
   * Update visible items based on viewport
   */
  private updateVisibleItems(): void {
    const startTime = performance.now();

    // Calculate visible range with buffer
    const bufferX = this.config.itemWidth * this.config.bufferSize;
    const bufferY = this.config.itemHeight * this.config.bufferSize;

    const visibleBounds = {
      left: this.viewport.x - bufferX,
      right: this.viewport.x + this.viewport.width + bufferX,
      top: this.viewport.y - bufferY,
      bottom: this.viewport.y + this.viewport.height + bufferY,
    };

    // Find items in visible range
    const newVisibleItems = new Set<string>();
    const visibleItemsList: VirtualItem[] = [];

    for (const item of this.items) {
      if (this.isItemVisible(item, visibleBounds)) {
        newVisibleItems.add(item.id);
        visibleItemsList.push(item);
      }
    }

    // Remove items that are no longer visible
    const toRemove: string[] = [];
    this.visibleItems.forEach((id) => {
      if (!newVisibleItems.has(id)) {
        toRemove.push(id);
      }
    });

    toRemove.forEach((id) => {
      this.removeItem(id);
    });

    // Add newly visible items
    visibleItemsList.forEach((item) => {
      if (!this.visibleItems.has(item.id)) {
        this.renderItem(item);
      }
    });

    // Update stats
    this.stats.visibleItems = newVisibleItems.size;
    this.stats.renderedItems = this.renderedSprites.size;
    this.stats.updateTime = performance.now() - startTime;

    // Check performance
    if (this.stats.updateTime > PERFORMANCE.FRAME_BUDGET_MS) {
      this.emit('performance-warning', this.getStats());
    }

    // Emit update event
    this.emit('items-update', visibleItemsList);

    if (this.config.debug) {
      debugLogger.debug('Virtual renderer update', 'VirtualRenderer', {
        visible: this.stats.visibleItems,
        rendered: this.stats.renderedItems,
        updateTime: this.stats.updateTime,
      });
    }
  }

  /**
   * Check if item is visible in bounds
   */
  private isItemVisible(
    item: VirtualItem,
    bounds: {
      left: number;
      right: number;
      top: number;
      bottom: number;
    }
  ): boolean {
    return (
      item.x + item.width >= bounds.left &&
      item.x <= bounds.right &&
      item.y + item.height >= bounds.top &&
      item.y <= bounds.bottom
    );
  }

  /**
   * Render a virtual item
   */
  private renderItem(item: VirtualItem): void {
    if (!this.container || !this.renderer) return;

    // Try to get recycled sprite or create new one
    let sprite: Sprite;
    if (this.config.enableRecycling) {
      const pooledSprite = this.getFromPool();
      sprite = pooledSprite || new Sprite();
    } else {
      sprite = new Sprite();
    }

    // Configure sprite with item data
    this.configureSprite(sprite, item);

    // Add to container and tracking
    this.container.addChild(sprite);
    this.renderedSprites.set(item.id, sprite);
    this.visibleItems.add(item.id);
  }

  /**
   * Configure sprite with item data
   */
  private configureSprite(sprite: Sprite, item: VirtualItem): void {
    // Position sprite relative to viewport
    sprite.x = item.x - this.viewport.scrollX;
    sprite.y = item.y - this.viewport.scrollY;
    sprite.width = item.width;
    sprite.height = item.height;
    sprite.visible = true;

    // Apply item-specific configuration
    if (typeof item.data === 'object' && item.data !== null) {
      const data = item.data as Record<string, unknown>;

      if (data.texture) {
        sprite.texture = data.texture as Texture;
      }

      if (typeof data.alpha === 'number') {
        sprite.alpha = data.alpha;
      }

      if (typeof data.tint === 'number') {
        sprite.tint = data.tint;
      }
    }
  }

  /**
   * Remove item from rendering
   */
  private removeItem(id: string): void {
    const sprite = this.renderedSprites.get(id);
    if (!sprite) return;

    // Remove from container
    if (this.container && sprite.parent === this.container) {
      this.container.removeChild(sprite);
    }

    // Return to pool or destroy
    if (this.config.enableRecycling) {
      this.returnToPool(sprite);
    } else {
      sprite.destroy();
    }

    this.renderedSprites.delete(id);
    this.visibleItems.delete(id);
  }

  /**
   * Estimate memory usage
   */
  estimateMemoryUsage(): number {
    const spriteMemory = this.renderedSprites.size * 0.1; // ~100KB per sprite estimate
    const poolMemory = this.spritePool.length * 0.05; // ~50KB per pooled sprite
    const dataMemory = this.items.length * 0.001; // ~1KB per item data

    this.stats.memoryUsage = spriteMemory + poolMemory + dataMemory;
    return this.stats.memoryUsage;
  }
}
