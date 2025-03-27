module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        browsers: [
          'last 2 chrome versions',
          'last 2 firefox versions',
          'last 2 safari versions',
          'last 2 edge versions',
          'not dead',
          'not ie 11',
          'not op_mini all'
        ],
        node: 'current'
      },
      useBuiltIns: 'usage',
      corejs: { version: '3.32', proposals: true },
      modules: process.env.NODE_ENV === 'test' ? 'auto' : false,
      debug: process.env.NODE_ENV === 'development'
    }],
    ['@babel/preset-react', {
      runtime: 'automatic',
      development: process.env.NODE_ENV === 'development',
      importSource: '@emotion/react',
      throwIfNamespace: true,
      pure: true
    }],
    ['@babel/preset-typescript', {
      isTSX: true,
      allExtensions: true,
      allowNamespaces: true,
      allowDeclareFields: true,
      onlyRemoveTypeImports: true,
      optimizeConstEnums: true
    }]
  ],
  plugins: [
    ['@babel/plugin-transform-runtime', {
      regenerator: true,
      helpers: true,
      useESModules: true
    }],
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-private-methods',
    '@babel/plugin-proposal-object-rest-spread'
  ],
  env: {
    development: {
      plugins: [
        'react-refresh/babel',
        ['babel-plugin-transform-import-meta', {
          module: 'ES6'
        }]
      ]
    },
    production: {
      plugins: [
        ['babel-plugin-transform-react-remove-prop-types', {
          removeImport: true
        }],
        'babel-plugin-optimize-clsx',
        ['babel-plugin-transform-imports', {
          lodash: {
            transform: 'lodash/${member}',
            preventFullImport: true
          }
        }]
      ]
    },
    test: {
      plugins: [
        'babel-plugin-dynamic-import-node',
        'babel-plugin-istanbul'
      ]
    }
  },
  assumptions: {
    privateFieldsAsProperties: true,
    setPublicClassFields: true,
    noDocumentAll: true,
    noClassCalls: true,
    constantSuper: true,
    enumerableModuleMeta: true,
    ignoreFunctionLength: true,
    ignoreToPrimitiveHint: true,
    objectRestNoSymbols: true,
    pureGetters: true,
    setClassMethods: true,
    superIsCallableConstructor: true
  }
}; 