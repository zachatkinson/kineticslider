// eslint.config.js
import eslint from '@eslint/js';
import * as tseslintPlugin from '@typescript-eslint/eslint-plugin';
import tseslintParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';

// Base JS config
const baseConfig = {
  files: ['**/*.{js,jsx,ts,tsx}'],
  ignores: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.git/**',
    '**/.github/**',
    '**/.cursor/**',
    'babel.config.js',
    'postcss.config.js',
    'commitlint.config.js',
    'jest.config.js',
    'vite.config.ts',
    'vitest.config.ts',
    'tailwind.config.js',
    'test.js',
  ],
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    globals: {
      ...globals.browser,
      ...globals.node,
    },
  },
  rules: {
    'no-undef': 'error',
  },
};

// TypeScript config
const tsConfig = {
  files: ['**/*.{ts,tsx}'],
  plugins: {
    '@typescript-eslint': tseslintPlugin,
  },
  languageOptions: {
    parser: tseslintParser,
    parserOptions: {
      project: './tsconfig.json',
    },
    globals: {
      ...globals.browser,
      ...globals.node,
    },
  },
  rules: {
    ...tseslintPlugin.configs.recommended.rules,
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-undef': 'off', // TypeScript already checks this
  },
};

// React config
const reactConfig = {
  files: ['**/*.{jsx,tsx}'],
  plugins: {
    react: reactPlugin,
    'react-hooks': reactHooksPlugin,
    'jsx-a11y': jsxA11yPlugin,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react-hooks/rules-of-hooks': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    'jsx-a11y/alt-text': 'warn',
    'jsx-a11y/aria-props': 'warn',
    'jsx-a11y/aria-role': 'warn',
  },
};

// Browser environment config
const browserConfig = {
  files: ['src/**/*.{js,jsx,ts,tsx}'],
  languageOptions: {
    globals: {
      ...globals.browser,
    },
  },
  rules: {
    'no-undef': 'off', // Disable for browser files
  },
};

// Test file config
const testConfig = {
  files: ['src/__tests__/**/*.{js,jsx,ts,tsx}'],
  languageOptions: {
    globals: {
      ...globals.browser,
      ...globals.node,
      ...globals.jest,
      vi: 'readonly',
      describe: 'readonly',
      it: 'readonly',
      expect: 'readonly',
      beforeEach: 'readonly',
      afterEach: 'readonly',
      beforeAll: 'readonly',
      afterAll: 'readonly',
      test: 'readonly',
      jest: 'readonly',
      document: 'readonly',
      window: 'readonly',
      global: 'readonly',
      setTimeout: 'readonly',
      clearTimeout: 'readonly',
    },
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unsafe-function-type': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    'no-redeclare': 'off',
    'jsx-a11y/no-noninteractive-tabindex': 'off',
    'no-undef': 'off', // Disable for test files
  },
};

// Config for specific file patterns
const specialConfig = {
  files: ['eslint.config.js'],
  rules: {
    'no-undef': 'off',
    '@typescript-eslint/no-var-requires': 'off',
  },
};

export default [
  eslint.configs.recommended,
  prettier,
  baseConfig,
  tsConfig,
  reactConfig,
  browserConfig,
  testConfig,
  specialConfig,
];
