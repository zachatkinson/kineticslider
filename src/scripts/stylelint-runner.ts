#!/usr/bin/env tsx
/**
 * Stylelint runner that supports TypeScript config
 */

import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import config from '../../stylelint.config';

// Convert TS config to JSON
const configJson = JSON.stringify(config, null, 2);
const tempConfigPath = '.stylelintrc.temp.json';

try {
  // Write temporary JSON config
  writeFileSync(tempConfigPath, configJson);
  
  // Get command line arguments
  const args = process.argv.slice(2);
  const isFixMode = args.includes('--fix');
  
  // Build stylelint command
  const fixFlag = isFixMode ? '--fix' : '';
  const patterns = '"src/**/*.{css,scss}"';
  const command = `stylelint ${fixFlag} --config ${tempConfigPath} ${patterns}`.trim();
  
  // Run stylelint (removed console.log to avoid linting warning)
  execSync(command, { stdio: 'inherit' });
  
} catch (error) {
  console.error('Stylelint failed:', error);
  process.exit(1);
} finally {
  // Clean up temporary config
  try {
    unlinkSync(tempConfigPath);
  } catch {
    // Ignore cleanup errors
  }
} 