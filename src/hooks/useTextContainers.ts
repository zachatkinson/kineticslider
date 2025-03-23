import { useEffect, type RefObject } from 'react';
import { Application, Container, Text, TextStyle, Sprite } from 'pixi.js';
import { gsap } from 'gsap';
import { type TextPair } from '../types';
import { setupCustomFonts } from '../utils/fontUtils';
import ResourceManager from '../managers/ResourceManager';

// Development environment check
const isDevelopment = import.meta.env?.MODE === 'development';

// Comprehensive logging utility
const log = {
    info: (message: string, ...args: any[]) => {
        if (isDevelopment) {
            console.log(`[useTextContainers:INFO] ${message}`, ...args);
        }
    },
    warn: (message: string, ...args: any[]) => {
        if (isDevelopment) {
            console.warn(`[useTextContainers:WARN] ${message}`, ...args);
        }
    },
    error: (message: string, error?: unknown) => {
        if (isDevelopment) {
            console.error(`[useTextContainers:ERROR] ${message}`, error);
        }
    }
};

// Cancellation and lifecycle management interface
interface CancellationFlags {
    isCancelled: boolean;
}

// Enhanced prop interface with comprehensive typing
interface UseTextContainersProps {
    sliderRef: RefObject<HTMLDivElement | null>;
    appRef: RefObject<Application | null>;
    slidesRef: RefObject<Sprite[]>;
    textContainersRef: RefObject<Container[]>;
    currentIndex: RefObject<number>;
    buttonMode: boolean;
    texts: TextPair[];

    // Title styling
    textTitleColor: string;
    textTitleSize: number;
    mobileTextTitleSize: number;
    textTitleLetterspacing: number;
    textTitleFontFamily?: string;

    // Subtitle styling
    textSubTitleColor: string;
    textSubTitleSize: number;
    mobileTextSubTitleSize: number;
    textSubTitleLetterspacing: number;
    textSubTitleOffsetTop: number;
    mobileTextSubTitleOffsetTop: number;
    textSubTitleFontFamily?: string;

    resourceManager?: ResourceManager | null;
}

// Default font fallbacks with more comprehensive options
const DEFAULT_FONTS = {
    title: 'Georgia, Times, "Times New Roman", serif',
    subtitle: 'Helvetica, Arial, sans-serif'
};

/**
 * Prepare font family string with comprehensive fallback handling
 */
function prepareFontFamily(
    fontStack?: string,
    defaultStack = DEFAULT_FONTS.title
): string {
    try {
        // If no font stack provided, return default
        if (!fontStack) {
            log.info(`No font stack provided, using default: ${defaultStack}`);
            return defaultStack;
        }

        // Trim and clean font stack
        const cleanedStack = fontStack
            .split(',')
            .map(font => font.trim().replace(/['"]/g, ''))
            .filter(Boolean)
            .join(', ');

        log.info(`Processed font stack: ${cleanedStack}`);
        return cleanedStack || defaultStack;
    } catch (error) {
        log.error('Error processing font family', error);
        return defaultStack;
    }
}

/**
 * Advanced text containers hook with comprehensive optimization
 */
const useTextContainers = ({
                               sliderRef,
                               appRef,
                               slidesRef,
                               textContainersRef,
                               currentIndex,
                               buttonMode,
                               texts,

                               // Title props
                               textTitleColor,
                               textTitleSize,
                               mobileTextTitleSize,
                               textTitleLetterspacing,
                               textTitleFontFamily,

                               // Subtitle props
                               textSubTitleColor,
                               textSubTitleSize,
                               mobileTextSubTitleSize,
                               textSubTitleLetterspacing,
                               textSubTitleOffsetTop,
                               mobileTextSubTitleOffsetTop,
                               textSubTitleFontFamily,

                               resourceManager
                           }: UseTextContainersProps) => {
    // Cancellation mechanism
    const cancellationRef = { current: { isCancelled: false } };

    // Text containers creation effect
    useEffect(() => {
        // Server-side rendering guard
        if (typeof window === 'undefined') return;

        // Reset cancellation flag
        cancellationRef.current.isCancelled = false;

        // Validate essential references
        if (!appRef.current || !slidesRef.current.length || !texts.length) {
            log.warn('Initialization aborted due to missing references');
            return;
        }

        // Async font setup
        const setupFontsAndCreateContainers = async () => {
            try {
                // Preload fonts if custom fonts are specified
                if (textTitleFontFamily || textSubTitleFontFamily) {
                    log.info('Setting up custom fonts', {
                        titleFont: textTitleFontFamily,
                        subtitleFont: textSubTitleFontFamily
                    });
                    await setupCustomFonts(textTitleFontFamily, textSubTitleFontFamily);
                }

                // Check for cancellation after font setup
                if (cancellationRef.current.isCancelled) return;

                const app = appRef.current!;
                const stage = app.stage.children[0] as Container;

                // Clear existing text containers
                textContainersRef.current.forEach(container => {
                    try {
                        if (container.parent) {
                            container.parent.removeChild(container);
                        }
                    } catch (removeError) {
                        log.error('Error removing existing text container', removeError);
                    }
                });
                textContainersRef.current = [];

                // Compute responsive text sizes
                const isMobile = window.innerWidth < 768;
                const computedTitleSize = isMobile ? mobileTextTitleSize : textTitleSize;
                const computedSubTitleSize = isMobile ? mobileTextSubTitleSize : textSubTitleSize;
                const computedSubTitleOffset = isMobile ? mobileTextSubTitleOffsetTop : textSubTitleOffsetTop;

                // Prepare font families
                const titleFontFamily = prepareFontFamily(textTitleFontFamily);
                const subtitleFontFamily = prepareFontFamily(textSubTitleFontFamily, DEFAULT_FONTS.subtitle);

                log.info('Creating text containers', {
                    titleFont: titleFontFamily,
                    subtitleFont: subtitleFontFamily
                });

                // Create text containers
                texts.forEach((textPair, index) => {
                    const [title, subtitle] = textPair;

                    // Create container
                    const textContainer = new Container();
                    textContainer.x = app.screen.width / 2;
                    textContainer.y = app.screen.height / 2;

                    // Track container with ResourceManager
                    if (resourceManager) {
                        resourceManager.trackDisplayObject(textContainer);
                    }

                    // Create title text
                    const titleStyle = new TextStyle({
                        fill: textTitleColor,
                        fontSize: computedTitleSize,
                        letterSpacing: textTitleLetterspacing,
                        fontWeight: 'bold',
                        align: 'center',
                        fontFamily: titleFontFamily
                    });
                    const titleText = new Text({ text: title, style: titleStyle });
                    titleText.anchor.set(0.5, 0);
                    titleText.y = 0;

                    // Track title with ResourceManager
                    if (resourceManager) {
                        resourceManager.trackDisplayObject(titleText);
                    }

                    // Create subtitle text
                    const subtitleStyle = new TextStyle({
                        fill: textSubTitleColor,
                        fontSize: computedSubTitleSize,
                        letterSpacing: textSubTitleLetterspacing,
                        align: 'center',
                        fontFamily: subtitleFontFamily
                    });
                    const subText = new Text({ text: subtitle, style: subtitleStyle });
                    subText.anchor.set(0.5, 0);
                    subText.y = titleText.height + computedSubTitleOffset;

                    // Track subtitle with ResourceManager
                    if (resourceManager) {
                        resourceManager.trackDisplayObject(subText);
                    }

                    // Add texts to container
                    textContainer.addChild(titleText, subText);
                    textContainer.pivot.y = textContainer.height / 2;

                    // Set initial visibility
                    textContainer.alpha = index === 0 ? 1 : 0;
                    textContainer.visible = index === 0;

                    // Button mode configuration
                    if (buttonMode) {
                        textContainer.eventMode = 'static';
                        textContainer.cursor = 'pointer';

                        // Hover effects with GSAP
                        textContainer.on('pointerover', () => {
                            gsap.to(titleText.scale, {
                                x: 1.1,
                                y: 1.1,
                                duration: 0.2,
                                onComplete: () => {
                                    if (resourceManager) {
                                        resourceManager.trackDisplayObject(titleText);
                                    }
                                }
                            });
                        });

                        textContainer.on('pointerout', () => {
                            gsap.to(titleText.scale, {
                                x: 1,
                                y: 1,
                                duration: 0.2,
                                onComplete: () => {
                                    if (resourceManager) {
                                        resourceManager.trackDisplayObject(titleText);
                                    }
                                }
                            });
                        });

                        // Slide change on click
                        textContainer.on('pointerdown', () => {
                            const nextIndex = (currentIndex.current + 1) % slidesRef.current.length;
                            window.dispatchEvent(new CustomEvent('slideChange', {
                                detail: { nextIndex }
                            }));
                        });
                    }

                    // Add to stage and store reference
                    stage.addChild(textContainer);
                    textContainersRef.current.push(textContainer);
                });

                log.info(`Created ${texts.length} text containers`);
            } catch (error) {
                log.error('Error in text containers setup', error);
            }
        };

        // Execute font and container setup
        setupFontsAndCreateContainers();

        // Resize handling effect
        const handleResize = () => {
            try {
                // Skip if cancelled or references missing
                if (cancellationRef.current.isCancelled ||
                    !appRef.current ||
                    !sliderRef.current ||
                    !textContainersRef.current.length) return;

                const containerWidth = sliderRef.current.clientWidth || 0;
                const containerHeight = sliderRef.current.clientHeight || 0;
                const isMobile = window.innerWidth < 768;

                // Compute responsive sizes
                const computedTitleSize = isMobile ? mobileTextTitleSize : textTitleSize;
                const computedSubTitleSize = isMobile ? mobileTextSubTitleSize : textSubTitleSize;
                const computedSubTitleOffset = isMobile ? mobileTextSubTitleOffsetTop : textSubTitleOffsetTop;

                // Prepare font families
                const titleFontFamily = prepareFontFamily(textTitleFontFamily);
                const subtitleFontFamily = prepareFontFamily(textSubTitleFontFamily, DEFAULT_FONTS.subtitle);

                // Update each text container
                textContainersRef.current.forEach(container => {
                    // Reposition container
                    container.x = containerWidth / 2;
                    container.y = containerHeight / 2;

                    // Update title text
                    const titleText = container.children[0] as Text;
                    titleText.style.fontSize = computedTitleSize;
                    titleText.style.fontFamily = titleFontFamily;
                    // Force text update
                    titleText.text = titleText.text;

                    // Update subtitle text
                    const subText = container.children[1] as Text;
                    subText.style.fontSize = computedSubTitleSize;
                    subText.style.fontFamily = subtitleFontFamily;
                    // Reposition subtitle
                    subText.y = titleText.height + computedSubTitleOffset;
                    // Force text update
                    subText.text = subText.text;

                    // Update container pivot
                    container.pivot.y = container.height / 2;

                    // Track updates with ResourceManager
                    if (resourceManager) {
                        resourceManager.trackDisplayObject(container);
                        resourceManager.trackDisplayObject(titleText);
                        resourceManager.trackDisplayObject(subText);
                    }
                });

                log.info('Text containers resized');
            } catch (error) {
                log.error('Error during text containers resize', error);
            }
        };

        // Add resize listener
        window.addEventListener('resize', handleResize);

        // Initial resize
        handleResize();

        // Cleanup function
        return () => {
            // Set cancellation flag
            cancellationRef.current.isCancelled = true;

            // Remove resize listener
            window.removeEventListener('resize', handleResize);
        };
    }, [
        // Dependency array with all props for comprehensive updates
        appRef.current,
        texts,
        textTitleColor,
        textTitleSize,
        mobileTextTitleSize,
        textTitleLetterspacing,
        textTitleFontFamily,
        textSubTitleColor,
        textSubTitleSize,
        mobileTextSubTitleSize,
        textSubTitleLetterspacing,
        textSubTitleOffsetTop,
        mobileTextSubTitleOffsetTop,
        textSubTitleFontFamily,
        buttonMode,
        resourceManager
    ]);

    // No return value needed as this is a side-effect hook
};

export default useTextContainers;