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
    // Fix GSAP plugin imports
    "import('gsap/PixiPlugin')": "import('gsap').then(m => ({ default: m.gsap.plugins.PixiPlugin }))",
};

// Copy of the style-inject code to avoid relying on node_modules path
const styleInjectCode = `
function styleInject(css, { insertAt } = {}) {
  if (!css || typeof document === 'undefined') return;

  const head = document.head || document.getElementsByTagName('head')[0];
  const style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

export default styleInject;
`;

// All external packages that should not be bundled
const external = [
    'react',
    'react-dom',
    'pixi.js',
    'pixi-filters',
    'gsap',
    'gsap/PixiPlugin',
];

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
            paths: {
                'gsap/PixiPlugin': 'gsap'
            }
        },
        plugins: [
            // Create a virtual module for style-inject
            {
                name: 'virtual-style-inject',
                resolveId(id) {
                    if (id === 'style-inject') {
                        return 'virtual:style-inject';
                    }
                    return null;
                },
                load(id) {
                    if (id === 'virtual:style-inject') {
                        return styleInjectCode;
                    }
                    return null;
                }
            },
            peerDepsExternal(),
            replace(replaceConfig),
            resolve({
                extensions: ['.ts', '.tsx', '.js', '.jsx'],
                mainFields: ['module', 'browser', 'main']
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
                // Use our virtual style-inject module
                inject: function (cssVariableName) {
                    return `import styleInject from 'style-inject';\nstyleInject(${cssVariableName}, { insertAt: 'top' });`;
                },
                use: ['sass'],
            }),
        ],
        external,
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
            entryFileNames: '[name].cjs',
            paths: {
                'gsap/PixiPlugin': 'gsap'
            }
        },
        plugins: [
            // Create a virtual module for style-inject
            {
                name: 'virtual-style-inject',
                resolveId(id) {
                    if (id === 'style-inject') {
                        return 'virtual:style-inject';
                    }
                    return null;
                },
                load(id) {
                    if (id === 'virtual:style-inject') {
                        return styleInjectCode;
                    }
                    return null;
                }
            },
            peerDepsExternal(),
            replace(replaceConfig),
            resolve({
                extensions: ['.ts', '.tsx', '.js', '.jsx'],
                mainFields: ['main', 'module']
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
                // Use our virtual style-inject module
                inject: function (cssVariableName) {
                    return `import styleInject from 'style-inject';\nstyleInject(${cssVariableName}, { insertAt: 'top' });`;
                },
                use: ['sass'],
            }),
        ],
        external,
    }),

    // Type declarations (separate build just for .d.ts files)
    defineConfig({
        input: 'src/index.ts',
        output: {
            dir: 'dist/types',
            format: 'esm',
            preserveModules: true,
            preserveModulesRoot: 'src',
            sourcemap: true,
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
                use: ['sass'],
            }),
        ],
        external,
    })
];