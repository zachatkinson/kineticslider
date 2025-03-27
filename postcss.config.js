module.exports = {
  plugins: {
    'autoprefixer': {
      flexbox: 'no-2009',
      grid: 'autoplace',
    },
    'postcss-preset-env': {
      stage: 3,
      features: {
        'nesting-rules': true,
        'custom-properties': true,
        'custom-media-queries': true,
        'media-query-ranges': true,
        'custom-selectors': true,
        'gap-properties': true,
        'logical-properties-and-values': true,
        'color-functional-notation': true,
      },
      autoprefixer: false,
      preserve: false,
    },
    'postcss-flexbugs-fixes': {},
    'postcss-normalize': {
      forceImport: true,
    },
    'cssnano': {
      preset: ['default', {
        discardComments: {
          removeAll: true,
        },
        normalizeWhitespace: true,
        minifyFontValues: true,
        minifyGradients: true,
        calc: false,
      }],
    },
  },
}; 