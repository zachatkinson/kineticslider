#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const COVERAGE_THRESHOLDS = {
  statements: 85,
  branches: 85,
  functions: 85,
  lines: 85,
};

function enforceCoverage() {
  const coverageFile = path.join(
    process.cwd(),
    'coverage',
    'coverage-summary.json'
  );

  if (!fs.existsSync(coverageFile)) {
    console.error('❌ Coverage file not found. Run tests with coverage first.');
    process.exit(1);
  }

  const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
  const total = coverage.total;

  console.log('📊 Coverage Report:');
  console.log(`   Statements: ${total.statements.pct}%`);
  console.log(`   Branches:   ${total.branches.pct}%`);
  console.log(`   Functions:  ${total.functions.pct}%`);
  console.log(`   Lines:      ${total.lines.pct}%`);

  const failures = [];

  Object.entries(COVERAGE_THRESHOLDS).forEach(([metric, threshold]) => {
    const actual = total[metric].pct;
    if (actual < threshold) {
      failures.push(`${metric}: ${actual}% < ${threshold}%`);
    }
  });

  if (failures.length > 0) {
    console.error('\n❌ Coverage thresholds not met:');
    failures.forEach((failure) => console.error(`   ${failure}`));
    console.error('\n💡 Increase test coverage to meet minimum requirements.');
    process.exit(1);
  }

  console.log('\n✅ All coverage thresholds met!');
}

enforceCoverage();
