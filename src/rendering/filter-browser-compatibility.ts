/**
 * @fileoverview Filter Browser Compatibility Matrix
 *
 * Tracks and reports browser compatibility for all PIXI filters,
 * providing a comprehensive compatibility matrix and known issues.
 *
 * @version 1.0.0
 */

// Browser compatibility tracking for PIXI filters

/**
 * Browser information
 */
export interface BrowserInfo {
  name: 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera' | 'unknown';
  version: string;
  platform: string;
  mobile: boolean;
  webgl: boolean;
  webgl2: boolean;
}

/**
 * Compatibility status for a filter
 */
export interface FilterCompatibilityStatus {
  filter: string;
  browser: BrowserInfo;
  status: 'full' | 'partial' | 'none' | 'untested';
  issues: string[];
  performance: 'excellent' | 'good' | 'poor' | 'unusable';
  lastTested: Date;
}

/**
 * Compatibility matrix for all filters
 */
export interface CompatibilityMatrix {
  filters: Map<string, Map<string, FilterCompatibilityStatus>>;
  summary: {
    totalFilters: number;
    totalBrowsers: number;
    fullCompatibility: number;
    partialCompatibility: number;
    noCompatibility: number;
  };
  recommendations: string[];
}

/**
 * FilterBrowserCompatibility - Browser compatibility tracking system
 *
 * Maintains a comprehensive matrix of filter compatibility across browsers,
 * including known issues, performance characteristics, and recommendations.
 */
export class FilterBrowserCompatibility {
  private static knownIssues: Record<string, Record<string, string[]>> = {
    displacement: {
      safari: [
        'May have rendering artifacts on older versions',
        'Performance degradation on iOS',
      ],
    },
    shockwave: {
      safari: ['Shader compilation issues on some devices'],
      firefox: ['Performance drops with multiple instances'],
    },
    crt: {
      edge: ['Scanline rendering may be incorrect on some GPUs'],
    },
    advancedBloom: {
      safari: ['Memory usage higher than other browsers'],
      firefox: ['Requires hardware acceleration enabled'],
    },
    backdrop: {
      safari: ['Not supported on iOS Safari < 15'],
      firefox: ['Requires WebGL2 context'],
    },
  };

  private static performanceRatings: Record<
    string,
    Record<string, 'excellent' | 'good' | 'poor'>
  > = {
    blur: {
      chrome: 'excellent',
      firefox: 'excellent',
      safari: 'good',
      edge: 'excellent',
    },
    displacement: {
      chrome: 'excellent',
      firefox: 'good',
      safari: 'poor',
      edge: 'excellent',
    },
    glow: {
      chrome: 'excellent',
      firefox: 'good',
      safari: 'good',
      edge: 'excellent',
    },
    ascii: {
      chrome: 'good',
      firefox: 'good',
      safari: 'good',
      edge: 'good',
    },
  };

  /**
   * Detect current browser information
   */
  static detectBrowser(): BrowserInfo {
    const ua = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();

    let name: BrowserInfo['name'] = 'unknown';
    let version = '0';

    if (ua.includes('chrome') && !ua.includes('edg')) {
      name = 'chrome';
      version = ua.match(/chrome\/(\d+)/)?.[1] || '0';
    } else if (ua.includes('firefox')) {
      name = 'firefox';
      version = ua.match(/firefox\/(\d+)/)?.[1] || '0';
    } else if (ua.includes('safari') && !ua.includes('chrome')) {
      name = 'safari';
      version = ua.match(/version\/(\d+)/)?.[1] || '0';
    } else if (ua.includes('edg')) {
      name = 'edge';
      version = ua.match(/edg\/(\d+)/)?.[1] || '0';
    } else if (ua.includes('opera') || ua.includes('opr')) {
      name = 'opera';
      version = ua.match(/(?:opera|opr)\/(\d+)/)?.[1] || '0';
    }

    const mobile = /mobile|android|ios|iphone|ipad|tablet/i.test(ua);

    // Detect WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    const gl2 = canvas.getContext('webgl2');

    return {
      name,
      version,
      platform,
      mobile,
      webgl: !!gl,
      webgl2: !!gl2,
    };
  }

  /**
   * Generate compatibility matrix for all filters
   */
  static async generateCompatibilityMatrix(
    filterNames: string[]
  ): Promise<CompatibilityMatrix> {
    const browsers: BrowserInfo['name'][] = [
      'chrome',
      'firefox',
      'safari',
      'edge',
    ];
    const matrix = new Map<string, Map<string, FilterCompatibilityStatus>>();

    for (const filter of filterNames) {
      const browserMap = new Map<string, FilterCompatibilityStatus>();

      for (const browserName of browsers) {
        const browser: BrowserInfo = {
          name: browserName,
          version: 'latest',
          platform: 'desktop',
          mobile: false,
          webgl: true,
          webgl2: true,
        };

        const status = this.getFilterCompatibility(filter, browser);
        browserMap.set(browserName, status);
      }

      matrix.set(filter, browserMap);
    }

    // Calculate summary
    let fullCompatibility = 0;
    let partialCompatibility = 0;
    let noCompatibility = 0;

    matrix.forEach((browserMap) => {
      browserMap.forEach((status) => {
        switch (status.status) {
          case 'full':
            fullCompatibility++;
            break;
          case 'partial':
            partialCompatibility++;
            break;
          case 'none':
            noCompatibility++;
            break;
        }
      });
    });

    return {
      filters: matrix,
      summary: {
        totalFilters: filterNames.length,
        totalBrowsers: browsers.length,
        fullCompatibility,
        partialCompatibility,
        noCompatibility,
      },
      recommendations: this.generateRecommendations(matrix),
    };
  }

  /**
   * Get compatibility status for a specific filter and browser
   */
  private static getFilterCompatibility(
    filter: string,
    browser: BrowserInfo
  ): FilterCompatibilityStatus {
    const filterIssues =
      this.knownIssues[filter as keyof typeof this.knownIssues];
    const issues =
      filterIssues?.[browser.name as keyof typeof filterIssues] || [];
    const filterPerf =
      this.performanceRatings[filter as keyof typeof this.performanceRatings];
    const performanceRating =
      filterPerf?.[browser.name as keyof typeof filterPerf] || 'good';

    // Determine status based on issues and WebGL support
    let status: FilterCompatibilityStatus['status'] = 'full';

    if (!browser.webgl) {
      status = 'none';
      issues.push('WebGL not supported');
    } else if (issues.length > 0) {
      status = 'partial';
    }

    // Special cases
    if (filter === 'backdrop' && !browser.webgl2) {
      status = 'partial';
      issues.push('Requires WebGL2 for full functionality');
    }

    if (
      browser.mobile &&
      ['displacement', 'shockwave', 'advancedBloom'].includes(filter)
    ) {
      status = 'partial';
      issues.push('Performance may be limited on mobile devices');
    }

    return {
      filter,
      browser,
      status,
      issues,
      performance: status === 'none' ? 'unusable' : performanceRating,
      lastTested: new Date(),
    };
  }

  /**
   * Generate recommendations based on compatibility matrix
   */
  private static generateRecommendations(
    matrix: Map<string, Map<string, FilterCompatibilityStatus>>
  ): string[] {
    const recommendations: string[] = [];
    const problematicFilters: Set<string> = new Set();
    const problematicBrowsers: Map<string, number> = new Map();

    matrix.forEach((browserMap, filter) => {
      let hasIssues = false;

      browserMap.forEach((status, browser) => {
        if (status.status !== 'full') {
          hasIssues = true;
          problematicBrowsers.set(
            browser,
            (problematicBrowsers.get(browser) || 0) + 1
          );
        }
      });

      if (hasIssues) {
        problematicFilters.add(filter);
      }
    });

    // Filter-specific recommendations
    if (problematicFilters.has('displacement')) {
      recommendations.push(
        '⚠️ Displacement filter has Safari compatibility issues - consider fallback options'
      );
    }

    if (problematicFilters.has('backdrop')) {
      recommendations.push(
        '📱 Backdrop blur requires WebGL2 - provide graceful degradation for older browsers'
      );
    }

    // Browser-specific recommendations
    problematicBrowsers.forEach((count, browser) => {
      if (count > 5) {
        recommendations.push(
          `🌐 ${browser} has compatibility issues with ${count} filters - consider browser-specific optimizations`
        );
      }
    });

    // General recommendations
    if (problematicFilters.size > matrix.size * 0.3) {
      recommendations.push(
        '🔧 Consider implementing feature detection and progressive enhancement'
      );
    }

    recommendations.push(
      '✅ Always test filters on target browsers before production deployment'
    );

    return recommendations;
  }

  /**
   * Generate HTML compatibility table
   */
  static generateHTMLTable(matrix: CompatibilityMatrix): string {
    const browsers = ['chrome', 'firefox', 'safari', 'edge'];
    let html = `
      <style>
        .compatibility-table {
          border-collapse: collapse;
          width: 100%;
          font-family: Arial, sans-serif;
        }
        .compatibility-table th,
        .compatibility-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: center;
        }
        .compatibility-table th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        .status-full { background-color: #4CAF50; color: white; }
        .status-partial { background-color: #FF9800; color: white; }
        .status-none { background-color: #F44336; color: white; }
        .status-untested { background-color: #9E9E9E; color: white; }
      </style>
      <table class="compatibility-table">
        <thead>
          <tr>
            <th>Filter</th>
            ${browsers.map((b) => `<th>${b.charAt(0).toUpperCase() + b.slice(1)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
    `;

    matrix.filters.forEach((browserMap, filter) => {
      html += '<tr>';
      html += `<td><strong>${filter}</strong></td>`;

      browsers.forEach((browser) => {
        const status = browserMap.get(browser);
        if (status) {
          const statusClass = `status-${status.status}`;
          const tooltip = status.issues.join('; ');
          html += `<td class="${statusClass}" title="${tooltip}">
            ${status.status === 'full' ? '✅' : status.status === 'partial' ? '⚠️' : '❌'}
          </td>`;
        } else {
          html += '<td class="status-untested">?</td>';
        }
      });

      html += '</tr>';
    });

    html += `
        </tbody>
      </table>
      <div style="margin-top: 20px;">
        <h3>Summary</h3>
        <p>✅ Full Compatibility: ${matrix.summary.fullCompatibility}</p>
        <p>⚠️ Partial Compatibility: ${matrix.summary.partialCompatibility}</p>
        <p>❌ No Compatibility: ${matrix.summary.noCompatibility}</p>
      </div>
    `;

    if (matrix.recommendations.length > 0) {
      html += `
        <div style="margin-top: 20px;">
          <h3>Recommendations</h3>
          <ul>
            ${matrix.recommendations.map((r) => `<li>${r}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    return html;
  }

  /**
   * Export compatibility matrix as JSON
   */
  static exportAsJSON(matrix: CompatibilityMatrix): string {
    const data = {
      generated: new Date().toISOString(),
      summary: matrix.summary,
      compatibility: {} as Record<
        string,
        Record<
          string,
          {
            status: string;
            issues: string[];
            performance: string;
          }
        >
      >,
      recommendations: matrix.recommendations,
    };

    for (const [filter, browserMap] of matrix.filters.entries()) {
      const filterObject: Record<
        string,
        {
          status: string;
          issues: string[];
          performance: string;
        }
      > = {};

      for (const [browser, status] of browserMap.entries()) {
        Object.assign(filterObject, {
          [browser]: {
            status: status.status,
            issues: status.issues,
            performance: status.performance,
          },
        });
      }

      Object.assign(data.compatibility, { [filter]: filterObject });
    }

    return JSON.stringify(data, null, 2);
  }
}
