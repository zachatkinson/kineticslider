import React, { useState, useEffect } from 'react';
import { FeatureFlag } from './feature-flags';
import { benchmark, PerformanceMetric, BenchmarkResult } from './performance-benchmarks';
import { PerformanceMonitorProps, MetricCardProps, MetricChartProps } from '../src/types/migration';

const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit, improvement }) => (
  <div className="p-4 bg-white rounded-lg shadow-sm">
    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
    <div className="mt-2 flex items-baseline">
      <span className="text-2xl font-bold text-gray-900">
        {value.toFixed(2)} {unit}
      </span>
      {improvement !== undefined && (
        <span className={`ml-2 text-sm ${improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {improvement >= 0 ? '↑' : '↓'} {Math.abs(improvement).toFixed(1)}%
        </span>
      )}
    </div>
  </div>
);

const MetricChart: React.FC<MetricChartProps> = ({ data, unit }) => {
  // Simple line chart implementation
  // You might want to use a library like Chart.js or Recharts for more complex visualizations
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

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ refreshInterval = 1000 }) => {
  const [metrics, setMetrics] = useState<Record<string, BenchmarkResult>>({});
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<FeatureFlag | null>(null);

  useEffect(() => {
    const updateMetrics = () => {
      const allMetricNames = Array.from(
        new Set(benchmark['metrics'].map(m => m.name))
      );

      const newMetrics: Record<string, BenchmarkResult> = {};
      
      allMetricNames.forEach(name => {
        try {
          newMetrics[name] = benchmark.getMetricSummary(name);
        } catch (error) {
          console.warn(`Failed to get metrics for ${name}:`, error);
        }
      });

      setMetrics(newMetrics);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const handleCompareFeature = (metricName: string, feature: FeatureFlag) => {
    try {
      const impact = benchmark.compareFeatureImpact(metricName, feature);
      // You could show this in a modal or update the UI to display the comparison
      console.log('Feature impact:', impact);
    } catch (error) {
      console.warn('Failed to compare feature impact:', error);
    }
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Monitor</h2>
      
      {/* Metric Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700">Select Metric</label>
        <select
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          value={selectedMetric || ''}
          onChange={(e) => setSelectedMetric(e.target.value || null)}
        >
          <option value="">All Metrics</option>
          {Object.keys(metrics).map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(metrics)
          .filter(([name]) => !selectedMetric || name === selectedMetric)
          .map(([name, result]) => (
            <div key={name} className="space-y-4">
              <MetricCard
                title={name}
                value={result.summary.mean}
                unit={result.metrics[0]?.unit || 'ms'}
              />
              <MetricChart
                data={result.metrics.slice(-20)} // Show last 20 data points
                unit={result.metrics[0]?.unit || 'ms'}
              />
            </div>
          ))}
      </div>

      {/* Feature Comparison */}
      {selectedMetric && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Compare Feature Impact
          </h3>
          <div className="flex space-x-4">
            <select
              className="block w-64 rounded-md border-gray-300 shadow-sm"
              value={selectedFeature || ''}
              onChange={(e) => setSelectedFeature(
                (e.target.value as FeatureFlag) || null
              )}
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