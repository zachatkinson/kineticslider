/**
 * Helper to handle dynamic imports for the KineticSlider
 */
import type { gsap as GSAPType } from 'gsap';
import type * as PixiJS from 'pixi.js';
import type * as PixiFilters from 'pixi-filters';

// Cache for imported modules
const importCache = new Map<string, any>();

/**
 * Load GSAP and related plugins
 */
export const loadGSAP = async (): Promise<typeof GSAPType> => {
    if (importCache.has('gsap')) {
        console.log('Using cached GSAP module');
        return importCache.get('gsap');
    }

    try {
        console.log('Loading GSAP module...');
        const gsapModule = await import('gsap');

        // Store in cache
        importCache.set('gsap', gsapModule.gsap);
        console.log('GSAP module loaded successfully');

        return gsapModule.gsap;
    } catch (error) {
        console.error('Failed to load GSAP:', error);
        throw error;
    }
};

/**
 * Load GSAP PixiPlugin
 */
export const loadPixiPlugin = async (): Promise<any> => {
    if (importCache.has('pixiPlugin')) {
        console.log('Using cached GSAP PixiPlugin');
        return importCache.get('pixiPlugin');
    }

    try {
        console.log('Loading GSAP PixiPlugin...');

        // Check if we're in a browser environment
        if (typeof window !== 'undefined') {
            const { default: PixiPlugin } = await import('gsap/PixiPlugin');

            // Store in cache
            importCache.set('pixiPlugin', PixiPlugin);
            console.log('GSAP PixiPlugin loaded successfully');

            return PixiPlugin;
        } else {
            // When running in Node.js during build, return a mock
            console.log('Running in Node.js environment, using mock PixiPlugin');
            const mockPlugin = {
                name: 'PixiPlugin (Mock)',
                registerPIXI: () => console.log('Mock registerPIXI called')
            };
            importCache.set('pixiPlugin', mockPlugin);
            return mockPlugin;
        }
    } catch (error) {
        console.warn('Failed to load PixiPlugin for GSAP:', error);
        return null;
    }
};

/**
 * Load PixiJS
 */
export const loadPixi = async (): Promise<typeof PixiJS> => {
    if (importCache.has('pixi')) {
        console.log('Using cached PixiJS module');
        return importCache.get('pixi');
    }

    try {
        console.log('Loading PixiJS module...');
        const pixiModule = await import('pixi.js');

        // Store in cache
        importCache.set('pixi', pixiModule);
        console.log('PixiJS module loaded successfully');

        return pixiModule;
    } catch (error) {
        console.error('Failed to load PixiJS:', error);
        throw error;
    }
};

/**
 * Load Pixi Filters
 */
export const loadPixiFilters = async (): Promise<typeof PixiFilters> => {
    if (importCache.has('pixiFilters')) {
        console.log('Using cached Pixi Filters module');
        return importCache.get('pixiFilters');
    }

    try {
        console.log('Loading Pixi Filters module...');
        const filtersModule = await import('pixi-filters');

        // Store in cache
        importCache.set('pixiFilters', filtersModule);
        console.log('Pixi Filters module loaded successfully');

        return filtersModule;
    } catch (error) {
        console.error('Failed to load Pixi Filters:', error);
        throw error;
    }
};

/**
 * Register GSAP PixiPlugin with the required PIXI classes
 */
export const registerGSAPPixiPlugin = (gsap: typeof GSAPType, pixi: typeof PixiJS) => {
    try {
        const PixiPlugin = importCache.get('pixiPlugin');
        if (!PixiPlugin) {
            console.warn('PixiPlugin not available for registration');
            return false;
        }

        // Skip actual registration if it's a mock
        if (PixiPlugin.name === 'PixiPlugin (Mock)') {
            console.log('Using mock PixiPlugin, skipping actual registration');
            return true;
        }

        // Extract needed classes from pixi module
        const { Application, Sprite, Container, Text, DisplacementFilter } = pixi;

        // Register the plugin with PIXI classes
        gsap.registerPlugin(PixiPlugin);
        PixiPlugin.registerPIXI({
            Application,
            Sprite,
            Container,
            Text,
            DisplacementFilter
        });

        console.log('GSAP PixiPlugin registered successfully');
        return true;
    } catch (error) {
        console.error('Failed to register GSAP PixiPlugin:', error);
        return false;
    }
};

/**
 * Load all required libraries for the KineticSlider
 */
export const loadKineticSliderDependencies = async (): Promise<{
    gsap: typeof GSAPType;
    pixi: typeof PixiJS;
    pixiFilters: typeof PixiFilters;
    pixiPlugin: any;
}> => {
    try {
        console.log('Loading KineticSlider dependencies...');

        // Load core modules
        const gsap = await loadGSAP();
        const pixi = await loadPixi();
        const pixiPlugin = await loadPixiPlugin();
        const pixiFilters = await loadPixiFilters();

        // Register PixiPlugin if available
        if (pixiPlugin) {
            registerGSAPPixiPlugin(gsap, pixi);
        }

        console.log('All KineticSlider dependencies loaded successfully');

        return { gsap, pixi, pixiFilters, pixiPlugin };
    } catch (error) {
        console.error('Failed to load KineticSlider dependencies:', error);
        throw error;
    }
};

/**
 * Check if all necessary dependencies are loaded
 */
export const areDependenciesLoaded = () => {
    return (
        importCache.has('gsap') &&
        importCache.has('pixi') &&
        importCache.has('pixiFilters')
    );
};

/**
 * Load all hooks for the KineticSlider
 */
export const loadKineticSliderHooks = async (): Promise<any> => {
    if (importCache.has('hooks')) {
        console.log('Using cached KineticSlider hooks');
        return importCache.get('hooks');
    }

    try {
        console.log('Loading KineticSlider hooks...');
        const hooks = await import('./hooks');

        // Store in cache
        importCache.set('hooks', hooks);
        console.log('KineticSlider hooks loaded successfully');

        return hooks;
    } catch (error) {
        console.error('Failed to load KineticSlider hooks:', error);
        throw error;
    }
};