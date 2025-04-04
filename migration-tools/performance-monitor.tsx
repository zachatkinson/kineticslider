import React, { useState } from 'react';
import { FeatureFlag } from './feature-flags';
import { benchmark } from './performance-benchmarks';
import { PerformanceMonitorProps, MetricCardProps, MetricChartProps, BenchmarkResult } from '../src/types/migration';

const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit }) => (
  <div className="p-4 bg-white rounded-lg shadow-sm">
    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
    <div className="mt-2 flex items-baseline">
      <span className="text-2xl font-bold text-gray-900">
        {value.toFixed(2)} {unit}
      </span>
    </div>
  </div>
);

const MetricChart: React.FC<MetricChartProps> = ({ data, unit }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  
  return (
    <div className="h-40 w-full flex items-end space-x-1">
      {data.map((metric, i) => {
        const height = ((metric.value - minValue) / (maxValue - minValue)) * 100;
        return (
          <div 
            key={i}
            className="bg-blue-500 w-2"
            style={{ height: `${Math.max(height, 1)}%` }}
            title={`${metric.value.toFixed(2)} ${unit}`} 
          />
        );
      })}
    </div>
  );
};

interface ExtendedBenchmarkResult extends BenchmarkResult {
  metrics?: Array<{
    name: string;
    value: number;
    unit?: string;
    timestamp: Date | number;
    featureFlags?: Record<FeatureFlag, boolean>;
  }>;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ results = [], title = "Performance Monitor" }) => {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<FeatureFlag | null>(null);
  
  const handleCompareFeature = (metricName: string, feature: FeatureFlag): void => {
    try {
      const impact = benchmark.compareFeatureImpact(metricName, feature);
      console.warn('Feature impact:', impact);
    } catch (error) {
      console.warn('Failed to compare feature impact:', error);
    }
  };
  
  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700">Select Metric</label>
        <select 
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          value={selectedMetric || ''}
          onChange={(e) => setSelectedMetric(e.target.value || null)}
        >
          <option value="">All Metrics</option>
          {results.map(result => (
            <option key={result.name} value={result.name}>{result.name}</option>
          ))}
        </select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results
          .filter(result => !selectedMetric || result.name === selectedMetric)
          .map((result) => {
            const extendedResult = result as ExtendedBenchmarkResult;
            return (
              <div key={result.name} className="space-y-4">
                <MetricCard 
                  title={result.name} 
                  value={result.summary.avg} 
                  unit={(extendedResult.metrics && extendedResult.metrics[0]?.unit) || 'ms'} 
                />
                {extendedResult.metrics && (
                  <MetricChart 
                    data={extendedResult.metrics.slice(-20)} 
                    unit={(extendedResult.metrics && extendedResult.metrics[0]?.unit) || 'ms'} 
                  />
                )}
              </div>
            );
          })
        }
      </div>
      
      {selectedMetric && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Compare Feature Impact
          </h3>
          <div className="flex space-x-4">
            <select
              className="block w-64 rounded-md border-gray-300 shadow-sm"
              value={selectedFeature || ''}
              onChange={(e) => setSelectedFeature((e.target.value as FeatureFlag) || null)}
            >
              <option value="">Select Feature</option>
              {Object.values(FeatureFlag).map(flag => (
                <option key={flag} value={flag}>{flag}</option>
              ))}
            </select>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
              disabled={!selectedFeature}
              onClick={() => {
                if (selectedMetric && selectedFeature) {
                  handleCompareFeature(selectedMetric, selectedFeature);
                }
              }}
            >
              Compare
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
