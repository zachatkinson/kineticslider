// eslint.config.ts
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import testingLibraryPlugin from 'eslint-plugin-testing-library';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// The flat config format returned by tseslint.config is a bit different from traditional ESLint
// so we're using a specific type annotation for portability
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config: any = tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', 'coverage/**', 'vite.config.ts', 'vitest.config.ts'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['vite.config.ts', 'vitest.config.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: ['./tsconfig.json', './tsconfig.node.json'],
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    settings: {
      react: {
        version: 'detect',
      },
      jsdoc: {
        mode: 'typescript',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
      'testing-library': testingLibraryPlugin,
      jsdoc: jsdocPlugin,
    },
    rules: {
      // Base ESLint rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // JSDoc rules
      'jsdoc/require-jsdoc': ['error', {
        publicOnly: true,
        require: {
          FunctionDeclaration: true,
          MethodDefinition: true,
          ClassDeclaration: true,
          ArrowFunctionExpression: false,
          FunctionExpression: false
        }
      }],
      'jsdoc/require-description': ['error', {
        contexts: ['TSInterfaceDeclaration', 'TSTypeAliasDeclaration', 'ClassDeclaration', 'ClassProperty']
      }],
      'jsdoc/require-param': ['error', {
        checkConstructors: false,
      }],
      'jsdoc/require-param-type': 'off',
      'jsdoc/require-returns': ['error', {
        checkGetters: true,
      }],
      'jsdoc/require-returns-type': 'off',
      'jsdoc/valid-types': 'error',
      'jsdoc/check-tag-names': 'error',
      'jsdoc/check-param-names': 'error',
      'jsdoc/require-example': ['warn', {
        contexts: ['TSInterfaceDeclaration', 'ClassDeclaration']
      }],

      // TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      // React rules
      'react/prop-types': 'off', // TypeScript handles props validation
      'react/react-in-jsx-scope': 'off', // Not needed with React 17+
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Accessibility rules
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',

      // Testing rules
      'testing-library/no-unnecessary-act': 'error',
    },
  },
  // Overrides for test files
  {
    files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  }
);

export default config; 