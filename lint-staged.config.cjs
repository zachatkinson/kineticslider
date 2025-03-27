module.exports = {
  // TypeScript and JavaScript files
  '*.{js,jsx,ts,tsx}': (filenames) => [
    'tsc --noEmit',
    `eslint --fix ${filenames.join(' ')}`,
    `prettier --write ${filenames.join(' ')}`,
  ],

  // Style files
  '*.{css,scss,sass}': (filenames) => [
    `stylelint --fix ${filenames.join(' ')}`,
    `prettier --write ${filenames.join(' ')}`,
  ],

  // JSON, MD, and other config files
  '*.{json,md,yml,yaml}': (filenames) => [
    `prettier --write ${filenames.join(' ')}`,
  ],

  // Test files with coverage check
  '*.{test,spec}.{js,jsx,ts,tsx}': (filenames) => [
    `jest --bail --findRelatedTests --coverage ${filenames.join(' ')}`,
  ],

  // Package files with audit
  'package.json': () => [
    'prettier --write package.json',
  ],
}; 