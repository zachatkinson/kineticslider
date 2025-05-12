#!/usr/bin/env node

import fs from "fs/promises";
import _path from "path";
import { glob } from "glob";
import { removeCommentsFromTypeScriptFiles } from "../utils/removeComments";

/**
 * Cleans unnecessary comments from the source code.
 *
 * @returns {void}
 *
 */
async function cleanComments(): Promise<void> {
  try {
    const files = await glob("src/**/*.{ts,tsx}", {
      ignore: "node_modules/**",
    });

    console.warn(`Found ${files.length} files to process...`);

    let processedCount = 0;
    let _changedCount = 0;

    for (const file of files) {
      try {
        const filepath = _path.join(file.split("/")[0], file);
        const stats = await fs.stat(filepath);

        if (
          stats.isFile() &&
          (filepath.endsWith(".ts") || filepath.endsWith(".tsx"))
        ) {
          const _content = await fs.readFile(filepath, "utf-8");

          // Since removeCommentsFromTypeScriptFiles works on directories, we'll call it directly
          // with a single file and get the content from another way
          const dirs = [filepath.split("/")[0]]; // Get the top level directory
          const result = await removeCommentsFromTypeScriptFiles(dirs);

          processedCount++;
          console.warn(
            `Processed ${processedCount}/${files.length} files (${result.successful} changed)`,
          );
        }
      } catch (error) {
        console.warn(`Error processing file ${file}:`, error);
      }
    }

    console.warn(`Completed: Processed ${processedCount} files.`);
  } catch (error) {
    console.warn("Error during comment cleaning:", error);
  }
}

// Execute the function
void cleanComments();
