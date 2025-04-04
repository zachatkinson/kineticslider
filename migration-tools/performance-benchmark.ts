import type { PerformanceResult, TestConfig } from '../src/types/migration';
const BENCHMARK_STORAGE_KEY = 'kinetic-slider-benchmark-results';

export const loadBenchmarkResults = (): PerformanceResult[] => {
    try {
        const savedResults = localStorage.getItem(BENCHMARK_STORAGE_KEY);
        if (savedResults) {
            const parsed = JSON.parse(savedResults);
            return parsed.map((result: Record<string, unknown>) => ({
                ...result,
                timestamp: new Date(result.timestamp as string | number | Date)
            }));
        }
    }
    catch (error) {
        console.warn('Failed to load benchmark results from localStorage:', error);
    }
    return [];
};

export const saveBenchmarkResults = (results: PerformanceResult[]): void => {
    try {
        localStorage.setItem(BENCHMARK_STORAGE_KEY, JSON.stringify(results));
    }
    catch (error) {
        console.warn('Failed to save benchmark results to localStorage:', error);
    }
};

export const addBenchmarkResult = (result: PerformanceResult): void => {
    const results = loadBenchmarkResults();
    results.push(result);
    saveBenchmarkResults(results);
};

export const clearBenchmarkResults = (): void => {
    try {
        localStorage.removeItem(BENCHMARK_STORAGE_KEY);
    }
    catch (error) {
        console.warn('Failed to clear benchmark results from localStorage:', error);
    }
};

export const measureExecutionTime = async (fn: () => Promise<void> | void, config: TestConfig): Promise<PerformanceResult> => {
    const start = performance.now();
    await fn();
    const end = performance.now();
    const duration = end - start;
    const result: PerformanceResult = {
        name: config.name,
        duration,
        timestamp: new Date(),
        metricType: config.metricType,
        implementation: config.implementation,
        testContext: config.testContext,
        value: duration,
        unit: 'ms'
    };
    addBenchmarkResult(result);
    return result;
};

export const measureAnimationSmoothness = async (startAnimationFn: () => void, durationMs: number, config: TestConfig): Promise<PerformanceResult> => {
    return new Promise((resolve) => {
        let frameCount = 0;
        let lastFrameTime = performance.now();
        const frameTimes: number[] = [];
        const recordFrame = (): void => {
            const now = performance.now();
            const frameTime = now - lastFrameTime;
            lastFrameTime = now;
            if (frameTime > 5) {
                frameTimes.push(frameTime);
                frameCount++;
            }
            if (now - lastFrameTime < durationMs) {
                requestAnimationFrame(recordFrame);
            }
            else {
                const totalTime = frameTimes.reduce((sum, time) => sum + time, 0);
                const fps = (frameCount * 1000) / totalTime;
                const result: PerformanceResult = {
                    name: config.name,
                    duration: totalTime,
                    timestamp: new Date(),
                    metricType: config.metricType,
                    implementation: config.implementation,
                    testContext: config.testContext,
                    value: fps,
                    unit: 'fps'
                };
                addBenchmarkResult(result);
                resolve(result);
            }
        };
        startAnimationFn();
        requestAnimationFrame(recordFrame);
    });
};

/**
 * Runs a benchmark with specified configuration
 * @param config - Test configuration
 * @returns Performance result data with timing information
 */
export async function runBenchmark(config: TestConfig): Promise<PerformanceResult> {
    const results: number[] = [];
    let startMemory: number | undefined;
    let endMemory: number | undefined;
    try {
        startMemory = (performance as unknown as {memory?: {usedJSHeapSize: number}}).memory?.usedJSHeapSize;
    }
    catch {
        // Memory API not available in all browsers
    }
    if (config.warmupIterations) {
        for (let i = 0; i < config.warmupIterations; i++) {
            await runTest(config);
        }
    }
    
    for (let i = 0; i < config.iterations; i++) {
        const iterationResult = await runTest(config);
        results.push(iterationResult);
    }
    const endTime = new Date();
    try {
        endMemory = (performance as unknown as {memory?: {usedJSHeapSize: number}}).memory?.usedJSHeapSize;
    }
    catch {
        // Memory API not available in all browsers
    }
    return {
        name: config.name,
        duration: calculateAverage(results),
        memoryUsage: endMemory && startMemory ? endMemory - startMemory : undefined,
        cpuUsage: undefined,
        timestamp: endTime,
        metricType: config.metricType,
        implementation: config.implementation,
        testContext: config.testContext
    };
}

/**
 * Runs a single test iteration
 * @param _config - Test configuration
 * @returns Duration of the test in milliseconds
 */
async function runTest(_config: TestConfig): Promise<number> {
    const start = performance.now();
    try {
        await new Promise(resolve => setTimeout(resolve, 100));
        const end = performance.now();
        return end - start;
    }
    catch (error) {
        console.error(`Test failed: ${error}`);
        throw error;
    }
}

/**
 * Calculates the average of an array of numbers
 * @param numbers - Array of numbers to average
 * @returns The calculated average value
 */
function calculateAverage(numbers: number[]): number {
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
}
