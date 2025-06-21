export default {
  // TypeScript and JavaScript files
  '*.{ts,tsx,js,jsx}': ['eslint --fix', 'prettier --write'],

  // JSON, CSS, SCSS, Markdown files
  '*.{json,css,scss,md}': ['prettier --write'],

  // TypeScript files - run type check (function to avoid running on each file)
  '*.{ts,tsx}': [() => 'tsc --noEmit'],
};
