const fs = require('fs');

// Core Web Vitals thresholds
const THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  CLS: { good: 0.1, poor: 0.25 },
  FID: { good: 100, poor: 300 },
  TTI: { good: 3800, poor: 7300 }
};

// Validate input files
function validateInputFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Input file not found: ${filePath}`);
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Error reading/parsing ${filePath}: ${error.message}`);
  }
}

// Calculate statistics for an array of numbers
function calculateStats(values) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error('Invalid input: empty or non-array values');
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const avg = sum / sorted.length;
  const p95Index = Math.floor(sorted.length * 0.95);
  const p95 = sorted[p95Index];
  
  // Calculate standard deviation
  const squareDiffs = sorted.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / sorted.length;
  const stdDev = Math.sqrt(avgSquareDiff);

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: Math.round(avg * 100) / 100,
    p95: Math.round(p95 * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100
  };
}

// Format milliseconds for display
function formatMs(value) {
  return `${value}ms`;
}

// Calculate percentage change
function calculateChange(before, after) {
  const change = ((after - before) / before) * 100;
  return Math.round(change * 100) / 100;
}

// Determine if a change is significant
function isSignificantChange(metric, before, after) {
  const threshold = THRESHOLDS[metric];
  if (!threshold) return Math.abs(calculateChange(before, after)) > 5;
  
  const beforeCategory = before <= threshold.good ? 'good' : before <= threshold.poor ? 'needs-improvement' : 'poor';
  const afterCategory = after <= threshold.good ? 'good' : after <= threshold.poor ? 'needs-improvement' : 'poor';
  
  return beforeCategory !== afterCategory;
}

// Main execution
try {
  const beforeMetrics = validateInputFile('before-metrics.json');
  const afterMetrics = validateInputFile('after-metrics.json');

  let report = '# Performance Comparison Report\n\n';
  let hasRegression = false;

  for (const metric of Object.keys(THRESHOLDS)) {
    if (!beforeMetrics[metric] || !afterMetrics[metric]) {
      console.warn(`Missing data for metric: ${metric}`);
      continue;
    }

    const beforeStats = calculateStats(beforeMetrics[metric]);
    const afterStats = calculateStats(afterMetrics[metric]);
    
    const avgChange = calculateChange(beforeStats.avg, afterStats.avg);
    const p95Change = calculateChange(beforeStats.p95, afterStats.p95);
    
    report += `## ${metric}\n`;
    report += '| Statistic | Before | After | Change |\n';
    report += '|-----------|--------|-------|--------|\n';
    report += `| Average | ${formatMs(beforeStats.avg)} | ${formatMs(afterStats.avg)} | ${avgChange}% |\n`;
    report += `| P95 | ${formatMs(beforeStats.p95)} | ${formatMs(afterStats.p95)} | ${p95Change}% |\n`;
    report += `| Std Dev | ${formatMs(beforeStats.stdDev)} | ${formatMs(afterStats.stdDev)} | - |\n`;
    report += `| Min | ${formatMs(beforeStats.min)} | ${formatMs(afterStats.min)} | - |\n`;
    report += `| Max | ${formatMs(beforeStats.max)} | ${formatMs(afterStats.max)} | - |\n\n`;

    if (isSignificantChange(metric, beforeStats.avg, afterStats.avg)) {
      hasRegression = hasRegression || afterStats.avg > beforeStats.avg;
      report += `⚠️ **Significant change detected in ${metric}**\n\n`;
    }
  }

  // Add summary
  report += '## Summary\n';
  if (hasRegression) {
    report += '⛔ **Performance regression detected!** Please review the changes.\n';
  } else {
    report += '✅ No significant performance regressions detected.\n';
  }

  // Write report
  fs.writeFileSync('performance-report.md', report);
  
  // Exit with error if regression detected
  process.exit(hasRegression ? 1 : 0);
} catch (error) {
  console.error('Error generating performance report:', error.message);
  process.exit(1);
} 