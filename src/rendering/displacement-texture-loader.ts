/**
 * @fileoverview Displacement Texture Loader
 *
 * Utility for loading and managing displacement textures for visual effects.
 * Integrates with our TextureManager for efficient caching and loading.
 *
 * @version 1.0.0
 */

import { Texture } from 'pixi.js';
import { TextureManager } from './texture-manager';
import { DisplacementEffects } from './displacement-effects';

/**
 * Configuration for displacement textures
 */
export interface DisplacementTextureConfig {
  /** Path to background displacement texture */
  backgroundTexturePath?: string;
  /** Path to cursor displacement texture */
  cursorTexturePath?: string;
  /** Whether to preload textures */
  preload?: boolean;
  /** Loading priority for textures */
  priority?: number;
}

/**
 * Loaded displacement textures
 */
export interface DisplacementTextures {
  /** Background displacement texture */
  background: Texture | null;
  /** Cursor displacement texture */
  cursor: Texture | null;
}

/**
 * DisplacementTextureLoader - Manages loading displacement textures
 *
 * Provides convenient methods for loading and configuring displacement
 * textures with our existing texture management system.
 */
export class DisplacementTextureLoader {
  private textureManager: TextureManager;
  private loadedTextures: DisplacementTextures = {
    background: null,
    cursor: null,
  };

  /**
   * Default texture paths for displacement effects
   */
  public static readonly DEFAULT_PATHS = {
    background: '/images/effects/background-displace.jpg',
    cursor: '/images/effects/cursor-displace.png',
  };

  constructor(textureManager?: TextureManager) {
    this.textureManager = textureManager || new TextureManager();
  }

  /**
   * Load displacement textures with specified configuration
   *
   * @param config - Configuration for texture loading
   * @returns Promise resolving to loaded textures
   */
  async loadDisplacementTextures(
    config: DisplacementTextureConfig = {}
  ): Promise<DisplacementTextures> {
    const {
      backgroundTexturePath = DisplacementTextureLoader.DEFAULT_PATHS
        .background,
      cursorTexturePath = DisplacementTextureLoader.DEFAULT_PATHS.cursor,
      priority = 750, // High priority for displacement textures
    } = config;

    try {
      // Load textures in parallel
      const loadPromises: Promise<void>[] = [];

      // Load background texture
      if (backgroundTexturePath) {
        loadPromises.push(
          this.textureManager
            .loadTexture(backgroundTexturePath, priority)
            .then((texture) => {
              this.loadedTextures.background = texture;
            })
        );
      }

      // Load cursor texture
      if (cursorTexturePath) {
        loadPromises.push(
          this.textureManager
            .loadTexture(cursorTexturePath, priority)
            .then((texture) => {
              this.loadedTextures.cursor = texture;
            })
        );
      }

      // Wait for all textures to load
      await Promise.all(loadPromises);

      return { ...this.loadedTextures };
    } catch (error) {
      throw new Error(
        `Failed to load displacement textures: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Create a configured DisplacementEffects instance with loaded textures
   *
   * @param preferredTexture - Which texture to use as primary ('background' | 'cursor')
   * @returns Configured DisplacementEffects instance
   */
  createDisplacementEffects(
    preferredTexture: 'background' | 'cursor' = 'background'
  ): DisplacementEffects {
    // Safe: preferredTexture is typed as 'background' | 'cursor' - no injection risk
    /* eslint-disable-next-line security/detect-object-injection */
    const primaryTexture = this.loadedTextures[preferredTexture];

    if (!primaryTexture) {
      throw new Error(
        `${preferredTexture} displacement texture not loaded. Call loadDisplacementTextures first.`
      );
    }

    return new DisplacementEffects(primaryTexture);
  }

  /**
   * Get specific loaded texture
   *
   * @param type - Type of texture to get
   * @returns Loaded texture or null
   */
  getTexture(type: 'background' | 'cursor'): Texture | null {
    // Safe: type is typed as 'background' | 'cursor' - no injection risk
    /* eslint-disable-next-line security/detect-object-injection */
    return this.loadedTextures[type];
  }

  /**
   * Check if textures are loaded
   *
   * @returns Loading status for each texture type
   */
  getLoadingStatus(): { background: boolean; cursor: boolean } {
    return {
      background: this.loadedTextures.background !== null,
      cursor: this.loadedTextures.cursor !== null,
    };
  }

  /**
   * Preload displacement textures for immediate use
   *
   * @param config - Optional configuration
   * @returns Promise that resolves when preloading is complete
   */
  async preloadTextures(config: DisplacementTextureConfig = {}): Promise<void> {
    await this.loadDisplacementTextures({ ...config, preload: true });
  }

  /**
   * Clear loaded textures and free memory
   */
  dispose(): void {
    this.loadedTextures = {
      background: null,
      cursor: null,
    };
  }
}
