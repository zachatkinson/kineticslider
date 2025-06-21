import lintStagedConfig from '../lint-staged.config.ts';
import { execSync } from 'child_process';

// Get staged files
const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);

// eslint-disable-next-line no-console
console.log('Staged files:', stagedFiles);

// Process each pattern in the config
for (const [pattern, commands] of Object.entries(lintStagedConfig)) {
  // Find matching files
  const matchingFiles = stagedFiles.filter(file => {
    // Simple pattern matching - convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\{([^}]+)\}/g, '($1)')
      .replace(/,/g, '|');
    
    // eslint-disable-next-line security/detect-non-literal-regexp
    return new RegExp(regexPattern).test(file);
  });

  if (matchingFiles.length === 0) continue;

  // eslint-disable-next-line no-console
  console.log(`Running tasks for pattern: ${pattern}`);
  // eslint-disable-next-line no-console
  console.log(`Matching files: ${matchingFiles.join(', ')}`);

  // Execute commands
  for (const command of commands) {
    try {
      if (typeof command === 'function') {
        const cmd = command();
        // eslint-disable-next-line no-console
        console.log(`Executing: ${cmd}`);
        execSync(cmd, { stdio: 'inherit' });
      } else {
        const cmd = `${command} ${matchingFiles.join(' ')}`;
        // eslint-disable-next-line no-console
        console.log(`Executing: ${cmd}`);
        execSync(cmd, { stdio: 'inherit' });
      }
    } catch {
      // eslint-disable-next-line no-console
      console.error(`Command failed: ${command}`);
      process.exit(1);
    }
  }
}

// eslint-disable-next-line no-console
console.log('All lint-staged tasks completed successfully!');
