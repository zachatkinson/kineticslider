/**
 * Font utilities for KineticSlider
 */
import { Assets } from 'pixi.js';

// Common system fonts that don't need to be loaded
const SYSTEM_FONTS = [
    // Sans-serif fonts
    'Arial', 'Helvetica', 'Helvetica Neue', 'Verdana', 'Tahoma', 'Trebuchet MS',
    'Segoe UI', 'Roboto', 'Open Sans', 'Liberation Sans', 'Noto Sans', 'Ubuntu',
    // Serif fonts
    'Times', 'Times New Roman', 'Georgia', 'Palatino', 'Garamond', 'Bookman',
    'Cambria', 'Constantia', 'Liberation Serif', 'Noto Serif',
    // Monospace fonts
    'Courier', 'Courier New', 'Monaco', 'Consolas', 'Liberation Mono', 'Menlo',
    // Generic families
    'sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'system-ui'
];

// Font file extensions to check
const FONT_EXTENSIONS = ['.woff2', '.woff', '.ttf', '.otf'];

/**
 * Extract font names from a CSS font-family string
 *
 * @param fontStack - CSS font-family value
 * @returns Array of individual font names
 */
export function parseFontStack(fontStack: string): string[] {
    if (!fontStack) return [];

    // Split by commas and clean up each font name
    return fontStack
        .split(',')
        .map(font => {
            // Remove quotes and trim whitespace
            return font
                .replace(/^["'\s]+|["'\s]+$/g, '') // Remove quotes and spaces at the start/end
                .trim();
        })
        .filter(Boolean); // Remove any empty entries
}

/**
 * Identify which fonts in a font stack are likely custom fonts
 *
 * @param parsedFonts - Array of font names
 * @returns Array of potential custom fonts
 */
export function identifyCustomFonts(parsedFonts: string[]): string[] {
    return parsedFonts.filter(font =>
        // Not in our system fonts list and not a generic family
        !SYSTEM_FONTS.some(systemFont =>
            systemFont.toLowerCase() === font.toLowerCase()
        )
    );
}

/**
 * Check if a font file exists in the fonts directory
 * This is a simplified implementation for client-side
 *
 * @param fontName - Name of the font to check
 * @param extensions - File extensions to try
 * @returns Path to the font file if found, null otherwise
 */
export async function findFontFile(fontName: string, extensions = FONT_EXTENSIONS): Promise<string | null> {
    // List of paths to try - check both case-sensitive and lowercase versions
    const fontPaths = [];
    for (const ext of extensions) {
        // Original case
        fontPaths.push(`/fonts/${fontName}${ext}`);
        // Lowercase version
        fontPaths.push(`/fonts/${fontName.toLowerCase()}${ext}`);
    }

    const additionalPaths = [];
    for (const ext of extensions) {
        // Original case
        additionalPaths.push(`/public/fonts/${fontName}${ext}`);
        // Lowercase version
        additionalPaths.push(`/public/fonts/${fontName.toLowerCase()}${ext}`);
    }

    // Combine paths
    const allPaths = [...fontPaths, ...additionalPaths];

    // Try each path
    for (const path of allPaths) {
        try {
            // Try to fetch the font file to check if it exists
            const response = await fetch(path, { method: 'HEAD' });
            if (response.ok) {
                console.log(`Found font file at: ${path}`);
                return path;
            }
        } catch (error) {
            // Ignore fetch errors and try the next path
        }
    }

    console.warn(`No font file found for: ${fontName}`);
    return null;
}

/**
 * Load custom fonts for use with Pixi.js
 *
 * @param fontStack - CSS font-family value
 * @returns Promise resolving to an array of successfully loaded font paths
 */
export async function loadCustomFonts(fontStack: string): Promise<string[]> {
    if (!fontStack) return [];

    // Parse font stack and identify custom fonts
    const parsedFonts = parseFontStack(fontStack);
    const customFonts = identifyCustomFonts(parsedFonts);

    if (!customFonts.length) {
        console.log('No custom fonts identified in font stack:', fontStack);
        return [];
    }

    console.log('Identified custom fonts:', customFonts);

    // Try to load each custom font
    const loadedFonts: string[] = [];

    for (const fontName of customFonts) {
        try {
            // Remove any quotes from the font name
            const cleanFontName = fontName.replace(/['"]/g, '');
            const fontPath = await findFontFile(cleanFontName);

            if (fontPath) {
                // Add font to Assets and load it
                console.log(`Loading font: ${cleanFontName} from ${fontPath}`);

                try {
                    // Register and load the font with PIXI Assets
                    await Assets.load({
                        src: fontPath,
                        data: {
                            // Add font-specific metadata if needed
                            family: cleanFontName
                        }
                    });

                    loadedFonts.push(fontPath);
                    console.log(`Successfully loaded font: ${cleanFontName}`);
                } catch (loadError) {
                    console.warn(`Failed to load font ${cleanFontName}:`, loadError);
                }
            }
        } catch (error) {
            console.warn(`Error processing font ${fontName}:`, error);
        }
    }

    return loadedFonts;
}

/**
 * Create @font-face CSS rules for custom fonts
 * This is needed for proper text rendering in Pixi.js
 *
 * @param fontPaths - Array of paths to font files
 * @returns CSS string with @font-face rules
 */
export function createFontFaceCSS(fontPaths: string[]): string {
    return fontPaths.map(path => {
        // Extract font name from path
        const fontName = path.split('/').pop()?.split('.')[0] || '';
        const fontFormat = path.split('.').pop();

        let format;
        switch(fontFormat) {
            case 'woff2': format = 'woff2'; break;
            case 'woff': format = 'woff'; break;
            case 'ttf': format = 'truetype'; break;
            case 'otf': format = 'opentype'; break;
            default: format = 'truetype';
        }

        return `
      @font-face {
        font-family: '${fontName}';
        src: url('${path}') format('${format}');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
    `;
    }).join('\n');
}

/**
 * Add @font-face rules to the document head
 *
 * @param css - CSS string with @font-face rules
 */
export function injectFontFaceCSS(css: string): void {
    if (typeof document === 'undefined' || !css) return;

    // Create a style element
    const style = document.createElement('style');
    style.textContent = css;
    style.setAttribute('data-kinetic-slider-fonts', 'true');

    // Add it to the head
    document.head.appendChild(style);
}

/**
 * Main function to handle custom font loading for KineticSlider
 *
 * @param titleFontStack - Title font-family value
 * @param subtitleFontStack - Subtitle font-family value
 * @returns Promise resolving when fonts are loaded
 */
export async function setupCustomFonts(
    titleFontStack?: string,
    subtitleFontStack?: string
): Promise<void> {
    // Skip during server-side rendering
    if (typeof window === 'undefined') return;

    console.log('Setting up custom fonts:', { titleFontStack, subtitleFontStack });

    // Track loaded fonts to avoid duplicates
    const loadedFontPaths: string[] = [];

    // Process title fonts
    if (titleFontStack) {
        const titleFontPaths = await loadCustomFonts(titleFontStack);
        loadedFontPaths.push(...titleFontPaths);
    }

    // Process subtitle fonts
    if (subtitleFontStack) {
        const subtitleFontPaths = await loadCustomFonts(subtitleFontStack);
        // Filter out duplicates
        const newPaths = subtitleFontPaths.filter(path => !loadedFontPaths.includes(path));
        loadedFontPaths.push(...newPaths);
    }

    // Create and inject CSS if fonts were found
    if (loadedFontPaths.length > 0) {
        const fontFaceCSS = createFontFaceCSS(loadedFontPaths);
        injectFontFaceCSS(fontFaceCSS);
        console.log('Injected font-face CSS for:', loadedFontPaths);

        // Allow some time for the fonts to load
        return new Promise((resolve) => {
            // Use a timeout to ensure fonts have time to load
            setTimeout(resolve, 100);
        });
    }

    return Promise.resolve();
}