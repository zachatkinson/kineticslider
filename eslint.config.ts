import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import security from 'eslint-plugin-security';
import tseslint from 'typescript-eslint';

const config = tseslint.config(
  {
    ignores: [
      'dist',
      '.storybook',
      'storybook-static',
      'src/filters/**/*', // Ignore old filter files
      'src/test.ts', // Ignore old test file
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: (() => {
        // Workaround for globals@16.3.0 bug with AudioWorkletGlobalScope trailing space
        // See: https://github.com/sindresorhus/globals/issues/239
        const GLOBALS_BROWSER_FIX = Object.assign({}, globals.browser);
        
        // Fix the AudioWorkletGlobalScope trailing space issue
        if ('AudioWorkletGlobalScope ' in GLOBALS_BROWSER_FIX) {
          GLOBALS_BROWSER_FIX.AudioWorkletGlobalScope = GLOBALS_BROWSER_FIX['AudioWorkletGlobalScope '];
          delete GLOBALS_BROWSER_FIX['AudioWorkletGlobalScope '];
        }
        
        return GLOBALS_BROWSER_FIX;
      })(),
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      security: security,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...security.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': 'warn',
      // Security rules
      'security/detect-object-injection': 'error',
      'security/detect-non-literal-regexp': 'error',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'error',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-fs-filename': 'error',
      'security/detect-non-literal-require': 'error',
      'security/detect-possible-timing-attacks': 'error',
      'security/detect-pseudoRandomBytes': 'error',
    },
  },
  // Test files configuration
  {
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.{test,spec}.{ts,tsx}'],
    rules: {
      'no-console': 'off', // Allow console in test files
      '@typescript-eslint/explicit-function-return-type': 'off',
      'security/detect-object-injection': 'off', // Disable for test files - legitimate testing utilities
    },
  }
);

export default config;
