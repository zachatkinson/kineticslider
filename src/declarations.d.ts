/**
 * Declaration file for module imports
 */

// CSS Modules
declare module '*.module.css' {
    const classes: { [key: string]: string };
    export default classes;
}

// Support direct import with .ts extension
declare module './index.ts' {
    export * from './index';
    export { default } from './index';
}

// Allow import.meta.env in TypeScript files (for Vite/Astro compatibility)
interface ImportMeta {
    readonly env: {
        [key: string]: string | boolean | undefined;
        MODE?: string;
        DEV?: boolean;
        PROD?: boolean;
        NODE_ENV?: string;
    };
}