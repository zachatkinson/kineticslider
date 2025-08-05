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
      assertions: Record<
        string,
        string | [string, { minScore?: number; maxNumericValue?: number }]
      >;
    };
    upload: {
      target: string;
    };
  };
}

const config: LighthouseConfig = {
  ci: {
    collect: {
      url: ['http://localhost:4173'],
      numberOfRuns: 1,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage --disable-gpu',
      },
    },
    assert: {
      assertions: {
        // Core Web Vitals - Enterprise Grade
        'categories:performance': ['warn', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.90 }],
        'categories:best-practices': ['warn', { minScore: 0.90 }],
        'categories:seo': ['warn', { minScore: 0.90 }],

        // Performance Metrics - Strict Targets
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        interactive: ['warn', { maxNumericValue: 4000 }],

        // Resource Optimization
        'mainthread-work-breakdown': ['warn', { maxNumericValue: 4000 }],
        'bootup-time': ['warn', { maxNumericValue: 2000 }],
        'uses-responsive-images': 'warn',
        'offscreen-images': 'warn',
        'unminified-css': 'error',
        'unminified-javascript': 'error',
        'unused-javascript': ['warn', { maxNumericValue: 50000 }],
        'uses-optimized-images': 'warn',
        'modern-image-formats': 'warn',
        'uses-webp-images': 'warn',
        'efficient-animated-content': 'warn',

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
