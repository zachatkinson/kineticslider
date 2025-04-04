/**
 * TypeDoc Generation Script
 * 
 * This script runs TypeDoc to generate HTML documentation for the codebase.
 * It configures TypeDoc with appropriate options and generates documentation
 * in the specified output directory.
 * 
 * @module Scripts
 * @category Documentation
 */

import { Application as _Application, TSConfigReader as _TSConfigReader, TypeDocReader as _TypeDocReader } from 'typedoc';
import path from 'path';
import fs from 'fs';

/**
 * TypeDoc configuration options
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
interface TypeDocConfig {
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
 * Default TypeDoc configuration
 */
const defaultConfig: TypeDocConfig = {
  rootDir: path.resolve(__dirname, '..'),
  outDir: path.resolve(__dirname, '../../docs/api'),
  entryPoints: ['src/**/*.ts', 'src/**/*.tsx', '!src/**/*.test.ts', '!src/**/*.spec.ts', '!src/**/*.stories.tsx'],
  tsConfigPath: path.resolve(__dirname, '../../tsconfig.json'),
  name: 'KineticSlider API Documentation',
  options: {
    excludePrivate: true,
    excludeProtected: false,
    excludeExternals: true,
    excludeInternal: true,
    includeVersion: true,
    categorizeByGroup: true,
    categoryOrder: [
      'Core',
      'Components',
      'Hooks',
      'Utilities',
      'Types',
      '*',
    ],
  },
};

/**
 * Generate TypeDoc documentation
 * 
 * @param config - TypeDoc configuration
 * @returns Promise that resolves when documentation generation is complete
 */
async function generateTypeDoc(config: TypeDocConfig): Promise<void> {
  console.warn(`Starting TypeDoc generation with configuration:`, config);
  
  // Create the output directory if it doesn't exist
  if (!fs.existsSync(config.outDir)) {
    fs.mkdirSync(config.outDir, { recursive: true });
    console.warn(`Created output directory: ${config.outDir}`);
  }
  
  // Create TypeDoc options
  const options = {
    entryPoints: config.entryPoints,
    tsconfig: config.tsConfigPath,
    out: config.outDir,
    name: config.name,
    ...config.options,
  };
  
  try {
    // Run typedoc programmatically
    const typedoc = require('typedoc');
    const app = new typedoc.Application();
    app.bootstrap(options);
    
    // Generate documentation
    const project = app.convert();
    
    if (project) {
      // Output documentation to the specified directory
      await app.generateDocs(project, config.outDir);
      console.warn(`TypeDoc documentation generated successfully at ${config.outDir}`);
      
      // Optionally generate JSON output for further processing
      await app.generateJson(project, path.join(config.outDir, 'documentation.json'));
      console.warn(`TypeDoc JSON data generated at ${path.join(config.outDir, 'documentation.json')}`);
    } else {
      console.error('Failed to generate TypeDoc documentation');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error running TypeDoc:', error);
    process.exit(1);
  }
}

/**
 * Parse command line arguments and merge with default config
 * 
 * @returns TypeDoc configuration
 */
function parseConfig(): TypeDocConfig {
  const args = process.argv.slice(2);
  const config = { ...defaultConfig };
  
  // Simple CLI argument parsing
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out' && i + 1 < args.length) {
      config.outDir = path.resolve(args[++i]);
    } else if (args[i] === '--name' && i + 1 < args.length) {
      config.name = args[++i];
    } else if (args[i] === '--tsconfig' && i + 1 < args.length) {
      config.tsConfigPath = path.resolve(args[++i]);
    } else if (args[i] === '--root' && i + 1 < args.length) {
      config.rootDir = path.resolve(args[++i]);
    }
  }
  
  return config;
}

/**
 * Main entry point for the script
 */
async function main(): Promise<void> {
  try {
    const config = parseConfig();
    await generateTypeDoc(config);
  } catch (error) {
    console.error('Error generating TypeDoc documentation:', error);
    process.exit(1);
  }
}

// Run the script if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { generateTypeDoc };
export type { TypeDocConfig }; 