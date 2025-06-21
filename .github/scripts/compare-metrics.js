#!/usr/bin/env node

const fs = require('fs');

function compareMetrics() {
  try {
    const before = JSON.parse(
      fs.readFileSync('lighthouse-before.json', 'utf8')
    );
    const after = JSON.parse(fs.readFileSync('lighthouse-after.json', 'utf8'));

    const report = [];

    // Compare key metrics
    const metrics = [
      'first-contentful-paint',
      'largest-contentful-paint',
      'cumulative-layout-shift',
      'total-blocking-time',
      'speed-index',
    ];

    report.push('| Metric | Before | After | Change |');
    report.push('|--------|--------|-------|--------|');

    metrics.forEach((metric) => {
      const beforeValue = getMetricValue(before, metric);
      const afterValue = getMetricValue(after, metric);

      if (beforeValue !== null && afterValue !== null) {
        const change = afterValue - beforeValue;
        const changeStr = change >= 0 ? `+${change}` : `${change}`;
        const changeIcon = change > 0 ? '⚠️' : change < 0 ? '✅' : 'ℹ️';

        report.push(
          `| ${metric} | ${beforeValue} | ${afterValue} | ${changeIcon} ${changeStr} |`
        );
      }
    });

    // Compare performance scores
    const beforePerf = getPerformanceScore(before);
    const afterPerf = getPerformanceScore(after);

    if (beforePerf !== null && afterPerf !== null) {
      const perfChange = afterPerf - beforePerf;
      const perfChangeStr =
        perfChange >= 0 ? `+${perfChange}` : `${perfChange}`;

      report.push('');
      report.push('### Performance Score');
      report.push(`- Before: ${beforePerf}`);
      report.push(`- After: ${afterPerf}`);
      report.push(`- Change: ${perfChangeStr}`);

      if (perfChange < -5) {
        report.push('⚠️ **Significant performance regression detected**');
      } else if (perfChange > 5) {
        report.push('✅ **Performance improved**');
      }
    }

    fs.writeFileSync('performance-report.md', report.join('\n'));
    console.log('Performance comparison completed');
  } catch (error) {
    console.log('❌ Unable to compare metrics:', error.message);
    fs.writeFileSync(
      'performance-report.md',
      'Unable to generate performance comparison'
    );
  }
}

function getMetricValue(lighthouse, metric) {
  try {
    return lighthouse.lhr?.audits?.[metric]?.numericValue || null;
  } catch {
    return null;
  }
}

function getPerformanceScore(lighthouse) {
  try {
    return Math.round(
      (lighthouse.lhr?.categories?.performance?.score || 0) * 100
    );
  } catch {
    return null;
  }
}

compareMetrics();
