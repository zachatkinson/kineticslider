const fs = require('fs');

// Enhanced performance thresholds based on Core Web Vitals
const thresholds = {
  performance: 90,
  accessibility: 90,
  'best-practices': 90,
  seo: 90,
  pwa: 90,
  FCP: 1800,
  LCP: 2500,
  CLS: 0.1,
  TTI: 3800,
  TBT: 200,
  // Additional metrics
  FMP: 2000,
  Speed_Index: 3000,
  First_Input_Delay: 100,
  Time_to_First_Byte: 600,
  DOM_Size: 1500,
  Resource_Size: 2000000 // 2MB
};

// Error handling wrapper
function safeParseJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    console.error(`Error reading/parsing file ${file}:`, error.message);
    process.exit(1);
  }
}

// Validate results format
function validateResults(results) {
  if (!Array.isArray(results)) {
    throw new Error('Invalid results format: expected array');
  }
  if (results.length === 0) {
    throw new Error('No Lighthouse results found');
  }
  return results;
}

// Read and validate Lighthouse results
const resultsFile = process.argv[2];
if (!resultsFile) {
  console.error('No results file specified');
  process.exit(1);
}

const results = validateResults(safeParseJSON(resultsFile));

// Calculate metrics with error handling
function calculateMetrics(runs) {
  try {
    return runs.map(run => ({
      performance: run.categories.performance.score * 100,
      accessibility: run.categories.accessibility.score * 100,
      'best-practices': run.categories['best-practices'].score * 100,
      seo: run.categories.seo.score * 100,
      pwa: run.categories.pwa?.score * 100 || 0,
      FCP: run.audits['first-contentful-paint'].numericValue,
      LCP: run.audits['largest-contentful-paint'].numericValue,
      CLS: run.audits['cumulative-layout-shift'].numericValue,
      TTI: run.audits['interactive'].numericValue,
      TBT: run.audits['total-blocking-time'].numericValue,
      // Additional metrics
      FMP: run.audits['first-meaningful-paint']?.numericValue,
      Speed_Index: run.audits['speed-index']?.numericValue,
      First_Input_Delay: run.audits['max-potential-fid']?.numericValue,
      Time_to_First_Byte: run.audits['server-response-time']?.numericValue,
      DOM_Size: run.audits['dom-size']?.numericValue,
      Resource_Size: run.audits['total-byte-weight']?.numericValue
    }));
  } catch (error) {
    console.error('Error calculating metrics:', error.message);
    process.exit(1);
  }
}

const metrics = calculateMetrics(results);

// Calculate statistics
function calculateStats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: values.reduce((a, b) => a + b, 0) / values.length,
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    stdDev: Math.sqrt(
      values.reduce((sq, n) => sq + Math.pow(n - (values.reduce((a, b) => a + b, 0) / values.length), 2), 0) / (values.length - 1)
    )
  };
}

// Generate detailed report
console.log('# Performance Analysis Report\n');

// Core Web Vitals
console.log('## Core Web Vitals\n');
console.log('| Metric | Value (avg) | P95 | Threshold | Status | Consistency |');
console.log('|---------|------------|-----|-----------|---------|-------------|');

Object.entries(thresholds).forEach(([metric, threshold]) => {
  const values = metrics.map(m => m[metric]).filter(v => v !== undefined);
  if (values.length === 0) return;

  const stats = calculateStats(values);
  const status = metric === 'CLS' 
    ? (stats.avg <= threshold ? '✅' : '❌')
    : (stats.avg >= threshold ? '✅' : '❌');
  
  const consistency = stats.stdDev < (stats.avg * 0.1) ? '🟢 High' : '🟡 Medium';
  
  const formattedValue = metric === 'CLS' 
    ? stats.avg.toFixed(3)
    : metric.includes('Size') 
      ? `${Math.round(stats.avg / 1024)}KB`
      : metric.endsWith('time') || ['FCP', 'LCP', 'TTI', 'FMP', 'Speed_Index'].includes(metric)
        ? `${Math.round(stats.avg)}ms`
        : `${Math.round(stats.avg)}%`;

  const formattedThreshold = metric === 'CLS'
    ? `≤ ${threshold}`
    : metric.includes('Size')
      ? `≤ ${Math.round(threshold / 1024)}KB`
      : metric.endsWith('time') || ['FCP', 'LCP', 'TTI', 'FMP', 'Speed_Index'].includes(metric)
        ? `≤ ${threshold}ms`
        : `≥ ${threshold}%`;

  console.log(`| ${metric} | ${formattedValue} | ${Math.round(stats.p95)} | ${formattedThreshold} | ${status} | ${consistency} |`);
});

// Performance Summary
console.log('\n## Performance Summary\n');
const failedMetrics = Object.entries(thresholds).filter(([metric, threshold]) => {
  const values = metrics.map(m => m[metric]).filter(v => v !== undefined);
  if (values.length === 0) return false;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return metric === 'CLS' ? avg > threshold : avg < threshold;
});

if (failedMetrics.length > 0) {
  console.log('⚠️ Performance issues detected:\n');
  failedMetrics.forEach(([metric, threshold]) => {
    const values = metrics.map(m => m[metric]).filter(v => v !== undefined);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    console.log(`- ${metric}: ${Math.round(avg * 100) / 100} (Threshold: ${threshold})`);
  });
} else {
  console.log('✅ All performance metrics are within acceptable thresholds.\n');
}

// Resource Usage
console.log('\n## Resource Usage\n');
const resourceMetrics = metrics[0];
if (resourceMetrics.DOM_Size && resourceMetrics.Resource_Size) {
  console.log('| Metric | Value | Threshold | Status |');
  console.log('|---------|--------|-----------|---------|');
  console.log(`| DOM Elements | ${Math.round(resourceMetrics.DOM_Size)} | ≤ ${thresholds.DOM_Size} | ${resourceMetrics.DOM_Size <= thresholds.DOM_Size ? '✅' : '❌'} |`);
  console.log(`| Total Resources | ${Math.round(resourceMetrics.Resource_Size / 1024)}KB | ≤ ${Math.round(thresholds.Resource_Size / 1024)}KB | ${resourceMetrics.Resource_Size <= thresholds.Resource_Size ? '✅' : '❌'} |`);
}

// Recommendations
console.log('\n## Recommendations\n');
failedMetrics.forEach(([metric, threshold]) => {
  const values = metrics.map(m => m[metric]).filter(v => v !== undefined);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const diff = metric === 'CLS' ? avg - threshold : threshold - avg;
  
  console.log(`### ${metric} Improvement\n`);
  console.log(`Current: ${Math.round(avg * 100) / 100}`);
  console.log(`Target: ${threshold}`);
  console.log(`Gap: ${Math.round(diff * 100) / 100}\n`);
  
  switch(metric) {
    case 'FCP':
    case 'LCP':
      console.log('- Consider implementing image optimization');
      console.log('- Review server response times');
      console.log('- Implement proper caching strategies');
      break;
    case 'CLS':
      console.log('- Review layout stability');
      console.log('- Implement proper image dimensions');
      console.log('- Review dynamic content loading');
      break;
    case 'TTI':
    case 'TBT':
      console.log('- Review JavaScript execution time');
      console.log('- Implement code splitting');
      console.log('- Optimize third-party scripts');
      break;
    default:
      console.log('- Review performance metrics');
      console.log('- Implement suggested optimizations');
      console.log('- Monitor for regressions');
  }
  console.log('');
});

// Exit with error if performance budgets are exceeded
process.exit(failedMetrics.length > 0 ? 1 : 0); 