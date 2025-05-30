/**
 * Script-related type definitions
 *
 * This module contains type definitions for build scripts, documentation generation,
 * and other development tooling.
 *
 * @module Scripts
 * @version 1.0.0
 */

/**
 * TypeDoc configuration options
 *
 * @example
 * ```ts
 * const config: TypeDocConfig = {
 *   rootDir: './src',
 *   outDir: './docs',
 *   entryPoints: ['src/**\/*.ts'],
 *   tsConfigPath: './tsconfig.json',
 *   name: 'My Project',
 *   options: { excludePrivate: true }
 * };
 * ```
 */
export interface TypeDocConfig {
  /** Root directory of the project */
  rootDir: string;
  /** Output directory for generated documentation */
  outDir: string;
  /** Entry point glob patterns */
  entryPoints: string[];
  /** TSConfig file path */
  tsConfigPath: string;
  /** Project name */
  name: string;
  /** Additional TypeDoc options */
  options: Record<string, unknown>;
}

/**
 * JSDoc generation configuration options
 *
 * @example Configuration for JSDoc generation
 */
export interface JSDocGenerationOptions {
  /** Root directory to scan for files */
  rootDir: string;
  /** Patterns to include in the scan */
  includePatterns: string[];
  /** Patterns to exclude from the scan */
  excludePatterns: string[];
  /** Whether to write updates to files */
  dryRun: boolean;
  /** Log level for output (0=error, 1=warn, 2=info, 3=debug) */
  logLevel: number;
}

/**
 * Represents a parsed TypeScript file with its AST
 *
 * @example
 * const file = {
 *   filename: 'path/to/file.ts',
 *   sourceFile: ts.createSourceFile(...),
 *   content: '// file content...'
 * };
 */
export interface ParsedFile {
  /** Filename with path */
  filename: string;
  /** TypeScript source file */
  sourceFile: import('typescript').SourceFile;
  /** Raw file content */
  content: string;
}

/**
 * Performance data interface for batch processing
 *
 * @example
 * ```ts
 * const data: PerformanceData = {
 *   timestamp: Date.now(),
 *   metric: 'fps',
 *   value: 60
 * };
 * ```
 */
export interface PerformanceData {
  timestamp: number;
  metric: string;
  value: number;
} 