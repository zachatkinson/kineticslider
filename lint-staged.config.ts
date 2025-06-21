interface LintStagedConfig {
  [key: string]: string[] | (() => string)[];
}

const config: LintStagedConfig = {
  // TypeScript and JavaScript files
  '*.{ts,tsx,js,jsx}': ['eslint --fix', (): string => 'tsx scripts/format.ts'],

  // JSON, CSS, SCSS, Markdown files
  '*.{json,css,scss,md}': [(): string => 'tsx scripts/format.ts'],

  // TypeScript files - run type check (function to avoid running on each file)
  '*.{ts,tsx}': [(): string => 'tsc --noEmit'],
};

export default config;
