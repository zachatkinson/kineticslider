import { register } from 'ts-node';

// Register ts-node for ESM support
register({
  transpileOnly: true,
  compilerOptions: {
    module: 'ESNext',
    target: 'ES2020',
    esModuleInterop: true,
    moduleResolution: 'node'
  },
  experimentalSpecifierResolution: 'node'
});

export {}; 