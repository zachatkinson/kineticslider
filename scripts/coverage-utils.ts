/**
 * @fileoverview Coverage Utilities for E2E Tests
 * 
 * Utilities for collecting and merging coverage data from Playwright E2E tests
 * using Istanbul/NYC for comprehensive coverage reporting with Codecov integration.
 * 
 * @version 1.0.0
 */

/* eslint-disable no-console, security/detect-non-literal-fs-filename */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'fs';
import { join } from 'path';
import libCoverage from 'istanbul-lib-coverage';
import libReports from 'istanbul-reports';
import libReport from 'istanbul-lib-report';

// Extract types and functions from the imported modules
const { createCoverageMap } = libCoverage;
const { create } = libReports;
type CoverageMap = ReturnType<typeof createCoverageMap>;

/**
 * Coverage collection and merging utilities
 */
export class CoverageUtils {
  private static readonly COVERAGE_DIR = './coverage';
  private static readonly NYC_OUTPUT_DIR = './coverage/.nyc_output';
  private static readonly MERGED_DIR = './coverage/merged';

  /**
   * Initialize coverage directories
   */
  static initializeCoverageDirs(): void {
    const dirs = [
      CoverageUtils.COVERAGE_DIR,
      CoverageUtils.NYC_OUTPUT_DIR,
      CoverageUtils.MERGED_DIR,
    ];

    dirs.forEach((dir) => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
        console.log(`📁 Created coverage directory: ${dir}`);
      }
    });
  }

  /**
   * Collect coverage from instrumented code in E2E tests
   */
  static async collectE2ECoverage(): Promise<void> {
    try {
      console.log('🎭 Collecting E2E coverage data...');
      
      // Run Playwright tests with coverage collection enabled
      execSync(
        'COVERAGE=true pnpm playwright test --reporter=dot',
        { 
          stdio: 'inherit',
          env: { 
            ...process.env, 
            COVERAGE: 'true',
            NODE_ENV: 'test'
          }
        }
      );

      console.log('✅ E2E coverage collection completed');
    } catch (error) {
      console.error('❌ E2E coverage collection failed:', error);
      throw error;
    }
  }

  /**
   * Merge unit test and E2E coverage reports
   */
  static mergeCoverageReports(): void {
    try {
      console.log('🔀 Merging coverage reports...');

      // Find all coverage files
      const unitCoverageFile = join(CoverageUtils.COVERAGE_DIR, 'coverage-final.json');
      const e2eCoverageFiles = CoverageUtils.findE2ECoverageFiles();

      if (!existsSync(unitCoverageFile)) {
        console.warn('⚠️  No unit test coverage found, proceeding with E2E coverage only');
      }

      // Create coverage map for merging
      const mergedCoverage = createCoverageMap();

      // Add unit test coverage if exists
      if (existsSync(unitCoverageFile)) {
        const unitCoverage = JSON.parse(readFileSync(unitCoverageFile, 'utf-8'));
        mergedCoverage.merge(unitCoverage);
        console.log('📊 Added unit test coverage');
      }

      // Add E2E coverage files
      e2eCoverageFiles.forEach((file) => {
        try {
          const coverage = JSON.parse(readFileSync(file, 'utf-8'));
          mergedCoverage.merge(coverage);
          console.log(`📊 Added E2E coverage: ${file}`);
        } catch {
          console.warn(`⚠️  Skipping invalid coverage file: ${file}`);
        }
      });

      // Write merged coverage
      const mergedFile = join(CoverageUtils.MERGED_DIR, 'coverage-final.json');
      writeFileSync(mergedFile, JSON.stringify(mergedCoverage.toJSON()));
      console.log(`✅ Merged coverage written to: ${mergedFile}`);

      // Generate reports
      CoverageUtils.generateReports(mergedCoverage);

    } catch (error) {
      console.error('❌ Coverage merge failed:', error);
      throw error;
    }
  }

  /**
   * Generate coverage reports in multiple formats
   */
  private static generateReports(coverageMap: CoverageMap): void {
    try {
      console.log('📈 Generating coverage reports...');

      const context = libReport.createContext({
        dir: CoverageUtils.MERGED_DIR,
        coverageMap,
      });

      // Generate LCOV for Codecov
      const lcovReport = create('lcov', {});
      lcovReport.execute(context);
      console.log('✅ Generated LCOV report for Codecov');

      // Generate HTML for local viewing
      const htmlReport = create('html', {});
      htmlReport.execute(context);
      console.log('✅ Generated HTML report');

      // Generate text summary for CI logs
      const textReport = create('text-summary', {});
      textReport.execute(context);
      console.log('✅ Generated text summary');

      // Generate JSON summary for threshold checking
      const jsonSummaryReport = create('json-summary', {});
      jsonSummaryReport.execute(context);
      console.log('✅ Generated JSON summary');

    } catch (error) {
      console.error('❌ Report generation failed:', error);
      throw error;
    }
  }

  /**
   * Find E2E coverage files from NYC output
   */
  private static findE2ECoverageFiles(): string[] {
    const files: string[] = [];
    
    try {
      
      // Check NYC output directory
      if (existsSync(CoverageUtils.NYC_OUTPUT_DIR)) {
        const nycFiles = readdirSync(CoverageUtils.NYC_OUTPUT_DIR)
          .filter((file: string) => file.endsWith('.json'))
          .map((file: string) => join(CoverageUtils.NYC_OUTPUT_DIR, file));
        
        files.push(...nycFiles);
      }

      // Check for global coverage object from browser
      const globalCoverageFile = join(CoverageUtils.COVERAGE_DIR, 'e2e-coverage.json');
      if (existsSync(globalCoverageFile)) {
        files.push(globalCoverageFile);
      }

      console.log(`📁 Found ${files.length} E2E coverage files`);
      return files;
      
    } catch (error) {
      console.warn('⚠️  Error finding E2E coverage files:', error);
      return [];
    }
  }

  /**
   * Extract coverage data from browser after E2E tests
   */
  static extractBrowserCoverage(): string {
    return `
      // Extract coverage from global window object
      const coverage = window.__coverage__;
      if (coverage) {
        // This code runs in the browser, so we use browser APIs
        console.log('✅ Coverage data found in browser');
        return coverage;
      } else {
        console.warn('⚠️  No coverage data found in browser');
        return null;
      }
    `;
  }

  /**
   * Clean up old coverage files
   */
  static cleanup(): void {
    try {
      console.log('🧹 Cleaning up old coverage files...');
      
      
      // Remove NYC temp directory
      if (existsSync(CoverageUtils.NYC_OUTPUT_DIR)) {
        rmSync(CoverageUtils.NYC_OUTPUT_DIR, { recursive: true, force: true });
      }
      
      // Remove temporary E2E coverage file
      const tempFile = join(CoverageUtils.COVERAGE_DIR, 'e2e-coverage.json');
      if (existsSync(tempFile)) {
        rmSync(tempFile, { force: true });
      }
      
      console.log('✅ Coverage cleanup completed');
    } catch (error) {
      console.warn('⚠️  Coverage cleanup failed:', error);
    }
  }
}

/**
 * Main coverage workflow
 */
export async function runCoverageWorkflow(): Promise<void> {
  try {
    console.log('🚀 Starting comprehensive coverage workflow...');
    
    // Initialize directories
    CoverageUtils.initializeCoverageDirs();
    
    // Clean up old files
    CoverageUtils.cleanup();
    
    // Collect E2E coverage (if not already collected)
    if (process.argv.includes('--collect-e2e')) {
      await CoverageUtils.collectE2ECoverage();
    }
    
    // Merge all coverage reports
    CoverageUtils.mergeCoverageReports();
    
    console.log('✅ Coverage workflow completed successfully');
    
  } catch (error) {
    console.error('❌ Coverage workflow failed:', error);
    process.exit(1);
  }
}

// CLI interface - ES modules don't have require.main, so we'll always run
// This file is only invoked from CI, so it's safe to always execute
void runCoverageWorkflow();