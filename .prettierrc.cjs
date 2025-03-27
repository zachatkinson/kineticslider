module.exports = {
  semi: true,
  trailingComma: 'all',
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  endOfLine: 'lf',
  plugins: ['@trivago/prettier-plugin-sort-imports', 'prettier-plugin-tailwindcss'],
  importOrder: [
    '^react',
    '^@?\\w',
    '^(@/(.*)$)|^[./]'
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true
}; 