import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tseslintParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
  eslint.configs.recommended,
  prettierConfig,
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'rollup.config.js',
    ],
  },
  // Base configuration for all JavaScript/TypeScript files
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        },
        project: ['./tsconfig.json', './tsconfig.test.json'],
        tsconfigRootDir: '.'
      },
      globals: {
        ...globals.browser,
        ...globals.es2022,
        ...globals.node,
        ...globals.jest,
        React: 'readonly',
        JSX: 'readonly',
        jest: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
      'prettier': prettierPlugin
    },
    rules: {
      // Prettier rules
      'prettier/prettier': ['error', {
        endOfLine: 'auto',
        singleQuote: true,
        trailingComma: 'es5',
        printWidth: 100,
        tabWidth: 2,
        semi: true,
      }],

      // TypeScript rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'error',

      // React rules
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/display-name': 'off',

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // General rules
      'no-undef': 'error',
      'no-unused-vars': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-case-declarations': 'error',
      'no-async-promise-executor': 'error',
      'no-self-assign': 'error',
      'no-dupe-class-members': 'error',
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  // Keep specific relaxed rules for test files only
  {
    files: ['**/__tests__/**/*.{js,jsx,ts,tsx}', '**/__mocks__/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.jest
      }
    }
  }
];
