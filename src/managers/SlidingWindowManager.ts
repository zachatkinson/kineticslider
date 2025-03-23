import { type EnhancedSprite } from '../types';
import ResourceManager from './ResourceManager';

/**
 * Configuration options for the SlidingWindowManager
 */
export interface SlidingWindowOptions {
    /** Number of slides to keep loaded on each side of the current slide */
    windowSize?: number;

    /** Whether to enable debug logging */
    debug?: boolean;

    /** Total number of slides in the slider */
    totalSlides: number;

    /** Initial active slide index */
    initialIndex?: number;
}

/**
 * Slide initialization state
 */
export enum SlideState {
    /** Slide is not initialized at all */
    UNINITIALIZED = 'uninitialized',

    /** Slide has a lightweight placeholder */
    PLACEHOLDER = 'placeholder',

    /** Slide is fully loaded and ready for display */
    LOADED = 'loaded',

    /** Slide is currently visible */
    ACTIVE = 'active',

    /** Slide failed to load */
    ERROR = 'error'
}

/**
 * Information about a slide's current state
 */
export interface SlideInfo {
    /** Index of the slide */
    index: number;

    /** Current state of the slide */
    state: SlideState;

    /** Reference to the sprite if available */
    sprite?: EnhancedSprite;

    /** Whether the slide is within the current visibility window */
    inWindow: boolean;

    /** Last time this slide was active */
    lastActiveTime?: number;
}

/**
 * Manages a sliding window of initialized slides to optimize memory usage
 * and improve performance by only fully loading slides that are visible
 * or likely to become visible soon.
 */
export default class SlidingWindowManager {
    /** Current active slide index */
    private activeIndex: number;

    /** Size of the window on each side of the active slide */
    private windowSize: number;

    /** Total number of slides */
    private totalSlides: number;

    /** Information about each slide */
    private slides: SlideInfo[];

    /** Whether debug logging is enabled */
    private debug: boolean;

    /** Resource manager for tracking resources */
    private resourceManager?: ResourceManager;

    /** Direction of the last navigation (-1 for prev, 1 for next, 0 for initial) */
    private lastDirection: number = 0;

    /**
     * Creates a new SlidingWindowManager
     *
     * @param options - Configuration options
     * @param resourceManager - Optional ResourceManager for resource tracking
     */
    constructor(options: SlidingWindowOptions, resourceManager?: ResourceManager) {
        this.windowSize = options.windowSize ?? 2;
        this.totalSlides = options.totalSlides;
        this.activeIndex = options.initialIndex ?? 0;
        this.debug = options.debug ?? false;
        this.resourceManager = resourceManager;

        // Initialize slide info array
        this.slides = Array(this.totalSlides).fill(null).map((_, index) => ({
            index,
            state: SlideState.UNINITIALIZED,
            inWindow: this.isInWindow(index, this.activeIndex)
        }));

        this.log(`Initialized with ${this.totalSlides} slides, window size ±${this.windowSize}, active index ${this.activeIndex}`);
        this.log(`Initial window: ${this.getWindowIndices().join(', ')}`);
    }

    /**
     * Log a message if debug is enabled
     */
    private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
        if (!this.debug) return;

        const prefix = `[SlidingWindowManager]`;

        switch (level) {
            case 'info':
                console.log(`${prefix} ${message}`);
                break;
            case 'warn':
                console.warn(`${prefix} ${message}`);
                break;
            case 'error':
                console.error(`${prefix} ${message}`);
                break;
        }
    }

    /**
     * Check if a slide index is within the current window
     *
     * @param index - Slide index to check
     * @param centerIndex - Center of the window (usually activeIndex)
     * @returns Whether the index is within the window
     */
    private isInWindow(index: number, centerIndex: number): boolean {
        const distance = Math.abs(index - centerIndex);
        return distance <= this.windowSize;
    }

    /**
     * Get all slide indices that should be in the current window
     *
     * @returns Array of slide indices in the window
     */
    public getWindowIndices(): number[] {
        const indices: number[] = [];

        // Include the active index and windowSize slides on each side
        for (let i = Math.max(0, this.activeIndex - this.windowSize);
             i <= Math.min(this.totalSlides - 1, this.activeIndex + this.windowSize);
             i++) {
            indices.push(i);
        }

        return indices;
    }

    /**
     * Get all slide indices that should be in the extended window
     * (includes prediction based on navigation direction)
     *
     * @returns Array of slide indices in the extended window
     */
    public getExtendedWindowIndices(): number[] {
        const indices = this.getWindowIndices();

        // Add extra slides in the direction of navigation
        if (this.lastDirection !== 0) {
            const extraIndex = this.lastDirection > 0
                ? this.activeIndex + this.windowSize + 1
                : this.activeIndex - this.windowSize - 1;

            if (extraIndex >= 0 && extraIndex < this.totalSlides) {
                indices.push(extraIndex);
            }
        }

        return indices;
    }

    /**
     * Update the active slide index and recalculate the window
     *
     * @param newIndex - New active slide index
     * @returns Object containing arrays of indices that entered and left the window
     */
    public updateActiveIndex(newIndex: number): {
        entered: number[],
        left: number[]
    } {
        if (newIndex < 0 || newIndex >= this.totalSlides) {
            this.log(`Invalid index: ${newIndex}`, 'error');
            return { entered: [], left: [] };
        }

        // Calculate direction of navigation
        this.lastDirection = newIndex > this.activeIndex ? 1 : -1;

        const oldWindowIndices = this.getWindowIndices();
        const oldActiveIndex = this.activeIndex;

        // Update active index
        this.activeIndex = newIndex;

        // Update active slide info
        if (this.slides[newIndex]) {
            this.slides[newIndex].state = SlideState.ACTIVE;
            this.slides[newIndex].lastActiveTime = Date.now();
        }

        // Update previous active slide
        if (this.slides[oldActiveIndex] && oldActiveIndex !== newIndex) {
            if (this.slides[oldActiveIndex].state === SlideState.ACTIVE) {
                this.slides[oldActiveIndex].state = SlideState.LOADED;
            }
        }

        // Get new window indices
        const newWindowIndices = this.getWindowIndices();

        // Calculate which indices entered and left the window
        const entered = newWindowIndices.filter(index => !oldWindowIndices.includes(index));
        const left = oldWindowIndices.filter(index => !newWindowIndices.includes(index));

        // Update inWindow flag for all slides
        this.slides.forEach(slide => {
            slide.inWindow = this.isInWindow(slide.index, this.activeIndex);
        });

        this.log(`Updated active index to ${newIndex}, direction: ${this.lastDirection}`);
        this.log(`Window changed: +[${entered.join(', ')}] -[${left.join(', ')}]`);

        return { entered, left };
    }

    /**
     * Register a sprite for a slide
     *
     * @param index - Slide index
     * @param sprite - Sprite instance
     * @param state - Current state of the slide
     */
    public registerSlide(index: number, sprite: EnhancedSprite, state: SlideState = SlideState.LOADED): void {
        if (index < 0 || index >= this.totalSlides) {
            this.log(`Invalid index for registerSlide: ${index}`, 'error');
            return;
        }

        this.slides[index] = {
            ...this.slides[index],
            sprite,
            state: index === this.activeIndex ? SlideState.ACTIVE : state,
            inWindow: this.isInWindow(index, this.activeIndex)
        };

        this.log(`Registered slide ${index} with state ${state}`);
    }

    /**
     * Update the state of a slide
     *
     * @param index - Slide index
     * @param state - New state
     */
    public updateSlideState(index: number, state: SlideState): void {
        if (index < 0 || index >= this.totalSlides) {
            this.log(`Invalid index for updateSlideState: ${index}`, 'error');
            return;
        }

        this.slides[index].state = state;
        this.log(`Updated slide ${index} state to ${state}`);
    }

    /**
     * Get information about a slide
     *
     * @param index - Slide index
     * @returns Slide information or null if index is invalid
     */
    public getSlideInfo(index: number): SlideInfo | null {
        if (index < 0 || index >= this.totalSlides) {
            this.log(`Invalid index for getSlideInfo: ${index}`, 'error');
            return null;
        }

        return this.slides[index];
    }

    /**
     * Get the current active index
     *
     * @returns Active slide index
     */
    public getActiveIndex(): number {
        return this.activeIndex;
    }

    /**
     * Get all slide information
     *
     * @returns Array of slide information
     */
    public getAllSlides(): SlideInfo[] {
        return [...this.slides];
    }

    /**
     * Get slides that need to be initialized (converted from UNINITIALIZED to at least PLACEHOLDER)
     *
     * @returns Array of slide indices that need initialization
     */
    public getSlidesToInitialize(): number[] {
        const windowIndices = this.getExtendedWindowIndices();

        return windowIndices.filter(index =>
            this.slides[index].state === SlideState.UNINITIALIZED
        );
    }

    /**
     * Get slides that need to be fully loaded (converted from PLACEHOLDER to LOADED)
     *
     * @returns Array of slide indices that need to be fully loaded
     */
    public getSlidesToLoad(): number[] {
        const windowIndices = this.getWindowIndices();

        return windowIndices.filter(index =>
            this.slides[index].state === SlideState.PLACEHOLDER
        );
    }

    /**
     * Get slides that can be unloaded (converted from LOADED to PLACEHOLDER)
     *
     * @returns Array of slide indices that can be unloaded
     */
    public getSlidesToUnload(): number[] {
        return this.slides
            .filter(slide =>
                !slide.inWindow &&
                (slide.state === SlideState.LOADED || slide.state === SlideState.ACTIVE)
            )
            .map(slide => slide.index);
    }

    /**
     * Set the window size
     *
     * @param size - New window size
     */
    public setWindowSize(size: number): void {
        if (size < 1) {
            this.log(`Invalid window size: ${size}, must be at least 1`, 'error');
            return;
        }

        this.windowSize = size;

        // Recalculate which slides are in the window
        this.slides.forEach(slide => {
            slide.inWindow = this.isInWindow(slide.index, this.activeIndex);
        });

        this.log(`Window size updated to ±${size}`);
    }

    /**
     * Get the current window size
     *
     * @returns Current window size
     */
    public getWindowSize(): number {
        return this.windowSize;
    }

    /**
     * Get the last navigation direction
     *
     * @returns Last direction (-1 for prev, 1 for next, 0 for initial)
     */
    public getLastDirection(): number {
        return this.lastDirection;
    }

    /**
     * Alias for updateActiveIndex to maintain naming consistency
     *
     * @param newIndex - New current slide index
     * @returns Object containing arrays of indices that entered and left the window
     */
    public updateCurrentIndex(newIndex: number): {
        entered: number[],
        left: number[]
    } {
        return this.updateActiveIndex(newIndex);
    }
}