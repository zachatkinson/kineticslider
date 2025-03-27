module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        browsers: [
          'last 2 versions',
          'not dead',
          'not ie 11'
        ],
        node: 'current'
      },
      useBuiltIns: 'usage',
      corejs: 3,
      modules: false
    }],
    ['@babel/preset-react', {
      runtime: 'automatic',
      development: process.env.NODE_ENV === 'development',
      importSource: 'react'
    }],
    ['@babel/preset-typescript', {
      isTSX: true,
      allExtensions: true,
      allowNamespaces: true,
      allowDeclareFields: true,
      onlyRemoveTypeImports: true
    }]
  ],
  plugins: [
    ['@babel/plugin-transform-runtime', {
      regenerator: true,
      helpers: true
    }],
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-private-methods'
  ],
  env: {
    development: {
      plugins: [
        // Development-only plugins
      ]
    },
    production: {
      plugins: [
        // Production-only plugins
      ]
    },
    test: {
      plugins: [
        // Test-only plugins
      ]
    }
  }
}; 