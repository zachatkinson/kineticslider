export default {
  presets: [
    ['@babel/preset-env', {
      targets: { node: 'current' },
      modules: false // Preserve ES modules
    }],
    '@babel/preset-typescript',
    ['@babel/preset-react', {
      runtime: 'automatic',
      importSource: '@emotion/react' // For modern React features
    }],
  ],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
        },
      },
    ],
  ],
};
