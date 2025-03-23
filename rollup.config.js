import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import esbuild from 'rollup-plugin-esbuild';
import { defineConfig } from 'rollup';
import { createRequire } from 'module';
import replace from '@rollup/plugin-replace';

const require = createRequire(import.meta.url);
const packageJson = require('./package.json');

// Common replace config for import.meta.env
const replaceConfig = {
    preventAssignment: true,
    'import.meta.env?.MODE': JSON.stringify('production'),
    'import.meta.env.MODE': JSON.stringify('production'),
    'import.meta.env.DEV': JSON.stringify(false),
    'import.meta.env.NODE_ENV': JSON.stringify('production'),
    'process.env.NODE_ENV': JSON.stringify('production'),
    // Fix for the import with .ts extension
    "import('./index.ts')": "import('./index')",
    // Fix for dynamic filter imports
    "import(/* @vite-ignore */ modulePath)": "import(modulePath)",
};

// Create a separate build for each format to handle TypeScript declarations properly
export default [
    // ESM build
    defineConfig({
        input: 'src/index.ts',
        output: {
            dir: 'dist/esm',
            format: 'esm',
            preserveModules: true,
            preserveModulesRoot: 'src',
            sourcemap: true,
            exports: 'named',
            entryFileNames: '[name].js',
        },
        plugins: [
            peerDepsExternal(),
            replace(replaceConfig),
            resolve({
                extensions: ['.ts', '.tsx', '.js', '.jsx']
            }),
            esbuild({
                include: /\.[jt]sx?$/,
                exclude: /node_modules/,
                sourceMap: true,
                minify: false,
                target: 'es2020',
                jsx: 'transform',
                tsconfig: './tsconfig.json',
            }),
            commonjs(),
            postcss({
                extensions: ['.css'],
                minimize: true,
                modules: true,
                extract: false,
                inject: true
            }),
        ],
        external: ['react', 'react-dom', 'pixi.js', 'pixi-filters', 'gsap'],
    }),

    // CJS build
    defineConfig({
        input: 'src/index.ts',
        output: {
            dir: 'dist/cjs',
            format: 'cjs',
            preserveModules: true,
            preserveModulesRoot: 'src',
            sourcemap: true,
            exports: 'named',
            entryFileNames: '[name].js',
        },
        plugins: [
            peerDepsExternal(),
            replace(replaceConfig),
            resolve({
                extensions: ['.ts', '.tsx', '.js', '.jsx']
            }),
            esbuild({
                include: /\.[jt]sx?$/,
                exclude: /node_modules/,
                sourceMap: true,
                minify: false,
                target: 'es2020',
                jsx: 'transform',
                tsconfig: './tsconfig.json',
            }),
            commonjs(),
            postcss({
                extensions: ['.css'],
                minimize: true,
                modules: true,
                extract: false,
                inject: true
            }),
        ],
        external: ['react', 'react-dom', 'pixi.js', 'pixi-filters', 'gsap'],
    }),

    // Type declarations (separate build just for .d.ts files)
    defineConfig({
        input: 'src/index.ts',
        output: {
            dir: 'dist/types',
            format: 'esm',
            preserveModules: true,
            preserveModulesRoot: 'src',
        },
        plugins: [
            peerDepsExternal(),
            typescript({
                tsconfig: './tsconfig.json',
                declaration: true,
                declarationDir: 'dist/types',
                outDir: 'dist/types',
                emitDeclarationOnly: true,
                rootDir: 'src',
                compilerOptions: {
                    moduleResolution: "node",
                    noEmitOnError: false,
                }
            }),
            resolve({
                extensions: ['.ts', '.tsx', '.js', '.jsx']
            }),
            replace(replaceConfig),
            commonjs(),
            postcss({
                extensions: ['.css'],
                modules: true,
                inject: false,
                extract: false,
            }),
        ],
        external: ['react', 'react-dom', 'pixi.js', 'pixi-filters', 'gsap'],
    })
];