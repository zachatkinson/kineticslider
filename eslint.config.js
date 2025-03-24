import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tseslintParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
    eslint.configs.recommended,
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
                // Using the combined config that includes test files
                project: ['./tsconfig.json', './tsconfig.test.json'],
                tsconfigRootDir: '.'
            },
            globals: {
                ...globals.browser,
                ...globals.es2022,
                ...globals.node,
                ...globals.jest,
                React: 'readonly', // Make React available globally
                JSX: 'readonly',
                jest: 'readonly'
            }
        },
        plugins: {
            '@typescript-eslint': tseslint,
            'react': reactPlugin,
            'react-hooks': reactHooksPlugin
        },
        rules: {
            // TypeScript rules
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-unused-vars': ['error', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_'
            }],
            '@typescript-eslint/no-unsafe-assignment': 'error',
            '@typescript-eslint/no-unsafe-member-access': 'error',
            '@typescript-eslint/no-unsafe-call': 'error',
            '@typescript-eslint/no-unsafe-return': 'error',
            '@typescript-eslint/explicit-module-boundary-types': 'error',
            '@typescript-eslint/no-non-null-assertion': 'error',

            // React rules
            'react/jsx-uses-react': 'off', // Not needed with the new JSX transform
            'react/jsx-uses-vars': 'error',
            'react/react-in-jsx-scope': 'off', // Not needed with the new JSX transform
            'react/prop-types': 'off',
            'react/display-name': 'off',

            // React Hooks rules
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'error',

            // General rules
            'no-undef': 'error',
            'no-unused-vars': 'off', // Use @typescript-eslint/no-unused-vars instead
            'no-console': ['error', { allow: ['warn', 'error'] }],
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