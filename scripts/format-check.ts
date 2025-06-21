import config from '../prettier.config.ts';
import prettier from 'prettier';
import { glob } from 'glob';
import fs from 'fs';

const files = await glob('src/**/*.{ts,tsx,js,jsx,json,css,scss,md}');
let hasUnformattedFiles = false;

for (const file of files) {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const content = fs.readFileSync(file, 'utf8');
    const formatted = await prettier.format(content, {
      ...config,
      filepath: file,
    });
    
    if (formatted !== content) {
      // eslint-disable-next-line no-console
      console.error(`File not formatted: ${file}`);
      hasUnformattedFiles = true;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error checking ${file}:`, error);
    hasUnformattedFiles = true;
  }
}

if (hasUnformattedFiles) {
  process.exit(1);
} else {
  // eslint-disable-next-line no-console
  console.log('All files are properly formatted!');
}
