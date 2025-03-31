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
  
  // Special File Configurations
  overrides: [
    // TypeScript files
    {
      files: ['*.ts', '*.tsx'],
      options: {
        parser: 'typescript',
      },
    },
    // JavaScript files
    {
      files: ['*.js', '*.jsx'],
      options: {
        parser: 'babel',
      },
    },
    // JSON files
    {
      files: ['*.json', '*.jsonc'],
      options: {
        parser: 'json',
        tabWidth: 2,
      },
    },
    // YAML files
    {
      files: ['*.yaml', '*.yml'],
      options: {
        tabWidth: 2,
      },
    },
    // CSS, SCSS, LESS files
    {
      files: ['*.css', '*.scss', '*.less'],
      options: {
        parser: 'css',
        singleQuote: false,
      },
    },
    // Markdown files
    {
      files: ['*.md', '*.mdx'],
      options: {
        parser: 'markdown',
        proseWrap: 'always',
      },
    },
    // GraphQL files
    {
      files: ['*.graphql', '*.gql'],
      options: {
        parser: 'graphql',
      },
    },
    // HTML files
    {
      files: ['*.html'],
      options: {
        parser: 'html',
        htmlWhitespaceSensitivity: 'css',
      },
    },
  ],
  
  // Import sorting (enhanced as per cursor rules)
  importOrder: [
    '^react$',
    '^react-dom(.*)$',
    '^next(.*)$',
    '<THIRD_PARTY_MODULES>',
    '^@/(.*)$',
    '^@components/(.*)$',
    '^@lib/(.*)$',
    '^@utils/(.*)$',
    '^@types/(.*)$',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderGroupNamespaceSpecifiers: true,
  importOrderCaseInsensitive: true,
  
  // TailwindCSS integration
  tailwindConfig: './tailwind.config.js',
  tailwindFunctions: ['clsx', 'cn', 'cva'],
  
  // Editor Integration
  endOfLine: 'lf',
  embeddedLanguageFormatting: 'auto',
  
  // Cursor rule specific additions
  plugins: [
    '@trivago/prettier-plugin-sort-imports',
    'prettier-plugin-tailwindcss'
  ],
};

export default config; 