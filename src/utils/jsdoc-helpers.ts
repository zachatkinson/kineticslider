/**
 * JSDoc generation utility functions
 *
 * Utilities for automatically generating JSDoc comments for TypeScript code
 *
 * @module JSDocHelpers
 * @version 1.0.0
 */

import * as ts from "typescript";

/**
 * Generate a JSDoc comment for a function declaration
 *
 * @param node - Function declaration node
 *
 * @returns Generated JSDoc comment
 *
 */
export function generateFunctionJSDoc(
  node: ts.FunctionDeclaration | ts.MethodDeclaration,
): string {
  const functionName = node.name ? node.name.getText() : "anonymous function";

  let comment = "/**\n * " + functionName;

  // Add parameters
  if (node.parameters.length > 0) {
    comment += "\n *";
    for (const param of node.parameters) {
      const paramName = param.name.getText();
      comment += "\n * @param " + paramName + " - Description of " + paramName;
    }
  }

  // Add return type if it exists
  if (node.type) {
    comment += "\n * @returns Description of return value";
  }

  comment += "\n */\n";

  return comment;
}

/**
 * Generate a JSDoc comment for an interface declaration
 *
 * @param node - Interface declaration node
 *
 * @returns Generated JSDoc comment
 *
 */
export function generateInterfaceJSDoc(node: ts.InterfaceDeclaration): string {
  const interfaceName = node.name.getText();

  let comment = "/**\n * " + interfaceName + " interface\n *\n";

  // Add default description
  comment += " * @example\n * // Usage example for " + interfaceName + "\n";

  // Close comment
  comment += " */\n";

  return comment;
}

/**
 * Generate a JSDoc comment for a class declaration
 *
 * @param node - Class declaration node
 *
 * @returns Generated JSDoc comment
 *
 */
export function generateClassJSDoc(node: ts.ClassDeclaration): string {
  const className = node.name ? node.name.getText() : "Anonymous class";

  let comment = "/**\n * " + className + " class\n *\n";

  // Add a description placeholder
  comment += " * @description Class for " + className + "\n";

  // Add an example placeholder
  comment += " * @example\n * // Example usage of " + className + "\n";

  // Add inheritance info if applicable
  if (node.heritageClauses && node.heritageClauses.length > 0) {
    for (const heritage of node.heritageClauses) {
      if (heritage.token === ts.SyntaxKind.ExtendsKeyword) {
        comment += " * @extends " + heritage.types[0].expression.getText() + "\n";
      } else if (heritage.token === ts.SyntaxKind.ImplementsKeyword) {
        for (const type of heritage.types) {
          comment += " * @implements " + type.expression.getText() + "\n";
        }
      }
    }
  }

  // Close comment
  comment += " */\n";

  return comment;
}

/**
 * Generate a JSDoc comment for a type alias declaration
 *
 * @param node - Type alias declaration node
 *
 * @returns Generated JSDoc comment
 *
 */
export function generateTypeAliasJSDoc(node: ts.TypeAliasDeclaration): string {
  const typeName = node.name.getText();

  let comment = "/**\n * " + typeName + " type\n *\n";

  // Add a description placeholder
  comment += " * @description Type definition for " + typeName + "\n";

  // Add an example placeholder
  comment += " * @example\n * // Example usage of " + typeName + "\n";

  // Close comment
  comment += " */\n";

  return comment;
}

/**
 * Generate a JSDoc comment for an enum declaration
 *
 * @param node - Enum declaration node
 *
 * @returns Generated JSDoc comment
 *
 */
export function generateEnumJSDoc(node: ts.EnumDeclaration): string {
  const enumName = node.name.getText();

  let comment = "/**\n * " + enumName + " enum\n *\n";

  // Add a description placeholder
  comment += " * @description Enumeration for " + enumName + "\n";

  // Add an example placeholder
  comment += " * @example\n * // Example usage of " + enumName + "\n";

  // Close comment
  comment += " */\n";

  return comment;
}

/**
 * Check if a node already has a JSDoc comment
 *
 * @param node - TypeScript AST node
 *
 * @param sourceFile - TypeScript source file
 *
 * @returns True if the node has JSDoc comments
 *
 */
export function hasJSDocComment(node: ts.Node, sourceFile: ts.SourceFile): boolean {
  // Get the full text of the source file
  const fullText = sourceFile.getFullText();

  // Get the position of the node
  const nodePos = node.getFullStart();

  // Get the text before the node
  const textBeforeNode = fullText.substring(0, nodePos).trim();

  // Check if there's a JSDoc comment (/**...*/) right before the node
  return /\/\*\*[\s\S]*?\*\/\s*$/.test(textBeforeNode);
}