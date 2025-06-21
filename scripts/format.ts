import config from '../prettier.config.ts';
import prettier from 'prettier';
import { glob } from 'glob';
import fs from 'fs';

const files = await glob('src/**/*.{ts,tsx,js,jsx,json,css,scss,md}');

for (const file of files) {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const content = fs.readFileSync(file, 'utf8');
    const formatted = await prettier.format(content, {
      ...config,
      filepath: file,
    });
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    fs.writeFileSync(file, formatted);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error formatting ${file}:`, error);
  }
}

// eslint-disable-next-line no-console
console.log(`Formatted ${files.length} files`);
