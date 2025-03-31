import type { Config } from 'lint-staged';

const isTestFile = (filePath: string): boolean => {
  return (
    filePath.includes('.test.') ||
    filePath.includes('.spec.') ||
    filePath.includes('/__tests__/')
  );
};

/**
 * lint-staged configuration
 */
const config: Config = {
  // Check TypeScript files
  '**/*.ts?(x)': (files: string[]) => {
    const nonTestFiles = files.filter((file) => !isTestFile(file));
    const testFiles = files.filter(isTestFile);
    
    const commands: string[] = [];
    
    // Type check non-test files
    if (nonTestFiles.length > 0) {
      commands.push('tsc --noEmit --project tsconfig.json');
    }
    
    // Type check test files
    if (testFiles.length > 0) {
      commands.push('tsc --noEmit --project tsconfig.test.json');
    }
    
    return commands;
  },
  
  // Lint and format TS/JS files
  '**/*.{ts,tsx,js,jsx}': [
    'eslint --fix',
    'prettier --write',
  ],
  
  // Lint and format style files
  '**/*.{css,scss,sass}': [
    'stylelint --fix',
    'prettier --write',
  ],
  
  // Format other file types
  '**/*.{json,md,mdx,yml,yaml}': [
    'prettier --write',
  ],
  
  // Format package.json
  'package.json': [
    'prettier --write',
  ],
};

export default config; 