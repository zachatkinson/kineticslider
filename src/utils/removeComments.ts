import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

/**
 * Removes comments from TypeScript source code while preserving the code structure
 * @param sourceText The source code text to process
 * @returns The processed source code without comments
 */
function removeCommentsFromSource(sourceText: string): string {
  const sourceFile = ts.createSourceFile(
    'temp.ts',
    sourceText,
    ts.ScriptTarget.Latest,
    true
  );

  // Create printer to generate output
  const printer = ts.createPrinter({
    removeComments: true,
    newLine: ts.NewLineKind.LineFeed,
  });

  // Print the file without comments
  return printer.printFile(sourceFile);
}

/**
 * Process a single file to remove comments
 * @param filePath Path to the TypeScript file
 * @returns true if successful, false if failed
 */
async function processFile(filePath: string): Promise<boolean> {
  try {
    const source = await fs.promises.readFile(filePath, 'utf-8');
    const processedSource = removeCommentsFromSource(source);
    await fs.promises.writeFile(filePath, processedSource, 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return false;
  }
}

/**
 * Remove comments from all TypeScript files in the specified directories
 * @param directories Array of directory paths to process
 * @returns Object containing success and failure counts
 */
export async function removeCommentsFromTypeScriptFiles(
  directories: string[]
): Promise<{ successful: number; failed: number }> {
  const stats = {
    successful: 0,
    failed: 0,
  };

  try {
    // Find all TypeScript files in the specified directories
    const files: string[] = await glob('**/*.{ts,tsx}', {
      cwd: process.cwd(),
      ignore: ['node_modules/**', 'dist/**', '.next/**'],
      absolute: true,
      nodir: true,
    });

    // Filter files to only include those in specified directories
    const targetFiles = files.filter((file: string) =>
      directories.some((dir) => file.startsWith(path.resolve(dir)))
    );

    // Process each file
    for (const file of targetFiles) {
      const success = await processFile(file);
      if (success) {
        stats.successful++;
        console.warn(`Successfully processed: ${file}`);
      } else {
        stats.failed++;
        console.error(`Failed to process: ${file}`);
      }
    }
  } catch (error) {
    console.error('Error processing files:', error);
  }

  return stats;
}

// Example usage:
// const directories = ['src/components', 'src/utils'];
// const results = await removeCommentsFromTypeScriptFiles(directories);
// console.log('Results:', results); 