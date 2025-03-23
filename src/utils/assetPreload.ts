/**
 * Helper function to preload all required KineticSlider assets
 */

import { Assets } from 'pixi.js';
import { setupCustomFonts } from './fontUtils';

/**
 * Helper function to preload all KineticSlider assets
 *
 * @param images - Array of image URLs to load
 * @param backgroundDisplacement - URL of background displacement image
 * @param cursorDisplacement - URL of cursor displacement image
 * @param titleFontFamily - Font family for titles
 * @param subtitleFontFamily - Font family for subtitles
 * @returns Promise that resolves when all assets are loaded
 */
export const preloadKineticSliderAssets = async (
    images: string[],
    backgroundDisplacement: string = '/images/background-displace.jpg',
    cursorDisplacement: string = '/images/cursor-displace.png',
    titleFontFamily?: string,
    subtitleFontFamily?: string
): Promise<void> => {
    try {
        console.log('Preloading KineticSlider assets...');

        // First, handle custom fonts if provided
        if (titleFontFamily || subtitleFontFamily) {
            console.log('Setting up custom fonts...');
            await setupCustomFonts(titleFontFamily, subtitleFontFamily);
        }

        // Combine all image assets into a single array
        const assetsToLoad = [
            ...images,
            backgroundDisplacement,
            cursorDisplacement
        ].filter(Boolean); // Remove any empty strings

        // Create a map of assets to load
        const assetsMap: Record<string, string> = {};
        for (const src of assetsToLoad) {
            assetsMap[src] = src;
        }

        // Check if assets are already in cache
        const uncachedAssets: Record<string, string> = {};

        // Check each asset if it's in cache
        for (const key in assetsMap) {
            if (Object.prototype.hasOwnProperty.call(assetsMap, key)) {
                const src = assetsMap[key];
                if (!Assets.cache.has(src)) {
                    uncachedAssets[key] = src;
                }
            }
        }

        // Only load assets not already in cache
        if (Object.keys(uncachedAssets).length > 0) {
            console.log(`Loading ${Object.keys(uncachedAssets).length} uncached assets...`);
            // Add assets to loader
            Assets.addBundle('kinetic-slider', uncachedAssets);

            // Load the bundle
            await Assets.loadBundle('kinetic-slider');

            console.log('All assets loaded successfully');
        } else {
            console.log('All assets already cached');
        }
    } catch (error) {
        console.error('Error preloading assets:', error);
        throw error;
    }
};