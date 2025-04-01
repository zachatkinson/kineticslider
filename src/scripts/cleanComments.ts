#!/usr/bin/env node

import { removeCommentsFromTypeScriptFiles } from '../utils/removeComments';
import path from 'path';

async function main() {
  // Default directories to process (relative to project root)
  const defaultDirs = ['src'];
  
  // Get directories from command line args or use defaults
  const directories = process.argv.slice(2).length > 0 
    ? process.argv.slice(2)
    : defaultDirs;

  console.log('Starting comment removal for directories:', directories);
  
  const results = await removeCommentsFromTypeScriptFiles(
    directories.map(dir => path.resolve(process.cwd(), dir))
  );

  console.log('\nResults:');
  console.log(`✓ Successfully processed: ${results.successful} files`);
  console.log(`✗ Failed to process: ${results.failed} files`);
}

main().catch(console.error); 