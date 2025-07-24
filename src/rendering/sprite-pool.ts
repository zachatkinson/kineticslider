/**
 * @fileoverview SpritePool for Object Pooling and Performance Optimization
 *
 * High-performance sprite pooling system with:
 * 1. Automatic pool size management
 * 2. Memory-efficient sprite reuse
 * 3. Configurable reset strategies
 * 4. Performance monitoring and statistics
 *
 * @version 1.0.0
 */

import { Sprite, Texture } from 'pixi.js';
import type { ISpritePool, SpritePoolConfig } from '../core/types';
import { SPRITE_POOL_CONSTANTS } from '../core/constants';
import { getBaseScale } from '../core/sprite-helpers';

/**
 * Pool statistics for monitoring
 */
interface PoolStats {
  available: number;
  inUse: number;
  total: number;
  created: number;
  reused: number;
  peakUsage: number;
  memoryEstimate: number;
}

/**
 * Sprite metadata for tracking
 */
interface SpriteMetadata {
  createdAt: number;
  lastUsed: number;
  useCount: number;
  poolGeneration: number;
}

/**
 * SpritePool for object pooling and performance optimization
 */
export class SpritePool implements ISpritePool {
  private availableSprites: Sprite[] = [];
  private inUseSprites = new Set<Sprite>();
  private spriteMetadata = new WeakMap<Sprite, SpriteMetadata>();
  private config: SpritePoolConfig;
  private stats: PoolStats;
  private generation = 0;

  constructor(config?: Partial<SpritePoolConfig>) {
    this.config = this.createDefaultConfig(config);
    this.stats = this.createDefaultStats();

    // Pre-populate pool with initial sprites
    this.initializePool();
  }

  /**
   * Get sprite from pool (creates new if pool is empty)
   */
  getSprite(texture?: Texture): Sprite {
    let sprite: Sprite;

    if (this.availableSprites.length > 0) {
      // Reuse existing sprite
      sprite = this.availableSprites.pop()!;
      this.resetSprite(sprite);
      this.stats.reused++;
    } else {
      // Create new sprite
      sprite = this.createNewSprite();
      this.stats.created++;
    }

    // Set texture if provided
    if (texture) {
      sprite.texture = texture;
    }

    // Track usage
    this.inUseSprites.add(sprite);
    this.updateSpriteMetadata(sprite, 'use');
    this.updateStats();

    return sprite;
  }

  /**
   * Return sprite to pool for reuse
   */
  returnSprite(sprite: Sprite): void {
    if (!this.inUseSprites.has(sprite)) {
      // Silently handle invalid sprite return
      return;
    }

    // Remove from in-use tracking
    this.inUseSprites.delete(sprite);

    // Check if pool is at capacity
    if (this.availableSprites.length >= this.config.maxSize) {
      // Dispose of sprite instead of returning to pool
      this.disposeSprite(sprite);
      return;
    }

    // Reset sprite to default state
    this.resetSprite(sprite);

    // Update metadata
    this.updateSpriteMetadata(sprite, 'return');

    // Return to pool
    this.availableSprites.push(sprite);
    this.updateStats();
  }

  /**
   * Clear all sprites from pool
   */
  clear(): void {
    // Dispose of all available sprites
    this.availableSprites.forEach((sprite) => {
      this.disposeSprite(sprite);
    });
    this.availableSprites = [];

    // Clear in-use sprites (they'll be disposed when returned)
    this.inUseSprites.clear();

    // Reset stats
    this.stats = this.createDefaultStats();
    this.generation++;
  }

  /**
   * Get pool statistics
   */
  getStats(): { available: number; inUse: number; total: number } {
    this.updateStats();
    return {
      available: this.stats.available,
      inUse: this.stats.inUse,
      total: this.stats.total,
    };
  }

  /**
   * Get detailed statistics for performance monitoring
   */
  getDetailedStats(): PoolStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Resize pool capacity
   */
  resize(newSize: number): void {
    if (newSize < 1) {
      throw new Error('Pool size must be at least 1');
    }

    const oldMaxSize = this.config.maxSize;
    this.config.maxSize = newSize;

    // If reducing size, dispose excess sprites
    if (newSize < oldMaxSize) {
      while (this.availableSprites.length > newSize) {
        const sprite = this.availableSprites.pop();
        if (sprite) {
          this.disposeSprite(sprite);
        }
      }
    }

    // If increasing size and current pool is below initial size, add sprites
    if (
      newSize > oldMaxSize &&
      this.availableSprites.length < this.config.initialSize
    ) {
      this.expandPool();
    }

    this.updateStats();
  }

  /**
   * Dispose of sprite pool
   */
  dispose(): void {
    this.clear();
    this.spriteMetadata = new WeakMap();
  }

  /**
   * Optimize pool performance by removing old sprites
   */
  optimize(): void {
    const currentTime = Date.now();
    const maxAge = 300000; // 5 minutes

    // Remove old sprites from available pool
    this.availableSprites = this.availableSprites.filter((sprite) => {
      const metadata = this.spriteMetadata.get(sprite);
      const age = metadata ? currentTime - metadata.lastUsed : 0;

      if (age > maxAge) {
        this.disposeSprite(sprite);
        return false;
      }
      return true;
    });

    // Shrink pool if usage is low
    const usageRatio = this.stats.inUse / this.stats.total;
    if (
      usageRatio < this.config.shrinkThreshold &&
      this.availableSprites.length > this.config.initialSize
    ) {
      const targetSize = Math.max(
        this.config.initialSize,
        Math.ceil(this.stats.total * this.config.shrinkThreshold)
      );
      while (this.availableSprites.length > targetSize) {
        const sprite = this.availableSprites.pop();
        if (sprite) {
          this.disposeSprite(sprite);
        }
      }
    }

    this.updateStats();
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  /**
   * Create default configuration
   */
  private createDefaultConfig(
    config?: Partial<SpritePoolConfig>
  ): SpritePoolConfig {
    return {
      initialSize: config?.initialSize ?? SPRITE_POOL_CONSTANTS.INITIAL_SIZE,
      maxSize: config?.maxSize ?? SPRITE_POOL_CONSTANTS.MAX_SIZE,
      growthFactor: config?.growthFactor ?? SPRITE_POOL_CONSTANTS.GROWTH_FACTOR,
      shrinkThreshold:
        config?.shrinkThreshold ?? SPRITE_POOL_CONSTANTS.SHRINK_THRESHOLD,
      resetProperties:
        config?.resetProperties ?? SPRITE_POOL_CONSTANTS.RESET_PROPERTIES,
    };
  }

  /**
   * Create default statistics
   */
  private createDefaultStats(): PoolStats {
    return {
      available: 0,
      inUse: 0,
      total: 0,
      created: 0,
      reused: 0,
      peakUsage: 0,
      memoryEstimate: 0,
    };
  }

  /**
   * Initialize pool with initial sprites
   */
  private initializePool(): void {
    for (let i = 0; i < this.config.initialSize; i++) {
      const sprite = this.createNewSprite();
      this.availableSprites.push(sprite);
    }
    this.updateStats();
  }

  /**
   * Create new sprite with metadata
   */
  private createNewSprite(): Sprite {
    const sprite = new Sprite();

    // Initialize sprite with default settings
    sprite.anchor.set(0.5);
    sprite.visible = true;
    sprite.alpha = 1;
    // Use baseScale instead of hardcoded 1 to preserve intended scaling
    const baseScale = getBaseScale(sprite);
    sprite.scale.set(baseScale);
    sprite.rotation = 0;
    sprite.position.set(0, 0);

    // Add metadata
    this.spriteMetadata.set(sprite, {
      createdAt: Date.now(),
      lastUsed: Date.now(),
      useCount: 0,
      poolGeneration: this.generation,
    });

    return sprite;
  }

  /**
   * Reset sprite to default state
   */
  private resetSprite(sprite: Sprite): void {
    // Reset configurable properties
    this.config.resetProperties.forEach((property) => {
      switch (property) {
        case 'x':
          sprite.x = 0;
          break;
        case 'y':
          sprite.y = 0;
          break;
        case 'scale': {
          // Use baseScale instead of hardcoded 1 to preserve intended scaling
          const baseScale = getBaseScale(sprite);
          sprite.scale.set(baseScale);
          break;
        }
        case 'rotation':
          sprite.rotation = 0;
          break;
        case 'alpha':
          sprite.alpha = 1;
          break;
        case 'visible':
          sprite.visible = true;
          break;
      }
    });

    // Reset additional properties
    sprite.tint = 0xffffff;
    sprite.filters = [];
    sprite.mask = null;

    // Remove from parent if attached
    if (sprite.parent) {
      sprite.parent.removeChild(sprite);
    }
  }

  /**
   * Dispose of a sprite completely
   */
  private disposeSprite(sprite: Sprite): void {
    // Remove from parent if attached
    if (sprite.parent) {
      sprite.parent.removeChild(sprite);
    }

    // Remove metadata
    this.spriteMetadata.delete(sprite);

    // Destroy the sprite
    sprite.destroy({
      children: true,
      texture: false, // Don't destroy shared textures
    });
  }

  /**
   * Update sprite metadata
   */
  private updateSpriteMetadata(
    sprite: Sprite,
    operation: 'use' | 'return'
  ): void {
    const metadata = this.spriteMetadata.get(sprite);
    if (metadata) {
      metadata.lastUsed = Date.now();
      if (operation === 'use') {
        metadata.useCount++;
      }
    }
  }

  /**
   * Update pool statistics
   */
  private updateStats(): void {
    this.stats.available = this.availableSprites.length;
    this.stats.inUse = this.inUseSprites.size;
    this.stats.total = this.stats.available + this.stats.inUse;

    // Update peak usage
    if (this.stats.inUse > this.stats.peakUsage) {
      this.stats.peakUsage = this.stats.inUse;
    }

    // Estimate memory usage (rough calculation)
    const bytesPerSprite = 1024; // Approximate sprite overhead
    this.stats.memoryEstimate = this.stats.total * bytesPerSprite;
  }

  /**
   * Expand pool when needed
   */
  private expandPool(): void {
    const currentSize = this.availableSprites.length;
    const targetSize = Math.min(
      Math.ceil(currentSize * this.config.growthFactor),
      this.config.maxSize
    );

    const spritesToAdd = targetSize - currentSize;
    for (let i = 0; i < spritesToAdd; i++) {
      const sprite = this.createNewSprite();
      this.availableSprites.push(sprite);
    }

    this.updateStats();
  }
}
