// Import Jest DOM extensions for DOM element assertions
import '@testing-library/jest-dom';
import 'jest-canvas-mock';

// Mock the GSAP library
jest.mock('gsap', () => ({
    gsap: {
        to: jest.fn().mockReturnValue({
            pause: jest.fn(),
            play: jest.fn(),
            kill: jest.fn(),
        }),
        timeline: jest.fn().mockReturnValue({
            to: jest.fn().mockReturnThis(),
            from: jest.fn().mockReturnThis(),
            fromTo: jest.fn().mockReturnThis(),
            pause: jest.fn(),
            play: jest.fn(),
            progress: jest.fn(),
            kill: jest.fn(),
            add: jest.fn().mockReturnThis(),
        }),
    },
    Power2: {
        easeInOut: 'ease-in-out',
        easeOut: 'ease-out',
        easeIn: 'ease-in',
    },
}));

// Mock the window.matchMedia function
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // Deprecated
        removeListener: jest.fn(), // Deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    constructor(callback) {
        this.callback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
};

// Mock requestAnimationFrame
global.requestAnimationFrame = callback => setTimeout(callback, 0);
global.cancelAnimationFrame = id => clearTimeout(id);

// Mock for import.meta.env
global.import = {
    meta: {
        env: {
            MODE: 'test',
        }
    }
};

// Create mock for PIXI
const PixiMock = {
    Application: jest.fn(() => ({
        stage: {
            addChild: jest.fn(),
            removeChild: jest.fn(),
            children: [],
        },
        renderer: {
            resize: jest.fn(),
            plugins: {
                interaction: {
                    on: jest.fn(),
                    off: jest.fn(),
                },
            },
            view: document.createElement('canvas'),
        },
        destroy: jest.fn(),
        ticker: {
            add: jest.fn(),
            remove: jest.fn(),
        },
    })),
    Sprite: jest.fn(() => ({
        anchor: { set: jest.fn() },
        position: { set: jest.fn() },
        scale: { set: jest.fn() },
        texture: null,
        filters: [],
        width: 100,
        height: 100,
    })),
    Container: jest.fn(() => ({
        addChild: jest.fn(),
        removeChild: jest.fn(),
        children: [],
        filters: [],
    })),
    DisplacementFilter: jest.fn(() => ({
        scale: { x: 0, y: 0 },
    })),
    Texture: {
        from: jest.fn(() => ({
            width: 100,
            height: 100,
        })),
        WHITE: 'WHITE-TEXTURE',
    },
    Assets: {
        load: jest.fn().mockResolvedValue({}),
    },
    Filter: jest.fn(),
};

jest.mock('pixi.js', () => PixiMock);

// Mock pixi-filters
jest.mock('pixi-filters', () => ({
    // Add mock implementations for specific filters if needed
}));