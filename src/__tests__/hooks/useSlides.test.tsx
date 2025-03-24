import { renderHook } from '@testing-library/react';
import { useSlides } from '../../hooks/useSlides';
import { TextPair, PixiRefs } from '../../types';
import { jest, describe, test, expect } from '@jest/globals';
import { Application } from 'pixi.js';

// Mock dependencies
jest.mock('../../managers/ResourceManager');
jest.mock('../../managers/AtlasManager');
jest.mock('../../managers/AnimationCoordinator');
jest.mock('../../managers/SlidingWindowManager');

describe('useSlides Hook', () => {
    // Setup mock props and refs
    const mockProps = {
        images: ['/images/slide1.jpg', '/images/slide2.jpg'],
        texts: [['Title 1', 'Subtitle 1'], ['Title 2', 'Subtitle 2']] as TextPair[],
        slidesBasePath: '/images/',
        useSlidesAtlas: false,
    };

    const mockSliderRef = { current: document.createElement('div') };

    // Create a properly typed mock app
    const mockApp = {
        stage: {
            addChild: jest.fn(),
            removeChild: jest.fn(),
            children: []
        },
        renderer: {
            resize: jest.fn(),
            plugins: {
                interaction: {
                    on: jest.fn(),
                    off: jest.fn()
                }
            },
            view: document.createElement('canvas'),
            resolution: 1
        },
        ticker: {
            add: jest.fn(),
            remove: jest.fn()
        },
        view: document.createElement('canvas'),
        screen: { width: 800, height: 600 },
        destroy: jest.fn(),
        render: jest.fn(),
        init: jest.fn(),
        canvas: document.createElement('canvas'),
        start: jest.fn(),
        stop: jest.fn()
    } as unknown as Application;

    // Create properly typed refs object
    const mockPixi = {
        app: { current: mockApp },
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

    test('initializes correctly', () => {
        const { result } = renderHook(() => useSlides({
            sliderRef: mockSliderRef,
            pixi: mockPixi,
            props: mockProps,
            onSlideChange: mockOnSlideChange,
        }));

        // Verify the hook returns the expected API
        expect(result.current).toHaveProperty('transitionToSlide');
        expect(result.current).toHaveProperty('nextSlide');
        expect(result.current).toHaveProperty('prevSlide');
        expect(result.current).toHaveProperty('isLoading');
        expect(result.current).toHaveProperty('loadingProgress');
    });
});