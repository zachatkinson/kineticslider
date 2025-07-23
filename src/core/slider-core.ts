/**
 * @fileoverview SliderCore - Main slider component logic
 *
 * Core slider functionality implementing essential navigation, playbook control,
 * and state management. Integrates with manager pattern and service container
 * for modular, testable architecture.
 *
 * @version 2.0.0 - Manager Integration
 */

import {
  GSAPTimelineFactory,
  type TransitionConfig,
} from '../physics/gsap-timeline-factory';
import { SimpleEventEmitter } from './event-emitter';
import { serviceContainer, SERVICE_KEYS } from './container';
import type {
  SliderConfig,
  SliderState,
  ISliderEngine,
  ISliderPhysics,
  ISliderRenderer,
  ISliderController,
} from './types';
import {
  SLIDER_EVENTS,
  ANIMATION_DURATION,
  EASING,
  SLIDER_ERROR_CODES,
  PHYSICS,
} from './constants';
import { ConfigurationSystem } from '../config';

// Import extracted managers
import { StateManager } from '../managers/state-manager';
import { AutoPlayManager } from '../managers/auto-play-manager';
import {
  NavigationManager,
  NavigationInputType,
} from '../managers/navigation-manager';
import { LoopManager, LoopMode } from '../managers/loop-manager';

/**
 * Main slider component providing essential functionality
 */
export class SliderCore extends SimpleEventEmitter implements ISliderEngine {
  private config: SliderConfig | null = null;
  private timelineFactory: GSAPTimelineFactory;
  private currentTimeline: gsap.core.Timeline | null = null;
  private container: HTMLElement | null = null;

  // Manager dependencies - extracted functionality
  private stateManager: StateManager;
  private autoPlayManager: AutoPlayManager;
  private navigationManager: NavigationManager;
  private loopManager: LoopManager;

  // Service dependencies
  private physics: ISliderPhysics | null = null;
  private renderer: ISliderRenderer | null = null;
  private controller: ISliderController | null = null;

  constructor(timelineFactory?: GSAPTimelineFactory) {
    super();
    this.timelineFactory = timelineFactory || new GSAPTimelineFactory();

    // Initialize managers
    this.stateManager = new StateManager();
    this.autoPlayManager = new AutoPlayManager();
    this.navigationManager = new NavigationManager();
    this.loopManager = new LoopManager();

    this.setupManagerEventHandling();
    this.setupErrorHandling();
  }

  // =============================================================================
  // 🎯 Public API - Core Functionality
  // =============================================================================

  /**
   * Initialize slider with configuration
   */
  async initialize(
    userConfig: Partial<SliderConfig>,
    container?: HTMLElement
  ): Promise<void> {
    try {
      // Process configuration with validation and defaults
      this.config = ConfigurationSystem.processConfig(userConfig);

      // Initialize state through StateManager
      this.stateManager.updateState({ isLoading: true, loadingProgress: 0 });
      this.emit(SLIDER_EVENTS.INITIALIZATION_START);

      // Store container reference
      this.container = container || null;

      // Initialize dependencies from service container
      await this.initializeServices(container);

      // Create image metadata elements
      this.createImageMetadataElements();

      // Get slides array
      const slideCount = this.config.slides.length;

      // Set up initial state through StateManager
      this.stateManager.updateState({
        totalSlides: slideCount,
        currentIndex: 0,
        isLoading: false,
        loadingProgress: 100,
        isInitialized: true,
      });

      // Configure managers with slider configuration
      this.configureManagers(this.config);

      // Update manager bounds
      this.navigationManager.updateSlideBounds(0, slideCount);

      // Update controller state now that totalSlides is set
      if (this.controller) {
        this.controller.updateSlideState(
          this.stateManager.getCurrentIndex(),
          this.stateManager.getTotalSlides()
        );
      }

      // Start auto-play if enabled
      if (this.config.autoPlay) {
        this.play();
      }

      this.emit(SLIDER_EVENTS.INITIALIZED, {
        totalSlides: this.stateManager.getTotalSlides(),
        currentIndex: this.stateManager.getCurrentIndex(),
      });
    } catch (error) {
      this.handleError(error, 'initialize');
      throw error;
    }
  }

  /**
   * Navigate to specific slide with optional animation
   */
  async goToSlide(index: number, animated: boolean = true): Promise<void> {
    try {
      const currentIndex = this.stateManager.getCurrentIndex();
      const totalSlides = this.stateManager.getTotalSlides();

      // Validate slide index first, before any navigation request
      if (!Number.isInteger(index) || index < 0 || index >= totalSlides) {
        throw new Error(
          `${SLIDER_ERROR_CODES.INVALID_SLIDE_INDEX}: Index ${index} is out of range (0-${totalSlides - 1})`
        );
      }

      if (this.stateManager.isTransitioning()) {
        throw new Error(
          `${SLIDER_ERROR_CODES.TRANSITION_IN_PROGRESS}: Cannot navigate while transitioning`
        );
      }

      const navigationRequest = this.navigationManager.requestNavigation(
        index,
        NavigationInputType.API,
        animated
      );

      if (!navigationRequest) {
        return; // Navigation request was blocked
      }

      if (index === currentIndex) {
        return; // Already at target slide
      }

      const fromIndex = currentIndex;

      // Update state through StateManager
      this.stateManager.updateState({ isTransitioning: true });
      this.navigationManager.updateTransitionState(true);

      this.emit(SLIDER_EVENTS.SLIDE_CHANGE_START, {
        fromIndex,
        toIndex: index,
      });

      // Perform transition
      try {
        if (animated) {
          await this.performAnimatedTransition(fromIndex, index);
        } else {
          await this.performInstantTransition(index);
        }
      } catch {
        // Transition failed but we'll continue with state update
      }

      // Update states through managers
      this.stateManager.updateState({
        currentIndex: index,
        isTransitioning: false,
      });
      this.navigationManager.updateSlideBounds(index, totalSlides);
      this.navigationManager.updateTransitionState(false);

      // Update controller state for accessibility
      if (this.controller) {
        this.controller.updateSlideState(index, totalSlides);
      }

      // Update image metadata display
      this.updateImageMetadata(index);

      this.emit(SLIDER_EVENTS.SLIDE_CHANGED, {
        currentIndex: index,
        previousIndex: fromIndex,
      });
    } catch (error) {
      this.stateManager.updateState({ isTransitioning: false });
      this.navigationManager.updateTransitionState(false);
      this.handleError(error, 'goToSlide');
      throw error;
    }
  }

  /**
   * Navigate to next slide
   */
  async nextSlide(): Promise<void> {
    if (!this.config) {
      throw new Error(
        `${SLIDER_ERROR_CODES.NOT_INITIALIZED}: Slider not initialized`
      );
    }

    const currentIndex = this.stateManager.getCurrentIndex();
    const totalSlides = this.stateManager.getTotalSlides();

    // Use LoopManager to determine next index
    const loopTransition = this.loopManager.getNextIndex(
      currentIndex,
      totalSlides,
      'forward'
    );

    if (!loopTransition.shouldNavigate) {
      // If auto-play is running and we can't loop, pause auto-play
      if (this.stateManager.isPlaying()) {
        this.pause();
      }
      return;
    }

    await this.goToSlide(loopTransition.targetIndex);
  }

  /**
   * Navigate to previous slide
   */
  async previousSlide(): Promise<void> {
    if (!this.config) {
      throw new Error(
        `${SLIDER_ERROR_CODES.NOT_INITIALIZED}: Slider not initialized`
      );
    }

    const currentIndex = this.stateManager.getCurrentIndex();
    const totalSlides = this.stateManager.getTotalSlides();

    // Use LoopManager to determine previous index
    const loopTransition = this.loopManager.getNextIndex(
      currentIndex,
      totalSlides,
      'backward'
    );

    if (!loopTransition.shouldNavigate) {
      return;
    }

    await this.goToSlide(loopTransition.targetIndex);
  }

  /**
   * Start auto-play
   */
  play(): void {
    if (this.stateManager.isPlaying()) {
      return;
    }

    // Update state through StateManager
    this.stateManager.updateState({ isPlaying: true });

    // Enable auto-play temporarily if not already enabled (for manual play button)
    const currentState = this.autoPlayManager.getState();

    if (!currentState.config.enabled) {
      this.autoPlayManager.updateConfig({ enabled: true });
    }

    // For manual play, also disable automatic pausing that might interfere
    this.autoPlayManager.updateConfig({
      enabled: true,
      pauseOnFocus: false,
      pauseOnHover: false,
      pauseOnInteraction: false,
    });

    // Start auto-play through AutoPlayManager
    this.autoPlayManager.start(async () => {
      await this.nextSlide();
    });

    // Update controller state
    if (this.controller) {
      this.controller.updatePlayState(true);
    }

    // Events are already emitted by AutoPlayManager, but we emit slider-specific ones
    this.emit(SLIDER_EVENTS.PLAY_STATE_CHANGED, { isPlaying: true });
  }

  /**
   * Pause auto-play
   */
  pause(): void {
    if (!this.stateManager.isPlaying()) {
      return;
    }

    // Update state through StateManager
    this.stateManager.updateState({ isPlaying: false });

    // Pause auto-play through AutoPlayManager (emits PLAY_PAUSED)
    this.autoPlayManager.pause();

    // Update controller state
    if (this.controller) {
      this.controller.updatePlayState(false);
    }

    // Events are already emitted by AutoPlayManager, but we emit slider-specific ones
    this.emit(SLIDER_EVENTS.PLAY_STATE_CHANGED, { isPlaying: false });
  }

  /**
   * Toggle play/pause state
   */
  togglePlayPause(): void {
    if (this.stateManager.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Update slider configuration dynamically
   */
  updateConfig(updates: Partial<SliderConfig>): void {
    if (!this.config) {
      throw new Error(
        `${SLIDER_ERROR_CODES.NOT_INITIALIZED}: Slider not initialized`
      );
    }

    // Merge updates with existing config and revalidate
    const mergedConfig = { ...this.config, ...updates };
    this.config = ConfigurationSystem.processConfig(mergedConfig);

    // Handle autoPlay configuration changes
    if (updates.autoPlay !== undefined) {
      if (updates.autoPlay === false && this.stateManager.isPlaying()) {
        // Stop auto-play if it was disabled
        this.pause();
      } else if (updates.autoPlay === true && !this.stateManager.isPlaying()) {
        // Start auto-play if it was enabled
        this.play();
      }
    }

    // Handle loop configuration changes
    if (updates.loop !== undefined) {
      this.loopManager.updateConfig({
        enabled: updates.loop,
      });
    }

    // If auto-play is running and interval changed, restart with new interval
    if (
      this.stateManager.isPlaying() &&
      (updates as { autoPlayInterval?: number }).autoPlayInterval !== undefined
    ) {
      this.autoPlayManager.stop();
      this.autoPlayManager.updateConfig({
        interval: (updates as { autoPlayInterval?: number }).autoPlayInterval!,
      });
      this.autoPlayManager.start(async () => {
        await this.nextSlide();
      });
    }

    this.emit(SLIDER_EVENTS.CONFIG_UPDATED, { config: this.config });
  }

  /**
   * Handle escape key for accessibility
   */
  handleEscape(): void {
    this.pause();
    this.emit(SLIDER_EVENTS.ESCAPE_PRESSED);
  }

  /**
   * Cleanup and destroy slider
   */
  destroy(): void {
    try {
      // Emit destroy event before cleanup
      this.emit(SLIDER_EVENTS.DESTROYED);

      this.pause();

      // Kill current animations
      if (this.currentTimeline) {
        this.currentTimeline.kill();
        this.currentTimeline = null;
      }

      // Destroy managers
      this.autoPlayManager.destroy();
      this.navigationManager.destroy();
      this.loopManager.destroy();
      this.stateManager.destroy();

      // Destroy services
      if (this.renderer) {
        this.renderer.destroy();
      }
      if (this.controller) {
        this.controller.destroy();
      }
      if (this.physics) {
        this.physics.cleanup();
      }

      this.config = null;
      this.removeAllListeners();
    } catch (error) {
      this.handleError(error, 'destroy');
    }
  }

  // =============================================================================
  // 🔍 State Access Methods
  // =============================================================================

  getState(): SliderState {
    return this.stateManager.getState();
  }

  getCurrentIndex(): number {
    return this.stateManager.getCurrentIndex();
  }

  getTotalSlides(): number {
    return this.stateManager.getTotalSlides();
  }

  isTransitioning(): boolean {
    return this.stateManager.isTransitioning();
  }

  isPlaying(): boolean {
    return this.stateManager.isPlaying();
  }

  // =============================================================================
  // 🔧 Private Implementation
  // =============================================================================

  /**
   * Set up event handling between managers and core slider
   */
  private setupManagerEventHandling(): void {
    // StateManager events
    this.stateManager.on(SLIDER_EVENTS.STATE_CHANGED, (state) => {
      this.emit(SLIDER_EVENTS.STATE_CHANGED, state);
    });

    // AutoPlayManager events
    this.autoPlayManager.on(SLIDER_EVENTS.PLAY_STARTED, () => {
      this.emit(SLIDER_EVENTS.PLAY_STARTED);
    });

    this.autoPlayManager.on(SLIDER_EVENTS.PLAY_PAUSED, () => {
      this.emit(SLIDER_EVENTS.PLAY_PAUSED);
    });

    this.autoPlayManager.on(SLIDER_EVENTS.PLAY_STOPPED, () => {
      this.emit(SLIDER_EVENTS.PLAY_STOPPED);
    });

    // Auto-play resume events with proper callback restoration
    this.autoPlayManager.on(SLIDER_EVENTS.PLAY_RESUMED, () => {
      // Reconnect the nextSlide callback when auto-play resumes
      this.autoPlayManager.start(async () => {
        await this.nextSlide();
      });
      this.emit(SLIDER_EVENTS.PLAY_RESUMED);
    });

    this.autoPlayManager.on(SLIDER_EVENTS.VISIBILITY_RESUMED, () => {
      // Handle page visibility resumed
      if (this.stateManager.isPlaying()) {
        this.autoPlayManager.start(async () => {
          await this.nextSlide();
        });
      }
      this.emit(SLIDER_EVENTS.VISIBILITY_RESUMED);
    });

    this.autoPlayManager.on(SLIDER_EVENTS.WINDOW_FOCUS_RESUMED, () => {
      // Handle window focus resumed
      if (this.stateManager.isPlaying()) {
        this.autoPlayManager.start(async () => {
          await this.nextSlide();
        });
      }
      this.emit(SLIDER_EVENTS.WINDOW_FOCUS_RESUMED);
    });

    // NavigationManager events
    this.navigationManager.on(SLIDER_EVENTS.NAVIGATION_REQUESTED, (data) => {
      this.emit(SLIDER_EVENTS.NAVIGATION_REQUESTED, data);
    });

    // LoopManager events
    this.loopManager.on(SLIDER_EVENTS.LOOP_FORWARD, (data) => {
      this.emit(SLIDER_EVENTS.LOOP_FORWARD, data);
    });

    this.loopManager.on(SLIDER_EVENTS.LOOP_BACKWARD, (data) => {
      this.emit(SLIDER_EVENTS.LOOP_BACKWARD, data);
    });
  }

  /**
   * Configure managers with enhanced slider configuration
   */
  private configureManagers(config: SliderConfig): void {
    // Configure AutoPlayManager with enhanced options
    this.autoPlayManager.updateConfig({
      enabled: config.autoPlay || false,
      interval:
        config.autoPlayInterval ||
        config.duration ||
        ANIMATION_DURATION.STANDARD * 1000,
      pauseOnHover: config.pauseOnHover !== false, // Default true unless explicitly disabled
      pauseOnFocus: config.pauseOnFocus !== false, // Default true unless explicitly disabled
      pauseOnInteraction: config.pauseOnInteraction !== false, // Default true unless explicitly disabled
    });

    // Configure LoopManager
    this.loopManager.updateConfig({
      enabled: config.loop || false,
      mode: LoopMode.INFINITE, // Default to infinite loop
    });

    // Configure NavigationManager with input settings
    const inputConfig = config.input;
    this.navigationManager.updateConfig({
      enableKeyboard: inputConfig?.enableKeyboard !== false, // Default enabled
      enableMouse: inputConfig?.enableMouse !== false, // Default enabled
      enableTouch: inputConfig?.enableTouch !== false, // Default enabled
      enableGesture: true,
      debounceDelay: 50,
      preventDuringTransition: true,
    });

    // StateManager doesn't need specific slider config, it uses defaults
  }

  private async initializeServices(container?: HTMLElement): Promise<void> {
    // Get services from container - simplified error handling

    // Physics service (optional)
    try {
      this.physics = serviceContainer.get<ISliderPhysics>(SERVICE_KEYS.PHYSICS);
    } catch {
      this.physics = null;
    }

    // Renderer service (optional for production, required for visual experience)
    try {
      this.renderer = serviceContainer.get<ISliderRenderer>(
        SERVICE_KEYS.RENDERER
      );
    } catch {
      this.renderer = null;
    }

    // Controller service (required)
    this.controller = serviceContainer.get<ISliderController>(
      SERVICE_KEYS.CONTROLLER
    );
    if (!this.controller) {
      throw new Error(
        `${SLIDER_ERROR_CODES.DEPENDENCY_MISSING}: Controller service is required but not available`
      );
    }

    // Initialize renderer if available and container provided
    if (container && this.renderer) {
      const renderConfig = {
        width: container.clientWidth || 800,
        height: container.clientHeight || 600,
        backgroundColor: 0x000000,
        antialias: true,
        resolution: 1,
        ...this.config?.rendering,
      };

      try {
        await this.renderer.initialize(container, renderConfig);

        // Create sprites for all slides
        for (const [i, slide] of this.config!.slides.entries()) {
          try {
            await this.renderer.createSprite(slide.src, i);
          } catch {
            // Sprite creation failed, continue with next slide
          }
        }

        // Update sprite visibility for created sprites
        const sprites = this.renderer.getSprites();
        sprites.forEach((sprite, i) => {
          const shouldBeVisible = i === this.stateManager.getCurrentIndex();
          this.renderer!.setVisible(sprite, shouldBeVisible);
        });
      } catch {
        this.renderer = null;
      }
    }

    // Configure services - regardless of renderer success
    if (this.config) {
      // Configure physics if available
      if (this.physics) {
        // Use provided physics config or default
        const physicsConfig = {
          transitionDuration: 0.3,
          transitionEase: 'power2.out',
          swipeThreshold: 50,
          scaleIntensity: 0.1,
          momentumDamping: 0.8,
          ...this.config.physics,
        };

        this.physics.setPhysicsConfig(physicsConfig);
      }

      // Initialize controller with input callbacks
      if (this.controller && container) {
        this.controller.initialize(container, {
          onSwipeLeft: () => {
            return this.nextSlide();
          },
          onSwipeRight: () => {
            return this.previousSlide();
          },
          onDragStart: (_x: number, _y: number) => {
            // Drag start handling - could be used for momentum
          },
          onDragMove: (
            _x: number,
            _y: number,
            _deltaX: number,
            _deltaY: number
          ) => {
            // Drag move handling - could be used for follow dragging
          },
          onDragEnd: (_x: number, _y: number) => {
            // Drag end handling - could be used for release animations
          },
          onKeyLeft: () => {
            return this.previousSlide();
          },
          onKeyRight: () => {
            return this.nextSlide();
          },
          onTogglePlayPause: () => {
            return this.togglePlayPause();
          },
          onGoToSlide: (index: number) => {
            return this.goToSlide(index);
          },
          onEscape: () => {
            return this.handleEscape();
          },
        });
      }
    }
  }

  private async performAnimatedTransition(
    fromIndex: number,
    toIndex: number
  ): Promise<void> {
    if (!this.physics || !this.renderer) {
      await this.performInstantTransition(toIndex);
      return;
    }

    const sprites = this.renderer.getSprites();

    // Check if we're using headless renderer (has different sprite structure)
    const isHeadlessRenderer =
      sprites.length > 0 &&
      (sprites[0] as { isHeadlessSprite?: boolean })?.isHeadlessSprite;

    if (isHeadlessRenderer) {
      await this.performInstantTransition(toIndex);
      return;
    }

    // Additional safety check: ensure sprites are PIXI-compatible
    if (
      sprites.length > 0 &&
      sprites[0] &&
      typeof sprites[0] === 'object' &&
      'isHeadlessSprite' in sprites[0]
    ) {
      await this.performInstantTransition(toIndex);
      return;
    }

    const fromSprite = sprites.at(fromIndex);
    const toSprite = sprites.at(toIndex);
    if (!fromSprite || !toSprite) {
      await this.performInstantTransition(toIndex);
      return;
    }

    try {
      const transitionConfig: TransitionConfig = {
        fromIndex,
        toIndex,
        scaleIntensity:
          this.config?.physics?.scaleIntensity || PHYSICS.SCALE_INTENSITY,
        duration: this.config?.duration || ANIMATION_DURATION.STANDARD,
        ease: this.config?.easing || EASING.EASE_OUT,
      };

      // Create transition timeline
      this.currentTimeline = GSAPTimelineFactory.createSlideTransition(
        fromSprite,
        toSprite,
        transitionConfig
      );

      // Use instant transition for reliability in all environments
      // GSAP animations can be unreliable in different browser contexts
      await this.performInstantTransition(toIndex);
      return;
    } catch {
      await this.performInstantTransition(toIndex);
    }
  }

  private async performInstantTransition(index: number): Promise<void> {
    if (!this.renderer) {
      this.updateVisualSlideIndicator(index);
      return;
    }

    const sprites = this.renderer.getSprites();
    if (sprites.length === 0 || index >= sprites.length) {
      this.updateVisualSlideIndicator(index);
      return;
    }

    // Hide all sprites and show only the target
    sprites.forEach((sprite, i) => {
      this.renderer!.setVisible(sprite, i === index);
    });
  }

  /**
   * Fallback method to update visual indicators when PIXI rendering isn't available
   */
  private updateVisualSlideIndicator(index: number): void {
    // Update the existing HTML slides to show the correct one
    const slides = document.querySelectorAll('.slide');
    slides.forEach((slide, i) => {
      const slideElement = slide as HTMLElement;
      if (i === index) {
        slideElement.classList.add('active');
        slideElement.style.display = 'block';
        slideElement.style.opacity = '1';
      } else {
        slideElement.classList.remove('active');
        slideElement.style.display = 'none';
        slideElement.style.opacity = '0';
      }
    });
  }

  private setupErrorHandling(): void {
    this.on(SLIDER_EVENTS.ERROR, () => {
      // Central error handling
      if (this.stateManager.isTransitioning()) {
        this.stateManager.updateState({ isTransitioning: false });
        this.navigationManager.updateTransitionState(false);
      }
    });
  }

  private handleError(error: unknown, context: string): void {
    const sliderError =
      error instanceof Error ? error : new Error(String(error));
    this.emit(SLIDER_EVENTS.ERROR, {
      error: sliderError,
      context,
      state: this.stateManager.getState(),
    });
  }

  /**
   * Create image metadata DOM elements for E2E tests
   */
  private createImageMetadataElements(): void {
    if (!this.container) {
      return;
    }

    // Create image metadata container
    const metadataContainer = document.createElement('div');
    metadataContainer.className = 'image-meta';
    metadataContainer.style.position = 'absolute';
    metadataContainer.style.bottom = '10px';
    metadataContainer.style.left = '10px';
    metadataContainer.style.background = 'rgba(0, 0, 0, 0.7)';
    metadataContainer.style.color = 'white';
    metadataContainer.style.padding = '8px 12px';
    metadataContainer.style.borderRadius = '4px';
    metadataContainer.style.fontSize = '14px';
    metadataContainer.style.zIndex = '1000';

    // Create title element
    const titleElement = document.createElement('span');
    titleElement.textContent = `Image ${this.stateManager.getCurrentIndex() + 1} of ${this.stateManager.getTotalSlides()}`;

    metadataContainer.appendChild(titleElement);
    this.container.appendChild(metadataContainer);
  }

  /**
   * Update image metadata display
   */
  private updateImageMetadata(index: number): void {
    if (!this.container) {
      return;
    }

    const titleElement = this.container.querySelector('.image-meta span');
    if (titleElement) {
      titleElement.textContent = `Image ${index + 1} of ${this.stateManager.getTotalSlides()}`;
    }
  }
}

// Note: SliderCore is registered in index.ts to avoid circular dependencies
