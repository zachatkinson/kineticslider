/** @type {import("prettier").Config} */
const config = {
  // Modern JavaScript features
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',
  endOfLine: 'lf',

  // React specific
  jsxSingleQuote: false,
  jsxBracketSameLine: false,

  // Import sorting
  importOrder: [
    '^react',
    '^@/(.*)$',
    '^@components/(.*)$',
    '^@hooks/(.*)$',
    '^@utils/(.*)$',
    '^@assets/(.*)$',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,

  // File specific overrides
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
      files: ['*.json'],
      options: {
        parser: 'json',
      },
    },
    {
      files: ['*.css', '*.scss', '*.less'],
      options: {
        parser: 'css',
      },
    },
  ],
};

module.exports = config; 