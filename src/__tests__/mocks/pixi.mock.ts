/**
 * Centralized PIXI.js mocks for testing
 * Updated to support BaseFilter class architecture
 */
import { vi } from 'vitest';

// Base filter properties that all PIXI filters should have
const createBaseFilterProperties = (overrides = {}): Record<string, unknown> => ({
  alpha: 1.0,
  enabled: true,
  destroy: vi.fn(),
  ...overrides
});

// AlphaFilter mock - matches PIXI.AlphaFilter API
export const createMockAlphaFilter = (options: unknown = {}): Record<string, unknown> => ({
  ...createBaseFilterProperties(),
  alpha: (options as Record<string, unknown>)?.alpha ?? 1.0,
  ...(options as Record<string, unknown>)
});

// BlurFilter mock - matches PIXI.BlurFilter API  
export const createMockBlurFilter = (options: unknown = {}): Record<string, unknown> => {
  const baseProps = createBaseFilterProperties();
  
  // Handle BlurFilter constructor options - PIXI.BlurFilter takes individual parameters, not strength
  const opts = options as Record<string, unknown>;
  const strengthX = opts?.strengthX ?? 8;
  const strengthY = opts?.strengthY ?? 8;
  const quality = opts?.quality ?? 4;
  const kernelSize = opts?.kernelSize ?? 5;
  const resolution = opts?.resolution ?? 1;

  return {
    ...baseProps,
    // Main strength property is computed from strengthX/strengthY, not passed in constructor
    get strength() { return Math.max(Number(this.strengthX) || 0, Number(this.strengthY) || 0); },
    set strength(value) { 
      this.strengthX = value;
      this.strengthY = value;
    },
    strengthX,
    strengthY,
    quality,
    kernelSize,
    resolution,
    repeatEdgePixels: opts?.repeatEdgePixels ?? false,
    ...(options as Record<string, unknown>)
  };
};

// NoiseFilter mock - matches PIXI.NoiseFilter API
export const createMockNoiseFilter = (options: unknown = {}): Record<string, unknown> => ({
  ...createBaseFilterProperties(),
  noise: (options as Record<string, unknown>)?.noise ?? 0.5,
  seed: (options as Record<string, unknown>)?.seed ?? Math.random(),
  ...(options as Record<string, unknown>)
});

// DropShadowFilter mock - matches pixi-filters DropShadowFilter API
export const createMockDropShadowFilter = (options: unknown = {}): Record<string, unknown> => ({
  ...createBaseFilterProperties(),
  alpha: (options as Record<string, unknown>)?.alpha ?? 0.5,
  blur: (options as Record<string, unknown>)?.blur ?? 2,
  color: (options as Record<string, unknown>)?.color ?? 0x000000,
  offsetX: (options as Record<string, unknown>)?.offsetX ?? 2,
  offsetY: (options as Record<string, unknown>)?.offsetY ?? 2,
  pixelSize: (options as Record<string, unknown>)?.pixelSize ?? 1,
  pixelSizeX: (options as Record<string, unknown>)?.pixelSizeX ?? 1,
  pixelSizeY: (options as Record<string, unknown>)?.pixelSizeY ?? 1,
  quality: (options as Record<string, unknown>)?.quality ?? 1,
  shadowOnly: (options as Record<string, unknown>)?.shadowOnly ?? false,
  ...(options as Record<string, unknown>)
});

// GrayscaleFilter mock - matches pixi-filters GrayscaleFilter API
export const createMockGrayscaleFilter = (options: unknown = {}): Record<string, unknown> => ({
  ...createBaseFilterProperties(),
  // GrayscaleFilter can have alpha property for blending
  alpha: 1.0,
  enabled: true,
  ...(options as Record<string, unknown>)
});

// EmbossFilter mock - matches pixi-filters EmbossFilter API
export const createMockEmbossFilter = (strength: number | unknown = 5, options: unknown = {}): Record<string, unknown> => ({
  ...createBaseFilterProperties(),
  strength: typeof strength === 'number' ? strength : 5,
  ...(options as Record<string, unknown>)
});

// DisplacementFilter mock - matches PIXI.DisplacementFilter API
export const createMockDisplacementFilter = (sprite?: unknown, scale?: unknown, options: unknown = {}): Record<string, unknown> => ({
  ...createBaseFilterProperties(),
  scale: scale ?? { x: 50, y: 50 },
  scaleX: (scale as Record<string, unknown>)?.x ?? 50,
  scaleY: (scale as Record<string, unknown>)?.y ?? 50,
  ...(options as Record<string, unknown>)
});

// GlowFilter mock - matches pixi-filters GlowFilter API
export const createMockGlowFilter = (options: unknown = {}): Record<string, unknown> => ({
  ...createBaseFilterProperties(),
  distance: (options as Record<string, unknown>)?.distance ?? 10,
  innerStrength: (options as Record<string, unknown>)?.innerStrength ?? 1,
  outerStrength: (options as Record<string, unknown>)?.outerStrength ?? 4,
  quality: (options as Record<string, unknown>)?.quality ?? 0.1,
  color: (options as Record<string, unknown>)?.color ?? 0xffffff,
  knockout: (options as Record<string, unknown>)?.knockout ?? false,
  ...(options as Record<string, unknown>)
});

// PIXI.js core mocks
export const mockPixiJS = (): Record<string, unknown> => {
  return vi.hoisted(() => ({
    AlphaFilter: vi.fn().mockImplementation((options: unknown) => 
      createMockAlphaFilter(options)
    ),
    BlurFilter: vi.fn().mockImplementation((options: unknown = {}) => {
      // Handle both cases: when called with options object or individual parameters
      const normalizedOptions = typeof options === 'object' && options !== null ? options : {};
      return createMockBlurFilter(normalizedOptions);
    }),
    ColorMatrixFilter: vi.fn().mockImplementation((options: unknown = {}) => ({
      ...createBaseFilterProperties(),
      alpha: 1.0,
      enabled: true,
      desaturate: vi.fn(),
      ...(options as Record<string, unknown>)
    })),
    NoiseFilter: vi.fn().mockImplementation(() => 
      createMockNoiseFilter()
    ),
    DisplacementFilter: vi.fn().mockImplementation((sprite: unknown, scale: unknown) => 
      createMockDisplacementFilter(sprite, scale)
    ),
    Texture: {
      from: vi.fn().mockReturnValue({
        destroy: vi.fn()
      })
    },
    Sprite: vi.fn().mockImplementation(() => ({
      destroy: vi.fn()
    })),
    Point: vi.fn().mockImplementation((x: number, y: number) => ({ x, y }))
  }));
};

// PIXI Filters (pixi-filters package) mocks
export const mockPixiFilters = (): Record<string, unknown> => {
  return vi.hoisted(() => ({
    DropShadowFilter: vi.fn().mockImplementation((options: unknown = {}) => 
      createMockDropShadowFilter(options)
    ),
    GrayscaleFilter: vi.fn().mockImplementation((options: unknown = {}) => 
      createMockGrayscaleFilter(options)
    ),
    EmbossFilter: vi.fn().mockImplementation((strength: unknown = 5, options: unknown = {}) => 
      createMockEmbossFilter(strength as number, options)
    ),
    GlowFilter: vi.fn().mockImplementation((options: unknown = {}) => 
      createMockGlowFilter(options)
    )
  }));
};

// Comprehensive PIXI setup for tests
export const setupPixiMocks = (): void => {
  const mockPixiFactory = vi.hoisted(() => ({
    AlphaFilter: vi.fn().mockImplementation((options: unknown) => 
      createMockAlphaFilter(options)
    ),
    BlurFilter: vi.fn().mockImplementation((options: unknown = {}) => {
      // Handle both cases: when called with options object or individual parameters
      const normalizedOptions = typeof options === 'object' && options !== null ? options : {};
      return createMockBlurFilter(normalizedOptions);
    }),
    ColorMatrixFilter: vi.fn().mockImplementation((options: unknown = {}) => ({
      ...createBaseFilterProperties(),
      alpha: 1.0,
      enabled: true,
      desaturate: vi.fn(),
      ...(options as Record<string, unknown>)
    })),
    NoiseFilter: vi.fn().mockImplementation(() => 
      createMockNoiseFilter()
    ),
    DisplacementFilter: vi.fn().mockImplementation((sprite: unknown, scale: unknown) => 
      createMockDisplacementFilter(sprite, scale)
    ),
    Texture: {
      from: vi.fn().mockReturnValue({
        destroy: vi.fn()
      })
    },
    Sprite: vi.fn().mockImplementation(() => ({
      destroy: vi.fn()
    })),
    Point: vi.fn().mockImplementation((x: number, y: number) => ({ x, y }))
  }));

  const mockPixiFiltersFactory = vi.hoisted(() => ({
    DropShadowFilter: vi.fn().mockImplementation((options: unknown = {}) => 
      createMockDropShadowFilter(options)
    ),
    GrayscaleFilter: vi.fn().mockImplementation((options: unknown = {}) => 
      createMockGrayscaleFilter(options)
    ),
    EmbossFilter: vi.fn().mockImplementation((strength: unknown = 5, options: unknown = {}) => 
      createMockEmbossFilter(strength as number, options)
    ),
    GlowFilter: vi.fn().mockImplementation((options: unknown = {}) => 
      createMockGlowFilter(options)
    )
  }));

  vi.mock('pixi.js', () => mockPixiFactory);
  vi.mock('pixi-filters', () => mockPixiFiltersFactory);
};

// Reset all PIXI mocks
export const resetPixiMocks = (): void => {
  vi.clearAllMocks();
};

// Default export that matches PIXI.js structure
const mockPixi = vi.hoisted(() => ({
  Application: vi.fn().mockImplementation((options: unknown = {}) => ({
    destroy: vi.fn(),
    stop: vi.fn(), 
    start: vi.fn(),
    render: vi.fn(),
    resize: vi.fn(),
    screen: { width: 800, height: 600 },
    stage: {
      addChild: vi.fn(),
      removeChild: vi.fn(),
      destroy: vi.fn(),
      filters: []
    },
    renderer: {
      width: 800,
      height: 600,
      view: document.createElement('canvas'),
      plugins: {},
      destroy: vi.fn()
    },
    ticker: {
      add: vi.fn(),
      remove: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      destroy: vi.fn()
    },
    loader: {
      add: vi.fn(),
      load: vi.fn()
    },
    view: document.createElement('canvas'),
    ...(options as Record<string, unknown>)
  })),
  AlphaFilter: vi.fn().mockImplementation((options: unknown) => 
    createMockAlphaFilter(options)
  ),
  BlurFilter: vi.fn().mockImplementation((options: unknown = {}) => {
    // Handle both cases: when called with options object or individual parameters
    const normalizedOptions = typeof options === 'object' && options !== null ? options : {};
    return createMockBlurFilter(normalizedOptions);
  }),
  ColorMatrixFilter: vi.fn().mockImplementation((options: unknown = {}) => ({
    ...createBaseFilterProperties(),
    alpha: 1.0,
    enabled: true,
    desaturate: vi.fn(),
    ...(options as Record<string, unknown>)
  })),
  NoiseFilter: vi.fn().mockImplementation(() => 
    createMockNoiseFilter()
  ),
  DisplacementFilter: vi.fn().mockImplementation((sprite: unknown, scale: unknown) => 
    createMockDisplacementFilter(sprite, scale)
  ),
  Texture: {
    from: vi.fn().mockReturnValue({
      destroy: vi.fn(),
      width: 100,
      height: 100
    })
  },
  Sprite: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    width: 100,
    height: 100,
    anchor: { set: vi.fn() },
    texture: null
  })),
  Point: vi.fn().mockImplementation((x: number, y: number) => ({ x, y })),
  Container: vi.fn().mockImplementation(() => ({
    addChild: vi.fn(),
    removeChild: vi.fn(),
    destroy: vi.fn(),
    filters: []
  })),
  Graphics: vi.fn().mockImplementation(() => ({
    beginFill: vi.fn().mockReturnThis(),
    drawRect: vi.fn().mockReturnThis(),
    endFill: vi.fn().mockReturnThis(),
    clear: vi.fn().mockReturnThis(),
    destroy: vi.fn()
  }))
}));

export default mockPixi;
