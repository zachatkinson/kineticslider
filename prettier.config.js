/** @type {import("prettier").Config} */
const config = {
  // Line Length and Indentation
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,

  // Quotes and Semicolons
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  jsxSingleQuote: false,

  // Commas and Brackets
  trailingComma: 'es5',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',

  // Line Endings and Special Characters
  endOfLine: 'lf',
  embeddedLanguageFormatting: 'auto',
  proseWrap: 'preserve',

  // Import Organization
  importOrder: [
    '^react',
    '^next',
    '^@/(.*)$',
    '^@components/(.*)$',
    '^@hooks/(.*)$',
    '^@utils/(.*)$',
    '^@styles/(.*)$',
    '^@assets/(.*)$',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderCaseInsensitive: true,

  // File-specific Configurations
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      options: {
        parser: 'typescript',
      },
    },
    {
      files: ['*.js', '*.jsx'],
      options: {
        parser: 'babel',
      },
    },
    {
      files: ['*.json', '*.jsonc'],
      options: {
        parser: 'json',
        trailingComma: 'none',
      },
    },
    {
      files: ['*.css', '*.scss', '*.less'],
      options: {
        parser: 'css',
        singleQuote: false,
      },
    },
    {
      files: ['*.md', '*.mdx'],
      options: {
        parser: 'markdown',
        proseWrap: 'always',
        printWidth: 100,
      },
    },
  ],

  // Plugin Configuration
  plugins: [
    '@trivago/prettier-plugin-sort-imports',
    'prettier-plugin-tailwindcss',
  ],
};

export default config;
