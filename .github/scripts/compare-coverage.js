#!/usr/bin/env node

const fs = require('fs');

function compareCoverage(beforeFile, afterFile) {
  try {
    const before = JSON.parse(fs.readFileSync(beforeFile, 'utf8'));
    const after = JSON.parse(fs.readFileSync(afterFile, 'utf8'));

    const beforeCoverage = before.coverageMap || before;
    const afterCoverage = after.coverageMap || after;

    // Calculate overall coverage percentages
    const beforePct = calculateOverallCoverage(beforeCoverage);
    const afterPct = calculateOverallCoverage(afterCoverage);

    const diff = afterPct - beforePct;
    const diffStr = diff >= 0 ? `+${diff.toFixed(2)}%` : `${diff.toFixed(2)}%`;

    console.log(`- Before: ${beforePct.toFixed(2)}%`);
    console.log(`- After: ${afterPct.toFixed(2)}%`);
    console.log(`- Change: ${diffStr}`);

    if (diff < -5) {
      console.log('⚠️ **Significant coverage decrease detected**');
    } else if (diff > 5) {
      console.log('✅ **Coverage improved**');
    } else {
      console.log('ℹ️ Coverage change within acceptable range');
    }
  } catch (error) {
    console.log('❌ Unable to compare coverage:', error.message);
  }
}

function calculateOverallCoverage(coverageMap) {
  let totalStatements = 0;
  let coveredStatements = 0;

  for (const file in coverageMap) {
    const fileCoverage = coverageMap[file];
    if (fileCoverage.s) {
      totalStatements += Object.keys(fileCoverage.s).length;
      coveredStatements += Object.values(fileCoverage.s).filter(
        (count) => count > 0
      ).length;
    }
  }

  return totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0;
}

const [beforeFile, afterFile] = process.argv.slice(2);
if (beforeFile && afterFile) {
  compareCoverage(beforeFile, afterFile);
} else {
  console.log('Usage: node compare-coverage.js <before.json> <after.json>');
}
