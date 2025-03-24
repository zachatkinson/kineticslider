import { renderHook } from '@testing-library/react';
import { useSlides } from '../../hooks/useSlides';
import { TextPair } from '../../types';
import { jest, describe, test, expect } from '@jest/globals';

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
    const mockPixi = {
        app: { current: { stage: { addChild: jest.fn() } } },
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
    };

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