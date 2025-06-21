import type { Config } from 'prettier';

const config: Config = {
  // Core Options
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  jsxSingleQuote: false,
  trailingComma: 'es5',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',

  // Editor Integration
  endOfLine: 'lf',
  embeddedLanguageFormatting: 'auto',

  // Special File Configurations
  overrides: [
    {
      files: ['*.md', '*.mdx'],
      options: {
        proseWrap: 'always',
      },
    },
  ],
};

export default config;
