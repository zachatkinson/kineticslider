const fs = require('fs');
const path = require('path');

// Configuration
const ERROR_RATE_THRESHOLD = 0.05; // 5% error rate threshold
const MEMORY_THRESHOLD_MB = 4096; // 4GB memory threshold
const CPU_THRESHOLD_PERCENT = 80; // 80% CPU threshold

// Paths to check for errors
const ERROR_PATHS = {
  next: path.resolve('./.next/error.log'),
  test: path.resolve('./coverage/coverage-final.json'),
  build: path.resolve('./logs/build-errors.log')
};

// Helper function to check if file exists
const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    console.warn(`Error checking file ${filePath}:`, error.message);
    return false;
  }
};

// Parse Next.js error log
const parseNextErrors = () => {
  if (!fileExists(ERROR_PATHS.next)) return 0;
  try {
    const content = fs.readFileSync(ERROR_PATHS.next, 'utf8');
    return content.split('\n').filter(line => line.includes('[Error]')).length;
  } catch (error) {
    console.error('Error parsing Next.js error log:', error.message);
    return 0;
  }
};

// Parse test coverage errors
const parseTestErrors = () => {
  if (!fileExists(ERROR_PATHS.test)) return 0;
  try {
    const coverage = JSON.parse(fs.readFileSync(ERROR_PATHS.test, 'utf8'));
    return Object.values(coverage).reduce((total, file) => {
      return total + (file.s ? Object.values(file.s).filter(v => v === 0).length : 0);
    }, 0);
  } catch (error) {
    console.error('Error parsing test coverage:', error.message);
    return 0;
  }
};

// Check resource usage
const checkResourceUsage = () => {
  const usage = process.memoryUsage();
  const memoryUsageMB = usage.heapUsed / 1024 / 1024;
  const cpuUsage = process.cpuUsage();
  const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds

  return {
    memory: {
      used: Math.round(memoryUsageMB),
      threshold: MEMORY_THRESHOLD_MB,
      exceeded: memoryUsageMB > MEMORY_THRESHOLD_MB
    },
    cpu: {
      percent: Math.round(cpuPercent),
      threshold: CPU_THRESHOLD_PERCENT,
      exceeded: cpuPercent > CPU_THRESHOLD_PERCENT
    }
  };
};

// Generate error report
const generateReport = () => {
  const nextErrors = parseNextErrors();
  const testErrors = parseTestErrors();
  const totalErrors = nextErrors + testErrors;
  const resourceUsage = checkResourceUsage();

  const report = {
    timestamp: new Date().toISOString(),
    errors: {
      total: totalErrors,
      next: nextErrors,
      test: testErrors,
      rate: totalErrors / 100 // Simplified error rate calculation
    },
    resources: resourceUsage
  };

  // Write report to file
  try {
    fs.writeFileSync(
      './error-report.json',
      JSON.stringify(report, null, 2)
    );
  } catch (error) {
    console.error('Error writing report:', error.message);
  }

  return report;
};

// Main execution
try {
  const report = generateReport();
  console.log('Error Monitoring Report:', JSON.stringify(report, null, 2));

  // Check thresholds and exit with error if exceeded
  if (report.errors.rate > ERROR_RATE_THRESHOLD ||
      report.resources.memory.exceeded ||
      report.resources.cpu.exceeded) {
    console.error('Error thresholds exceeded!');
    process.exit(1);
  }

  process.exit(0);
} catch (error) {
  console.error('Fatal error in monitoring script:', error.message);
  process.exit(1);
} 