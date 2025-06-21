interface LighthouseConfig {
  ci: {
    collect: {
      startServerCommand: string;
      url: string[];
      numberOfRuns: number;
      settings: {
        chromeFlags: string;
      };
    };
    assert: {
      assertions: Record<string, string | [string, { minScore?: number; maxNumericValue?: number }]>;
    };
    upload: {
      target: string;
    };
  };
}

const config: LighthouseConfig = {
  ci: {
    collect: {
      startServerCommand: 'pnpm run preview',
      url: ['http://localhost:4173'],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
      },
    },
    assert: {
      assertions: {
        // Core Web Vitals - Enterprise Grade
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],

        // Performance Metrics - Strict Targets
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'speed-index': ['error', { maxNumericValue: 2000 }],
        interactive: ['error', { maxNumericValue: 3500 }],

        // Resource Optimization
        'mainthread-work-breakdown': ['error', { maxNumericValue: 3000 }],
        'bootup-time': ['error', { maxNumericValue: 1500 }],
        'uses-responsive-images': 'error',
        'offscreen-images': 'error',
        'unminified-css': 'error',
        'unminified-javascript': 'error',
        'unused-javascript': ['error', { maxNumericValue: 40000 }],
        'uses-optimized-images': 'error',
        'modern-image-formats': 'error',
        'uses-webp-images': 'error',
        'efficient-animated-content': 'error',

        // Network & Caching
        'uses-long-cache-ttl': 'warn',
        'uses-rel-preconnect': 'warn',
        'uses-rel-preload': 'warn',
        'uses-text-compression': 'error',

        // Security & Best Practices
        'is-on-https': 'error',
        'uses-http2': 'warn',
        'no-vulnerable-libraries': 'error',
        'csp-xss': 'warn',

        // Accessibility - WCAG 2.2 AA
        'color-contrast': 'error',
        'image-alt': 'error',
        label: 'error',
        'link-name': 'error',
        'button-name': 'error',
        'aria-allowed-attr': 'error',
        'aria-required-attr': 'error',
        'aria-valid-attr-value': 'error',
        'aria-valid-attr': 'error',
        'duplicate-id-aria': 'error',
        'heading-order': 'error',
        'landmark-one-main': 'error',
        list: 'error',
        listitem: 'error',
        'meta-viewport': 'error',
        tabindex: 'error',
        'valid-lang': 'error',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};

export default config;
