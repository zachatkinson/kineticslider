import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import * as tsNode from 'ts-node';

const require = createRequire(import.meta.url);

export function resolve(specifier, context, nextResolve) {
  if (specifier.endsWith('.ts')) {
    const resolved = require.resolve(specifier);
    return {
      url: pathToFileURL(resolved).href,
      format: 'module'
    };
  }
  return nextResolve(specifier);
}

export function load(url, context, nextLoad) {
  if (url.endsWith('.ts')) {
    const filePath = fileURLToPath(url);
    const transformed = tsNode.create({
      compilerOptions: {
        module: 'ESNext',
        moduleResolution: 'node'
      }
    }).compile(filePath);
    return {
      format: 'module',
      source: transformed
    };
  }
  return nextLoad(url);
} 