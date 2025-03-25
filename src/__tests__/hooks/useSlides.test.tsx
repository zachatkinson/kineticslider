import { renderHook, act } from '@testing-library/react';
import { useSlides } from '../../hooks/useSlides';
import { TextPair, PixiRefs } from '../../types';
import { jest, describe, test, expect } from '@jest/globals';
import type { Renderer, Stage } from '../types/pixi';
import ResourceManager from '../../__mocks__/ResourceManager';
import { AtlasManager } from '../../__mocks__/AtlasManager';

// Mock dependencies
jest.mock('../../managers/ResourceManager');
jest.mock('../../managers/AtlasManager');
jest.mock('../../managers/AnimationCoordinator');
jest.mock('../../managers/SlidingWindowManager');

describe('useSlides', () => {
  // Setup mock props and refs
  const mockProps = {
    images: [
      'images/slides/1.jpg',
      'images/slides/2.jpg',
      'images/slides/3.jpg',
      'images/slides/4.jpg',
      'images/slides/5.jpg'
    ],
    texts: [
      ['Title 1', 'Subtitle 1'],
      ['Title 2', 'Subtitle 2'],
      ['Title 3', 'Subtitle 3'],
      ['Title 4', 'Subtitle 4'],
      ['Title 5', 'Subtitle 5']
    ] as TextPair[],
    slidesBasePath: '/images/',
    useSlidesAtlas: true,
    backgroundDisplacementSpriteLocation: 'images/effects/background-displace.jpg',
    cursorDisplacementSpriteLocation: 'images/effects/cursor-displace.png',
    slidesAtlas: '/atlas/slides-atlas.json',
    effectsAtlas: '/atlas/effects-atlas.json'
  };

  const mockSliderRef = { current: document.createElement('div') };
  // Set dimensions on the slider element
  mockSliderRef.current.getBoundingClientRect = () => ({
    width: 1600,
    height: 500,
    top: 0,
    left: 0,
    right: 1600,
    bottom: 500,
    x: 0,
    y: 0,
    toJSON: () => {}
  });
  Object.defineProperties(mockSliderRef.current, {
    clientWidth: { value: 1600 },
    clientHeight: { value: 500 }
  });

  // Create a properly typed mock renderer and stage for v8
  const mockRenderer: Renderer = {
    width: 1600,
    height: 500,
    backgroundColor: 0x000000,
    render: jest.fn(),
    resize: jest.fn(),
    view: document.createElement('canvas'),
    events: {
      add: jest.fn(),
      remove: jest.fn(),
    },
    destroy: jest.fn(),
    screen: {
      width: 1600,
      height: 500
    }
  };

  // Create a mock stage with children array and dimensions
  const mockStage: Stage = {
    addChild: jest.fn(),
    removeChild: jest.fn(),
    destroy: jest.fn(),
    children: [],
    filters: null,
    width: 1600,
    height: 500
  };

  // Create a mock app with proper screen dimensions and initialization
  const mockApp = {
    current: {
      stage: mockStage,
      renderer: mockRenderer,
      view: document.createElement('canvas'),
      screen: {
        width: 1600,
        height: 500
      },
      destroy: jest.fn(),
      init: jest.fn().mockResolvedValue(undefined)
    }
  };

  // Create properly typed refs object for v8
  const mockPixi = {
    app: mockApp,
    renderer: { current: mockRenderer },
    stage: { current: mockStage },
    slides: { current: [] },
    background: { current: null },
    cursor: { current: null },
    textContainers: { current: [] },
    backgroundDisplacementSprite: { current: null },
    cursorDisplacementSprite: { current: null },
    bgDispFilter: { current: null },
    cursorDispFilter: { current: null },
    filters: { current: [] },
    currentIndex: { current: 0 }
  } as unknown as PixiRefs;

  const mockOnSlideChange = jest.fn();

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockStage.children.length = 0;

    // Mock Assets.get to return a texture with dimensions
    const mockTexture = {
      width: 1600,
      height: 500,
      baseTexture: {
        width: 1600,
        height: 500,
        valid: true,
        hasLoaded: true,
        realWidth: 1600,
        realHeight: 500
      },
      valid: true,
      noFrame: false,
      _frame: {
        x: 0,
        y: 0,
        width: 1600,
        height: 500
      },
      orig: {
        width: 1600,
        height: 500
      },
      trim: null,
      destroy: jest.fn(),
      update: jest.fn()
    };
    (global as any).Assets = {
      get: jest.fn().mockReturnValue(mockTexture),
      load: jest.fn().mockResolvedValue(mockTexture),
      addBundle: jest.fn(),
      loadBundle: jest.fn().mockImplementation((name: string, progressCallback: (progress: number) => void) => {
        progressCallback(1);
        return Promise.resolve(mockTexture);
      }),
      cache: {
        has: jest.fn().mockReturnValue(false)
      }
    };
  });

  it('initializes with correct default values', async () => {
    const mockResourceManager = new ResourceManager('test-component') as any;
    const mockAtlasManager = new AtlasManager() as any;

    const { result } = renderHook(() => useSlides({
      sliderRef: mockSliderRef,
      pixi: mockPixi,
      props: mockProps,
      resourceManager: mockResourceManager,
      atlasManager: mockAtlasManager,
      onSlideChange: mockOnSlideChange
    }));

    // Initial state
    expect(result.current).toBeTruthy();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.loadingProgress).toBe(0);

    // Wait for any async operations
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  });

  test('initializes correctly', async () => {
    const mockResourceManager = new ResourceManager('test-component') as any;
    const mockAtlasManager = new AtlasManager() as any;

    const { result } = renderHook(() => useSlides({
      sliderRef: mockSliderRef,
      pixi: mockPixi,
      props: mockProps,
      resourceManager: mockResourceManager,
      atlasManager: mockAtlasManager,
      onSlideChange: mockOnSlideChange
    }));

    // Wait for any async operations
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Verify the hook returns the expected API
    expect(result.current).toBeTruthy();
    expect(result.current.transitionToSlide).toBeDefined();
    expect(result.current.nextSlide).toBeDefined();
    expect(result.current.prevSlide).toBeDefined();
    expect(result.current.isLoading).toBeDefined();
    expect(result.current.loadingProgress).toBeDefined();
  });
});
