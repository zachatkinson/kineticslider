/** @type {import('lint-staged').Configuration} */
export default {
  // Run type checking first
  '**/*.{ts,tsx}': () => 'tsc --noEmit',

  // Lint and format TypeScript/JavaScript files
  '**/*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],

  // Style files
  '**/*.{css,scss,sass}': ['stylelint --fix', 'prettier --write'],

  // Other files that only need formatting
  '**/*.{json,md,yml,yaml}': ['prettier --write'],

  // Test files
  '**/*.{test,spec}.{js,jsx,ts,tsx}': ['jest --bail --findRelatedTests'],

  // Package files
  'package.json': ['prettier --write'],
};
