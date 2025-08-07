#!/usr/bin/env tsx

import fs from 'fs';

interface CoverageThresholds {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
}

interface CoverageMetric {
  pct: number;
  covered: number;
  skipped: number;
  total: number;
}

interface CoverageSummary {
  total: {
    statements: CoverageMetric;
    branches: CoverageMetric;
    functions: CoverageMetric;
    lines: CoverageMetric;
  };
}

const COVERAGE_THRESHOLDS: CoverageThresholds = {
  statements: 75,
  branches: 70,
  functions: 75,
  lines: 75,
};

function checkMetric(metric: keyof CoverageThresholds, actual: number, threshold: number): string | null {
  if (actual < threshold) {
    return `${metric}: ${actual}% < ${threshold}%`;
  }
  return null;
}

function enforceCoverage(): void {
  const coverageFilePath = './coverage/coverage-summary.json';

  try {
    const coverageData = fs.readFileSync(coverageFilePath, 'utf8');
    const coverage: CoverageSummary = JSON.parse(coverageData);
    const total = coverage.total;

    process.stdout.write('📊 Coverage Report:\n');
    process.stdout.write(`   Statements: ${total.statements.pct}%\n`);
    process.stdout.write(`   Branches:   ${total.branches.pct}%\n`);
    process.stdout.write(`   Functions:  ${total.functions.pct}%\n`);
    process.stdout.write(`   Lines:      ${total.lines.pct}%\n`);

    const failures: string[] = [];

    // Check statements
    const statementsFailure = checkMetric('statements', total.statements.pct, COVERAGE_THRESHOLDS.statements);
    if (statementsFailure) failures.push(statementsFailure);

    // Check branches  
    const branchesFailure = checkMetric('branches', total.branches.pct, COVERAGE_THRESHOLDS.branches);
    if (branchesFailure) failures.push(branchesFailure);

    // Check functions
    const functionsFailure = checkMetric('functions', total.functions.pct, COVERAGE_THRESHOLDS.functions);
    if (functionsFailure) failures.push(functionsFailure);

    // Check lines
    const linesFailure = checkMetric('lines', total.lines.pct, COVERAGE_THRESHOLDS.lines);
    if (linesFailure) failures.push(linesFailure);

    if (failures.length > 0) {
      process.stderr.write('\n❌ Coverage thresholds not met:\n');
      for (const failure of failures) {
        process.stderr.write(`   ${failure}\n`);
      }
      process.stderr.write('\n💡 Increase test coverage to meet minimum requirements.\n');
      process.exit(1);
    }

    process.stdout.write('\n✅ All coverage thresholds met!\n');
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      process.stderr.write('❌ Coverage file not found. Run tests with coverage first.\n');
    } else {
      process.stderr.write(`❌ Error reading coverage file: ${String(error)}\n`);
    }
    process.exit(1);
  }
}

enforceCoverage();
