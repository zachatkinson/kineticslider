/**
 * JSDoc/TypeDoc Comment Generation Script
 * 
 * This script scans TypeScript files in the project and adds or improves
 * JSDoc comments to ensure they are TypeDoc-friendly. It follows standard
 * patterns for documenting different code constructs.
 * 
 * @module Scripts
 * @category Documentation
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import ts from 'typescript';

/**
 * Configuration options for JSDoc generation
 * @example Configuration for JSDoc generation
 */
interface JSDocGenerationOptions {
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
 * Default configuration options
 */
const defaultOptions: JSDocGenerationOptions = {
  rootDir: path.resolve(__dirname, '..'),
  includePatterns: ['**/*.ts', '**/*.tsx'],
  excludePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/coverage/**', '**/scripts/**'],
  dryRun: false,
  logLevel: 2,
};

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
interface ParsedFile {
  /** Filename with path */
  filename: string;
  /** TypeScript source file */
  sourceFile: ts.SourceFile;
  /** Raw file content */
  content: string;
}

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
  private logEntries: Array<{level: string; message: string}> = [];

  /**
   * Create a new logger
   * @param level - Log level (0=error, 1=warn, 2=info, 3=debug)
   */
  constructor(level: number) {
    this.level = level;
  }

  /**
   * Log an error message
   * @param message - Message to log
   */
  error(message: string): void {
    if (this.level >= 0) {
      this.logEntries.push({level: 'ERROR', message});
      // Instead of directly logging, we store the message
      // Will be processed by a logging service or written to a file
    }
  }

  /**
   * Log a warning message
   * @param message - Message to log
   */
  warn(message: string): void {
    if (this.level >= 1) {
      this.logEntries.push({level: 'WARN', message});
      // Store the warning message instead of using console
    }
  }

  /**
   * Log an info message
   * @param message - Message to log
   */
  info(message: string): void {
    if (this.level >= 2) {
      this.logEntries.push({level: 'INFO', message});
      // Store the info message instead of using console
    }
  }

  /**
   * Log a debug message
   * @param message - Message to log
   */
  debug(message: string): void {
    if (this.level >= 3) {
      this.logEntries.push({level: 'DEBUG', message});
      // Store the debug message instead of using console
    }
  }
  
  /**
   * Retrieve all log entries
   * @returns Array of log entries
   */
  getEntries(): Array<{level: string; message: string}> {
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
 * @returns Array of file paths
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
      logger.warn('No files found matching the specified patterns.');
    } else {
      logger.info(`Found ${files.length} files to process.`);
    }
  } catch (error) {
    const logger = new Logger(options.logLevel);
    logger.error('Error finding files:' + String(error));
  }
  
  return files;
}

/**
 * Parse a TypeScript file into an AST
 * 
 * @param filePath - Path to the file
 * @returns Parsed file information
 */
function parseFile(filePath: string): ParsedFile {
  const content = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true
  );
  
  return {
    filename: filePath,
    sourceFile,
    content,
  };
}

/**
 * Check if a node already has a JSDoc comment
 * 
 * @param node - TypeScript AST node
 * @param sourceFile - TypeScript source file
 * @returns True if the node has JSDoc comments
 */
function hasJSDocComment(node: ts.Node, sourceFile: ts.SourceFile): boolean {
  // Get the full text of the source file
  const fullText = sourceFile.getFullText();
  
  // Get the position of the node
  const nodePos = node.getFullStart();
  
  // Get the text before the node
  const textBeforeNode = fullText.substring(0, nodePos).trim();
  
  // Check if there's a JSDoc comment (/**...*/) right before the node
  return /\/\*\*[\s\S]*?\*\/\s*$/.test(textBeforeNode);
}

/**
 * Generate a JSDoc comment for a function declaration
 * 
 * @param node - Function declaration node
 * @returns Generated JSDoc comment
 */
export function generateFunctionJSDoc(node: ts.FunctionDeclaration | ts.MethodDeclaration): string {
  const functionName = node.name ? node.name.getText() : 'anonymous function';
  
  let comment = `/**\n * ${functionName}`;
  
  // Add parameters
  if (node.parameters.length > 0) {
    comment += '\n *';
    for (const param of node.parameters) {
      const paramName = param.name.getText();
      comment += `\n * @param ${paramName} - Description of ${paramName}`;
    }
  }
  
  // Add return type if it exists
  if (node.type) {
    comment += '\n * @returns Description of return value';
  }
  
  comment += '\n */\n';
  
  return comment;
}

/**
 * Generate a JSDoc comment for an interface declaration
 * 
 * @param node - Interface declaration node
 * @returns Generated JSDoc comment
 */
function generateInterfaceJSDoc(node: ts.InterfaceDeclaration): string {
  const interfaceName = node.name.getText();
  
  let comment = `/**\n * ${interfaceName} interface\n *\n`;
  
  // Add default description
  comment += ` * @example\n * // Usage example for ${interfaceName}\n`;
  
  // Close comment
  comment += ' */\n';
  
  return comment;
}

/**
 * Generate a JSDoc comment for a class declaration
 * 
 * @param node - Class declaration node
 * @returns Generated JSDoc comment
 */
function generateClassJSDoc(node: ts.ClassDeclaration): string {
  const className = node.name ? node.name.getText() : 'Anonymous class';
  
  let comment = `/**\n * ${className} class\n *\n`;
  
  // Add a description placeholder
  comment += ` * @description Class for ${className}\n`;
  
  // Add an example placeholder
  comment += ` * @example\n * // Example usage of ${className}\n`;
  
  // Add inheritance info if applicable
  if (node.heritageClauses && node.heritageClauses.length > 0) {
    for (const heritage of node.heritageClauses) {
      if (heritage.token === ts.SyntaxKind.ExtendsKeyword) {
        comment += ` * @extends ${heritage.types[0].expression.getText()}\n`;
      } else if (heritage.token === ts.SyntaxKind.ImplementsKeyword) {
        for (const type of heritage.types) {
          comment += ` * @implements ${type.expression.getText()}\n`;
        }
      }
    }
  }
  
  // Close comment
  comment += ' */\n';
  
  return comment;
}

/**
 * Generate a JSDoc comment for a type alias declaration
 * 
 * @param node - Type alias declaration node
 * @returns Generated JSDoc comment
 */
function generateTypeAliasJSDoc(node: ts.TypeAliasDeclaration): string {
  const typeName = node.name.getText();
  
  let comment = `/**\n * ${typeName} type\n *\n`;
  
  // Add a description placeholder
  comment += ` * @description Type definition for ${typeName}\n`;
  
  // Add an example placeholder
  comment += ` * @example\n * // Example usage of ${typeName}\n`;
  
  // Close comment
  comment += ' */\n';
  
  return comment;
}

/**
 * Generate a JSDoc comment for an enum declaration
 * 
 * @param node - Enum declaration node
 * @returns Generated JSDoc comment
 */
function generateEnumJSDoc(node: ts.EnumDeclaration): string {
  const enumName = node.name.getText();
  
  let comment = `/**\n * ${enumName} enum\n *\n`;
  
  // Add a description placeholder
  comment += ` * @description Enumeration for ${enumName}\n`;
  
  // Add an example placeholder
  comment += ` * @example\n * // Example usage of ${enumName}\n`;
  
  // Close comment
  comment += ' */\n';
  
  return comment;
}

/**
 * Process a single file to add or improve JSDoc comments
 * 
 * @param parsedFile - Parsed TypeScript file
 * @param logger - Logger instance
 * @returns Updated file content with improved JSDoc comments
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
    let jsDoc = '';
    
    if (ts.isFunctionDeclaration(node)) {
      jsDoc = generateFunctionJSDoc(node);
      logger.debug(`Adding JSDoc for function ${node.name?.getText() || 'anonymous'}`);
    } else if (ts.isInterfaceDeclaration(node)) {
      jsDoc = generateInterfaceJSDoc(node);
      logger.debug(`Adding JSDoc for interface ${node.name.getText()}`);
    } else if (ts.isClassDeclaration(node)) {
      jsDoc = generateClassJSDoc(node);
      logger.debug(`Adding JSDoc for class ${node.name?.getText() || 'anonymous'}`);
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
 * @param content - Updated file content
 * @param dryRun - Whether to actually write to file
 * @param logger - Logger instance
 */
function writeFile(filePath: string, content: string, dryRun: boolean, logger: Logger): void {
  if (dryRun) {
    logger.info(`[DRY RUN] Would write updated content to ${filePath}`);
    return;
  }
  
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    logger.info(`Updated JSDoc comments in ${filePath}`);
  } catch (error) {
    logger.error(`Failed to write to ${filePath}: ${String(error)}`);
  }
}

/**
 * Main function to generate JSDoc comments
 * 
 * @param options - JSDoc generation options
 */
function generateJSDocs(options: JSDocGenerationOptions): void {
  const logger = new Logger(options.logLevel);
  
  // Find all matching files
  const files = findFiles(options);
  
  if (files.length === 0) {
    logger.warn('No files to process. Check your include/exclude patterns.');
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
  
  logger.info('JSDoc generation completed.');
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
export {
  generateJSDocs,
  defaultOptions,
  type JSDocGenerationOptions,
}; 