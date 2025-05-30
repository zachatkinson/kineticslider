/**
 * JSDoc Generation Script
 *
 * This script automatically generates JSDoc comments for TypeScript files
 * that don't already have them. It uses the TypeScript compiler API to
 * parse files and generate appropriate documentation comments.
 *
 * @module Scripts
 * @category Documentation
 */

import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";
import * as glob from "glob";
import type { JSDocGenerationOptions, ParsedFile } from "../types/scripts";
import {
  generateFunctionJSDoc,
  generateInterfaceJSDoc,
  generateClassJSDoc,
  generateTypeAliasJSDoc,
  generateEnumJSDoc,
  hasJSDocComment,
} from "../utils/jsdoc-helpers";

/**
 * Default configuration options
 */
const defaultOptions: JSDocGenerationOptions = {
  rootDir: path.resolve(__dirname, ".."),
  includePatterns: ["**/*.ts", "**/*.tsx"],
  excludePatterns: [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/coverage/**",
    "**/scripts/**",
  ],
  dryRun: false,
  logLevel: 2,
};

/**
 * Logger utility for consistent message formatting
 *
 * @example
 * const logger = new Logger(2);
 * logger.info('Processing file...');
 * logger.error('Failed to read file');
 */
class Logger {
  private level: number;
  private logEntries: Array<{ level: string; message: string }> = [];

  /**
   * Create a new logger
   *
   * @param level - Log level (0=error, 1=warn, 2=info, 3=debug)
   *
   */
  constructor(level: number) {
    this.level = level;
  }

  /**
   * Log an error message
   *
   * @param message - Message to log
   *
   */
  error(message: string): void {
    if (this.level >= 0) {
      this.logEntries.push({ level: "ERROR", message });
      // Instead of directly logging, we store the message
      // Will be processed by a logging service or written to a file
    }
  }

  /**
   * Log a warning message
   *
   * @param message - Message to log
   *
   */
  warn(message: string): void {
    if (this.level >= 1) {
      this.logEntries.push({ level: "WARN", message });
      // Store the warning message instead of using console
    }
  }

  /**
   * Log an info message
   *
   * @param message - Message to log
   *
   */
  info(message: string): void {
    if (this.level >= 2) {
      this.logEntries.push({ level: "INFO", message });
      // Store the info message instead of using console
    }
  }

  /**
   * Log a debug message
   *
   * @param message - Message to log
   *
   */
  debug(message: string): void {
    if (this.level >= 3) {
      this.logEntries.push({ level: "DEBUG", message });
      // Store the debug message instead of using console
    }
  }

  /**
   * Retrieve all log entries
   *
   * @returns Array of log entries
   *
   */
  getEntries(): Array<{ level: string; message: string }> {
    return this.logEntries;
  }

  /**
   * Write all logs to the console
   * Used only when explicitly called, such as at the end of a process
   */
  writeToConsole(): void {
    for (const entry of this.logEntries) {
      // Only used when explicitly called to output logs
      process.stdout.write(`[${entry.level}] ${entry.message}\n`);
    }
  }
}

/**
 * Find all TypeScript files matching the given patterns
 *
 * @param options - JSDoc generation options
 *
 * @returns Array of file paths
 *
 */
function findFiles(options: JSDocGenerationOptions): string[] {
  const { rootDir, includePatterns, excludePatterns } = options;

  let files: string[] = [];

  try {
    for (const pattern of includePatterns) {
      const matches = glob.sync(pattern, {
        cwd: rootDir,
        absolute: true,
        ignore: excludePatterns,
      });

      files = [...files, ...matches];
    }

    const logger = new Logger(options.logLevel);
    if (files.length === 0) {
      logger.warn("No files found matching the specified patterns.");
    } else {
      logger.info(`Found ${files.length} files to process.`);
    }
  } catch (error) {
    const logger = new Logger(options.logLevel);
    logger.error("Error finding files:" + String(error));
  }

  return files;
}

/**
 * Parse a TypeScript file into an AST
 *
 * @param filePath - Path to the file
 *
 * @returns Parsed file information
 *
 */
function parseFile(filePath: string): ParsedFile {
  const content = fs.readFileSync(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
  );

  return {
    filename: filePath,
    sourceFile,
    content,
  };
}

/**
 * Process a single file to add or improve JSDoc comments
 *
 * @param parsedFile - Parsed TypeScript file
 *
 * @param logger - Logger instance
 *
 * @returns Updated file content with improved JSDoc comments
 *
 */
function processFile(parsedFile: ParsedFile, logger: Logger): string {
  const { filename, sourceFile, content } = parsedFile;
  let updatedContent = content;

  function visit(node: ts.Node): void {
    // Skip nodes that already have JSDoc comments
    if (hasJSDocComment(node, sourceFile)) {
      ts.forEachChild(node, visit);
      return;
    }

    // Generate JSDoc based on node kind
    let jsDoc = "";

    if (ts.isFunctionDeclaration(node)) {
      jsDoc = generateFunctionJSDoc(node);
      logger.debug(
        `Adding JSDoc for function ${node.name?.getText() || "anonymous"}`,
      );
    } else if (ts.isInterfaceDeclaration(node)) {
      jsDoc = generateInterfaceJSDoc(node);
      logger.debug(`Adding JSDoc for interface ${node.name.getText()}`);
    } else if (ts.isClassDeclaration(node)) {
      jsDoc = generateClassJSDoc(node);
      logger.debug(
        `Adding JSDoc for class ${node.name?.getText() || "anonymous"}`,
      );
    } else if (ts.isTypeAliasDeclaration(node)) {
      jsDoc = generateTypeAliasJSDoc(node);
      logger.debug(`Adding JSDoc for type alias ${node.name.getText()}`);
    } else if (ts.isEnumDeclaration(node)) {
      jsDoc = generateEnumJSDoc(node);
      logger.debug(`Adding JSDoc for enum ${node.name.getText()}`);
    }

    // Insert JSDoc at the start of the node if we generated one
    if (jsDoc) {
      const pos = node.getFullStart();
      updatedContent =
        updatedContent.substring(0, pos) +
        jsDoc +
        updatedContent.substring(pos);
    }

    // Continue traversing
    ts.forEachChild(node, visit);
  }

  // Start traversal
  logger.info(`Processing file: ${filename}`);
  ts.forEachChild(sourceFile, visit);

  return updatedContent;
}

/**
 * Write updated content to a file
 *
 * @param filePath - Path to the file
 *
 * @param content - Updated file content
 *
 * @param dryRun - Whether to actually write to file
 *
 * @param logger - Logger instance
 *
 */
function writeFile(
  filePath: string,
  content: string,
  dryRun: boolean,
  logger: Logger,
): void {
  if (dryRun) {
    logger.info(`[DRY RUN] Would write updated content to ${filePath}`);
    return;
  }

  try {
    fs.writeFileSync(filePath, content, "utf-8");
    logger.info(`Updated JSDoc comments in ${filePath}`);
  } catch (error) {
    logger.error(`Failed to write to ${filePath}: ${String(error)}`);
  }
}

/**
 * Main function to generate JSDoc comments
 *
 * @param options - JSDoc generation options
 *
 */
function generateJSDocs(options: JSDocGenerationOptions): void {
  const logger = new Logger(options.logLevel);

  // Find all matching files
  const files = findFiles(options);

  if (files.length === 0) {
    logger.warn("No files to process. Check your include/exclude patterns.");
    return;
  }

  logger.info(`Found ${files.length} files to process.`);

  // Process each file
  for (const filePath of files) {
    try {
      const parsedFile = parseFile(filePath);
      const updatedContent = processFile(parsedFile, logger);

      // Only write if the content has changed
      if (updatedContent !== parsedFile.content) {
        writeFile(filePath, updatedContent, options.dryRun, logger);
      } else {
        logger.info(`No changes needed for ${filePath}`);
      }
    } catch (error) {
      logger.error(`Error processing ${filePath}: ${String(error)}`);
    }
  }

  logger.info("JSDoc generation completed.");
  logger.writeToConsole();
}

/**
 * Main entry point
 */
function main(): void {
  const options = { ...defaultOptions };

  // Parse command line args if needed
  // For simplicity, we're just using default options here

  generateJSDocs(options);
}

// Only run if called directly (not imported)
if (require.main === module) {
  main();
}

// Export for testing/importing
export { generateJSDocs, defaultOptions, type JSDocGenerationOptions };
