module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm run start',
      url: ['http://localhost:3000'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'mainthread-work-breakdown': ['error', { maxNumericValue: 4000 }],
        'bootup-time': ['error', { maxNumericValue: 2000 }],
        'uses-rel-preconnect': 'off',
        'uses-responsive-images': 'error',
        'offscreen-images': 'error',
        'unminified-css': 'error',
        'unminified-javascript': 'error',
        'unused-javascript': 'error',
        'uses-optimized-images': 'error',
        'modern-image-formats': 'error',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}; 