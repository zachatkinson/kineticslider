/**
 * @fileoverview Unified PIXI.js Slider Renderer
 *
 * Complete PIXI.js rendering system that handles:
 * 1. PIXI Application initialization and management
 * 2. Sprite creation, loading, and lifecycle management
 * 3. GSAP-powered physics-based animations
 * 4. GPU-optimized rendering pipeline
 *
 * This unified renderer eliminates the confusion between "SliderRenderer"
 * and "PixiSliderRenderer" by providing one comprehensive solution.
 *
 * @version 1.0.0
 */

import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import type {
  ISliderRenderer,
  RenderConfig,
  UIPanelConfig,
} from '../core/types';
import { ScaleMode } from '../core/types';
import { debugLogger } from '../utils/debug-logger';
import { setBaseScale } from '../core/sprite-helpers';

// Import Sprite type specifically
type Sprite = PIXI.Sprite;
// Define animation types locally to avoid circular dependency
interface AnimationSequence {
  hideSprites: number[];
  targetSprite: {
    index: number;
    initialState: { visible: boolean; alpha: number; scale: number };
    finalState: { alpha: number; scale: number };
    duration: number;
    ease: string;
  };
  sourceSprite?: {
    index: number;
    finalState: { alpha: number; scale: number; visible: boolean };
    duration: number;
    ease: string;
  };
}

interface SwipeAnimation {
  initialPhase: { duration: number; movement: number; scale: number };
  springPhase: {
    duration: number;
    movement: number;
    scale: number;
    ease: string;
  };
}

interface ScaleAnimation {
  targetScale: number;
  duration: number;
  ease: string;
}
import { GSAP_DEFAULTS } from '../core/constants';
import {
  safeArrayAssign,
  safeArrayAccess,
  isValidArrayIndex,
} from '../utils/safe-array';

/**
 * Unified PIXI.js Renderer with Complete Pipeline
 *
 * Handles everything from PIXI app initialization to GSAP animations.
 * Eliminates the need for separate "PixiSliderRenderer" animation applier.
 */
export class SliderRenderer implements ISliderRenderer {
  private app: PIXI.Application | null = null;
  private pixiContainer: PIXI.Container | null = null;
  private uiContainer: PIXI.Container | null = null;
  private sprites: PIXI.Sprite[] = [];
  private uiPanels: Map<string, PIXI.Sprite> = new Map();
  private container: HTMLElement | null = null;
  private config: RenderConfig | null = null;
  private isInitialized = false;
  private sliderId: string;
  private intendedScale: number = 1; // Store the scale based on ScaleMode

  // Animation management
  private activeTimelines = new Set<gsap.core.Timeline>();
  private activeTweens = new Set<gsap.core.Tween>();

  // Animation defaults
  private readonly animationDefaults: gsap.TweenVars = {
    ease: 'power2.out',
    overwrite: 'auto' as const,
  };

  constructor() {
    this.sliderId = `slider-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // =============================================================================
  // 🎯 PIXI Application Management (implements ISliderRenderer)
  // =============================================================================

  /**
   * Initialize using shared PIXI application instance
   */
  async initialize(
    container: HTMLElement,
    config: RenderConfig
  ): Promise<void> {
    try {
      if (!container) {
        throw new Error(
          'Container element is required for renderer initialization'
        );
      }

      // Store configuration
      this.config = config;
      this.container = container;
      debugLogger.info(
        `Renderer initialized with config - ScaleMode: ${config.scaleMode}, OverscanAmount: ${config.overscanAmount}`,
        'RENDERER'
      );

      // Create individual PIXI application (back to individual instances but with better cleanup)
      this.app = new PIXI.Application();

      // Use logical dimensions for calculations, let PIXI handle device pixel ratio
      const logicalWidth = container.clientWidth || config.width || 800;
      const logicalHeight = container.clientHeight || config.height || 600;

      await this.app.init({
        width: logicalWidth,
        height: logicalHeight,
        backgroundAlpha: 1, // Make background opaque so backgroundColor is visible
        backgroundColor: config.backgroundColor,
        antialias: config.antialias,
        resolution: config.resolution || window.devicePixelRatio || 1,
        // Remove resizeTo to prevent automatic canvas resizing that might interfere with our scaling
        // resizeTo: container,
        preference: 'webgl',
        powerPreference: 'low-power',
        preserveDrawingBuffer: false,
        useBackBuffer: true, // Enable backBuffer for backdrop blur filters
      });

      if (!this.app || !this.app.renderer) {
        throw new Error('PIXI application failed to initialize');
      }

      const canvas = this.app.renderer.canvas;
      if (!canvas) {
        throw new Error('PIXI renderer canvas is not available');
      }

      this.container.appendChild(canvas);
      canvas.classList.add('kinetic-slider-canvas');

      // Ensure canvas displays at logical size regardless of device pixel ratio
      canvas.style.width = `${logicalWidth}px`;
      canvas.style.height = `${logicalHeight}px`;

      // Create main container for slides
      this.pixiContainer = new PIXI.Container();
      this.app.stage.addChild(this.pixiContainer);
      debugLogger.debug('Created pixiContainer and added to stage', 'RENDERER');

      // Create UI container for panels (above slides)
      this.uiContainer = new PIXI.Container();
      this.app.stage.addChild(this.uiContainer);
      debugLogger.debug('Created uiContainer and added to stage', 'RENDERER');

      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize PIXI renderer: ${error}`);
    }
  }

  /**
   * Get PIXI application instance
   */
  getApplication(): PIXI.Application | null {
    return this.app;
  }

  /**
   * Resize renderer and update viewport
   */
  resize(width: number, height: number): void {
    if (!this.app) {
      throw new Error('Renderer not initialized');
    }

    this.app.renderer.resize(width, height);
  }

  // =============================================================================
  // 🎯 Sprite Management (implements ISliderRenderer)
  // =============================================================================

  /**
   * Create and load sprite from texture
   */
  async createSprite(
    texture: string | PIXI.Texture,
    index: number
  ): Promise<PIXI.Sprite> {
    if (!this.app) {
      throw new Error('Renderer not initialized');
    }

    let pixiTexture: PIXI.Texture;

    if (typeof texture === 'string') {
      try {
        // Use PIXI.js v8 Assets API for loading images
        pixiTexture = await PIXI.Assets.load(texture);
      } catch {
        // Create a fallback colored texture
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Create a gradient as fallback
          const gradient = ctx.createLinearGradient(0, 0, 800, 600);
          gradient.addColorStop(0, '#ff6b6b');
          gradient.addColorStop(1, '#4ecdc4');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 800, 600);

          // Add some text
          ctx.fillStyle = 'white';
          ctx.font = '48px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`Slide ${index + 1}`, 400, 300);
        }
        pixiTexture = PIXI.Texture.from(canvas);
      }
    } else {
      pixiTexture = texture;
    }

    const sprite = new PIXI.Sprite(pixiTexture);

    // Configure sprite using logical screen dimensions (PIXI handles pixel ratio automatically)
    sprite.anchor.set(0.5);
    sprite.position.set(this.app.screen.width / 2, this.app.screen.height / 2);

    // Debug app dimensions and sprite dimensions (including pixel ratio info)
    debugLogger.debug(
      `APP SCREEN DIMENSIONS: ${this.app.screen.width}×${this.app.screen.height}`,
      'DIMENSION_DEBUG'
    );
    debugLogger.debug(
      `CANVAS PHYSICAL DIMENSIONS: ${this.app.canvas.width}×${this.app.canvas.height}`,
      'DIMENSION_DEBUG'
    );
    debugLogger.debug(
      `DEVICE PIXEL RATIO: ${this.app.renderer.resolution}`,
      'DIMENSION_DEBUG'
    );
    debugLogger.debug(
      `SPRITE ORIGINAL DIMENSIONS: ${sprite.width}×${sprite.height}`,
      'DIMENSION_DEBUG'
    );
    debugLogger.debug(
      `SPRITE POSITION: ${sprite.position.x}, ${sprite.position.y}`,
      'DIMENSION_DEBUG'
    );

    // Scale sprite based on configured scale mode
    const scaleMode = this.config?.scaleMode || ScaleMode.COVER;
    debugLogger.info(
      `Sprite scaling - Mode: ${scaleMode}, Config exists: ${!!this.config}`,
      'RENDERER'
    );

    const scaleX = this.app.screen.width / sprite.width;
    const scaleY = this.app.screen.height / sprite.height;
    debugLogger.debug(
      `SCALE RATIOS: scaleX=${scaleX}, scaleY=${scaleY}`,
      'DIMENSION_DEBUG'
    );
    let scale: number;

    switch (scaleMode) {
      case ScaleMode.CONTAIN:
        // Fit entirely within stage, may show letterbox/pillarbox
        scale = Math.min(scaleX, scaleY);
        break;

      case ScaleMode.OVERSCAN: {
        // Step 1: Fit image completely within container (contain behavior)
        const containScale = Math.min(scaleX, scaleY);
        // Step 2: Apply slight enlargement to crop edges while preserving scene visibility
        const overscanAmount = this.config?.overscanAmount || 1.05; // Default 5% overscan
        scale = containScale * overscanAmount;
        debugLogger.info(
          `Overscan scaling - Contain scale: ${containScale}, Overscan amount: ${overscanAmount}, Final scale: ${scale}`,
          'RENDERER'
        );
        break;
      }

      case ScaleMode.COVER:
      default:
        // Fill entire stage, may crop edges
        scale = Math.max(scaleX, scaleY);
        break;
    }

    // Store the intended scale for this configuration
    this.intendedScale = scale;
    sprite.scale.set(scale);

    // Set baseScale on sprite for physics system to respect
    setBaseScale(sprite, scale);
    debugLogger.info(
      `Sprite created - Intended scale: ${scale}, BaseScale set: ${scale}, Current scale: ${sprite.scale.x}`,
      'RENDERER'
    );

    // Add GSAP data attributes for targeting
    this.markSpriteForGSAP(sprite, index);

    // Add to container (not directly to stage)
    if (this.pixiContainer) {
      this.pixiContainer.addChild(sprite);
      debugLogger.debug(`Added sprite ${index} to pixiContainer`, 'RENDERER');
    } else {
      this.app.stage.addChild(sprite);
      debugLogger.debug(
        `Added sprite ${index} directly to stage (no container)`,
        'RENDERER'
      );
    }

    // Use safe array assignment to prevent object injection
    safeArrayAssign(this.sprites, index, sprite);

    // Debug logging for sprite creation
    debugLogger.debug(
      `Created sprite ${index}: texture=${!!sprite.texture}, width=${sprite.width}, height=${sprite.height}, alpha=${sprite.alpha}, visible=${sprite.visible}, filters=${sprite.filters?.length || 0}`,
      'RENDERER'
    );

    // Extra debugging for slide 1
    if (index === 0) {
      debugLogger.debug(
        `SLIDE 1 CREATION - texture valid: ${!!pixiTexture}, sprite added, texture width: ${pixiTexture?.width || 'unknown'}, texture height: ${pixiTexture?.height || 'unknown'}`,
        'RENDERER'
      );
    }

    return sprite;
  }

  /**
   * Remove sprite from stage and cleanup
   */
  removeSprite(sprite: PIXI.Sprite): void {
    if (!this.app) return;

    const index = this.sprites.indexOf(sprite);
    debugLogger.debug(`Removing sprite ${index}`, 'RENDERER');

    // Remove from proper container
    if (this.pixiContainer && sprite.parent === this.pixiContainer) {
      this.pixiContainer.removeChild(sprite);
      debugLogger.debug(
        `Removed sprite ${index} from pixiContainer`,
        'RENDERER'
      );
    } else if (sprite.parent === this.app.stage) {
      this.app.stage.removeChild(sprite);
      debugLogger.debug(`Removed sprite ${index} from stage`, 'RENDERER');
    } else {
      debugLogger.warn(
        `Sprite ${index} parent mismatch: parent=${!!sprite.parent}`,
        'RENDERER'
      );
    }

    // Remove from tracking array
    if (index !== -1) {
      this.sprites.splice(index, 1);
    }

    // Cleanup texture if needed
    sprite.destroy();
  }

  /**
   * Get all managed sprites
   */
  getSprites(): PIXI.Sprite[] {
    return [...this.sprites];
  }

  /**
   * Get the intended scale based on ScaleMode configuration
   */
  getIntendedScale(): number {
    return this.intendedScale;
  }

  /**
   * Control sprite visibility
   */
  setVisible(sprite: PIXI.Sprite, visible: boolean): void {
    const spriteIndex = this.sprites.indexOf(sprite);

    debugLogger.debug(
      `Sprite ${spriteIndex}: visible=${visible}, current alpha=${sprite.alpha}, current visible=${sprite.visible}`,
      'VISIBILITY'
    );

    // KILL ANY EXISTING GSAP ANIMATIONS ON THIS SPRITE FIRST
    gsap.killTweensOf(sprite);

    sprite.visible = visible;
    sprite.alpha = visible ? 1 : 0;

    // Additional logging for slide 1 specifically
    if (spriteIndex === 0) {
      debugLogger.debug(
        `SLIDE 1 - KILLED GSAP tweens, setting visible=${visible}, alpha=${sprite.alpha}, texture valid=${!!sprite.texture}, parent=${!!sprite.parent}`,
        'VISIBILITY'
      );

      if (visible) {
        // Force sprite to front and render - but add slight delay
        setTimeout(() => {
          if (this.pixiContainer && sprite.parent === this.pixiContainer) {
            debugLogger.debug(
              `SLIDE 1 - Moving to front of ${this.pixiContainer.children.length} children`,
              'VISIBILITY'
            );
            this.pixiContainer.setChildIndex(
              sprite,
              this.pixiContainer.children.length - 1
            );
          }

          // Force a render frame
          if (this.app) {
            debugLogger.debug('SLIDE 1 - Forcing render', 'VISIBILITY');
            this.app.render();
          }
        }, 16); // Next frame
      }
    }
  }

  // =============================================================================
  // 🎯 PIXI.Filter Management (implements ISliderRenderer)
  // =============================================================================

  /**
   * Apply filter to sprite
   */
  applyFilter(sprite: PIXI.Sprite, filter: PIXI.Filter): void {
    // Create a new filters array instead of modifying the existing one
    const currentFilters = sprite.filters ? [...sprite.filters] : [];
    sprite.filters = [...currentFilters, filter];
  }

  /**
   * Remove specific filter from sprite
   */
  removeFilter(sprite: PIXI.Sprite, filter: PIXI.Filter): void {
    if (!sprite.filters || !Array.isArray(sprite.filters)) return;

    const index = sprite.filters.indexOf(filter);
    if (index !== -1) {
      sprite.filters.splice(index, 1);
    }
  }

  /**
   * Clear all filters from sprite
   */
  clearFilters(sprite: PIXI.Sprite): void {
    sprite.filters = [];
  }

  // =============================================================================
  // 🎯 GSAP Animation Integration (from PixiSliderRenderer)
  // =============================================================================

  /**
   * Apply transition animation sequence to PIXI sprites
   */
  applyTransition(
    sprites: Sprite[],
    sequence: AnimationSequence
  ): gsap.core.Timeline {
    const timeline = this.createManagedTimeline();

    // Hide sprites that should be hidden
    sequence.hideSprites.forEach((index) => {
      // Use safe array access with type checking
      if (isValidArrayIndex(index, sprites.length)) {
        const sprite = safeArrayAccess(sprites, index);
        if (sprite) {
          timeline.set(sprite, { alpha: 0, visible: false }, 0);
        }
      }
    });

    // Get target sprite with safe array access
    const targetIndex = sequence.targetSprite.index;
    const targetSprite = isValidArrayIndex(targetIndex, sprites.length)
      ? safeArrayAccess(sprites, targetIndex)
      : null;
    if (!targetSprite) return timeline;

    // Set initial state for target sprite
    timeline.set(
      targetSprite,
      {
        visible: sequence.targetSprite.initialState.visible,
        alpha: sequence.targetSprite.initialState.alpha,
        scale: sequence.targetSprite.initialState.scale,
      },
      0
    );

    // Animate target sprite to final state
    timeline.to(
      targetSprite,
      {
        ...this.animationDefaults,
        duration: sequence.targetSprite.duration,
        alpha: sequence.targetSprite.finalState.alpha,
        scale: sequence.targetSprite.finalState.scale,
        ease: sequence.targetSprite.ease,
      },
      0
    );

    // Handle source sprite exit animation if specified
    if (sequence.sourceSprite) {
      // Use safe array access with type checking
      const sourceIndex = sequence.sourceSprite.index;
      const sourceSprite = isValidArrayIndex(sourceIndex, sprites.length)
        ? safeArrayAccess(sprites, sourceIndex)
        : null;
      if (sourceSprite) {
        timeline.to(
          sourceSprite,
          {
            ...this.animationDefaults,
            duration: sequence.sourceSprite.duration,
            alpha: sequence.sourceSprite.finalState.alpha,
            scale: sequence.sourceSprite.finalState.scale,
            ease: sequence.sourceSprite.ease,
            onComplete: () => {
              gsap.set(sourceSprite, {
                visible: sequence.sourceSprite!.finalState.visible,
              });
            },
          },
          0
        );
      }
    }

    return timeline;
  }

  /**
   * Apply swipe animation to PIXI sprite
   */
  applySwipe(sprite: Sprite, animation: SwipeAnimation): gsap.core.Timeline {
    const timeline = this.createManagedTimeline();

    // Initial movement phase
    timeline.to(sprite, {
      ...this.animationDefaults,
      duration: animation.initialPhase.duration,
      x: `+=${animation.initialPhase.movement}`,
      scale: animation.initialPhase.scale,
    });

    // Spring back phase
    timeline.to(sprite, {
      ...this.animationDefaults,
      duration: animation.springPhase.duration,
      x: `+=${animation.springPhase.movement}`,
      scale: animation.springPhase.scale,
      ease: animation.springPhase.ease,
    });

    return timeline;
  }

  /**
   * Apply scale animation to PIXI sprite
   */
  applyScale(sprite: Sprite, animation: ScaleAnimation): gsap.core.Timeline {
    const timeline = this.createManagedTimeline();

    timeline.to(sprite, {
      ...GSAP_DEFAULTS.PERFORMANCE,
      duration: animation.duration,
      scale: animation.targetScale,
      ease: animation.ease,
    });

    return timeline;
  }

  /**
   * Apply batch animations to multiple sprites efficiently
   */
  applyBatchAnimations(
    sprites: Sprite[],
    animations: Array<{ spriteIndex: number; props: gsap.TweenVars }>
  ): gsap.core.Timeline {
    const timeline = this.createManagedTimeline();

    animations.forEach(({ spriteIndex, props }) => {
      // Use safe array access with type checking to prevent object injection
      if (isValidArrayIndex(spriteIndex, sprites.length)) {
        const sprite = safeArrayAccess(sprites, spriteIndex);
        if (sprite) {
          timeline.to(
            sprite,
            {
              ...this.animationDefaults,
              ...props,
            },
            0
          ); // Start all animations at the same time
        }
      }
    });

    return timeline;
  }

  /**
   * Create optimized GSAP tween with performance settings
   */
  createOptimizedTween(sprite: Sprite, props: gsap.TweenVars): gsap.core.Tween {
    // Safe configuration merge to avoid object injection
    const safeProps = {
      ...this.animationDefaults,
      duration: props.duration || 0.5,
      ease: props.ease || 'power2.out',
      onComplete: props.onComplete,
      onUpdate: props.onUpdate,
      // Add specific animation properties safely
      x: props.x,
      y: props.y,
      scale: props.scale,
      alpha: props.alpha,
      rotation: props.rotation,
    };

    const tween = gsap.to(sprite, safeProps);
    this.activeTweens.add(tween);

    return tween;
  }

  /**
   * Kill all active animations immediately
   */
  killAllAnimations(): void {
    // Kill all managed timelines
    this.activeTimelines.forEach((timeline) => {
      timeline.kill();
    });
    this.activeTimelines.clear();

    // Kill all managed tweens
    this.activeTweens.forEach((tween) => {
      tween.kill();
    });
    this.activeTweens.clear();
  }

  /**
   * Get animation performance stats
   */
  getPerformanceStats(): {
    activeTimelines: number;
    activeTweens: number;
    totalAnimations: number;
  } {
    return {
      activeTimelines: this.activeTimelines.size,
      activeTweens: this.activeTweens.size,
      totalAnimations: this.activeTimelines.size + this.activeTweens.size,
    };
  }

  /**
   * Set sprites data attributes for GSAP targeting
   */
  markSpritesForGSAP(sprites: Sprite[]): void {
    sprites.forEach((sprite, index) => {
      this.markSpriteForGSAP(sprite, index);
    });
  }

  /**
   * Cleanup renderer resources (alias for destroy for backward compatibility)
   */
  cleanup(): void {
    this.killAllAnimations();
  }

  // =============================================================================
  // 🎯 UI Panel Management (implements ISliderRenderer)
  // =============================================================================

  /**
   * Create a UI panel with optional backdrop blur
   */
  async createUIPanel(config: UIPanelConfig): Promise<PIXI.Sprite> {
    if (!this.app || !this.uiContainer) {
      throw new Error('Renderer not initialized');
    }

    debugLogger.info(`Creating UI panel: ${config.id}`, 'RENDERER');

    // Create a graphics object for the panel background
    const graphics = new PIXI.Graphics();

    // Set background color with some transparency
    const bgColor = config.content.backgroundColor || 0x000000;
    const bgAlpha = 0.8;
    graphics.rect(0, 0, config.size.width, config.size.height);
    graphics.fill({ color: bgColor, alpha: bgAlpha });

    // Add border radius if specified
    if (config.content.borderRadius) {
      // For rounded corners, we'd need to use different drawing methods
      graphics.clear();
      graphics.roundRect(
        0,
        0,
        config.size.width,
        config.size.height,
        config.content.borderRadius
      );
      graphics.fill({ color: bgColor, alpha: bgAlpha });
    }

    // Create texture from graphics
    const texture = this.app.renderer.generateTexture(graphics);

    // Create sprite from texture
    const panelSprite = new PIXI.Sprite(texture);

    // Add text if specified
    if (config.content.text) {
      const textStyle = new PIXI.TextStyle({
        fontFamily: 'Arial, sans-serif',
        fontSize: config.content.fontSize || 16,
        fill: config.content.textColor || 0xffffff,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: config.size.width - (config.content.padding || 20) * 2,
      });

      const text = new PIXI.Text({
        text: config.content.text,
        style: textStyle,
      });

      // Center text in panel
      text.anchor.set(0.5);
      text.position.set(config.size.width / 2, config.size.height / 2);

      // Add text to a container with the panel sprite
      const panelContainer = new PIXI.Container();
      panelContainer.addChild(panelSprite);
      panelContainer.addChild(text);

      // Position the entire container
      this.positionUIPanel(panelContainer, config.position);

      debugLogger.info(
        `UI panel positioned: ${config.id} at ${config.position}, bounds: ${panelContainer.width}x${panelContainer.height}`,
        'RENDERER'
      );

      // Add backdrop blur if enabled
      if (config.backdropBlur?.enabled) {
        await this.applyBackdropBlurToPanel(
          panelContainer,
          config.backdropBlur
        );
      }

      this.uiContainer.addChild(panelContainer);
      this.uiPanels.set(config.id, panelContainer as PIXI.Sprite);

      debugLogger.info(`UI panel created with text: ${config.id}`, 'RENDERER');
      return panelContainer as PIXI.Sprite;
    } else {
      // Position the sprite
      this.positionUIPanel(panelSprite, config.position);

      // Add backdrop blur if enabled
      if (config.backdropBlur?.enabled) {
        await this.applyBackdropBlurToPanel(panelSprite, config.backdropBlur);
      }

      this.uiContainer.addChild(panelSprite);
      this.uiPanels.set(config.id, panelSprite);

      debugLogger.info(`UI panel created: ${config.id}`, 'RENDERER');
      return panelSprite;
    }
  }

  /**
   * Remove a UI panel by ID
   */
  removeUIPanel(panelId: string): void {
    const panel = this.uiPanels.get(panelId);
    if (panel && this.uiContainer) {
      this.uiContainer.removeChild(panel);
      this.uiPanels.delete(panelId);
      panel.destroy();
      debugLogger.info(`UI panel removed: ${panelId}`, 'RENDERER');
    }
  }

  /**
   * Get all UI panels
   */
  getUIPanels(): PIXI.Sprite[] {
    return Array.from(this.uiPanels.values());
  }

  /**
   * Clear all UI panels
   */
  clearUIPanels(): void {
    this.uiPanels.forEach((panel, _id) => {
      if (this.uiContainer) {
        this.uiContainer.removeChild(panel);
      }
      panel.destroy();
    });
    this.uiPanels.clear();
    debugLogger.info('All UI panels cleared', 'RENDERER');
  }

  /**
   * Position a UI panel based on configuration
   */
  private positionUIPanel(
    panel: PIXI.Container | PIXI.Sprite,
    position: UIPanelConfig['position']
  ): void {
    if (!this.app) return;

    const stageWidth = this.app.screen.width;
    const stageHeight = this.app.screen.height;

    debugLogger.info(
      `Positioning panel: ${position}, stage: ${stageWidth}x${stageHeight}, panel: ${panel.width}x${panel.height}`,
      'RENDERER'
    );

    if (typeof position === 'object') {
      // Custom position
      panel.position.set(position.x, position.y);
    } else {
      // Get panel bounds for pivot calculations
      const bounds = panel.getBounds();
      const panelWidth = bounds.width;
      const panelHeight = bounds.height;

      // Predefined positions
      switch (position) {
        case 'center':
          if ('anchor' in panel) panel.anchor.set(0.5);
          else panel.pivot.set(panelWidth / 2, panelHeight / 2);
          panel.position.set(stageWidth / 2, stageHeight / 2);
          break;
        case 'top-left':
          panel.position.set(20, 20);
          break;
        case 'top-right':
          if ('anchor' in panel) panel.anchor.set(1, 0);
          else panel.pivot.set(panelWidth, 0);
          panel.position.set(stageWidth - 20, 20);
          break;
        case 'bottom-left':
          if ('anchor' in panel) panel.anchor.set(0, 1);
          else panel.pivot.set(0, panelHeight);
          panel.position.set(20, stageHeight - 20);
          break;
        case 'bottom-right':
          if ('anchor' in panel) panel.anchor.set(1, 1);
          else panel.pivot.set(panelWidth, panelHeight);
          panel.position.set(stageWidth - 20, stageHeight - 20);
          debugLogger.info(
            `Bottom-right positioned at: ${stageWidth - 20}, ${stageHeight - 20} with pivot: ${panelWidth}, ${panelHeight}`,
            'RENDERER'
          );
          break;
        default:
          // Default to center
          if ('anchor' in panel) panel.anchor.set(0.5);
          else panel.pivot.set(panelWidth / 2, panelHeight / 2);
          panel.position.set(stageWidth / 2, stageHeight / 2);
      }
    }
  }

  /**
   * Apply backdrop blur to a UI panel
   */
  private async applyBackdropBlurToPanel(
    panel: PIXI.Container | PIXI.Sprite,
    blurConfig: NonNullable<UIPanelConfig['backdropBlur']>
  ): Promise<void> {
    try {
      // Import BackdropBlurFilter dynamically
      const { BackdropBlurFilter } = await import('pixi-filters');

      const filter = new BackdropBlurFilter({
        strength: blurConfig.intensity * 4, // Scale intensity
        quality: blurConfig.quality || 4,
        kernelSize: 5,
        resolution: 1,
      });

      // Apply filter to panel
      panel.filters = [filter];

      debugLogger.info(`Backdrop blur applied to UI panel`, 'RENDERER');
    } catch (error) {
      debugLogger.error(`Failed to apply backdrop blur: ${error}`, 'RENDERER');
    }
  }

  // =============================================================================
  // 🎯 Rendering Control and Cleanup (implements ISliderRenderer)
  // =============================================================================

  /**
   * Force render frame
   */
  render(): void {
    if (this.app) {
      this.app.render();
    }
  }

  /**
   * Complete cleanup and destruction
   */
  destroy(): void {
    // Kill all animations
    this.killAllAnimations();

    // Cleanup sprites
    this.sprites.forEach((sprite) => {
      if (sprite.parent) {
        sprite.parent.removeChild(sprite);
      }
      sprite.destroy();
    });
    this.sprites = [];

    // Cleanup UI panels
    this.clearUIPanels();

    // Destroy PIXI app
    if (this.app) {
      this.app.destroy(true, {
        children: true,
        texture: true,
        textureSource: true,
        context: true,
      });
      this.app = null;
    }

    // Clear references
    this.container = null;
    this.isInitialized = false;
  }

  // =============================================================================
  // 🎯 Private Helper Methods
  // =============================================================================

  /**
   * Create managed timeline with automatic cleanup
   */
  private createManagedTimeline(): gsap.core.Timeline {
    const timeline = gsap.timeline({
      onComplete: () => {
        this.activeTimelines.delete(timeline);
      },
    });

    this.activeTimelines.add(timeline);
    return timeline;
  }

  /**
   * Mark sprite with GSAP data attributes for targeting
   */
  private markSpriteForGSAP(sprite: Sprite, index: number): void {
    // Add simple data properties for GSAP targeting with proper typing
    (sprite as Sprite & { 'data-slider-sprite': boolean })[
      'data-slider-sprite'
    ] = true;
    (sprite as Sprite & { 'data-sprite-index': number })['data-sprite-index'] =
      index;
  }
}
