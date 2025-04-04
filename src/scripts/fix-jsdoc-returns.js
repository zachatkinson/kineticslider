#!/usr/bin/env node

/**
 * Script to automatically add missing JSDoc @returns declarations to functions
 * Usage: node fix-jsdoc-returns.js [path]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const glob = require('glob');

// Get target directory from command line or use default
const targetDir = process.argv[2] || 'src';

/**
 * Main function to process files
 */
async function main() {
  console.log(`Finding TypeScript files in ${targetDir}...`);
  
  // Find all TypeScript files
  const files = glob.sync(`${targetDir}/**/*.{ts,tsx}`, {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
  });
  
  console.log(`Found ${files.length} TypeScript files.`);
  
  let fixedCount = 0;
  
  for (const file of files) {
    const fixed = await processFile(file);
    if (fixed) fixedCount++;
  }
  
  console.log(`\nFixed JSDoc @returns declarations in ${fixedCount} files.`);
}

/**
 * Process a single file to add missing @returns declarations
 * @param {string} filePath - Path to the file
 * @returns {boolean} Whether the file was modified
 */
async function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if file is empty
    if (!content.trim()) return false;
    
    // Parse the file to find JSDoc blocks without @returns
    const result = findAndFixJsdocReturns(content);
    
    if (result.modified) {
      fs.writeFileSync(filePath, result.content, 'utf8');
      console.log(`✓ Fixed: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Find JSDoc blocks that are missing @returns declarations and add them
 * @param {string} content - File content
 * @returns {Object} Object with modified content and flag indicating if changes were made
 */
function findAndFixJsdocReturns(content) {
  const lines = content.split('\n');
  const newLines = [...lines];
  let modified = false;
  
  // Regular expressions to detect JSDoc and function declarations
  const jsdocStartRegex = /^\s*\/\*\*/;
  const jsdocEndRegex = /^\s*\*\//;
  const returnsRegex = /\s*\*\s*@returns/;
  const functionRegex = /^\s*(export\s+)?(async\s+)?(function|const|let|var).*(\([^)]*\)\s*:\s*[^{=;]+|:\s*[^{=;]+\s*=>\s*)/;
  const methodRegex = /^\s*[a-zA-Z0-9_]+\s*(\([^)]*\)\s*:\s*[^{=;]+)/;
  const arrowFunctionRegex = /^\s*[a-zA-Z0-9_]+\s*:\s*(\([^)]*\)\s*=>\s*[^{;]+|[^{;]+\s*=>\s*[^{;]+)/;
  
  let inJsdoc = false;
  let jsdocStart = -1;
  let jsdocEnd = -1;
  let hasReturns = false;
  
  // First pass: identify JSDoc blocks without @returns
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if we're entering a JSDoc block
    if (jsdocStartRegex.test(line)) {
      inJsdoc = true;
      jsdocStart = i;
      hasReturns = false;
      continue;
    }
    
    // If we're in a JSDoc block, check for @returns
    if (inJsdoc) {
      if (returnsRegex.test(line)) {
        hasReturns = true;
      }
      
      // Check if we're exiting the JSDoc block
      if (jsdocEndRegex.test(line)) {
        inJsdoc = false;
        jsdocEnd = i;
        
        // Check if the next line is a function declaration
        const nextNonEmptyLine = findNextNonEmptyLine(lines, jsdocEnd + 1);
        if (nextNonEmptyLine !== -1) {
          const nextLine = lines[nextNonEmptyLine];
          const isFunctionDeclaration = 
            functionRegex.test(nextLine) || 
            methodRegex.test(nextLine) || 
            arrowFunctionRegex.test(nextLine);
          
          // If we have a function declaration without a @returns tag, add it
          if (isFunctionDeclaration && !hasReturns) {
            const returnType = extractReturnType(nextLine);
            const indentation = getIndentation(lines[jsdocEnd]);
            newLines.splice(jsdocEnd, 0, `${indentation}* @returns ${returnType}`);
            modified = true;
            
            // Adjust indices since we inserted a line
            i++;
            jsdocEnd++;
          }
        }
      }
    }
  }
  
  return {
    content: newLines.join('\n'),
    modified
  };
}

/**
 * Extract the return type from a function declaration
 * @param {string} line - Function declaration line
 * @returns {string} The return type or a generic description
 */
function extractReturnType(line) {
  // Try to extract return type from the function signature
  const returnTypeMatch = line.match(/:\s*([^{=;]+)(\s*=>\s*([^{;]+))?/);
  
  if (returnTypeMatch) {
    const returnType = returnTypeMatch[3] || returnTypeMatch[1];
    return `The ${returnType.trim()} value`;
  }
  
  // If we can't determine the return type, use a generic description
  return 'The function result';
}

/**
 * Find the next non-empty line
 * @param {string[]} lines - Array of lines
 * @param {number} startIndex - Index to start searching from
 * @returns {number} Index of the next non-empty line or -1 if not found
 */
function findNextNonEmptyLine(lines, startIndex) {
  for (let i = startIndex; i < lines.length; i++) {
    if (lines[i].trim() !== '') {
      return i;
    }
  }
  return -1;
}

/**
 * Get the indentation of a line
 * @param {string} line - Line to extract indentation from
 * @returns {string} Indentation string
 */
function getIndentation(line) {
  const match = line.match(/^(\s*)/);
  return match ? match[1] : '';
}

// Run the script
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 