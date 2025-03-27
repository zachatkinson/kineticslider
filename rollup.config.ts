import { defineConfig } from 'rollup';
import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import visualizer from 'rollup-plugin-visualizer';
import { readFileSync } from 'fs';
import { resolve as resolvePath } from 'path';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig({
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
      exports: 'named',
    },
    {
      file: pkg.unpkg,
      format: 'umd',
      name: 'KineticSlider',
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        gsap: 'gsap',
        'pixi.js': 'PIXI',
      },
      sourcemap: true,
    },
  ],
  external: [
    'react',
    'react-dom',
    'gsap',
    'pixi.js',
    ...Object.keys(pkg.peerDependencies || {}),
    ...Object.keys(pkg.dependencies || {}),
  ],
  plugins: [
    resolve({
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      preferBuiltins: true,
    }),
    commonjs({
      include: /node_modules/,
      extensions: ['.js', '.ts', '.tsx'],
    }),
    typescript({
      tsconfig: resolvePath(__dirname, 'tsconfig.json'),
      clean: true,
      useTsconfigDeclarationDir: true,
    }),
    babel({
      extensions: ['.ts', '.tsx'],
      exclude: 'node_modules/**',
      babelHelpers: 'bundled',
      presets: [
        '@babel/preset-env',
        '@babel/preset-react',
        '@babel/preset-typescript',
      ],
    }),
    terser({
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
      output: {
        comments: false,
      },
    }),
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
}); 