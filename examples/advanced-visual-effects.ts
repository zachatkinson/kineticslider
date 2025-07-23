/**
 * @fileoverview Advanced Visual Effects Usage Examples
 *
 * Comprehensive examples demonstrating Phase 3.3 advanced visual effects.
 * Shows how to use DisplacementEffects, FilterChain, EffectPresets, and PerformanceOptimizer.
 *
 * @version 1.0.0
 */

/* eslint-disable security/detect-object-injection */

import { Application, Sprite, Assets } from 'pixi.js';
import {
  DisplacementEffects,
  FilterChain,
  EffectPresets,
  PerformanceOptimizer,
  type MouseFollowOptions,
  type TransitionOptions,
  type IdleEffectOptions,
  type FilterConfig,
  type PresetOptions,
  type QualityLevel,
} from '../src/rendering';

/**
 * Example 1: Basic Displacement Effects
 *
 * This example shows how to create and use basic displacement effects
 * including mouse follow, transitions, and idle animations.
 */
export async function basicDisplacementEffectsExample(): Promise<void> {
  // Initialize PIXI Application
  const app = new Application();
  await app.init({ width: 800, height: 600 });
  document.body.appendChild(app.canvas);

  // Load textures
  const [slideTexture, displacementTexture] = await Promise.all([
    Assets.load('https://pixijs.com/assets/bunny.png'),
    Assets.load('https://pixijs.com/assets/displacement_map.png'),
  ]);

  // Create sprite
  const sprite = new Sprite(slideTexture);
  sprite.anchor.set(0.5);
  sprite.position.set(400, 300);
  app.stage.addChild(sprite);

  // Initialize displacement effects
  const displacementEffects = new DisplacementEffects(displacementTexture);

  // Example 1a: Mouse Follow Effect
  const mouseFollowOptions: MouseFollowOptions = {
    intensity: 0.7,
    radius: 150,
    smoothing: true,
    smoothingFactor: 0.1,
    duration: 0.3,
    enabled: true,
  };

  displacementEffects.createMouseFollowEffect(sprite, mouseFollowOptions);

  // Example 1b: Idle Animation
  const idleOptions: IdleEffectOptions = {
    type: 'float',
    intensity: 0.4,
    duration: 3,
    loop: true,
    enabled: true,
  };

  displacementEffects.createIdleEffect(sprite, idleOptions);

  // Example 1c: Transition Effect (requires two sprites)
  const secondSprite = new Sprite(slideTexture);
  secondSprite.anchor.set(0.5);
  secondSprite.position.set(400, 300);
  secondSprite.alpha = 0;
  app.stage.addChild(secondSprite);

  const transitionOptions: TransitionOptions = {
    type: 'wave',
    intensity: 0.8,
    duration: 1.5,
    waveFrequency: 10,
    waveAmplitude: 30,
  };

  // Create transition on user interaction
  window.addEventListener('click', () => {
    const transitionTimeline = displacementEffects.createTransitionEffect(
      sprite,
      secondSprite,
      transitionOptions
    );

    // Fade sprites during transition
    transitionTimeline.to(sprite, { alpha: 0, duration: 0.75 }, 0);
    transitionTimeline.to(secondSprite, { alpha: 1, duration: 0.75 }, 0.75);
  });

  console.log('Basic Displacement Effects Example Ready!');
  console.log('- Mouse follow effect is active');
  console.log('- Idle float animation is running');
  console.log('- Click to trigger transition effect');
}

/**
 * Example 2: Advanced Filter Chains
 *
 * This example demonstrates creating complex filter chains with
 * multiple effects, priorities, and animation coordination.
 */
export async function advancedFilterChainsExample(): Promise<void> {
  const app = new Application();
  await app.init({ width: 800, height: 600 });
  document.body.appendChild(app.canvas);

  // Load texture
  const texture = await Assets.load('https://pixijs.com/assets/bunny.png');
  const sprite = new Sprite(texture);
  sprite.anchor.set(0.5);
  sprite.position.set(400, 300);
  app.stage.addChild(sprite);

  // Create filter chain with multiple effects
  const filterChain = new FilterChain({
    name: 'advanced-effects',
    mode: 'sequential',
    staggerDelay: 0.2,
    autoOptimize: true,
    maxFilters: 8,
  });

  // Example 2a: Add blur filter with animation
  const { BlurFilter } = await import('pixi.js');
  const blurFilter = new BlurFilter(0, 4);

  const blurConfig: FilterConfig = {
    id: 'blur-effect',
    priority: 3,
    enabled: true,
    animationProperties: { blur: 8 },
    duration: 1.0,
    ease: 'power2.out',
    animated: true,
  };

  filterChain.addFilter(blurFilter, blurConfig);

  // Example 2b: Add color matrix filter
  const { ColorMatrixFilter } = await import('pixi.js');
  const colorFilter = new ColorMatrixFilter();

  const colorConfig: FilterConfig = {
    id: 'color-effect',
    priority: 2,
    enabled: true,
    animationProperties: { alpha: 1 },
    duration: 1.2,
    ease: 'power2.inOut',
    animated: true,
    onUpdate: (filter, progress) => {
      // Custom animation logic
      const intensity = progress * 0.5;
      colorFilter.brightness(1 + intensity, false);
      colorFilter.contrast(1 + intensity * 0.3, false);
    },
  };

  filterChain.addFilter(colorFilter, colorConfig);

  // Example 2c: Add noise filter
  const { NoiseFilter } = await import('pixi.js');
  const noiseFilter = new NoiseFilter(0);

  const noiseConfig: FilterConfig = {
    id: 'noise-effect',
    priority: 1,
    enabled: true,
    animationProperties: { noise: 0.3 },
    duration: 0.8,
    ease: 'power2.in',
    animated: true,
  };

  filterChain.addFilter(noiseFilter, noiseConfig);

  // Apply filter chain
  const result = filterChain.applyTo(sprite);
  console.log(`Applied ${result.appliedCount} filters`);

  // Example 2d: Dynamic filter management
  setTimeout(() => {
    filterChain.disableFilter('noise-effect');
    filterChain.updateFilter('blur-effect', {
      animationProperties: { blur: 12 },
      duration: 0.5,
    });
  }, 3000);

  // Example 2e: Remove filters with animation
  setTimeout(async () => {
    await filterChain.removeFrom(sprite, true);
    console.log('Filters removed with animation');
  }, 6000);

  console.log('Advanced Filter Chains Example Ready!');
  console.log('- Sequential filter application with stagger');
  console.log('- Custom update callbacks');
  console.log('- Dynamic filter management');
}

/**
 * Example 3: Effect Presets Library
 *
 * This example shows how to use the comprehensive effect presets
 * library for quick and consistent visual effects.
 */
export async function effectPresetsExample(): Promise<void> {
  const app = new Application();
  await app.init({ width: 800, height: 600 });
  document.body.appendChild(app.canvas);

  // Load textures
  const [slideTexture, displacementTexture] = await Promise.all([
    Assets.load('https://pixijs.com/assets/bunny.png'),
    Assets.load('https://pixijs.com/assets/displacement_map.png'),
  ]);

  // Create sprites for different effects
  const sprites = Array.from({ length: 4 }, (_, i) => {
    const sprite = new Sprite(slideTexture);
    sprite.anchor.set(0.5);
    sprite.position.set(200 + i * 150, 300);
    sprite.scale.set(0.5);
    app.stage.addChild(sprite);
    return sprite;
  });

  // Initialize effect presets
  const effectPresets = new EffectPresets({
    enableMetrics: true,
    defaultIntensity: 'moderate',
    qualityLevel: 1.0,
    autoOptimize: true,
  });

  effectPresets.setDisplacementTexture(displacementTexture);

  // Example 3a: Blur effects
  const blurEffects = [
    { name: 'softBlur', sprite: sprites[0] },
    { name: 'motionBlur', sprite: sprites[1] },
  ];

  blurEffects.forEach(({ name, sprite }) => {
    const options: PresetOptions = {
      intensity: 'moderate',
      duration: 1.0,
      autoCleanup: true,
    };

    const effect = effectPresets.createEffect(name, options);
    effect.applyTo(sprite);

    // Store for cleanup
    (sprite as { effectCleanup?: () => void }).effectCleanup = effect.cleanup;
  });

  // Example 3b: Color effects
  const colorEffects = [
    { name: 'vintage', sprite: sprites[2] },
    { name: 'cyberpunk', sprite: sprites[3] },
  ];

  colorEffects.forEach(({ name, sprite }) => {
    const options: PresetOptions = {
      intensity: 'strong',
      duration: 1.5,
      ease: 'power2.inOut',
    };

    const effect = effectPresets.createEffect(name, options);
    effect.applyTo(sprite);

    (sprite as { effectCleanup?: () => void }).effectCleanup = effect.cleanup;
  });

  // Example 3c: Interactive displacement effects
  const interactiveSprite = new Sprite(slideTexture);
  interactiveSprite.anchor.set(0.5);
  interactiveSprite.position.set(400, 150);
  app.stage.addChild(interactiveSprite);

  const mouseFollowEffect = effectPresets.createEffect(
    'mouseFollowDisplacement',
    {
      intensity: 'moderate',
      customParams: {
        radius: 200,
        smoothing: true,
        smoothingFactor: 0.15,
      },
    }
  );

  mouseFollowEffect.applyTo(interactiveSprite);

  // Example 3d: Composite effects
  const compositeSprite = new Sprite(slideTexture);
  compositeSprite.anchor.set(0.5);
  compositeSprite.position.set(400, 450);
  app.stage.addChild(compositeSprite);

  const cinematicEffect = effectPresets.createEffect('cinematicTransition', {
    intensity: 'intense',
    duration: 2.0,
    ease: 'power2.inOut',
  });

  cinematicEffect.applyTo(compositeSprite);

  // Example 3e: Performance recommendations
  const lowPerformancePresets = effectPresets.getRecommendedPresets(2);
  console.log(
    'Low performance presets:',
    lowPerformancePresets.map((p) => p.name)
  );

  const allPresets = effectPresets.getPresetNames();
  console.log('All available presets:', allPresets);

  // Example 3f: Category-based selection
  const blurPresets = effectPresets.getPresetsByCategory('blur');
  const colorPresets = effectPresets.getPresetsByCategory('color');
  const displacementPresets =
    effectPresets.getPresetsByCategory('displacement');

  console.log('Effect Presets Example Ready!');
  console.log(`- Blur presets: ${blurPresets.length}`);
  console.log(`- Color presets: ${colorPresets.length}`);
  console.log(`- Displacement presets: ${displacementPresets.length}`);
}

/**
 * Example 4: Performance Optimization
 *
 * This example demonstrates how to use the PerformanceOptimizer
 * for dynamic quality adjustment and optimal performance.
 */
export async function performanceOptimizationExample(): Promise<void> {
  const app = new Application();
  await app.init({ width: 800, height: 600 });
  document.body.appendChild(app.canvas);

  // Load textures
  const [slideTexture, displacementTexture] = await Promise.all([
    Assets.load('https://pixijs.com/assets/bunny.png'),
    Assets.load('https://pixijs.com/assets/displacement_map.png'),
  ]);

  // Create test sprites
  const sprites = Array.from({ length: 6 }, (_, i) => {
    const sprite = new Sprite(slideTexture);
    sprite.anchor.set(0.5);
    sprite.position.set(150 + (i % 3) * 200, 200 + Math.floor(i / 3) * 200);
    sprite.scale.set(0.6);
    app.stage.addChild(sprite);
    return sprite;
  });

  // Initialize performance optimizer
  const performanceOptimizer = new PerformanceOptimizer({
    targetFPS: 60,
    fpsThreshold: 45,
    memoryThreshold: 150,
    strategy: 'balanced',
    qualityMode: 'auto',
    autoAdjust: true,
  });

  await performanceOptimizer.initialize(app);

  // Initialize effect systems
  const displacementEffects = new DisplacementEffects(displacementTexture);
  const filterChain = new FilterChain();
  const effectPresets = new EffectPresets();
  effectPresets.setDisplacementTexture(displacementTexture);

  // Register optimization targets
  performanceOptimizer.registerTarget(displacementEffects);
  performanceOptimizer.registerTarget(filterChain);
  performanceOptimizer.registerTarget(effectPresets);

  // Example 4a: Device capability detection
  const deviceCapability = performanceOptimizer.getDeviceCapability();
  console.log('Device capability:', deviceCapability);

  const currentQuality = performanceOptimizer.getCurrentQuality();
  console.log('Initial quality settings:', currentQuality);

  // Example 4b: Create effects based on device capability
  sprites.forEach((sprite, index) => {
    if (currentQuality.enableDisplacement && index < 2) {
      // High-quality displacement effects
      displacementEffects.createIdleEffect(sprite, {
        type: 'float',
        intensity: currentQuality.effectIntensity,
        duration: 3 + index,
      });
    }

    if (currentQuality.enableComplexFilters && index < 4) {
      // Complex filter effects
      const preset = effectPresets.createEffect('neonGlow', {
        intensity: currentQuality.effectIntensity > 0.7 ? 'strong' : 'moderate',
        duration: 1.5,
      });
      preset.applyTo(sprite);

      setTimeout(() => preset.cleanup(), 5000);
    }
  });

  // Example 4c: Performance monitoring
  performanceOptimizer.startMonitoring();

  // Performance event listeners
  performanceOptimizer.addEventListener('fps_drop', (event) => {
    console.warn('FPS Drop detected:', event.data);
  });

  performanceOptimizer.addEventListener('memory_warning', (event) => {
    console.warn('Memory warning:', event.data);
  });

  performanceOptimizer.addEventListener('quality_change', (event) => {
    console.log('Quality adjusted:', event.data);
  });

  performanceOptimizer.addEventListener('optimization_applied', (event) => {
    console.log('Optimization applied:', event.data);
  });

  // Example 4d: Manual optimization
  setTimeout(() => {
    const recommendation = performanceOptimizer.getOptimizationRecommendation();
    console.log('Optimization recommendation:', recommendation);

    if (recommendation.expectedImprovement > 0.1) {
      performanceOptimizer.applyOptimization(recommendation);
    }
  }, 5000);

  // Example 4e: Quality level adjustment
  const qualityLevels: QualityLevel[] = [
    {
      level: 0.3,
      effectIntensity: 0.3,
      maxConcurrentEffects: 2,
      animationQuality: 0.5,
      textureScale: 0.5,
      enableDisplacement: false,
      enableComplexFilters: false,
      filterQuality: 0.3,
      renderScale: 0.75,
    },
    {
      level: 0.8,
      effectIntensity: 0.8,
      maxConcurrentEffects: 6,
      animationQuality: 0.9,
      textureScale: 1.0,
      enableDisplacement: true,
      enableComplexFilters: true,
      filterQuality: 0.8,
      renderScale: 1.0,
    },
  ];

  let currentQualityIndex = 0;

  // Toggle quality levels every 10 seconds
  setInterval(() => {
    currentQualityIndex = (currentQualityIndex + 1) % qualityLevels.length;
    performanceOptimizer.setQualityLevel(qualityLevels[currentQualityIndex]);
    console.log(
      `Quality level changed to: ${qualityLevels[currentQualityIndex].level}`
    );
  }, 10000);

  console.log('Performance Optimization Example Ready!');
  console.log('- Auto-adjustment enabled');
  console.log('- Performance monitoring active');
  console.log('- Quality levels will toggle every 10 seconds');
}

/**
 * Example 5: Complete Integration
 *
 * This example shows how to integrate all Phase 3.3 components
 * for a complete advanced visual effects system.
 */
export async function completeIntegrationExample(): Promise<void> {
  const app = new Application();
  await app.init({ width: 1200, height: 800 });
  document.body.appendChild(app.canvas);

  // Load textures
  const [slideTexture1, slideTexture2, slideTexture3, displacementTexture] =
    await Promise.all([
      Assets.load('https://pixijs.com/assets/bunny.png'),
      Assets.load('https://pixijs.com/assets/bunny.png'),
      Assets.load('https://pixijs.com/assets/bunny.png'),
      Assets.load('https://pixijs.com/assets/displacement_map.png'),
    ]);

  // Create slide sprites
  const slides = [
    { texture: slideTexture1, x: 400, y: 300, active: true },
    { texture: slideTexture2, x: 1200, y: 300, active: false },
    { texture: slideTexture3, x: 1600, y: 300, active: false },
  ].map((config) => {
    const sprite = new Sprite(config.texture);
    sprite.anchor.set(0.5);
    sprite.position.set(config.x, config.y);
    sprite.alpha = config.active ? 1 : 0;
    app.stage.addChild(sprite);
    return sprite;
  });

  // Initialize all systems
  const displacementEffects = new DisplacementEffects(displacementTexture);
  const filterChain = new FilterChain({
    name: 'slide-effects',
    mode: 'parallel',
    autoOptimize: true,
  });
  const effectPresets = new EffectPresets({
    enableMetrics: true,
    autoOptimize: true,
  });
  effectPresets.setDisplacementTexture(displacementTexture);

  const performanceOptimizer = new PerformanceOptimizer({
    strategy: 'balanced',
    autoAdjust: true,
  });

  await performanceOptimizer.initialize(app);

  // Register all systems with optimizer
  performanceOptimizer.registerTarget(displacementEffects);
  performanceOptimizer.registerTarget(filterChain);
  performanceOptimizer.registerTarget(effectPresets);

  performanceOptimizer.startMonitoring();

  // Example 5a: Interactive slide system
  let currentSlide = 0;

  const transitionToSlide = async (index: number): Promise<void> => {
    if (index === currentSlide) return;

    const fromSprite = slides[currentSlide];
    const toSprite = slides[index];

    // Create transition effect
    const transitionTimeline = displacementEffects.createTransitionEffect(
      fromSprite,
      toSprite,
      {
        type: 'wave',
        intensity: 0.7,
        duration: 1.5,
      }
    );

    // Add preset effects to transition
    const fromEffect = effectPresets.createEffect('cinematicTransition', {
      intensity: 'strong',
      duration: 1.5,
    });

    const toEffect = effectPresets.createEffect('softGlow', {
      intensity: 'moderate',
      duration: 1.5,
    });

    fromEffect.applyTo(fromSprite);
    toEffect.applyTo(toSprite);

    // Position and fade animation
    const masterTimeline = transitionTimeline;
    masterTimeline.to(
      fromSprite,
      {
        x: fromSprite.x - 400,
        alpha: 0,
        duration: 1.5,
        ease: 'power2.inOut',
      },
      0
    );

    masterTimeline.to(
      toSprite,
      {
        x: 400,
        alpha: 1,
        duration: 1.5,
        ease: 'power2.inOut',
      },
      0
    );

    // Cleanup after transition
    masterTimeline.call(() => {
      fromEffect.cleanup();
      toEffect.cleanup();
    });

    currentSlide = index;
  };

  // Example 5b: Add interactive effects to current slide
  const addInteractiveEffects = () => {
    const activeSprite = slides[currentSlide] as PIXI.Sprite | undefined;
    if (!activeSprite) return;

    // Mouse follow effect
    displacementEffects.createMouseFollowEffect(activeSprite, {
      intensity: 0.5,
      radius: 150,
      smoothing: true,
    });

    // Idle animation
    displacementEffects.createIdleEffect(activeSprite, {
      type: 'breathe',
      intensity: 0.3,
      duration: 4,
      loop: true,
    });

    // Dynamic filter chain
    const { BlurFilter, ColorMatrixFilter } = window as {
      BlurFilter?: typeof BlurFilter;
      ColorMatrixFilter?: typeof ColorMatrixFilter;
    };
    const blurFilter = new BlurFilter(0, 2);
    const colorFilter = new ColorMatrixFilter();

    filterChain.addFilter(blurFilter, {
      id: 'interactive-blur',
      animationProperties: { blur: 2 },
      duration: 2.0,
    });

    filterChain.addFilter(colorFilter, {
      id: 'interactive-color',
      animationProperties: { alpha: 1 },
      duration: 2.0,
      onUpdate: (filter, progress) => {
        const intensity = Math.sin(progress * Math.PI * 2) * 0.1;
        colorFilter.brightness(1 + intensity, false);
      },
    });

    filterChain.applyTo(activeSprite);
  };

  // Initialize with interactive effects
  addInteractiveEffects();

  // Example 5c: Keyboard controls
  window.addEventListener('keydown', (event) => {
    switch (event.key) {
      case 'ArrowLeft':
        if (currentSlide > 0) {
          transitionToSlide(currentSlide - 1);
        }
        break;
      case 'ArrowRight':
        if (currentSlide < slides.length - 1) {
          transitionToSlide(currentSlide + 1);
        }
        break;
      case ' ':
        // Toggle effects
        if (displacementEffects.getPerformanceMetrics().activeEffects > 0) {
          displacementEffects.stopAllEffects();
          filterChain.clear();
        } else {
          addInteractiveEffects();
        }
        break;
    }
  });

  // Example 5d: Performance monitoring and adjustment
  let performanceInfoElement: HTMLElement;

  const createPerformanceInfo = () => {
    performanceInfoElement = document.createElement('div');
    performanceInfoElement.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 12px;
      z-index: 1000;
    `;
    document.body.appendChild(performanceInfoElement);
  };

  const updatePerformanceInfo = () => {
    if (!performanceInfoElement) return;

    const metrics = performanceOptimizer.getRealTimeMetrics();
    const quality = performanceOptimizer.getCurrentQuality();
    const deviceCapability = performanceOptimizer.getDeviceCapability();

    performanceInfoElement.innerHTML = `
      <strong>Performance Monitor</strong><br>
      Device: ${deviceCapability}<br>
      FPS: ${metrics.fps.toFixed(1)}<br>
      Memory: ${metrics.memoryUsage.toFixed(1)}MB<br>
      Quality: ${(quality.level * 100).toFixed(0)}%<br>
      Effects: ${metrics.activeEffects}<br>
      Displacement: ${quality.enableDisplacement ? 'On' : 'Off'}<br>
      Complex Filters: ${quality.enableComplexFilters ? 'On' : 'Off'}
    `;
  };

  createPerformanceInfo();
  setInterval(updatePerformanceInfo, 1000);

  // Example 5e: Automatic quality adjustment
  performanceOptimizer.addEventListener('quality_change', (event) => {
    console.log('Quality adjusted:', event.data);

    // Reapply effects with new quality settings
    const newQuality = performanceOptimizer.getCurrentQuality();
    if (!newQuality.enableDisplacement) {
      displacementEffects.stopAllEffects();
    }

    if (!newQuality.enableComplexFilters) {
      filterChain.clear();
    }
  });

  console.log('Complete Integration Example Ready!');
  console.log('Controls:');
  console.log('- Arrow keys: Navigate slides');
  console.log('- Spacebar: Toggle effects');
  console.log('- Mouse: Interactive displacement');
  console.log('- Performance info: Top-right corner');
}

/**
 * Example 6: Custom Effects Creation
 *
 * This example shows how to create custom effects and register them
 * with the effect presets system.
 */
export async function customEffectsExample(): Promise<void> {
  const app = new Application();
  await app.init({ width: 800, height: 600 });
  document.body.appendChild(app.canvas);

  // Load texture
  const texture = await Assets.load('https://pixijs.com/assets/bunny.png');
  const sprite = new Sprite(texture);
  sprite.anchor.set(0.5);
  sprite.position.set(400, 300);
  app.stage.addChild(sprite);

  // Initialize effect presets
  const effectPresets = new EffectPresets();

  // Example 6a: Register custom blur effect
  effectPresets.registerPreset({
    name: 'customRadialBlur',
    category: 'blur',
    description: 'Custom radial blur effect with pulsing animation',
    performanceImpact: 3,
    compatibility: ['chrome', 'firefox', 'safari'],
    useCases: ['focus effects', 'dream sequences', 'time distortion'],
    create: (options = {}) => {
      const intensity =
        options.intensity === 'subtle'
          ? 0.3
          : options.intensity === 'moderate'
            ? 0.6
            : options.intensity === 'strong'
              ? 0.8
              : 1.0;

      const filterChain = new FilterChain({ name: 'custom-radial-blur' });

      // Create multiple blur filters for radial effect
      const blurFilters = Array.from({ length: 3 }, (_, i) => {
        const { BlurFilter } = window as { BlurFilter?: typeof BlurFilter };
        const filter = new BlurFilter(intensity * (i + 1) * 2, 2);

        filterChain.addFilter(filter, {
          id: `radial-blur-${i}`,
          animationProperties: {
            blur: intensity * (i + 1) * 2,
            alpha: 0.3 + i * 0.2,
          },
          duration: options.duration || 2.0,
          ease: 'sine.inOut',
        });

        return filter;
      });

      return {
        filterChain,
        filters: blurFilters,
        cleanup: () => {
          filterChain.dispose();
        },
        applyTo: (target) => {
          filterChain.applyTo(target);
        },
        removeFrom: (target) => {
          filterChain.removeFrom(target);
        },
      };
    },
  });

  // Example 6b: Register custom color effect
  effectPresets.registerPreset({
    name: 'customRainbow',
    category: 'color',
    description: 'Animated rainbow color cycling effect',
    performanceImpact: 2,
    compatibility: ['chrome', 'firefox', 'safari'],
    useCases: ['party themes', 'celebration effects', 'psychedelic visuals'],
    create: (options = {}) => {
      const intensity =
        options.intensity === 'subtle'
          ? 0.2
          : options.intensity === 'moderate'
            ? 0.5
            : options.intensity === 'strong'
              ? 0.8
              : 1.0;

      const { ColorMatrixFilter } = window as {
        ColorMatrixFilter?: typeof ColorMatrixFilter;
      };
      const colorFilter = new ColorMatrixFilter();

      const filterChain = new FilterChain({ name: 'custom-rainbow' });

      filterChain.addFilter(colorFilter, {
        id: 'rainbow-color',
        animationProperties: { alpha: 1 },
        duration: options.duration || 3.0,
        ease: 'sine.inOut',
        onUpdate: (filter, progress) => {
          const hue = (progress * 360 * 3) % 360; // 3 full cycles
          const saturation = 1 + intensity * 0.5;

          colorFilter.hue(hue, false);
          colorFilter.saturate(saturation, false);
          colorFilter.brightness(1 + intensity * 0.2, false);
        },
      });

      return {
        filterChain,
        filters: [colorFilter],
        cleanup: () => {
          filterChain.dispose();
        },
        applyTo: (target) => {
          filterChain.applyTo(target);
        },
        removeFrom: (target) => {
          filterChain.removeFrom(target);
        },
      };
    },
  });

  // Example 6c: Use custom effects
  const customBlurEffect = effectPresets.createEffect('customRadialBlur', {
    intensity: 'strong',
    duration: 2.5,
  });

  customBlurEffect.applyTo(sprite);

  // Switch to rainbow effect after 5 seconds
  setTimeout(() => {
    customBlurEffect.removeFrom(sprite);
    customBlurEffect.cleanup();

    const rainbowEffect = effectPresets.createEffect('customRainbow', {
      intensity: 'moderate',
      duration: 4.0,
    });

    rainbowEffect.applyTo(sprite);

    // Cleanup after 8 seconds
    setTimeout(() => {
      rainbowEffect.cleanup();
    }, 8000);
  }, 5000);

  console.log('Custom Effects Example Ready!');
  console.log('- Custom radial blur effect active');
  console.log('- Will switch to rainbow effect after 5 seconds');
}

// Export all examples for easy testing
export const examples = {
  basicDisplacementEffects: basicDisplacementEffectsExample,
  advancedFilterChains: advancedFilterChainsExample,
  effectPresets: effectPresetsExample,
  performanceOptimization: performanceOptimizationExample,
  completeIntegration: completeIntegrationExample,
  customEffects: customEffectsExample,
};

// Auto-run example based on URL parameter
if (typeof window !== 'undefined') {
  const urlParams = new URLSearchParams(window.location.search);
  const exampleName = urlParams.get('example');

  if (exampleName && examples[exampleName as keyof typeof examples]) {
    examples[exampleName as keyof typeof examples]().catch(console.error);
  }
}
