module.exports = {
  // TypeScript and JavaScript files
  '*.{js,jsx,ts,tsx}': (filenames) => [
    'tsc --noEmit',
    `eslint --fix ${filenames.join(' ')}`,
    `prettier --write ${filenames.join(' ')}`,
    'git add',
  ],

  // Style files
  '*.{css,scss,sass}': (filenames) => [
    `stylelint --fix ${filenames.join(' ')}`,
    `prettier --write ${filenames.join(' ')}`,
    'git add',
  ],

  // JSON, MD, and other config files
  '*.{json,md,yml,yaml}': (filenames) => [
    `prettier --write ${filenames.join(' ')}`,
    'git add',
  ],

  // Test files with coverage check
  '*.{test,spec}.{js,jsx,ts,tsx}': (filenames) => [
    `jest --bail --findRelatedTests --coverage ${filenames.join(' ')}`,
    'git add',
  ],

  // Package files with audit
  'package.json': () => [
    'npm audit',
    'prettier --write package.json',
    'git add',
  ],
}; 