/** @type {import('lint-staged').Configuration} */
export default {
  // Run type checking first with specific configs for test and non-test files
  '**/*.{ts,tsx}': (files) => {
    const testFiles = files.filter(
      (file) =>
        file.includes('.test.') ||
        file.includes('.spec.') ||
        file.includes('/__tests__/')
    );

    const nonTestFiles = files.filter(
      (file) =>
        !file.includes('.test.') &&
        !file.includes('.spec.') &&
        !file.includes('/__tests__/')
    );

    const commands = [];

    if (nonTestFiles.length > 0) {
      commands.push('tsc --noEmit --project tsconfig.json');
    }

    if (testFiles.length > 0) {
      commands.push('tsc --noEmit --project tsconfig.test.json');
    }

    return commands;
  },

  // Lint and format TypeScript/JavaScript files
  '**/*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],

  // Style files
  '**/*.{css,scss,sass}': ['stylelint --fix', 'prettier --write'],

  // Other files that only need formatting
  '**/*.{json,md,yml,yaml}': ['prettier --write'],

  // Test files
  '**/*.{test,spec}.{js,jsx,ts,tsx}': [
    // 'vitest related --bail' // Commented out to fix hanging issue during commit
  ],

  // Package files
  'package.json': ['prettier --write'],
};
