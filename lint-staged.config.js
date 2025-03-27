module.exports = {
  '*.{js,jsx,ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    'git add',
  ],
  '*.{json,css,scss,md}': [
    'prettier --write',
    'git add',
  ],
  '*.{test,spec}.{js,jsx,ts,tsx}': [
    'jest --bail --findRelatedTests',
  ],
}; 