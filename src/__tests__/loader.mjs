import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import * as tsNode from 'ts-node';
import path from 'path';
import { resolve as resolveTs } from 'ts-node/esm';
import { dirname } from 'path';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize ts-node for worker threads
if (!process.execArgv.some((arg) => arg.includes('ts-node'))) {
  tsNode.register({
    compilerOptions: {
      module: 'ESNext',
      moduleResolution: 'node',
      target: 'ES2020',
      esModuleInterop: true,
      allowJs: true,
      skipLibCheck: true,
    },
    transpileOnly: true,
    esm: true,
  });
}

export async function resolve(specifier, context, nextResolve) {
  const { parentURL = pathToFileURL(process.cwd()) } = context;

  if (specifier.endsWith('.ts') || specifier.endsWith('.tsx')) {
    return resolveTs(specifier, context, nextResolve);
  }

  return nextResolve(specifier, context, nextResolve);
}

export async function load(url, context, nextLoad) {
  if (url.endsWith('.ts') || url.endsWith('.tsx')) {
    const { source, format } = await nextLoad(url, { ...context, format: 'module' });
    return {
      source,
      format: 'module',
      shortCircuit: true,
    };
  }
  return nextLoad(url, context);
} 