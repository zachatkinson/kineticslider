const fs = require('fs');

// Coverage thresholds
const COVERAGE_THRESHOLDS = {
  statements: 80,
  branches: 70,
  functions: 80,
  lines: 80
};

// Helper to calculate coverage metrics
function calculateCoverageMetrics(coverage) {
  const totals = {
    statements: { total: 0, covered: 0 },
    branches: { total: 0, covered: 0 },
    functions: { total: 0, covered: 0 },
    lines: { total: 0, covered: 0 }
  };

  Object.values(coverage).forEach(file => {
    // Statements coverage
    Object.values(file.s || {}).forEach(count => {
      totals.statements.total++;
      if (count > 0) totals.statements.covered++;
    });

    // Branches coverage
    Object.values(file.b || {}).forEach(counts => {
      totals.branches.total += counts.length;
      totals.branches.covered += counts.filter(count => count > 0).length;
    });

    // Functions coverage
    Object.values(file.f || {}).forEach(count => {
      totals.functions.total++;
      if (count > 0) totals.functions.covered++;
    });

    // Lines coverage
    Object.values(file.l || {}).forEach(count => {
      totals.lines.total++;
      if (count > 0) totals.lines.covered++;
    });
  });

  return totals;
}

// Calculate coverage percentage
function calculatePercentage(covered, total) {
  return total === 0 ? 100 : Math.round((covered / total) * 100 * 100) / 100;
}

// Format coverage change
function formatChange(before, after) {
  const change = after - before;
  return change >= 0 ? `+${change.toFixed(2)}%` : `${change.toFixed(2)}%`;
}

// Determine if coverage change is significant
function isSignificantChange(metric, before, after) {
  const threshold = COVERAGE_THRESHOLDS[metric];
  const change = Math.abs(after - before);
  
  // Consider it significant if:
  // 1. Change is more than 1%
  // 2. Coverage drops below threshold
  return change > 1 || (before >= threshold && after < threshold);
}

try {
  // Read coverage files
  const beforeCoverage = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const afterCoverage = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));

  // Calculate metrics
  const beforeMetrics = calculateCoverageMetrics(beforeCoverage);
  const afterMetrics = calculateCoverageMetrics(afterCoverage);

  let report = '### Test Coverage Changes\n\n';
  report += '| Metric | Before | After | Change | Status |\n';
  report += '|---------|---------|--------|---------|--------|\n';

  let hasSignificantChange = false;
  let hasCoverageRegression = false;

  // Compare each metric
  Object.entries(beforeMetrics).forEach(([metric, before]) => {
    const after = afterMetrics[metric];
    const beforePct = calculatePercentage(before.covered, before.total);
    const afterPct = calculatePercentage(after.covered, after.total);
    const change = formatChange(beforePct, afterPct);
    
    let status = '✅';
    if (afterPct < COVERAGE_THRESHOLDS[metric]) {
      status = '❌';
      hasCoverageRegression = true;
    } else if (afterPct < beforePct) {
      status = '⚠️';
      hasCoverageRegression = true;
    }

    if (isSignificantChange(metric, beforePct, afterPct)) {
      hasSignificantChange = true;
    }

    report += `| ${metric} | ${beforePct.toFixed(2)}% | ${afterPct.toFixed(2)}% | ${change} | ${status} |\n`;
  });

  // Add detailed changes for significant regressions
  if (hasSignificantChange) {
    report += '\n### Significant Coverage Changes\n\n';
    
    // Compare file by file
    const allFiles = new Set([
      ...Object.keys(beforeCoverage),
      ...Object.keys(afterCoverage)
    ]);

    allFiles.forEach(file => {
      const beforeFile = beforeCoverage[file];
      const afterFile = afterCoverage[file];

      if (!beforeFile || !afterFile) {
        report += `- ${file}: ${!beforeFile ? 'New file' : 'Removed'}\n`;
        return;
      }

      const beforeMetrics = calculateCoverageMetrics({ [file]: beforeFile });
      const afterMetrics = calculateCoverageMetrics({ [file]: afterFile });
      
      const beforePct = calculatePercentage(
        beforeMetrics.lines.covered,
        beforeMetrics.lines.total
      );
      const afterPct = calculatePercentage(
        afterMetrics.lines.covered,
        afterMetrics.lines.total
      );

      if (Math.abs(afterPct - beforePct) > 5) {
        report += `- ${file}: ${formatChange(beforePct, afterPct)}\n`;
      }
    });
  }

  // Add summary
  report += '\n### Summary\n';
  if (hasCoverageRegression) {
    report += '⚠️ Coverage regression detected. Please review the changes.\n';
  } else {
    report += '✅ No significant coverage regressions detected.\n';
  }

  // Write report
  console.log(report);
  process.exit(hasCoverageRegression ? 1 : 0);
} catch (error) {
  console.error('Error comparing coverage:', error.message);
  process.exit(1);
} 