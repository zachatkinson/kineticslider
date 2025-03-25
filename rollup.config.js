import { createRequire } from 'module';
import { readFileSync } from 'fs';

const require = createRequire(import.meta.url);
const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const typescript = require('@rollup/plugin-typescript');
const peerDepsExternal = require('rollup-plugin-peer-deps-external');
const terser = require('@rollup/plugin-terser');
const replace = require('@rollup/plugin-replace');
const dts = require('rollup-plugin-dts');
const postcss = require('rollup-plugin-postcss');

// Read package.json as ES module
const pkg = JSON.parse(readFileSync('./package.json'));

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

// Create a custom plugin for style-inject
const virtualStyleInject = {
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
};

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
      },
      {
        file: pkg.module,
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      peerDepsExternal(),
      resolve({
        extensions: ['.ts', '.tsx', '.js', '.jsx']
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        sourceMap: true,
        inlineSources: true
      }),
      postcss({
        extensions: ['.css'],
        modules: true,
        use: ['sass'],
      }),
      terser(),
    ],
    external,
  },
  {
    input: 'dist/types/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [dts()],
  },
  // Type declarations (separate build just for .d.ts files)
  {
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
          moduleResolution: "bundler",
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
  }
];
