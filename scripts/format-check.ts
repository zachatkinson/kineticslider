import config from '../prettier.config.ts';
import prettier from 'prettier';
import { glob } from 'glob';
import fs from 'fs';

const files = await glob('src/**/*.{ts,tsx,js,jsx,json,css,scss,md}');
let hasErrors = false;

for (const file of files) {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const content = fs.readFileSync(file, 'utf8');
    const isFormatted = await prettier.check(content, {
      ...config,
      filepath: file,
    });
    
    if (!isFormatted) {
      // eslint-disable-next-line no-console
      console.error(`❌ ${file} is not formatted`);
      hasErrors = true;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error checking ${file}:`, error);
    hasErrors = true;
  }
}

if (hasErrors) {
  // eslint-disable-next-line no-console
  console.error('\n❌ Some files are not formatted. Run "pnpm format" to fix.');
  process.exit(1);
} else {
  // eslint-disable-next-line no-console
  console.log(`✅ All ${files.length} files are properly formatted`);
}