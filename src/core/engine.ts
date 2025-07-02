import type {
  ISliderEngine,
  ISliderPhysics,
  ISliderRenderer,
  ISliderController,
  SliderState,
  SliderConfig,
  EventEmitter,
  InputCallbacks,
} from './types';
import { serviceContainer, SERVICE_KEYS } from './container';
import {
  ERROR_MESSAGES,
  INTERACTION_EFFECTS,
  SLIDER_EVENTS,
  TEST_CONFIG,
} from '.';

/**
 * Central SliderEngine - Coordinates all slider functionality
 *
 * Responsibilities:
 * - State management
 * - Service coordination
 * - Navigation logic
 * - Event handling
 * - Lifecycle management
 *
 * @example
 * ```typescript
 * const engine = new SliderEngine();
 * await engine.initialize(config);
 * engine.goToSlide(2);
 * ```
 */
export class SliderEngine implements ISliderEngine {
  private state: SliderState = {
    currentIndex: 0,
    isTransitioning: false,
    isInitialized: false,
    totalSlides: 0,
    isLoading: false,
    loadingProgress: 0,
    isPlaying: false,
  };

  private config: SliderConfig | null = null;
  private physics: ISliderPhysics | null = null;
  private renderer: ISliderRenderer | null = null;
  private controller: ISliderController | null = null;
  private eventEmitter: EventEmitter | null = null;

  // Simple fallback event emitter for basic functionality
  private fallbackEvents = new Map<string, ((...args: unknown[]) => void)[]>();

  /**
   * Initialize the slider engine with configuration
   */
  async initialize(config: SliderConfig): Promise<void> {
    try {
      this.setState({ isLoading: true, loadingProgress: 0 });
      this.config = config;

      // Get services from container
      this.physics = serviceContainer.get<ISliderPhysics>(SERVICE_KEYS.PHYSICS);
      this.renderer = serviceContainer.get<ISliderRenderer>(
        SERVICE_KEYS.RENDERER
      );
      this.controller = serviceContainer.get<ISliderController>(
        SERVICE_KEYS.CONTROLLER
      );
      this.eventEmitter = serviceContainer.get<EventEmitter>(
        SERVICE_KEYS.EVENT_EMITTER
      );

      // Update state
      this.setState({
        totalSlides: config.images.length,
        loadingProgress: 20,
      });

      // Initialize physics configuration
      this.physics.setPhysicsConfig(config.physics);
      this.setState({ loadingProgress: 40 });

      // Setup input callbacks
      const inputCallbacks: InputCallbacks = {
        onSwipeLeft: () => this.nextSlide(),
        onSwipeRight: () => this.previousSlide(),
        onDragStart: (x, y) => this.handleDragStart(x, y),
        onDragMove: (x, y, deltaX, deltaY) =>
          this.handleDragMove(x, y, deltaX, deltaY),
        onDragEnd: (x, y) => this.handleDragEnd(x, y),
        onKeyLeft: () => this.previousSlide(),
        onKeyRight: () => this.nextSlide(),
        onTogglePlayPause: () => this.togglePlayPause(),
        onGoToSlide: (index: number) => this.goToSlide(index),
        onEscape: () => this.handleEscape(),
      };

      this.setState({ loadingProgress: 60 });

      // Initialize controller with callbacks
      this.controller.setInputConfig(config.input);
      this.controller.initialize(document.body, inputCallbacks);
      this.setState({ loadingProgress: 80 });

      // Mark as initialized
      this.setState({
        isInitialized: true,
        isLoading: false,
        loadingProgress: 100,
      });

      // Initialize accessibility state
      if (this.controller) {
        this.controller.updateSlideState(
          this.state.currentIndex,
          this.state.totalSlides
        );
        this.controller.updatePlayState(this.state.isPlaying);
      }

      this.emit(SLIDER_EVENTS.INITIALIZED, this.state);
    } catch (error) {
      this.setState({ isLoading: false });
      throw new Error(ERROR_MESSAGES.ENGINE_INIT_FAILED(error));
    }
  }

  /**
   * Navigate to specific slide
   */
  async goToSlide(index: number, animated = true): Promise<void> {
    if (!this.isValidIndex(index) || this.state.isTransitioning) {
      return;
    }

    const previousIndex = this.state.currentIndex;

    try {
      this.setState({ isTransitioning: true });
      this.emit(SLIDER_EVENTS.SLIDE_CHANGE_START, {
        from: previousIndex,
        to: index,
      });

      if (animated && this.physics && this.renderer) {
        // Get sprites from renderer
        const sprites = this.renderer.getSprites();

        // Animate transition using physics engine
        const timeline = this.physics.animateTransition(
          previousIndex,
          index,
          sprites
        );

        // Wait for animation to complete
        await new Promise<void>((resolve) => {
          timeline.call(() => resolve());
        });
      } else if (this.renderer) {
        // Instant transition
        const sprites = this.renderer.getSprites();
        sprites.forEach((sprite, spriteIndex) => {
          this.renderer!.setVisible(sprite, spriteIndex === index);
        });
      }

      this.setState({
        currentIndex: index,
        isTransitioning: false,
      });

      // Update accessibility state for screen readers
      if (this.controller) {
        this.controller.updateSlideState(index, this.state.totalSlides);
      }

      this.emit(SLIDER_EVENTS.SLIDE_CHANGED, {
        from: previousIndex,
        to: index,
      });
    } catch (error) {
      this.setState({ isTransitioning: false });
      throw new Error(ERROR_MESSAGES.NAVIGATION_FAILED(index, error));
    }
  }

  /**
   * Navigate to next slide
   */
  async nextSlide(): Promise<void> {
    const nextIndex = (this.state.currentIndex + 1) % this.state.totalSlides;
    await this.goToSlide(nextIndex);
  }

  /**
   * Navigate to previous slide
   */
  async previousSlide(): Promise<void> {
    const prevIndex =
      this.state.currentIndex === 0
        ? this.state.totalSlides - 1
        : this.state.currentIndex - 1;
    await this.goToSlide(prevIndex);
  }

  /**
   * Get current slider state
   */
  getState(): SliderState {
    return { ...this.state };
  }

  /**
   * Get current slide index
   */
  getCurrentIndex(): number {
    return this.state.currentIndex;
  }

  /**
   * Get total number of slides
   */
  getTotalSlides(): number {
    return this.state.totalSlides;
  }

  /**
   * Check if slider is transitioning
   */
  isTransitioning(): boolean {
    return this.state.isTransitioning;
  }

  /**
   * Toggle play/pause state for accessibility
   */
  togglePlayPause(): void {
    const newPlayState = !this.state.isPlaying;
    this.setState({ isPlaying: newPlayState });

    // Update accessibility state for screen readers
    if (this.controller) {
      this.controller.updatePlayState(newPlayState);
    }

    // Emit play/pause state change event
    this.emit(SLIDER_EVENTS.PLAY_STATE_CHANGED, {
      isPlaying: newPlayState,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if slider is playing
   */
  isPlaying(): boolean {
    return this.state.isPlaying;
  }

  /**
   * Handle escape key for accessibility
   */
  handleEscape(): void {
    // Reset to first slide
    this.goToSlide(0).catch((error) => {
      // Handle error silently or emit error event
      this.emit(SLIDER_EVENTS.ERROR, {
        message: 'Failed to reset to first slide',
        error,
        timestamp: Date.now(),
      });
    });

    // Pause if playing
    if (this.state.isPlaying) {
      this.togglePlayPause();
    }

    // Emit escape event
    this.emit(SLIDER_EVENTS.ESCAPE_PRESSED, {
      previousIndex: this.state.currentIndex,
      timestamp: Date.now(),
    });
  }

  /**
   * Subscribe to events
   */
  on(event: string, callback: (...args: unknown[]) => void): void {
    if (this.eventEmitter) {
      this.eventEmitter.on(event, callback);
    } else {
      // Use fallback event system
      if (!this.fallbackEvents.has(event)) {
        this.fallbackEvents.set(event, []);
      }
      this.fallbackEvents.get(event)!.push(callback);
    }
  }

  /**
   * Unsubscribe from events
   */
  off(event: string, callback: (...args: unknown[]) => void): void {
    if (this.eventEmitter) {
      this.eventEmitter.off(event, callback);
    } else {
      // Use fallback event system
      const callbacks = this.fallbackEvents.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
  }

  /**
   * Emit events
   */
  emit(event: string, ...args: unknown[]): void {
    if (this.eventEmitter) {
      this.eventEmitter.emit(event, ...args);
    } else {
      // Use fallback event system
      const callbacks = this.fallbackEvents.get(event);
      if (callbacks) {
        callbacks.forEach((callback) => callback(...args));
      }
    }
  }

  /**
   * Destroy the slider engine
   */
  destroy(): void {
    // Kill all animations
    this.physics?.killAllAnimations();

    // Destroy services
    this.renderer?.destroy();
    this.controller?.destroy();
    this.physics?.cleanup();

    // Reset state
    this.state = {
      currentIndex: 0,
      isTransitioning: false,
      isInitialized: false,
      totalSlides: 0,
      isLoading: false,
      loadingProgress: 0,
      isPlaying: false,
    };

    this.emit(SLIDER_EVENTS.DESTROYED);
  }

  /**
   * Handle drag start
   */
  private handleDragStart(x: number, y: number): void {
    this.emit(SLIDER_EVENTS.DRAG_START, { x, y });
  }

  /**
   * Handle drag move with scale effect
   */
  private handleDragMove(
    x: number,
    y: number,
    deltaX: number,
    deltaY: number
  ): void {
    if (this.physics && this.renderer) {
      const sprites = this.renderer.getSprites();
      const currentSprite = sprites[this.state.currentIndex];

      if (currentSprite) {
        // Apply scale effect based on drag distance
        const intensity =
          Math.abs(deltaX) / TEST_CONFIG.CALCULATION.MOVEMENT_BASE; // Scale based on drag distance
        this.physics.animateScale(
          currentSprite,
          INTERACTION_EFFECTS.BASE_SCALE +
            intensity * INTERACTION_EFFECTS.DRAG_SCALE_MULTIPLIER,
          INTERACTION_EFFECTS.DRAG_SCALE_DURATION
        );
      }
    }

    this.emit(SLIDER_EVENTS.DRAG_MOVE, { x, y, deltaX, deltaY });
  }

  /**
   * Handle drag end
   */
  private handleDragEnd(x: number, y: number): void {
    if (this.physics && this.renderer) {
      const sprites = this.renderer.getSprites();
      const currentSprite = sprites[this.state.currentIndex];

      if (currentSprite) {
        // Reset scale
        this.physics.animateScale(
          currentSprite,
          INTERACTION_EFFECTS.BASE_SCALE,
          INTERACTION_EFFECTS.SCALE_RESET_DURATION
        );
      }
    }

    this.emit(SLIDER_EVENTS.DRAG_END, { x, y });
  }

  /**
   * Update state and emit change events
   */
  private setState(updates: Partial<SliderState>): void {
    const previousState = { ...this.state };
    this.state = { ...this.state, ...updates };
    this.emit(SLIDER_EVENTS.STATE_CHANGED, {
      previous: previousState,
      current: this.state,
    });
  }

  /**
   * Validate slide index
   */
  private isValidIndex(index: number): boolean {
    return index >= 0 && index < this.state.totalSlides;
  }
}
