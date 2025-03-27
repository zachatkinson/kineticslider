import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-plugin-prettier';
import jsdoc from 'eslint-plugin-jsdoc';

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Base configuration
  {
    ignores: ['node_modules/**', 'dist/**', '.cursor/**'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react': react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      'prettier': prettier,
      'jsdoc': jsdoc,
    },
    rules: {
      // JSDoc rules
      'jsdoc/require-jsdoc': ['error', {
        publicOnly: true,
        require: {
          FunctionDeclaration: true,
          MethodDefinition: true,
          ClassDeclaration: true,
          ArrowFunctionExpression: true,
          FunctionExpression: true
        },
        contexts: [
          'TSInterfaceDeclaration',
          'TSTypeAliasDeclaration',
          'TSEnumDeclaration',
          'TSPropertySignature'
        ],
        checkConstructors: true,
        checkGetters: true,
        checkSetters: true
      }],
      'jsdoc/require-param': 'error',
      'jsdoc/require-param-description': 'error',
      'jsdoc/require-param-name': 'error',
      'jsdoc/require-param-type': 'error',
      'jsdoc/require-returns': 'error',
      'jsdoc/require-returns-check': 'error',
      'jsdoc/require-returns-description': 'error',
      'jsdoc/require-returns-type': 'error',
      'jsdoc/valid-types': 'error',

      // Modern React 19 rules
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-boolean-value': ['error', 'never'],
      'react/jsx-curly-brace-presence': ['error', 'never'],
      'react/jsx-no-useless-fragment': 'error',
      'react/jsx-pascal-case': 'error',
      'react/jsx-sort-props': ['error', {
        callbacksLast: true,
        shorthandFirst: true,
      }],
      'react/jsx-uses-vars': 'error',
      'react/no-array-index-key': 'error',
      'react/no-unescaped-entities': 'off',
      'react/no-unknown-property': 'error',
      'react/no-unstable-nested-components': 'error',
      'react/no-unused-prop-types': 'error',
      'react/no-unused-state': 'error',
      'react/no-will-update-set-state': 'error',
      'react/self-closing-comp': ['error', {
        component: true,
        html: true,
      }],
      'react/style-prop-object': 'error',
      'react/void-dom-elements-no-children': 'error',

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Accessibility rules
      'jsx-a11y/alt-text': ['error', {
        elements: ['img', 'object', 'area', 'input[type="image"]'],
        img: ['Image', 'img'],
        area: ['Area'],
        'input[type="image"]': ['InputImage'],
      }],
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/anchor-is-valid': ['error', {
        components: ['Link'],
        specialLink: ['hrefLeft', 'hrefRight'],
        aspects: ['invalidHref', 'preferButton'],
      }],
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/control-has-associated-label': ['error', {
        ignoreElements: ['audio', 'canvas', 'embed', 'input', 'textarea', 'tr', 'video'],
        ignoreRoles: ['grid', 'listbox', 'menu', 'menubar', 'radiogroup', 'row', 'tablist', 'toolbar', 'tree', 'treegrid'],
        includeRoles: ['alert', 'dialog'],
      }],
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/html-has-lang': 'error',
      'jsx-a11y/iframe-has-title': 'error',
      'jsx-a11y/img-redundant-alt': 'error',
      'jsx-a11y/interactive-supports-focus': ['error', {
        tabbable: ['button', 'checkbox', 'link', 'progressbar', 'slider', 'spinbutton', 'switch', 'tab', 'textbox'],
      }],
      'jsx-a11y/label-has-associated-control': ['error', {
        labelComponents: [],
        labelAttributes: [],
        controlComponents: [],
        assert: 'either',
        ignoreElements: ['audio', 'canvas', 'embed', 'input', 'textarea', 'tr', 'video'],
        ignoreRoles: ['grid', 'listbox', 'menu', 'menubar', 'radiogroup', 'row', 'tablist', 'toolbar', 'tree', 'treegrid'],
        includeRoles: ['alert', 'dialog'],
      }],
      'jsx-a11y/lang': 'error',
      'jsx-a11y/media-has-caption': ['error', {
        audio: ['Audio'],
        video: ['Video'],
        track: ['Track'],
      }],
      'jsx-a11y/mouse-events-have-key-events': 'error',
      'jsx-a11y/no-access-key': 'error',
      'jsx-a11y/no-autofocus': ['error', {
        ignoreNonDOM: true,
      }],
      'jsx-a11y/no-distracting-elements': ['error', {
        elements: ['marquee', 'blink'],
      }],
      'jsx-a11y/no-interactive-element-to-noninteractive-role': ['error', {
        tr: ['none', 'presentation'],
        td: ['none', 'presentation'],
      }],
      'jsx-a11y/no-noninteractive-element-interactions': ['error', {
        handlers: ['onClick', 'onMouseDown', 'onMouseUp', 'onKeyPress', 'onKeyDown', 'onKeyUp'],
      }],
      'jsx-a11y/no-noninteractive-element-to-interactive-role': ['error', {
        ul: ['listbox', 'menu', 'menubar', 'radiogroup', 'tablist', 'tree', 'treegrid'],
        ol: ['listbox', 'menu', 'menubar', 'radiogroup', 'tablist', 'tree', 'treegrid'],
        li: ['menuitem', 'option', 'row', 'tab', 'treeitem'],
        table: ['grid'],
        td: ['gridcell'],
        div: ['button', 'combobox', 'grid', 'listbox', 'menu', 'menubar', 'radiogroup', 'row', 'slider', 'spinbutton', 'tablist', 'textbox', 'tree', 'treegrid'],
      }],
      'jsx-a11y/no-noninteractive-tabindex': ['error', {
        tags: [],
        roles: ['tabpanel'],
        allowExpressionValues: true,
      }],
      'jsx-a11y/no-onchange': 'off',
      'jsx-a11y/no-redundant-roles': 'error',
      'jsx-a11y/no-scroll-to-top-on-focus': 'error',
      'jsx-a11y/no-static-element-interactions': ['error', {
        allowExpressionValues: true,
        handlers: ['onClick', 'onMouseDown', 'onMouseUp', 'onKeyPress', 'onKeyDown', 'onKeyUp'],
      }],
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/scope': 'error',
      'jsx-a11y/tabindex-no-positive': 'error',

      // Performance rules
      'react/jsx-no-constructed-context-values': 'error',
      'react/jsx-no-useless-fragment': 'error',
      'react/no-array-index-key': 'error',
      'react/no-unstable-nested-components': 'error',
      'react/no-will-update-set-state': 'error',

      // TypeScript rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      }],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
        disallowTypeAnnotations: true,
      }],

      // General rules
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-unused-vars': 'off', // Using TypeScript's no-unused-vars
      'prettier/prettier': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
      'jsx-a11y': {
        components: {
          Button: 'button',
          Link: 'a',
          Input: 'input',
          Select: 'select',
          Textarea: 'textarea',
        },
      },
    },
  },

  // Relaxed rules for test files
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'jsdoc/require-jsdoc': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-returns': 'off',
    },
  },
]; 