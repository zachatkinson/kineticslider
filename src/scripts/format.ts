import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { globby } from "globby";
import prettier from "prettier";
import fs from "fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "../../");

async function formatAll(): Promise<void> {
  // Find all .ts and .tsx files in src
  const files = await globby([`${rootDir}/src/**/*.{ts,tsx}`], {
    gitignore: true,
    absolute: true,
  });

  // Load Prettier config (it will resolve prettier.config.ts automatically)
  const config = await prettier.resolveConfig(rootDir);

  let hadError = false;

  for (const file of files) {
    const input = await fs.readFile(file, "utf8");
    const formatted = await prettier.format(input, {
      ...config,
      filepath: file,
    });
    if (input !== formatted) {
      await fs.writeFile(file, formatted, "utf8");
      console.warn(`Formatted: ${file}`);
    }
  }

  if (hadError) {
    process.exit(1);
  }
}

formatAll().catch((err) => {
  console.error("Formatting failed:", err);
  process.exit(1);
});
