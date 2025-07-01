import { gsap as h } from "gsap";
const z = "1.0.0", v = {
  /** Style property */
  STYLE: "style",
  /** Sprite X coordinate property */
  X_COORDINATE: "x",
  /** Sprite Y coordinate property */
  Y_COORDINATE: "y",
  /** Will-change auto value */
  WILL_CHANGE_AUTO: "auto",
  /** Will-change transform value */
  WILL_CHANGE_TRANSFORM: "transform, opacity"
}, x = {
  /** Slider sprite data attribute */
  SLIDER_SPRITE: "data-slider-sprite",
  /** Sprite index data attribute */
  SPRITE_INDEX: "data-sprite-index"
}, p = {
  /** Mouse events */
  MOUSE_DOWN: "mousedown",
  MOUSE_MOVE: "mousemove",
  MOUSE_UP: "mouseup",
  MOUSE_LEAVE: "mouseleave",
  /** Touch events */
  TOUCH_START: "touchstart",
  TOUCH_MOVE: "touchmove",
  TOUCH_END: "touchend",
  TOUCH_CANCEL: "touchcancel",
  /** Keyboard events */
  KEY_DOWN: "keydown",
  /** Other events */
  CONTEXT_MENU: "contextmenu"
}, b = {
  /** Form elements */
  INPUT: "INPUT",
  TEXTAREA: "TEXTAREA",
  SELECT: "SELECT"
}, w = {
  /** Form attributes */
  CONTENT_EDITABLE: "contenteditable",
  /** Values */
  TRUE: "true"
}, R = {
  /** Arrow keys */
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  /** Common keys */
  ENTER: "Enter",
  ESCAPE: "Escape"
}, g = {
  /** Core lifecycle events */
  INITIALIZED: "initialized",
  DESTROYED: "destroyed",
  /** Slide navigation events */
  SLIDE_CHANGE_START: "slideChangeStart",
  SLIDE_CHANGED: "slideChanged",
  /** Interaction events */
  DRAG_START: "dragStart",
  DRAG_MOVE: "dragMove",
  DRAG_END: "dragEnd",
  /** State events */
  STATE_CHANGED: "stateChanged",
  /** Playback events */
  PLAY_STATE_CHANGED: "playStateChanged",
  /** Accessibility events */
  ESCAPE_PRESSED: "escapePressed",
  /** Error events */
  ERROR: "error"
}, _ = {
  /** Target frame rate for animations */
  TARGET_FPS: 60,
  /** Frame budget in milliseconds (1000ms / 60fps) */
  FRAME_BUDGET_MS: 16.67,
  /** Sample buffer size for velocity tracking */
  SAMPLE_BUFFER_SIZE: 10,
  /** Throttle interval for 60fps performance (16.67ms) */
  THROTTLE_INTERVAL: 16.67
}, T = {
  /** Quick animations (micro-interactions) */
  QUICK: 0.15,
  /** Fast animations (button hovers, tooltips) */
  FAST: 0.2,
  /** Standard animations (most UI transitions) */
  STANDARD: 0.3,
  /** Medium animations (modal dialogs, page transitions) */
  MEDIUM: 0.5,
  /** Slow animations (complex transitions) */
  SLOW: 0.8,
  /** Very slow animations (dramatic effects) */
  VERY_SLOW: 1
}, E = {
  /** Standard ease out (most common) */
  EASE_OUT: "power2.out",
  /** Standard ease in */
  EASE_IN: "power2.in",
  /** Standard ease in-out */
  EASE_IN_OUT: "power2.inOut",
  /** Bounce effect */
  BOUNCE: "bounce.out",
  /** Elastic effect */
  ELASTIC: "elastic.out(1, 0.3)",
  /** Circ effect */
  CIRC: "circ.out"
}, c = {
  /** Standard momentum damping factor */
  MOMENTUM_DAMPING: 0.85,
  /** Friction coefficient */
  FRICTION: 0.85,
  /** Spring constant for elastic animations */
  SPRING_CONSTANT: 0.1,
  /** Velocity threshold for motion detection (px/ms) */
  VELOCITY_THRESHOLD: 0.5,
  /** Maximum allowed velocity (px/ms) */
  MAX_VELOCITY: 2,
  /** Exit animation speed factor (faster fade out) */
  EXIT_SPEED_FACTOR: 0.6,
  /** Minimum animation duration (seconds) */
  MIN_DURATION: 0.05,
  /** Distance normalization factor for drag calculations */
  DISTANCE_NORMALIZATION: 100,
  /** Spring calculation minimum constant threshold */
  SPRING_MIN_CONSTANT: 0.1,
  /** Duration calculation factors */
  DURATION_FACTORS: {
    /** Minimum duration offset multiplier */
    MIN_OFFSET: 0.5,
    /** Maximum duration offset multiplier */
    MAX_OFFSET: 0.5,
    /** Spring damping intensity factor */
    SPRING_DAMPING_FACTOR: 0.5
  },
  /** Time factor bounds for adaptive timing */
  TIME_FACTOR: {
    MIN: 0.5,
    MAX: 1.5
  }
}, f = {
  /** Minimum allowed scale (prevents invisible sprites) */
  MIN: 0.1,
  /** Default scale */
  DEFAULT: 1,
  /** Slight scale up for emphasis */
  EMPHASIS: 1.05,
  /** Medium scale up for highlights */
  HIGHLIGHT: 1.1,
  /** Medium scale down for exits */
  EXIT: 0.9
}, C = {
  /** No intensity */
  NONE: 0,
  /** Very low intensity (scale intensity default) */
  VERY_LOW: 0.1,
  /** Low intensity */
  LOW: 0.3,
  /** Medium intensity */
  MEDIUM: 0.5,
  /** High intensity */
  HIGH: 0.8,
  /** Maximum intensity */
  MAX: 1
}, N = {
  /** Scale multiplier for drag intensity */
  DRAG_SCALE_MULTIPLIER: 0.1,
  /** Duration for drag scale transitions */
  DRAG_SCALE_DURATION: 0.1,
  /** Duration for scale reset animations */
  SCALE_RESET_DURATION: 0.2,
  /** Base scale for normal state */
  BASE_SCALE: 1
}, P = {
  /** Swipe threshold in pixels */
  SWIPE_THRESHOLD: 50,
  /** Drag threshold in pixels */
  DRAG_THRESHOLD: 10,
  /** Tap threshold in pixels */
  TAP_THRESHOLD: 5,
  /** Long press duration in milliseconds */
  LONG_PRESS_DURATION: 500,
  /** Maximum touch targets for multi-touch */
  MAX_TOUCH_TARGETS: 2,
  /** Minimum movement threshold for input */
  MIN_MOVEMENT_THRESHOLD: 0.1
}, G = {
  /** Test calculation base values */
  CALCULATION: {
    MOVEMENT_BASE: 100
  }
}, K = {
  transitionDuration: T.SLOW,
  transitionEase: E.EASE_OUT,
  swipeThreshold: P.SWIPE_THRESHOLD,
  scaleIntensity: C.VERY_LOW,
  // 0.1 - matches test expectations
  momentumDamping: c.MOMENTUM_DAMPING
}, $ = {
  enableMouse: !0,
  enableTouch: !0,
  enableKeyboard: !0,
  swipeThreshold: P.SWIPE_THRESHOLD,
  dragThreshold: P.DRAG_THRESHOLD
}, d = {
  /** GPU optimization settings */
  GPU_OPTIMIZED: {
    force3D: !0,
    ease: E.EASE_OUT
  },
  /** Standard timeline settings */
  TIMELINE: {
    force3D: !0,
    ease: E.EASE_OUT
  },
  /** Performance optimized settings */
  PERFORMANCE: {
    force3D: !0,
    ease: E.EASE_OUT,
    overwrite: "auto"
  }
}, L = {
  /** PIXI renderer initialization failure */
  PIXI_INIT_FAILED: (o) => `Failed to initialize PIXI renderer: ${o}`,
  /** Renderer not initialized */
  RENDERER_NOT_INITIALIZED: "Renderer not initialized",
  /** Sprite creation failure */
  SPRITE_CREATE_FAILED: (o) => `Failed to create sprite: ${o}`,
  /** Service not found in container */
  SERVICE_NOT_FOUND: (o) => `Service '${o}' not found`,
  /** Engine initialization failure */
  ENGINE_INIT_FAILED: (o) => `Failed to initialize slider engine: ${o}`,
  /** Navigation failure */
  NAVIGATION_FAILED: (o, t) => `Failed to navigate to slide ${o}: ${t}`,
  /** Constants validation failure */
  CONSTANTS_VALIDATION_FAILED: (o) => `Constants validation failed: ${o}`,
  /** Generic validation errors */
  VALIDATION: {
    TARGET_FPS_POSITIVE: "TARGET_FPS must be positive",
    FRAME_BUDGET_MISMATCH: "FRAME_BUDGET_MS must equal 1000 / TARGET_FPS",
    SCALE_MIN_MAX: "SCALE.MIN must be less than SCALE.MAX",
    INTENSITY_RANGE: (o) => `Intensity value ${o} must be between 0 and 1`
  }
};
if (Math.abs(_.FRAME_BUDGET_MS - 1e3 / _.TARGET_FPS) > 0.01)
  throw new Error(L.VALIDATION.FRAME_BUDGET_MISMATCH);
Object.values(C).forEach((o) => {
  if (o < 0 || o > 1)
    throw new Error(L.VALIDATION.INTENSITY_RANGE(o));
});
class Q {
  constructor() {
    this.factories = /* @__PURE__ */ new Map(), this.instances = /* @__PURE__ */ new Map(), this.singletons = /* @__PURE__ */ new Set();
  }
  /**
   * Register a service factory (lazy instantiation)
   */
  register(t, e, i = !0) {
    this.factories.set(t, e), i && this.singletons.add(t);
  }
  /**
   * Register a service instance directly
   */
  registerInstance(t, e) {
    this.instances.set(t, e), this.singletons.add(t);
  }
  /**
   * Get a service instance
   */
  get(t) {
    if (this.instances.has(t))
      return this.instances.get(t);
    const e = this.factories.get(t);
    if (!e)
      throw new Error(L.SERVICE_NOT_FOUND(t));
    const i = e();
    return this.singletons.has(t) && this.instances.set(t, i), i;
  }
  /**
   * Check if service is registered
   */
  has(t) {
    return this.factories.has(t) || this.instances.has(t);
  }
  /**
   * Clear all services
   */
  clear() {
    this.factories.clear(), this.instances.clear(), this.singletons.clear();
  }
}
const S = new Q(), A = {
  ENGINE: "slider-engine",
  PHYSICS: "slider-physics",
  RENDERER: "slider-renderer",
  CONTROLLER: "slider-controller",
  EVENT_EMITTER: "event-emitter"
};
class Z {
  constructor() {
    this.listeners = /* @__PURE__ */ new Map();
  }
  /**
   * Subscribe to an event
   */
  on(t, e) {
    this.listeners.has(t) || this.listeners.set(t, []), this.listeners.get(t).push(e);
  }
  /**
   * Subscribe to an event once (auto-unsubscribe after first emission)
   */
  once(t, e) {
    const i = (...s) => {
      e(...s), this.off(t, i);
    };
    this.on(t, i);
  }
  /**
   * Unsubscribe from an event
   */
  off(t, e) {
    const i = this.listeners.get(t);
    if (!i) return;
    const s = i.indexOf(e);
    s > -1 && (i.splice(s, 1), i.length === 0 && this.listeners.delete(t));
  }
  /**
   * Emit an event to all subscribers
   */
  emit(t, ...e) {
    const i = this.listeners.get(t);
    if (!i) return;
    [...i].forEach((n) => {
      try {
        n(...e);
      } catch (a) {
        t !== g.ERROR && this.emit(g.ERROR, { event: t, error: a, callback: n });
      }
    });
  }
  /**
   * Remove all listeners for a specific event
   */
  removeAllListeners(t) {
    t ? this.listeners.delete(t) : this.listeners.clear();
  }
  /**
   * Get list of events that have listeners
   */
  eventNames() {
    return Array.from(this.listeners.keys());
  }
  /**
   * Get number of listeners for an event
   */
  listenerCount(t) {
    const e = this.listeners.get(t);
    return e ? e.length : 0;
  }
}
const M = (o) => o.baseScale || f.DEFAULT, j = (o, t) => M(o) * t, J = (o, t) => {
  o.scale.set(t, t);
}, q = (o, t, e) => 1 + Math.min(Math.abs(o) / t, 1) * e;
class tt {
  constructor() {
    this.state = {
      currentIndex: 0,
      isTransitioning: !1,
      isInitialized: !1,
      totalSlides: 0,
      isLoading: !1,
      loadingProgress: 0,
      isPlaying: !1
    }, this.config = null, this.physics = null, this.renderer = null, this.controller = null, this.eventEmitter = null, this.fallbackEvents = /* @__PURE__ */ new Map();
  }
  /**
   * Initialize the slider engine with configuration
   */
  async initialize(t) {
    try {
      this.setState({ isLoading: !0, loadingProgress: 0 }), this.config = t, this.physics = S.get(A.PHYSICS), this.renderer = S.get(
        A.RENDERER
      ), this.controller = S.get(
        A.CONTROLLER
      ), this.eventEmitter = S.get(
        A.EVENT_EMITTER
      ), this.setState({
        totalSlides: t.images.length,
        loadingProgress: 20
      }), this.physics.setPhysicsConfig(t.physics), this.setState({ loadingProgress: 40 });
      const e = {
        onSwipeLeft: () => this.nextSlide(),
        onSwipeRight: () => this.previousSlide(),
        onDragStart: (i, s) => this.handleDragStart(i, s),
        onDragMove: (i, s, n, a) => this.handleDragMove(i, s, n, a),
        onDragEnd: (i, s) => this.handleDragEnd(i, s),
        onKeyLeft: () => this.previousSlide(),
        onKeyRight: () => this.nextSlide(),
        onTogglePlayPause: () => this.togglePlayPause(),
        onGoToSlide: (i) => this.goToSlide(i),
        onEscape: () => this.handleEscape()
      };
      this.setState({ loadingProgress: 60 }), this.controller.setInputConfig(t.input), this.controller.initialize(document.body, e), this.setState({ loadingProgress: 80 }), this.setState({
        isInitialized: !0,
        isLoading: !1,
        loadingProgress: 100
      }), this.emit(g.INITIALIZED, this.state);
    } catch (e) {
      throw this.setState({ isLoading: !1 }), new Error(L.ENGINE_INIT_FAILED(e));
    }
  }
  /**
   * Navigate to specific slide
   */
  async goToSlide(t, e = !0) {
    if (!this.isValidIndex(t) || this.state.isTransitioning)
      return;
    const i = this.state.currentIndex;
    try {
      if (this.setState({ isTransitioning: !0 }), this.emit(g.SLIDE_CHANGE_START, {
        from: i,
        to: t
      }), e && this.physics && this.renderer) {
        const s = this.renderer.getSprites(), n = this.physics.animateTransition(
          i,
          t,
          s
        );
        await new Promise((a) => {
          n.call(() => a());
        });
      } else this.renderer && this.renderer.getSprites().forEach((n, a) => {
        this.renderer.setVisible(n, a === t);
      });
      this.setState({
        currentIndex: t,
        isTransitioning: !1
      }), this.emit(g.SLIDE_CHANGED, {
        from: i,
        to: t
      });
    } catch (s) {
      throw this.setState({ isTransitioning: !1 }), new Error(L.NAVIGATION_FAILED(t, s));
    }
  }
  /**
   * Navigate to next slide
   */
  async nextSlide() {
    const t = (this.state.currentIndex + 1) % this.state.totalSlides;
    await this.goToSlide(t);
  }
  /**
   * Navigate to previous slide
   */
  async previousSlide() {
    const t = this.state.currentIndex === 0 ? this.state.totalSlides - 1 : this.state.currentIndex - 1;
    await this.goToSlide(t);
  }
  /**
   * Get current slider state
   */
  getState() {
    return { ...this.state };
  }
  /**
   * Get current slide index
   */
  getCurrentIndex() {
    return this.state.currentIndex;
  }
  /**
   * Get total number of slides
   */
  getTotalSlides() {
    return this.state.totalSlides;
  }
  /**
   * Check if slider is transitioning
   */
  isTransitioning() {
    return this.state.isTransitioning;
  }
  /**
   * Toggle play/pause state for accessibility
   */
  togglePlayPause() {
    const t = !this.state.isPlaying;
    this.setState({ isPlaying: t }), this.emit(g.PLAY_STATE_CHANGED, {
      isPlaying: t,
      timestamp: Date.now()
    });
  }
  /**
   * Check if slider is playing
   */
  isPlaying() {
    return this.state.isPlaying;
  }
  /**
   * Handle escape key for accessibility
   */
  handleEscape() {
    this.goToSlide(0).catch((t) => {
      this.emit(g.ERROR, {
        message: "Failed to reset to first slide",
        error: t,
        timestamp: Date.now()
      });
    }), this.state.isPlaying && this.togglePlayPause(), this.emit(g.ESCAPE_PRESSED, {
      previousIndex: this.state.currentIndex,
      timestamp: Date.now()
    });
  }
  /**
   * Subscribe to events
   */
  on(t, e) {
    this.eventEmitter ? this.eventEmitter.on(t, e) : (this.fallbackEvents.has(t) || this.fallbackEvents.set(t, []), this.fallbackEvents.get(t).push(e));
  }
  /**
   * Unsubscribe from events
   */
  off(t, e) {
    if (this.eventEmitter)
      this.eventEmitter.off(t, e);
    else {
      const i = this.fallbackEvents.get(t);
      if (i) {
        const s = i.indexOf(e);
        s > -1 && i.splice(s, 1);
      }
    }
  }
  /**
   * Emit events
   */
  emit(t, ...e) {
    if (this.eventEmitter)
      this.eventEmitter.emit(t, ...e);
    else {
      const i = this.fallbackEvents.get(t);
      i && i.forEach((s) => s(...e));
    }
  }
  /**
   * Destroy the slider engine
   */
  destroy() {
    this.physics?.killAllAnimations(), this.renderer?.destroy(), this.controller?.destroy(), this.physics?.cleanup(), this.state = {
      currentIndex: 0,
      isTransitioning: !1,
      isInitialized: !1,
      totalSlides: 0,
      isLoading: !1,
      loadingProgress: 0,
      isPlaying: !1
    }, this.emit(g.DESTROYED);
  }
  /**
   * Handle drag start
   */
  handleDragStart(t, e) {
    this.emit(g.DRAG_START, { x: t, y: e });
  }
  /**
   * Handle drag move with scale effect
   */
  handleDragMove(t, e, i, s) {
    if (this.physics && this.renderer) {
      const a = this.renderer.getSprites()[this.state.currentIndex];
      if (a) {
        const r = Math.abs(i) / G.CALCULATION.MOVEMENT_BASE;
        this.physics.animateScale(
          a,
          N.BASE_SCALE + r * N.DRAG_SCALE_MULTIPLIER,
          N.DRAG_SCALE_DURATION
        );
      }
    }
    this.emit(g.DRAG_MOVE, { x: t, y: e, deltaX: i, deltaY: s });
  }
  /**
   * Handle drag end
   */
  handleDragEnd(t, e) {
    if (this.physics && this.renderer) {
      const s = this.renderer.getSprites()[this.state.currentIndex];
      s && this.physics.animateScale(
        s,
        N.BASE_SCALE,
        N.SCALE_RESET_DURATION
      );
    }
    this.emit(g.DRAG_END, { x: t, y: e });
  }
  /**
   * Update state and emit change events
   */
  setState(t) {
    const e = { ...this.state };
    this.state = { ...this.state, ...t }, this.emit(g.STATE_CHANGED, {
      previous: e,
      current: this.state
    });
  }
  /**
   * Validate slide index
   */
  isValidIndex(t) {
    return t >= 0 && t < this.state.totalSlides;
  }
}
class F {
  constructor(t = {}) {
    this.config = {
      friction: c.FRICTION,
      scaleIntensity: C.VERY_LOW,
      velocityThreshold: c.VELOCITY_THRESHOLD,
      maxVelocity: c.MAX_VELOCITY,
      swipeThreshold: P.SWIPE_THRESHOLD,
      ...t
    };
  }
  /**
   * Calculate velocity based on distance and time
   * Pattern from main branch useMouseDrag.ts throttling
   */
  static calculateVelocity(t, e) {
    return e <= 0 ? 0 : Math.abs(t / e);
  }
  /**
   * Apply friction to reduce velocity over time
   * Pattern from main branch momentum calculations
   */
  static applyFriction(t, e) {
    return t * (1 - e);
  }
  /**
   * Calculate snap position for slide alignment
   * Pattern from main branch slide positioning logic
   */
  static calculateSnapPosition(t, e) {
    const s = Math.round(t / e) * e, n = Math.abs(s - t), a = T.STANDARD, r = Math.min(n / e, 1), l = a * (c.DURATION_FACTORS.MIN_OFFSET + r * c.DURATION_FACTORS.MAX_OFFSET);
    return {
      targetPosition: s,
      snapDistance: n,
      duration: l
    };
  }
  /**
   * Calculate momentum physics for drag interactions
   * Pattern from main branch useMouseDrag.ts drag effects
   */
  calculateMomentum(t, e, i) {
    const s = Math.min(
      Math.abs(t),
      this.config.maxVelocity
    ), n = this.config.friction * (i / 1e3), a = F.applyFriction(
      s,
      n
    ), r = a * i, u = 1 + Math.min(
      Math.abs(e) / this.config.swipeThreshold,
      1
    ) * this.config.scaleIntensity, m = Math.max(
      0.1,
      a / this.config.maxVelocity
    ), I = T.FAST / m;
    return {
      velocity: a,
      distance: r,
      duration: Math.min(I, T.SLOW),
      scaleFactor: u
    };
  }
  /**
   * Calculate scale intensity for drag interactions
   * Pattern from main branch useMouseDrag.ts handleDragEffect
   */
  calculateDragScale(t, e = f.DEFAULT) {
    const s = 1 + Math.min(
      Math.abs(t) / this.config.swipeThreshold,
      1
    ) * this.config.scaleIntensity;
    return e * s;
  }
  /**
   * Determine if swipe meets threshold for slide change
   * Pattern from main branch swipe detection logic
   */
  shouldTriggerSlideChange(t, e) {
    const i = Math.abs(t) >= this.config.swipeThreshold, s = e >= this.config.velocityThreshold;
    return i || s;
  }
  /**
   * Calculate spring physics for reset animations
   * Pattern from main branch scale reset animations
   */
  calculateSpringReset(t, e = f.DEFAULT) {
    const i = Math.abs(t - e), s = Math.min(i / f.EMPHASIS, 1), n = T.FAST + s * T.FAST;
    return {
      scaleDelta: i,
      duration: Math.min(n, T.MEDIUM),
      ease: E.EASE_OUT
      // Use constant instead of hardcoded string
    };
  }
  /**
   * Update physics configuration
   */
  updateConfig(t) {
    this.config = { ...this.config, ...t };
  }
  /**
   * Get current physics configuration
   */
  getConfig() {
    return { ...this.config };
  }
  /**
   * Reset physics configuration to defaults
   */
  resetConfig() {
    this.config = {
      friction: c.FRICTION,
      scaleIntensity: C.VERY_LOW,
      velocityThreshold: c.VELOCITY_THRESHOLD,
      maxVelocity: c.MAX_VELOCITY,
      swipeThreshold: P.SWIPE_THRESHOLD
    };
  }
}
class D {
  /**
   * Create a slide transition timeline
   * Pattern from main branch useSlides.ts performTransition
   */
  static createSlideTransition(t, e, i) {
    const s = h.timeline({
      ...d.TIMELINE,
      onStart: i.onStart,
      onComplete: i.onComplete
    }), n = 1 + i.scaleIntensity / 100;
    t.visible = !0, e.visible = !0, e.alpha = 0;
    const a = M(t), r = M(e);
    return J(e, r * n), s.to(
      t.scale,
      {
        x: a * n,
        y: a * n,
        duration: i.duration,
        ease: i.ease
      },
      0
    ), s.to(
      t,
      {
        alpha: 0,
        duration: i.duration,
        ease: i.ease,
        onComplete: () => {
          t.visible = !1;
        }
      },
      0
    ), s.to(
      e.scale,
      {
        x: r,
        y: r,
        duration: i.duration,
        ease: i.ease
      },
      0
    ), s.to(
      e,
      {
        alpha: 1,
        duration: i.duration,
        ease: i.ease
      },
      0
    ), s;
  }
  /**
   * Create a momentum animation timeline
   * Pattern from main branch momentum calculations
   */
  static createMomentumAnimation(t, e) {
    const i = h.timeline({
      ...d.PERFORMANCE,
      onComplete: e.onComplete
    }), s = e.velocity * e.direction * e.duration, n = Math.pow(e.damping, e.duration), a = s * n;
    return i.to(t, {
      x: `+=${a}`,
      duration: e.duration,
      ease: E.EASE_OUT
    }), i;
  }
  /**
   * Create a snap animation timeline
   * Pattern from main branch slide snapping
   */
  static createSnapAnimation(t, e) {
    const i = h.timeline({
      ...d.TIMELINE,
      onComplete: e.onComplete
    });
    return i.to(t, {
      x: e.targetPosition,
      duration: e.duration,
      ease: e.ease
    }), i;
  }
  /**
   * Create a scale animation timeline
   * Pattern from main branch drag scale effects
   */
  static createScaleAnimation(t, e) {
    const i = h.timeline({
      ...d.PERFORMANCE,
      onComplete: e.onComplete
    }), s = e.targetScale * e.baseScale;
    return i.to(t.scale, {
      x: s,
      y: s,
      duration: e.duration,
      ease: e.ease
    }), i;
  }
  /**
   * Create a drag effect timeline
   * Pattern from main branch useMouseDrag.ts handleDragEffect
   */
  static createDragEffect(t, e, i = c.MOMENTUM_DAMPING) {
    const s = h.timeline(d.PERFORMANCE), n = M(t), a = q(
      e,
      c.DISTANCE_NORMALIZATION,
      i
    ), r = n * a;
    return s.to(t.scale, {
      x: r,
      y: r,
      duration: T.QUICK,
      ease: E.EASE_OUT
    }), s;
  }
  /**
   * Create a scale reset timeline
   * Pattern from main branch useMouseDrag.ts resetSlideScale
   */
  static createScaleReset(t, e = f.DEFAULT) {
    const i = h.timeline(d.PERFORMANCE), n = M(t) * e;
    return i.to(t.scale, {
      x: n,
      y: n,
      duration: T.FAST,
      ease: E.EASE_OUT
    }), i;
  }
  /**
   * Create a coordinated animation group
   * Pattern from main branch AnimationCoordinator.ts
   */
  static createAnimationGroup(t, e = {}) {
    const i = h.timeline({
      ...d.TIMELINE,
      delay: e.delay || 0,
      onStart: e.onStart,
      onComplete: e.onComplete
    });
    return t.forEach((s) => {
      i.add(s, 0);
    }), i;
  }
  /**
   * Create a staggered animation timeline
   * Enhanced pattern for sequential animations
   */
  static createStaggeredAnimation(t, e, i = 0.1) {
    const s = h.timeline(d.TIMELINE);
    return t.forEach((n, a) => {
      const r = e(n, a);
      s.add(r, a * i);
    }), s;
  }
  /**
   * Create a fade transition timeline
   * Simple fade pattern for lightweight transitions
   */
  static createFadeTransition(t, e, i = T.STANDARD) {
    const s = h.timeline(d.TIMELINE);
    return t.visible = !0, e.visible = !0, e.alpha = 0, s.to(
      t,
      {
        alpha: 0,
        duration: i,
        ease: E.EASE_OUT,
        onComplete: () => {
          t.visible = !1;
        }
      },
      0
    ), s.to(
      e,
      {
        alpha: 1,
        duration: i,
        ease: E.EASE_OUT
      },
      0
    ), s;
  }
  /**
   * Create a master timeline with cleanup
   * Pattern from main branch resource management
   */
  static createManagedTimeline(t, e) {
    const i = h.timeline({
      ...d.TIMELINE,
      onComplete: () => {
        t.forEach((s) => {
          s && s.isActive() && s.kill();
        }), e && e();
      }
    });
    return t.forEach((s) => {
      i.add(s, 0);
    }), i;
  }
}
class k {
  constructor(t = {}) {
    this.config = {
      springConstant: c.SPRING_CONSTANT,
      damping: c.MOMENTUM_DAMPING,
      duration: T.STANDARD,
      ease: E.ELASTIC,
      ...t
    };
  }
  /**
   * Calculate spring force for elastic motion
   * Pattern from main branch spring physics calculations
   */
  static calculateSpringForce(t, e = c.SPRING_CONSTANT) {
    return -t * e;
  }
  /**
   * Calculate elastic motion parameters
   * Pattern from main branch elastic animations
   */
  calculateElasticMotion(t, e, i = 0) {
    const s = t - e, n = k.calculateSpringForce(
      s,
      this.config.springConstant
    ), a = Math.min(
      Math.abs(s) / c.DISTANCE_NORMALIZATION,
      1
    ), r = 1 / Math.max(this.config.springConstant, c.SPRING_MIN_CONSTANT), l = this.config.duration * a * r;
    return {
      targetPosition: e,
      force: n,
      duration: Math.min(l, T.VERY_SLOW),
      ease: this.config.ease
    };
  }
  /**
   * Create a spring animation timeline
   * Pattern from main branch elastic reset animations
   */
  createSpringAnimation(t, e, i, s = {}) {
    const n = h.timeline(d.PERFORMANCE), a = { ...this.config, ...s }, r = this.calculateElasticMotion(t.x, e), l = this.calculateElasticMotion(t.y, i), u = Math.max(r.duration, l.duration);
    return n.to(t, {
      x: e,
      y: i,
      duration: u,
      ease: a.ease
    }), n;
  }
  /**
   * Create a scale spring animation
   * Pattern from main branch scale reset with elastic behavior
   */
  createScaleSpring(t, e = f.DEFAULT, i = {}) {
    const s = h.timeline(d.PERFORMANCE), n = { ...this.config, ...i }, a = j(t, e), r = t.scale.x, l = this.calculateElasticMotion(r, a);
    return s.to(t.scale, {
      x: a,
      y: a,
      duration: l.duration,
      ease: n.ease
    }), s;
  }
  /**
   * Create displacement filter animation
   * Pattern from main branch useDisplacementEffects.ts
   */
  createDisplacementAnimation(t, e) {
    const i = h.timeline(d.TIMELINE);
    return i.to(t.scale, {
      x: e.backgroundScale * e.intensity,
      y: e.backgroundScale * e.intensity,
      duration: e.duration,
      ease: E.ELASTIC
    }), i;
  }
  /**
   * Create cursor follow effect with spring physics
   * Pattern from main branch cursor displacement effects
   */
  createCursorFollowEffect(t, e, i, s = 1) {
    const n = h.timeline(d.PERFORMANCE), a = s * this.config.damping, r = this.config.duration * (1 - a * c.DURATION_FACTORS.SPRING_DAMPING_FACTOR);
    return n.to(t, {
      x: e,
      y: i,
      duration: r,
      ease: E.CIRC
    }), n;
  }
  /**
   * Create bouncy scale effect
   * Enhanced pattern for dramatic spring effects
   */
  createBouncyScale(t, e, i = f.DEFAULT, s = 2) {
    const n = h.timeline(d.TIMELINE), a = M(t), r = a * e, l = a * i;
    for (let u = 0; u < s; u++) {
      const m = 1 - u / s, I = l + (r - l) * m;
      n.to(t.scale, {
        x: I,
        y: I,
        duration: this.config.duration / (s * 2),
        ease: E.BOUNCE
      });
    }
    return n.to(t.scale, {
      x: l,
      y: l,
      duration: this.config.duration / 4,
      ease: E.EASE_OUT
    }), n;
  }
  /**
   * Create wobble effect with spring physics
   * Pattern for organic, natural motion
   */
  createWobbleEffect(t, e = 5, i = 3) {
    const s = h.timeline(d.PERFORMANCE), n = t.x, a = t.y;
    for (let r = 0; r < i; r++) {
      const l = n + e * Math.sin(r * Math.PI), u = a + e * Math.cos(r * Math.PI);
      s.to(t, {
        x: l,
        y: u,
        duration: this.config.duration / i,
        ease: E.EASE_IN_OUT
      });
    }
    return s.to(t, {
      x: n,
      y: a,
      duration: this.config.duration / 4,
      ease: this.config.ease
    }), s;
  }
  /**
   * Create magnetic attraction effect
   * Enhanced pattern for interactive elements
   */
  createMagneticAttraction(t, e, i, s = 0.5) {
    const n = h.timeline(d.PERFORMANCE), a = e - t.x, r = i - t.y, l = Math.sqrt(a * a + r * r), u = s / Math.max(l / c.DISTANCE_NORMALIZATION, 1), m = t.x + a * u, I = t.y + r * u;
    return n.to(t, {
      x: m,
      y: I,
      duration: this.config.duration,
      ease: this.config.ease
    }), n;
  }
  /**
   * Create ripple effect with spring physics
   * Pattern for impact and interaction feedback
   */
  createRippleEffect(t, e, i, s = 200) {
    const n = h.timeline(d.TIMELINE);
    return t.forEach((a, r) => {
      const l = a.x - e, u = a.y - i, m = Math.sqrt(l * l + u * u);
      if (m <= s) {
        const I = m / s * this.config.duration, U = 20 * (1 - m / s), X = l / m, V = u / m, B = a.x + X * U, W = a.y + V * U;
        n.to(
          a,
          {
            x: B,
            y: W,
            duration: this.config.duration / 3,
            ease: E.EASE_OUT
          },
          I
        ), n.to(
          a,
          {
            x: a.x,
            y: a.y,
            duration: this.config.duration * 2 / 3,
            ease: this.config.ease
          },
          I + this.config.duration / 3
        );
      }
    }), n;
  }
  /**
   * Update spring configuration
   */
  updateConfig(t) {
    this.config = { ...this.config, ...t };
  }
  /**
   * Get current spring configuration
   */
  getConfig() {
    return { ...this.config };
  }
}
class O {
  constructor(t = {}) {
    this.samples = [], this.lastThrottleTime = 0, this.lastPosition = null, this.smoothedVelocity = 0, this.config = {
      bufferSize: _.SAMPLE_BUFFER_SIZE,
      throttleInterval: _.THROTTLE_INTERVAL,
      minDistance: P.MIN_MOVEMENT_THRESHOLD,
      maxVelocity: c.MAX_VELOCITY,
      smoothingFactor: 0.3,
      ...t
    };
  }
  /**
   * Calculate velocity between two points
   * Pattern from main branch velocity calculations
   */
  static calculateVelocity(t, e, i, s, n, a) {
    const r = a - i;
    if (r <= 0) return 0;
    const l = s - t, u = n - e;
    return Math.sqrt(l * l + u * u) / (r / 1e3);
  }
  /**
   * Calculate velocity direction in radians
   */
  static calculateDirection(t, e, i, s) {
    const n = i - t, a = s - e;
    return Math.atan2(a, n);
  }
  /**
   * Apply exponential smoothing to velocity
   * Pattern for noise reduction
   */
  applySmoothingFilter(t) {
    return this.smoothedVelocity = this.smoothedVelocity * (1 - this.config.smoothingFactor) + t * this.config.smoothingFactor, this.smoothedVelocity;
  }
  /**
   * Check if motion should be tracked (throttling)
   * Pattern from main branch useMouseDrag.ts throttling
   */
  shouldTrackMotion(t) {
    return t - this.lastThrottleTime >= this.config.throttleInterval;
  }
  /**
   * Add a velocity sample
   * Pattern from main branch motion tracking
   */
  addSample(t, e, i = Date.now()) {
    if (!this.shouldTrackMotion(i))
      return !1;
    this.lastThrottleTime = i;
    let s = 0, n = 0;
    if (this.lastPosition) {
      if (n = Math.sqrt(
        Math.pow(t - this.lastPosition.x, 2) + Math.pow(e - this.lastPosition.y, 2)
      ), n < this.config.minDistance)
        return !1;
      const r = this.samples[this.samples.length - 1];
      r && (s = O.calculateVelocity(
        r.x,
        r.y,
        r.timestamp,
        t,
        e,
        i
      ), s = Math.min(s, this.config.maxVelocity));
    }
    const a = {
      timestamp: i,
      x: t,
      y: e,
      velocity: s,
      distance: n
    };
    return this.samples.push(a), this.samples.length > this.config.bufferSize && this.samples.shift(), this.lastPosition = { x: t, y: e }, !0;
  }
  /**
   * Get current velocity calculation
   * Main method for retrieving velocity data
   */
  getVelocity() {
    if (this.samples.length < 2)
      return {
        velocity: 0,
        direction: 0,
        velocityX: 0,
        velocityY: 0,
        smoothedVelocity: 0,
        averageVelocity: 0
      };
    const t = this.samples[this.samples.length - 1], e = t.velocity, i = this.samples[this.samples.length - 2], s = O.calculateDirection(
      i.x,
      i.y,
      t.x,
      t.y
    ), n = e * Math.cos(s), a = e * Math.sin(s), r = this.applySmoothingFilter(e), l = this.samples.reduce((u, m) => u + m.velocity, 0) / this.samples.length;
    return {
      velocity: e,
      direction: s,
      velocityX: n,
      velocityY: a,
      smoothedVelocity: r,
      averageVelocity: l
    };
  }
  /**
   * Get peak velocity over the buffer
   * Useful for momentum calculations
   */
  getPeakVelocity() {
    return this.samples.length === 0 ? 0 : Math.max(...this.samples.map((t) => t.velocity));
  }
  /**
   * Determine if motion qualifies as a swipe
   * Pattern from main branch swipe detection
   */
  isSwipeGesture(t = c.VELOCITY_THRESHOLD, e = P.SWIPE_THRESHOLD) {
    if (this.samples.length < 2) return !1;
    const i = this.getVelocity(), s = this.getTotalDistance();
    return i.velocity >= t || s >= e;
  }
  /**
   * Get total distance traveled
   */
  getTotalDistance() {
    return this.samples.reduce((t, e) => t + e.distance, 0);
  }
  /**
   * Get motion duration
   */
  getMotionDuration() {
    if (this.samples.length < 2) return 0;
    const t = this.samples[0];
    return this.samples[this.samples.length - 1].timestamp - t.timestamp;
  }
  /**
   * Predict future position based on current velocity
   * Pattern for momentum calculations
   */
  predictPosition(t) {
    if (!this.lastPosition || this.samples.length < 2)
      return this.lastPosition || { x: 0, y: 0 };
    const e = this.getVelocity(), i = e.velocity * (t / 1e3);
    return {
      x: this.lastPosition.x + i * Math.cos(e.direction),
      y: this.lastPosition.y + i * Math.sin(e.direction)
    };
  }
  /**
   * Get velocity samples for debugging or analysis
   */
  getSamples() {
    return [...this.samples];
  }
  /**
   * Reset tracking state
   */
  reset() {
    this.samples = [], this.lastThrottleTime = 0, this.lastPosition = null, this.smoothedVelocity = 0;
  }
  /**
   * Update tracking configuration
   */
  updateConfig(t) {
    this.config = { ...this.config, ...t };
  }
  /**
   * Get current tracking configuration
   */
  getConfig() {
    return { ...this.config };
  }
}
class et {
  constructor() {
    this.config = K;
  }
  /**
   * Calculate transition animation sequence
   *
   * @param fromIndex - Source slide index
   * @param toIndex - Target slide index
   * @param totalSprites - Total number of sprites
   * @returns Animation sequence configuration
   */
  calculateTransition(t, e, i) {
    const n = {
      hideSprites: Array.from(
        { length: i },
        (a, r) => r
      ).filter((a) => a !== e),
      targetSprite: {
        index: e,
        initialState: {
          visible: !0,
          alpha: 0,
          scale: f.HIGHLIGHT
          // Start slightly larger for smooth scale-in effect
        },
        finalState: {
          alpha: 1,
          scale: f.DEFAULT
        },
        duration: this.config.transitionDuration,
        ease: this.config.transitionEase
      }
    };
    return t !== e && t >= 0 && t < i && (n.sourceSprite = {
      index: t,
      finalState: {
        alpha: 0,
        scale: f.EXIT,
        // Scale down for smooth exit
        visible: !1
      },
      duration: this.config.transitionDuration * c.EXIT_SPEED_FACTOR,
      // Slightly faster fade out
      ease: E.EASE_IN
    }), n;
  }
  /**
   * Calculate swipe animation parameters
   *
   * @param direction - Swipe direction (-1 or 1)
   * @param intensity - Swipe intensity (0-1)
   * @returns Swipe animation configuration
   */
  calculateSwipe(t, e) {
    const i = Math.max(0, Math.min(1, e)), s = t * i * G.CALCULATION.MOVEMENT_BASE, n = 1 + i * this.config.scaleIntensity;
    return {
      initialPhase: {
        movement: s,
        scale: n,
        duration: T.FAST
      },
      springPhase: {
        movement: -s * this.config.momentumDamping,
        scale: f.DEFAULT,
        duration: this.config.transitionDuration,
        ease: E.ELASTIC
      }
    };
  }
  /**
   * Calculate scale animation parameters
   *
   * @param targetScale - Target scale value
   * @param duration - Animation duration (optional)
   * @returns Scale animation configuration
   */
  calculateScale(t, e = T.STANDARD) {
    return {
      targetScale: Math.max(f.MIN, t),
      // Prevent negative or zero scale
      duration: Math.max(c.MIN_DURATION, e),
      // Minimum duration for smooth animation
      ease: E.EASE_OUT
    };
  }
  /**
   * Calculate if swipe exceeds threshold for slide change
   *
   * @param distance - Swipe distance in pixels
   * @param velocity - Swipe velocity
   * @returns Whether swipe should trigger slide change
   */
  shouldTriggerSlideChange(t, e) {
    const i = this.config.swipeThreshold, s = c.VELOCITY_THRESHOLD;
    return Math.abs(t) > i || Math.abs(e) > s;
  }
  /**
   * Calculate optimal animation timing based on user interaction
   *
   * @param interactionTime - Time user spent interacting (ms)
   * @param intensity - Interaction intensity (0-1)
   * @returns Optimized animation duration
   */
  calculateAdaptiveTiming(t, e) {
    const i = this.config.transitionDuration, s = Math.max(
      c.TIME_FACTOR.MIN,
      Math.min(c.TIME_FACTOR.MAX, t / 1e3)
    ), n = f.DEFAULT + e * C.VERY_LOW;
    return i * s * n;
  }
  /**
   * Update physics configuration
   */
  setConfig(t) {
    this.config = { ...this.config, ...t };
  }
  /**
   * Get current physics configuration
   */
  getConfig() {
    return { ...this.config };
  }
  /**
   * Calculate momentum decay for natural motion
   *
   * @param initialVelocity - Starting velocity
   * @param timeStep - Time step for calculation
   * @returns Velocity after decay
   */
  calculateMomentumDecay(t, e) {
    return t * Math.pow(this.config.momentumDamping, e);
  }
  /**
   * Calculate spring force for elastic animations
   *
   * @param displacement - Current displacement from rest position
   * @param springConstant - Spring strength (0-1)
   * @returns Spring force value
   */
  calculateSpringForce(t, e = c.SPRING_CONSTANT) {
    return -t * e;
  }
}
class H {
  constructor() {
    this.activeTimelines = /* @__PURE__ */ new Set(), this.activeTweens = /* @__PURE__ */ new Set(), this.animationDefaults = d.GPU_OPTIMIZED;
  }
  /**
   * Apply transition animation sequence to PIXI sprites
   *
   * @param sprites - Array of PIXI sprites
   * @param sequence - Pure animation sequence from physics engine
   * @returns GSAP timeline for the animation
   */
  applyTransition(t, e) {
    const i = this.createManagedTimeline();
    e.hideSprites.forEach((n) => {
      const a = t.at(n);
      a && i.set(a, { alpha: 0, visible: !1 }, 0);
    });
    const s = t.at(e.targetSprite.index);
    if (!s) return i;
    if (i.set(
      s,
      {
        visible: e.targetSprite.initialState.visible,
        alpha: e.targetSprite.initialState.alpha,
        scale: e.targetSprite.initialState.scale
      },
      0
    ), i.to(
      s,
      {
        ...this.animationDefaults,
        duration: e.targetSprite.duration,
        alpha: e.targetSprite.finalState.alpha,
        scale: e.targetSprite.finalState.scale,
        ease: e.targetSprite.ease
      },
      0
    ), e.sourceSprite) {
      const n = t.at(e.sourceSprite.index);
      n && i.to(
        n,
        {
          ...this.animationDefaults,
          duration: e.sourceSprite.duration,
          alpha: e.sourceSprite.finalState.alpha,
          scale: e.sourceSprite.finalState.scale,
          ease: e.sourceSprite.ease,
          onComplete: () => {
            h.set(n, {
              visible: e.sourceSprite.finalState.visible
            });
          }
        },
        0
      );
    }
    return i;
  }
  /**
   * Apply swipe animation to PIXI sprite
   *
   * @param sprite - PIXI sprite to animate
   * @param animation - Pure swipe animation from physics engine
   * @returns GSAP timeline for the swipe animation
   */
  applySwipe(t, e) {
    const i = this.createManagedTimeline();
    return i.to(t, {
      ...this.animationDefaults,
      duration: e.initialPhase.duration,
      x: `+=${e.initialPhase.movement}`,
      scale: e.initialPhase.scale
    }), i.to(t, {
      ...this.animationDefaults,
      duration: e.springPhase.duration,
      x: `+=${e.springPhase.movement}`,
      scale: e.springPhase.scale,
      ease: e.springPhase.ease
    }), i;
  }
  /**
   * Apply scale animation to PIXI sprite
   *
   * @param sprite - PIXI sprite to scale
   * @param animation - Pure scale animation from physics engine
   * @returns GSAP timeline for the scale animation
   */
  applyScale(t, e) {
    const i = this.createManagedTimeline();
    return i.to(t, {
      ...d.PERFORMANCE,
      duration: e.duration,
      scale: e.targetScale,
      ease: e.ease
    }), i;
  }
  /**
   * Create optimized tween for GPU acceleration
   *
   * @param target - Animation target
   * @param props - Animation properties
   * @returns Optimized GSAP tween
   */
  createOptimizedTween(t, e) {
    const i = h.to(t, {
      ...this.animationDefaults,
      ...e,
      // GPU optimization
      onStart: () => {
        t && typeof t == "object" && v.STYLE in t && (t.style.willChange = v.WILL_CHANGE_TRANSFORM);
      },
      onComplete: () => {
        t && typeof t == "object" && v.STYLE in t && (t.style.willChange = v.WILL_CHANGE_AUTO), this.activeTweens.delete(i), e.onComplete?.();
      }
    });
    return this.activeTweens.add(i), i;
  }
  /**
   * Apply batch animations to multiple sprites efficiently
   *
   * @param sprites - Array of sprites
   * @param animations - Array of animation properties
   * @returns GSAP timeline containing all animations
   */
  applyBatchAnimations(t, e) {
    const i = this.createManagedTimeline();
    return e.forEach(({ spriteIndex: s, props: n }) => {
      const a = t.at(s);
      a && i.to(
        a,
        {
          ...this.animationDefaults,
          ...n
        },
        0
      );
    }), i;
  }
  /**
   * Kill all active animations immediately
   */
  killAllAnimations() {
    this.activeTimelines.forEach((t) => {
      t.kill();
    }), this.activeTimelines.clear(), this.activeTweens.forEach((t) => {
      t.kill();
    }), this.activeTweens.clear();
  }
  /**
   * Cleanup renderer resources
   */
  cleanup() {
    this.killAllAnimations();
  }
  /**
   * Get animation performance stats
   */
  getPerformanceStats() {
    return {
      activeTimelines: this.activeTimelines.size,
      activeTweens: this.activeTweens.size,
      totalAnimations: this.activeTimelines.size + this.activeTweens.size
    };
  }
  /**
   * Set sprites data attribute for GSAP targeting
   *
   * @param sprites - Array of sprites to mark
   */
  markSpritesForGSAP(t) {
    t.forEach((e, i) => {
      e && typeof e == "object" && (e[x.SLIDER_SPRITE] = !0, e[x.SPRITE_INDEX] = i);
    });
  }
  /**
   * Create managed timeline with automatic cleanup
   *
   * @returns GSAP timeline with cleanup management
   */
  createManagedTimeline() {
    const t = h.timeline({
      onComplete: () => {
        this.activeTimelines.delete(t);
      }
    });
    return this.activeTimelines.add(t), t;
  }
  /**
   * Validate sprite array for safety
   *
   * @param sprites - Sprites to validate
   * @returns True if sprites array is valid
   */
  validateSprites(t) {
    return Array.isArray(t) && t.every(
      (e) => (
        // Note: Can't use DOM_PROPERTIES.TYPE_OBJECT here due to TypeScript typeof constraint
        e && typeof e == "object" && v.X_COORDINATE in e && v.Y_COORDINATE in e
      )
    );
  }
}
class it {
  constructor(t = new et(), e = new H()) {
    this.engine = t, this.renderer = e;
  }
  animateTransition(t, e, i) {
    const s = i || [], n = this.engine.calculateTransition(
      t,
      e,
      s.length
    );
    return this.renderer.applyTransition(s, n);
  }
  animateSwipe(t, e, i) {
    if (!t)
      return h.timeline();
    const s = this.engine.calculateSwipe(e, i);
    return this.renderer.applySwipe(t, s);
  }
  animateScale(t, e, i = T.STANDARD) {
    if (!t)
      return h.timeline();
    const s = this.engine.calculateScale(e, i);
    return this.renderer.applyScale(t, s);
  }
  setPhysicsConfig(t) {
    t && this.engine.setConfig(t);
  }
  getPhysicsConfig() {
    return this.engine.getConfig();
  }
  killAllAnimations() {
    this.renderer.killAllAnimations();
  }
  cleanup() {
    try {
      this.renderer.cleanup();
    } catch {
    }
  }
  shouldTriggerSlideChange(t, e) {
    return this.engine.shouldTriggerSlideChange(t, e);
  }
  calculateAdaptiveTiming(t, e) {
    return this.engine.calculateAdaptiveTiming(t, e);
  }
  getPerformanceStats() {
    return this.renderer.getPerformanceStats();
  }
  markSpritesForGSAP(t) {
    const e = t || [];
    this.renderer.markSpritesForGSAP(e);
  }
  applyBatchAnimations(t, e) {
    const i = t || [], s = e || [];
    return this.renderer.applyBatchAnimations(i, s);
  }
}
class st {
  constructor(t = {}) {
    this.eventQueue = /* @__PURE__ */ new Map(), this.rafId = null, this.lastDispatchTime = 0, this.handlerCallbacks = /* @__PURE__ */ new Map(), this.config = {
      useRAF: !0,
      fallbackInterval: _.THROTTLE_INTERVAL,
      maxBatchSize: 10,
      enableMetrics: !0,
      maxHoldTime: 100,
      // Maximum 100ms hold time
      ...t
    }, this.metrics = {
      totalEvents: 0,
      throttledEvents: 0,
      averageBatchSize: 0,
      performanceScore: 1,
      lastUpdate: performance.now()
    };
  }
  /**
   * Throttle an event with intelligent batching
   * 
   * @param eventType - Type of event for grouping
   * @param event - Event to throttle
   * @param handler - Function to call with batched events
   */
  throttle(t, e, i) {
    this.updateMetrics(t), this.handlerCallbacks.set(t, i), this.eventQueue.has(t) || this.eventQueue.set(t, []);
    const s = this.eventQueue.get(t);
    s.push(e), s.length > this.config.maxBatchSize && s.shift(), this.scheduleDispatch();
  }
  /**
   * Throttle specifically for pointer move events with coalescing
   */
  throttlePointerMove(t, e) {
    const i = "getCoalescedEvents" in t && typeof t.getCoalescedEvents == "function" ? t.getCoalescedEvents() : [t];
    this.throttle("pointermove", t, () => {
      e(i);
    });
  }
  /**
   * Schedule event dispatch using RAF or fallback timer
   */
  scheduleDispatch() {
    if (this.rafId !== null) return;
    if (performance.now() - this.lastDispatchTime > this.config.maxHoldTime) {
      this.dispatchBatchedEvents();
      return;
    }
    this.config.useRAF && typeof requestAnimationFrame < "u" ? this.rafId = requestAnimationFrame(() => this.dispatchBatchedEvents()) : this.rafId = setTimeout(
      () => this.dispatchBatchedEvents(),
      this.config.fallbackInterval
    );
  }
  /**
   * Dispatch all batched events
   */
  dispatchBatchedEvents() {
    this.rafId = null, this.lastDispatchTime = performance.now();
    for (const [t, e] of this.eventQueue.entries()) {
      if (e.length === 0) continue;
      const i = this.handlerCallbacks.get(t);
      if (i)
        try {
          const s = [...e];
          e.length = 0, i(s), this.config.enableMetrics && this.updateBatchMetrics(s.length);
        } catch {
        }
    }
  }
  /**
   * Update throttling metrics
   */
  updateMetrics(t) {
    if (!this.config.enableMetrics) return;
    this.metrics.totalEvents++, (this.eventQueue.get(t)?.length || 0) > 0 && this.metrics.throttledEvents++;
    const i = this.metrics.throttledEvents / this.metrics.totalEvents;
    this.metrics.performanceScore = Math.max(0.1, 1 - i * 0.5), this.metrics.lastUpdate = performance.now();
  }
  /**
   * Update batch processing metrics
   */
  updateBatchMetrics(t) {
    if (!this.config.enableMetrics) return;
    const e = this.metrics.averageBatchSize;
    this.metrics.averageBatchSize = e === 0 ? t : e * 0.9 + t * 0.1;
  }
  /**
   * Get current throttling metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }
  /**
   * Reset all metrics
   */
  resetMetrics() {
    this.metrics = {
      totalEvents: 0,
      throttledEvents: 0,
      averageBatchSize: 0,
      performanceScore: 1,
      lastUpdate: performance.now()
    };
  }
  /**
   * Check if throttler is performing well
   */
  isPerformant() {
    return this.metrics.performanceScore > 0.7;
  }
  /**
   * Get current queue size for debugging
   */
  getQueueSize(t) {
    if (t)
      return this.eventQueue.get(t)?.length || 0;
    let e = 0;
    for (const i of this.eventQueue.values())
      e += i.length;
    return e;
  }
  /**
   * Force immediate dispatch of all pending events
   */
  flush() {
    this.rafId !== null && (this.config.useRAF && typeof cancelAnimationFrame < "u" ? cancelAnimationFrame(this.rafId) : clearTimeout(this.rafId), this.rafId = null), this.dispatchBatchedEvents();
  }
  /**
   * Clean up and stop all throttling
   */
  destroy() {
    this.flush(), this.eventQueue.clear(), this.handlerCallbacks.clear(), this.resetMetrics();
  }
  /**
   * Update throttler configuration
   */
  updateConfig(t) {
    this.config = { ...this.config, ...t };
  }
}
var y = /* @__PURE__ */ ((o) => (o.TAP = "tap", o.DOUBLE_TAP = "double-tap", o.LONG_PRESS = "long-press", o.SWIPE_LEFT = "swipe-left", o.SWIPE_RIGHT = "swipe-right", o.SWIPE_UP = "swipe-up", o.SWIPE_DOWN = "swipe-down", o.PAN = "pan", o.PINCH = "pinch", o.ROTATE = "rotate", o.UNKNOWN = "unknown", o))(y || {});
class nt {
  constructor(t, e = {}) {
    this.activePointers = /* @__PURE__ */ new Map(), this.lastTapTime = 0, this.lastTapPosition = { x: 0, y: 0 }, this.longPressTimer = null, this.onGesture = null, this.element = t, this.config = {
      enableMultiTouch: !0,
      swipeThreshold: P.SWIPE_THRESHOLD,
      swipeVelocityThreshold: 1.5,
      // Balanced threshold for swipe vs pan distinction
      tapTimeout: 300,
      tapThreshold: P.TAP_THRESHOLD,
      doubleTapTimeout: 300,
      // Reset to faster timing for more responsive detection
      longPressTimeout: P.LONG_PRESS_DURATION,
      pinchThreshold: 10,
      maxPointers: P.MAX_TOUCH_TARGETS,
      ...e
    }, this.setupEventListeners();
  }
  /**
   * Setup pointer event listeners on the target element
   */
  setupEventListeners() {
    this.element.addEventListener("pointerdown", this.handlePointerDown.bind(this)), this.element.addEventListener("pointermove", this.handlePointerMove.bind(this)), this.element.addEventListener("pointerup", this.handlePointerUp.bind(this)), this.element.addEventListener("pointercancel", this.handlePointerCancel.bind(this)), this.element.addEventListener("lostpointercapture", this.handlePointerCancel.bind(this)), this.element.addEventListener("contextmenu", (t) => t.preventDefault());
  }
  /**
   * Handle pointer down events
   */
  handlePointerDown(t) {
    if (this.activePointers.size >= this.config.maxPointers)
      return;
    const e = {
      startEvent: t,
      currentEvent: t,
      velocityTracker: new O(),
      startTime: performance.now(),
      hasMoved: !1
    };
    if (this.activePointers.set(t.pointerId, e), e.velocityTracker.addSample(t.clientX, t.clientY), this.element.setPointerCapture)
      try {
        this.element.setPointerCapture(t.pointerId);
      } catch {
      }
    this.activePointers.size === 1 ? this.startLongPressDetection(t) : this.cancelLongPressDetection(), t.preventDefault && t.preventDefault();
  }
  /**
   * Handle pointer move events
   */
  handlePointerMove(t) {
    const e = this.activePointers.get(t.pointerId);
    e && (e.currentEvent = t, e.velocityTracker.addSample(t.clientX, t.clientY), e.hasMoved || this.calculateDistance(
      e.startEvent,
      t
    ) > this.config.tapThreshold && (e.hasMoved = !0, this.cancelLongPressDetection()), this.config.enableMultiTouch && this.activePointers.size > 1 && this.detectMultiTouchGestures(), t.preventDefault && t.preventDefault());
  }
  /**
   * Handle pointer up events
   */
  handlePointerUp(t) {
    const e = this.activePointers.get(t.pointerId);
    if (!e) return;
    e.currentEvent = t, e.velocityTracker.addSample(t.clientX, t.clientY);
    const i = performance.now() - e.startTime, s = this.calculateDistance(e.startEvent, t), n = e.velocityTracker.getVelocity().velocity, a = this.classifyGesture(
      e,
      s,
      n,
      i
    );
    if (a && this.onGesture?.(a), this.activePointers.delete(t.pointerId), this.cancelLongPressDetection(), this.element.releasePointerCapture)
      try {
        this.element.releasePointerCapture(t.pointerId);
      } catch {
      }
    t.preventDefault && t.preventDefault();
  }
  /**
   * Handle pointer cancel events
   */
  handlePointerCancel(t) {
    this.activePointers.delete(t.pointerId), this.cancelLongPressDetection();
  }
  /**
   * Classify a single-pointer gesture
   */
  classifyGesture(t, e, i, s) {
    const n = t.startEvent, a = t.currentEvent;
    return !t.hasMoved && s < this.config.tapTimeout ? this.createTapGesture(n, a, s) : e > this.config.swipeThreshold && (i > this.config.swipeVelocityThreshold || i === 0) ? this.createSwipeGesture(n, a, e, i, s) : t.hasMoved ? this.createPanGesture(n, a, e, i, s) : null;
  }
  /**
   * Create tap gesture info
   */
  createTapGesture(t, e, i) {
    const s = performance.now(), n = s - this.lastTapTime, a = Math.sqrt(
      Math.pow(t.clientX - this.lastTapPosition.x, 2) + Math.pow(t.clientY - this.lastTapPosition.y, 2)
    );
    let r = "tap";
    return n < this.config.doubleTapTimeout && a < this.config.tapThreshold && (r = "double-tap"), this.lastTapTime = s, this.lastTapPosition = { x: t.clientX, y: t.clientY }, {
      type: r,
      direction: "none",
      startPoint: { x: t.clientX, y: t.clientY },
      currentPoint: { x: e.clientX, y: e.clientY },
      distance: 0,
      velocity: 0,
      duration: i,
      pointerCount: 1,
      pointers: [e]
    };
  }
  /**
   * Create swipe gesture info
   */
  createSwipeGesture(t, e, i, s, n) {
    const a = this.calculateDirection(t, e);
    return {
      type: this.swipeDirectionToGestureType(a),
      direction: a,
      startPoint: { x: t.clientX, y: t.clientY },
      currentPoint: { x: e.clientX, y: e.clientY },
      distance: i,
      velocity: s,
      duration: n,
      pointerCount: 1,
      pointers: [e]
    };
  }
  /**
   * Create pan gesture info
   */
  createPanGesture(t, e, i, s, n) {
    return {
      type: "pan",
      direction: this.calculateDirection(t, e),
      startPoint: { x: t.clientX, y: t.clientY },
      currentPoint: { x: e.clientX, y: e.clientY },
      distance: i,
      velocity: s,
      duration: n,
      pointerCount: 1,
      pointers: [e]
    };
  }
  /**
   * Detect multi-touch gestures (pinch, rotate)
   */
  detectMultiTouchGestures() {
    if (this.activePointers.size !== 2) return;
    const t = Array.from(this.activePointers.values()), [e, i] = t, s = this.calculateDistance(
      e.currentEvent,
      i.currentEvent
    ), n = this.calculateDistance(
      e.startEvent,
      i.startEvent
    ), a = s / n;
    if (Math.abs(a - 1) > 0.1) {
      const r = {
        type: "pinch",
        direction: "none",
        startPoint: this.calculateMidpoint(e.startEvent, i.startEvent),
        currentPoint: this.calculateMidpoint(e.currentEvent, i.currentEvent),
        distance: Math.abs(s - n),
        velocity: 0,
        // TODO: Calculate pinch velocity
        duration: performance.now() - Math.min(e.startTime, i.startTime),
        scale: a,
        pointerCount: 2,
        pointers: [e.currentEvent, i.currentEvent]
      };
      this.onGesture?.(r);
    }
  }
  /**
   * Start long press detection
   */
  startLongPressDetection(t) {
    this.cancelLongPressDetection(), this.longPressTimer = setTimeout(() => {
      if (this.activePointers.has(t.pointerId) && !this.activePointers.get(t.pointerId).hasMoved) {
        const i = {
          type: "long-press",
          direction: "none",
          startPoint: { x: t.clientX, y: t.clientY },
          currentPoint: { x: t.clientX, y: t.clientY },
          distance: 0,
          velocity: 0,
          duration: this.config.longPressTimeout,
          pointerCount: 1,
          pointers: [t]
        };
        this.onGesture?.(i);
      }
    }, this.config.longPressTimeout);
  }
  /**
   * Cancel long press detection
   */
  cancelLongPressDetection() {
    this.longPressTimer && (clearTimeout(this.longPressTimer), this.longPressTimer = null);
  }
  /**
   * Calculate distance between two pointer events
   */
  calculateDistance(t, e) {
    const i = e.clientX - t.clientX, s = e.clientY - t.clientY;
    return Math.sqrt(i * i + s * s);
  }
  /**
   * Calculate direction between two pointer events
   */
  calculateDirection(t, e) {
    const i = e.clientX - t.clientX, s = e.clientY - t.clientY;
    return Math.abs(i) > Math.abs(s) ? i > 0 ? "right" : "left" : s > 0 ? "down" : "up";
  }
  /**
   * Calculate midpoint between two pointer events
   */
  calculateMidpoint(t, e) {
    return {
      x: (t.clientX + e.clientX) / 2,
      y: (t.clientY + e.clientY) / 2
    };
  }
  /**
   * Convert swipe direction to gesture type
   */
  swipeDirectionToGestureType(t) {
    switch (t) {
      case "left":
        return "swipe-left";
      case "right":
        return "swipe-right";
      case "up":
        return "swipe-up";
      case "down":
        return "swipe-down";
      default:
        return "unknown";
    }
  }
  /**
   * Get current gesture state for debugging
   */
  getActivePointerCount() {
    return this.activePointers.size;
  }
  /**
   * Update gesture configuration
   */
  updateConfig(t) {
    this.config = { ...this.config, ...t };
  }
  /**
   * Clean up event listeners and timers
   */
  destroy() {
    this.cancelLongPressDetection(), this.activePointers.clear(), this.element.removeEventListener("pointerdown", this.handlePointerDown.bind(this)), this.element.removeEventListener("pointermove", this.handlePointerMove.bind(this)), this.element.removeEventListener("pointerup", this.handlePointerUp.bind(this)), this.element.removeEventListener("pointercancel", this.handlePointerCancel.bind(this));
  }
}
class at {
  constructor(t, e, i = {}) {
    this.liveRegion = null, this.totalSlides = 0, this.currentSlide = 0, this.isPlaying = !1, this.element = t, this.callbacks = e, this.config = {
      enableArrowKeys: !0,
      enableWASD: !0,
      enableSpaceBar: !0,
      enableEnterKey: !0,
      enableTabNavigation: !0,
      enableHomeEnd: !0,
      enablePageKeys: !0,
      respectMotionPreferences: !0,
      enableAnnouncements: !0,
      customBindings: /* @__PURE__ */ new Map(),
      ...i
    }, this.focusState = {
      previousElement: null,
      currentIndex: 0,
      isTrapped: !1
    }, this.setupAccessibility(), this.setupEventListeners();
  }
  /**
   * Setup accessibility attributes and ARIA properties
   */
  setupAccessibility() {
    this.element.hasAttribute("tabindex") || this.element.setAttribute("tabindex", "0"), this.element.setAttribute("role", "region"), this.element.setAttribute("aria-label", "Interactive image slider"), this.element.setAttribute("aria-live", "polite"), this.element.setAttribute(
      "aria-describedby",
      this.createKeyboardInstructions()
    ), this.createLiveRegion(), this.config.respectMotionPreferences && this.setupMotionPreferences();
  }
  /**
   * Create hidden instructions for screen readers
   */
  createKeyboardInstructions() {
    const t = "slider-keyboard-instructions", e = document.getElementById(t);
    e && e.remove();
    const i = document.createElement("div");
    i.id = t, i.className = "sr-only", i.setAttribute("aria-hidden", "true");
    const s = [
      "Use arrow keys or WASD to navigate slides.",
      "Press space to play or pause.",
      "Press home to go to first slide, end to go to last slide.",
      "Press escape to exit."
    ].join(" ");
    return i.textContent = s, document.body.appendChild(i), t;
  }
  /**
   * Create live region for screen reader announcements
   */
  createLiveRegion() {
    if (!this.config.enableAnnouncements) return;
    const t = "slider-live-region", e = document.getElementById(t);
    e && e.remove(), this.liveRegion = document.createElement("div"), this.liveRegion.id = t, this.liveRegion.className = "sr-only", this.liveRegion.setAttribute("aria-live", "polite"), this.liveRegion.setAttribute("aria-atomic", "true"), this.liveRegion.setAttribute("role", "status"), document.body.appendChild(this.liveRegion);
  }
  /**
   * Setup motion preference detection
   */
  setupMotionPreferences() {
    const t = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    this.handleMotionPreference(t), t.addEventListener("change", (e) => {
      this.handleMotionPreference(e);
    });
  }
  /**
   * Handle motion preference changes
   */
  handleMotionPreference(t) {
    t.matches ? (this.announce(
      "Reduced motion detected. Animations will be minimized.",
      "info"
      /* INFO */
    ), document.documentElement.style.setProperty(
      "--slider-motion-preference",
      "reduce"
    )) : document.documentElement.style.setProperty(
      "--slider-motion-preference",
      "auto"
    );
  }
  /**
   * Setup keyboard event listeners
   */
  setupEventListeners() {
    this.element.addEventListener("keydown", this.handleKeyDown.bind(this)), this.element.addEventListener("focus", this.handleFocus.bind(this)), this.element.addEventListener("blur", this.handleBlur.bind(this));
  }
  /**
   * Handle keyboard events
   */
  handleKeyDown(t) {
    if (t.ctrlKey || t.metaKey || t.altKey || this.isInputElement(t.target))
      return;
    let e = !1;
    const i = this.config.customBindings.get(t.key);
    if (i && (i(), e = !0), !e)
      switch (t.key) {
        // Arrow key navigation
        case R.ARROW_LEFT:
          this.config.enableArrowKeys && (this.navigatePrevious(), e = !0);
          break;
        case R.ARROW_RIGHT:
          this.config.enableArrowKeys && (this.navigateNext(), e = !0);
          break;
        // WASD navigation (alternative/gaming controls)
        case "a":
        case "A":
          this.config.enableWASD && (this.navigatePrevious(), e = !0);
          break;
        case "d":
        case "D":
          this.config.enableWASD && (this.navigateNext(), e = !0);
          break;
        // Home/End navigation
        case "Home":
          this.config.enableHomeEnd && (this.navigateToFirst(), e = !0);
          break;
        case "End":
          this.config.enableHomeEnd && (this.navigateToLast(), e = !0);
          break;
        // Page navigation
        case "PageUp":
          this.config.enablePageKeys && (this.navigatePrevious(), e = !0);
          break;
        case "PageDown":
          this.config.enablePageKeys && (this.navigateNext(), e = !0);
          break;
        // Space bar for play/pause
        case " ":
          this.config.enableSpaceBar && (this.togglePlayPause(), e = !0);
          break;
        // Enter key for activation
        case R.ENTER:
          this.config.enableEnterKey && (this.togglePlayPause(), e = !0);
          break;
        // Escape key
        case R.ESCAPE:
          this.handleEscape(), e = !0;
          break;
      }
    e && (t.preventDefault && t.preventDefault(), t.stopPropagation && t.stopPropagation());
  }
  /**
   * Handle focus events
   */
  handleFocus(t) {
    this.focusState.previousElement = t.relatedTarget, this.announceCurrentState();
  }
  /**
   * Handle blur events
   */
  handleBlur(t) {
  }
  /**
   * Check if element is an input element that should handle its own keyboard events
   */
  isInputElement(t) {
    if (!t) return !1;
    const e = [
      b.INPUT,
      b.TEXTAREA,
      b.SELECT,
      "button"
    ];
    return !!(t.tagName && e.includes(t.tagName.toLowerCase()) || t.getAttribute && t.getAttribute(w.CONTENT_EDITABLE) === w.TRUE);
  }
  /**
   * Navigate to previous slide
   */
  navigatePrevious() {
    this.callbacks.onPrevious(), this.announce(
      `Previous slide. ${this.getCurrentSlideAnnouncement()}`,
      "navigation"
      /* NAVIGATION */
    );
  }
  /**
   * Navigate to next slide
   */
  navigateNext() {
    this.callbacks.onNext(), this.announce(
      `Next slide. ${this.getCurrentSlideAnnouncement()}`,
      "navigation"
      /* NAVIGATION */
    );
  }
  /**
   * Navigate to first slide
   */
  navigateToFirst() {
    this.callbacks.onFirst(), this.announce(
      `First slide. ${this.getCurrentSlideAnnouncement()}`,
      "navigation"
      /* NAVIGATION */
    );
  }
  /**
   * Navigate to last slide
   */
  navigateToLast() {
    this.callbacks.onLast(), this.announce(
      `Last slide. ${this.getCurrentSlideAnnouncement()}`,
      "navigation"
      /* NAVIGATION */
    );
  }
  /**
   * Toggle play/pause state
   */
  togglePlayPause() {
    this.callbacks.onTogglePlayPause(), this.isPlaying = !this.isPlaying;
    const t = this.isPlaying ? "Playing" : "Paused";
    this.announce(
      `${t}`,
      "status"
      /* STATUS */
    );
  }
  /**
   * Handle escape key
   */
  handleEscape() {
    this.callbacks.onEscape(), this.announce(
      "Exited",
      "status"
      /* STATUS */
    );
  }
  /**
   * Announce text to screen readers
   */
  announce(t, e = "info") {
    if (!this.config.enableAnnouncements || !this.liveRegion) return;
    this.liveRegion.textContent = "";
    const i = e === "info" ? t : `${e}: ${t}`;
    setTimeout(() => {
      this.liveRegion && (this.liveRegion.textContent = i);
    }, 100);
  }
  /**
   * Announce current slider state
   */
  announceCurrentState() {
    const t = [
      "Image slider focused.",
      this.getCurrentSlideAnnouncement(),
      this.isPlaying ? "Auto-play is active." : "Auto-play is paused."
    ].join(" ");
    this.announce(
      t,
      "status"
      /* STATUS */
    );
  }
  /**
   * Get current slide announcement
   */
  getCurrentSlideAnnouncement() {
    return this.totalSlides === 0 ? "No slides available." : `Slide ${this.currentSlide + 1} of ${this.totalSlides}.`;
  }
  /**
   * Set total number of slides
   */
  setTotalSlides(t) {
    this.totalSlides = t, this.element.setAttribute("aria-valuemax", t.toString());
  }
  /**
   * Set current slide index
   */
  setCurrentSlide(t) {
    this.currentSlide = Math.max(0, Math.min(t, this.totalSlides - 1)), this.element.setAttribute("aria-valuenow", (this.currentSlide + 1).toString()), this.element.setAttribute("aria-valuetext", this.getCurrentSlideAnnouncement());
  }
  /**
   * Set play/pause state
   */
  setPlayingState(t) {
    this.isPlaying = t;
  }
  /**
   * Add custom key binding
   */
  addKeyBinding(t, e) {
    this.config.customBindings.set(t, e);
  }
  /**
   * Remove custom key binding
   */
  removeKeyBinding(t) {
    this.config.customBindings.delete(t);
  }
  /**
   * Update configuration
   */
  updateConfig(t) {
    this.config = { ...this.config, ...t };
  }
  /**
   * Focus the slider element
   */
  focus() {
    this.element.focus();
  }
  /**
   * Get current focus state
   */
  getFocusState() {
    return { ...this.focusState };
  }
  /**
   * Clean up event listeners and DOM elements
   */
  destroy() {
    this.element.removeEventListener("keydown", this.handleKeyDown.bind(this)), this.element.removeEventListener("focus", this.handleFocus.bind(this)), this.element.removeEventListener("blur", this.handleBlur.bind(this)), this.liveRegion && (this.liveRegion.remove ? this.liveRegion.remove() : this.liveRegion.parentNode && this.liveRegion.parentNode.removeChild(this.liveRegion), this.liveRegion = null);
    const t = document.getElementById("slider-keyboard-instructions");
    t && t.remove(), this.config.customBindings.clear();
  }
}
class rt {
  constructor() {
    this.config = $, this.callbacks = null, this.element = null, this.isEnabled = !1, this.gestureRecognizer = null, this.keyboardNavigator = null, this.isPointerDown = !1, this.startX = 0, this.startY = 0, this.currentX = 0, this.currentY = 0, this.startTime = 0, this.boundHandlers = /* @__PURE__ */ new Map(), this.eventThrottler = new st({
      useRAF: !0,
      enableMetrics: !0,
      maxBatchSize: 10
    }), this.kineticPhysics = new F(), this.springPhysics = new k(), this.velocityTracker = new O();
  }
  /**
   * Initialize enhanced input handling on target element
   */
  initialize(t, e) {
    this.element = t, this.callbacks = e, this.setupGestureRecognizer(), this.setupKeyboardNavigator(), this.setupEventListeners(), this.enable();
  }
  /**
   * Setup advanced gesture recognition
   */
  setupGestureRecognizer() {
    this.element && (this.gestureRecognizer = new nt(this.element, {
      enableMultiTouch: !0,
      swipeThreshold: this.config.swipeThreshold,
      tapThreshold: this.config.dragThreshold
    }), this.gestureRecognizer.onGesture = (t) => {
      this.handleGesture(t);
    });
  }
  /**
   * Setup accessible keyboard navigation
   */
  setupKeyboardNavigator() {
    if (!this.element || !this.callbacks) return;
    const t = {
      onNext: () => this.callbacks?.onSwipeLeft(),
      // Next slide
      onPrevious: () => this.callbacks?.onSwipeRight(),
      // Previous slide
      onFirst: () => {
        this.callbacks?.onKeyLeft();
      },
      onLast: () => {
        this.callbacks?.onKeyRight();
      },
      onTogglePlayPause: () => {
        this.callbacks?.onTogglePlayPause && this.callbacks.onTogglePlayPause();
      },
      onGoToSlide: (e) => {
        this.callbacks?.onGoToSlide && this.callbacks.onGoToSlide(e);
      },
      onEscape: () => {
        this.callbacks?.onEscape && this.callbacks.onEscape();
      }
    };
    this.keyboardNavigator = new at(
      this.element,
      t,
      {
        enableArrowKeys: this.config.enableKeyboard,
        enableWASD: this.config.enableKeyboard,
        respectMotionPreferences: !0,
        enableAnnouncements: !0
      }
    );
  }
  /**
   * Handle advanced gesture events with GSAP physics integration
   */
  handleGesture(t) {
    if (!(!this.callbacks || !this.isEnabled))
      switch (this.velocityTracker.addSample(
        t.currentPoint.x,
        t.currentPoint.y,
        performance.now()
      ), t.type) {
        case y.SWIPE_LEFT:
          this.handlePhysicsSwipe(t, "left");
          break;
        case y.SWIPE_RIGHT:
          this.handlePhysicsSwipe(t, "right");
          break;
        case y.TAP:
          this.handlePhysicsTap(t);
          break;
        case y.DOUBLE_TAP:
          this.handlePhysicsDoubleTap(t);
          break;
        case y.LONG_PRESS:
          this.handlePhysicsLongPress(t);
          break;
        case y.PINCH:
          this.handlePhysicsPinch(t);
          break;
        case y.PAN:
          this.handlePhysicsPan(t);
          break;
      }
  }
  /**
   * Handle swipe gestures with kinetic physics and GSAP animations
   */
  handlePhysicsSwipe(t, e) {
    const i = this.kineticPhysics.calculateMomentum(
      t.velocity,
      t.distance,
      t.duration
    );
    if (this.element) {
      const s = D.createMomentumAnimation(
        this.element,
        // Architectural bridge: DOM → PIXI
        {
          velocity: i.velocity,
          direction: e === "left" ? -1 : 1,
          duration: i.duration,
          damping: 0.85
        }
      ), n = D.createDragEffect(
        this.element,
        // Architectural bridge: DOM → PIXI
        t.distance,
        0.1
        // Subtle scale intensity
      );
      s.play(), n.play();
    }
    e === "left" ? this.callbacks?.onSwipeLeft() : this.callbacks?.onSwipeRight();
  }
  /**
   * Handle tap gestures with spring physics feedback
   */
  handlePhysicsTap(t) {
    if (!this.element) return;
    const e = D.createScaleAnimation(
      this.element,
      // Architectural bridge: DOM → PIXI
      {
        targetScale: 0.98,
        baseScale: 1,
        duration: 0.1,
        ease: "power2.out"
      }
    );
    setTimeout(() => {
      D.createScaleReset(
        this.element,
        // Architectural bridge: DOM → PIXI
        1
      ).play();
    }, 100), e.play();
  }
  /**
   * Handle double-tap with enhanced spring feedback
   */
  handlePhysicsDoubleTap(t) {
    if (!this.element) return;
    this.springPhysics.createBouncyScale(
      this.element,
      // Architectural bridge: DOM → PIXI
      1.05,
      // Peak scale
      1,
      // Final scale
      2
      // Bounce count
    ).play();
  }
  /**
   * Handle long press with progressive spring effect
   */
  handlePhysicsLongPress(t) {
    if (!this.element) return;
    this.springPhysics.createScaleSpring(
      this.element,
      // Architectural bridge: DOM → PIXI
      1.02,
      // Slight scale increase
      {
        springConstant: 0.2,
        damping: 0.8,
        duration: 0.3,
        ease: "elastic.out(1, 0.5)"
      }
    ).play();
  }
  /**
   * Handle pinch gestures with scale physics
   */
  handlePhysicsPinch(t) {
    if (!this.element || !t.scale) return;
    D.createScaleAnimation(
      this.element,
      // Architectural bridge: DOM → PIXI
      {
        targetScale: t.scale,
        baseScale: 1,
        duration: 0.3,
        ease: "power2.out"
      }
    ).play();
  }
  /**
   * Handle pan gestures with physics-driven smoothing
   */
  handlePhysicsPan(t) {
    const e = this.velocityTracker.getVelocity(), i = this.kineticPhysics.calculateDragScale(
      t.distance,
      e.velocity
    );
    this.element && D.createDragEffect(
      this.element,
      // Architectural bridge: DOM → PIXI
      t.distance,
      i * 0.1
      // Scale intensity
    ).play(), this.callbacks?.onDragMove(
      t.currentPoint.x,
      t.currentPoint.y,
      t.currentPoint.x - t.startPoint.x,
      t.currentPoint.y - t.startPoint.y
    );
  }
  /**
   * Enable input handling
   */
  enable() {
    this.isEnabled = !0;
  }
  /**
   * Disable input handling
   */
  disable() {
    this.isEnabled = !1;
  }
  /**
   * Set input configuration
   */
  setInputConfig(t) {
    this.config = { ...this.config, ...t };
  }
  /**
   * Get current input configuration
   */
  getInputConfig() {
    return { ...this.config };
  }
  /**
   * Destroy input controller and cleanup all enhanced components
   */
  destroy() {
    this.gestureRecognizer?.destroy(), this.gestureRecognizer = null, this.keyboardNavigator?.destroy(), this.keyboardNavigator = null, this.eventThrottler?.destroy(), this.removeEventListeners(), this.element = null, this.callbacks = null, this.isEnabled = !1;
  }
  /**
   * Setup all event listeners with proper options
   */
  setupEventListeners() {
    if (this.element) {
      if (this.config.enableMouse && (this.addEventListenerWithCleanup(
        p.MOUSE_DOWN,
        (t) => this.handlePointerStart(t)
      ), this.addEventListenerWithCleanup(
        p.MOUSE_MOVE,
        (t) => this.handlePointerMove(t),
        { passive: !0 }
      ), this.addEventListenerWithCleanup(
        p.MOUSE_UP,
        (t) => this.handlePointerEnd(t)
      ), this.addEventListenerWithCleanup(
        p.MOUSE_LEAVE,
        (t) => this.handlePointerEnd(t)
      )), this.config.enableTouch && (this.addEventListenerWithCleanup(
        p.TOUCH_START,
        (t) => this.handleTouchStart(t),
        { passive: !1 }
      ), this.addEventListenerWithCleanup(
        p.TOUCH_MOVE,
        (t) => this.handleTouchMove(t),
        { passive: !0 }
      ), this.addEventListenerWithCleanup(
        p.TOUCH_END,
        (t) => this.handleTouchEnd(t)
      ), this.addEventListenerWithCleanup(
        p.TOUCH_CANCEL,
        (t) => this.handleTouchEnd(t)
      )), this.config.enableKeyboard) {
        const t = (e) => this.handleKeyDown(e);
        document.addEventListener(p.KEY_DOWN, t), this.boundHandlers.set(p.KEY_DOWN, t);
      }
      this.addEventListenerWithCleanup(
        p.CONTEXT_MENU,
        (t) => {
          t.preventDefault();
        }
      );
    }
  }
  /**
   * Remove all event listeners
   */
  removeEventListeners() {
    this.element && (this.boundHandlers.forEach((t, e) => {
      e === p.KEY_DOWN ? document.removeEventListener(e, t) : this.element.removeEventListener(e, t);
    }), this.boundHandlers.clear());
  }
  /**
   * Helper to add event listener with cleanup tracking
   */
  addEventListenerWithCleanup(t, e, i) {
    this.element && (this.element.addEventListener(t, e, i), this.boundHandlers.set(t, e));
  }
  /**
   * Handle mouse down events
   */
  handlePointerStart(t) {
    !this.isEnabled || !this.callbacks || (this.isPointerDown = !0, this.startX = t.clientX, this.startY = t.clientY, this.currentX = t.clientX, this.currentY = t.clientY, this.startTime = performance.now(), this.callbacks.onDragStart(this.startX, this.startY), t.preventDefault());
  }
  /**
   * Handle mouse move events
   */
  handlePointerMove(t) {
    if (!this.isEnabled || !this.isPointerDown || !this.callbacks) return;
    const e = t.clientX - this.currentX, i = t.clientY - this.currentY;
    this.currentX = t.clientX, this.currentY = t.clientY, this.callbacks.onDragMove(this.currentX, this.currentY, e, i);
  }
  /**
   * Handle mouse up events
   */
  handlePointerEnd(t) {
    if (!this.isEnabled || !this.isPointerDown || !this.callbacks) return;
    this.isPointerDown = !1;
    const e = this.currentX - this.startX, i = performance.now() - this.startTime, s = Math.abs(e) / i;
    Math.abs(e) > this.config.swipeThreshold && s > c.VELOCITY_THRESHOLD && (e > 0 ? this.callbacks.onSwipeRight() : this.callbacks.onSwipeLeft()), this.callbacks.onDragEnd(this.currentX, this.currentY);
  }
  /**
   * Handle touch start events
   */
  handleTouchStart(t) {
    if (!this.isEnabled || !this.callbacks || t.touches.length !== 1) return;
    const e = t.touches[0];
    this.isPointerDown = !0, this.startX = e.clientX, this.startY = e.clientY, this.currentX = e.clientX, this.currentY = e.clientY, this.startTime = performance.now(), this.callbacks.onDragStart(this.startX, this.startY), Math.abs(this.startY - e.clientY) < this.config.dragThreshold && t.preventDefault();
  }
  /**
   * Handle touch move events
   */
  handleTouchMove(t) {
    if (!this.isEnabled || !this.isPointerDown || !this.callbacks || t.touches.length !== 1) return;
    const e = t.touches[0], i = e.clientX - this.currentX, s = e.clientY - this.currentY;
    this.currentX = e.clientX, this.currentY = e.clientY, this.callbacks.onDragMove(this.currentX, this.currentY, i, s);
  }
  /**
   * Handle touch end events
   */
  handleTouchEnd(t) {
    if (!this.isEnabled || !this.isPointerDown || !this.callbacks) return;
    this.isPointerDown = !1;
    const e = this.currentX - this.startX, i = performance.now() - this.startTime, s = Math.abs(e) / i;
    Math.abs(e) > this.config.swipeThreshold && s > c.VELOCITY_THRESHOLD && (e > 0 ? this.callbacks.onSwipeRight() : this.callbacks.onSwipeLeft()), this.callbacks.onDragEnd(this.currentX, this.currentY);
  }
  /**
   * Handle keyboard events
   */
  handleKeyDown(t) {
    if (!this.isEnabled || !this.callbacks) return;
    const e = document.activeElement;
    if (!(e && (e.tagName === b.INPUT || e.tagName === b.TEXTAREA || e.tagName === b.SELECT || e.getAttribute(w.CONTENT_EDITABLE) === w.TRUE)))
      switch (t.key) {
        case R.ARROW_LEFT:
        case "a":
        case "A":
          this.callbacks.onKeyLeft(), t.preventDefault();
          break;
        case R.ARROW_RIGHT:
        case "d":
        case "D":
          this.callbacks.onKeyRight(), t.preventDefault();
          break;
      }
  }
}
const lt = z;
function Y() {
  const o = new Z();
  S.registerInstance(A.EVENT_EMITTER, o), S.register(A.PHYSICS, () => new it()), S.register(A.RENDERER, () => new H()), S.register(A.CONTROLLER, () => new rt()), S.register(A.ENGINE, () => new tt());
}
function ht() {
  return S.has(A.ENGINE) || Y(), S.get(A.ENGINE);
}
function ut() {
  S.clear();
}
Y();
export {
  lt as KINETIC_SLIDER_VERSION,
  H as PixiSliderRenderer,
  A as SERVICE_KEYS,
  Z as SimpleEventEmitter,
  rt as SliderController,
  tt as SliderEngine,
  it as SliderPhysics,
  ht as createKineticSlider,
  Y as initializeSliderServices,
  ut as resetSliderServices,
  S as serviceContainer
};
//# sourceMappingURL=kinetic-slider.es.js.map
