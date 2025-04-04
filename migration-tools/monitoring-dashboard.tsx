import React, { useState, useEffect } from 'react';
import { FeatureFlag } from './feature-flags';
import { featureMonitoring } from './feature-monitoring';
import type { FeatureMetrics as ImportedFeatureMetrics } from '../src/types/feature-monitoring';
import { PerformanceMonitor } from './performance-monitor';

// Define the missing props interfaces
interface MonitoringMetricCardProps {
  title: string;
  value: string | number;
  trend?: number;
  status?: string;
}

interface EventData {
  [key: string]: string | number | boolean;
}

interface EventItem {
  type: string;
  feature: string;
  timestamp: Date;
  data?: EventData;
}

interface EventListProps {
  events: EventItem[];
  onEventSelect?: (_event: EventItem) => void;
}

const _MetricCard: React.FC<MonitoringMetricCardProps> = ({ title, value, trend, status }) => (
  <div className="p-4 bg-white rounded-lg shadow-sm">
    <h3 className="text-sm font-medium text-gray-500">{title}</h3>
    <div className="mt-1 flex items-baseline">
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {trend !== undefined && (
        <span className={`ml-2 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    {status && (
      <p className="mt-1 text-sm text-gray-500">{status}</p>
    )}
  </div>
);

const EventList: React.FC<EventListProps> = ({ events }) => (
  <div className="flow-root">
    <ul className="-mb-8">
      {events.map((event: EventItem, eventIdx: number) => (
        <li key={eventIdx}>
          <div className="relative pb-8">
            {eventIdx !== events.length - 1 ? (
              <span 
                className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                aria-hidden="true"
              />
            ) : null}
            <div className="relative flex space-x-3">
              <div>
                <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                  event.type === 'error'
                    ? 'bg-red-500'
                    : event.type === 'usage'
                      ? 'bg-green-500'
                      : 'bg-blue-500'
                }`}>
                  {event.type === 'error' ? '!' : '✓'}
                </span>
              </div>
              <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                <div>
                  <p className="text-sm text-gray-500">
                    {event.feature} - {event.type}
                  </p>
                  {event.data && (
                    <p className="mt-1 text-xs text-gray-500">
                      {JSON.stringify(event.data)}
                    </p>
                  )}
                </div>
                <div className="text-right text-sm whitespace-nowrap text-gray-500">
                  {new Date(event.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  </div>
);

export const MonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<Map<FeatureFlag, ImportedFeatureMetrics>>(new Map());
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<FeatureFlag | null>(null);
  
  useEffect(() => {
    const updateData = (): void => {
      // Get metrics for all features
      const allMetrics = new Map<FeatureFlag, ImportedFeatureMetrics>();
      Object.values(FeatureFlag).forEach(flag => {
        allMetrics.set(flag, featureMonitoring.getMetrics(flag));
      });
      setMetrics(allMetrics);
      
      // Get recent events
      setEvents(
        featureMonitoring.getEvents(selectedFeature || Object.values(FeatureFlag)[0])
          .slice(0, 10)
      );
    };
    updateData();
    const interval = setInterval(updateData, 5000);
    return () => clearInterval(interval);
  }, [selectedFeature]);
  
  const getFeatureHealth = (feature: FeatureFlag): string => {
    const featureMetrics = featureMonitoring.getMetrics(feature);
    if (!featureMetrics) return 'unknown';
    
    const errorRate = featureMetrics.errorRate || 0;
    if (errorRate > 0.1) return 'critical';
    if (errorRate > 0.05) return 'warning';
    if (featureMetrics.usageCount === 0) return 'unused';
    
    return 'healthy';
  };
  
  return (
    <div className="p-6 bg-gray-50">
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900">
          Feature Monitoring
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Real-time monitoring of feature flags and performance metrics
        </p>
      </div>
      
      <div className="mb-6">
        <select
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={selectedFeature || ''}
          onChange={(e) => setSelectedFeature((e.target.value as FeatureFlag) || null)}
        >
          <option value="">All Features</option>
          {Object.values(FeatureFlag).map((flag) => (
            <option key={flag} value={flag}>
              {flag}
            </option>
          ))}
        </select>
      </div>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from(metrics.entries())
          .filter(([flag]) => !selectedFeature || flag === selectedFeature)
          .map(([flag, metrics]) => (
            <div key={flag} className="space-y-4">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`h-3 w-3 rounded-full ${
                        getFeatureHealth(flag) === 'healthy'
                          ? 'bg-green-400'
                          : getFeatureHealth(flag) === 'warning'
                            ? 'bg-yellow-400'
                            : getFeatureHealth(flag) === 'critical'
                              ? 'bg-red-400'
                              : 'bg-gray-400'
                      }`} />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {flag}
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {metrics.usageCount}
                          </div>
                          <div className="ml-2 flex items-baseline text-sm font-semibold">
                            {metrics.errorCount > 0 && (
                              <span className="text-red-600">
                                {metrics.errorCount} errors
                              </span>
                            )}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">
                      Last used: {' '}
                    </span>
                    {metrics.lastUpdated 
                      ? new Date(metrics.lastUpdated).toLocaleString() 
                      : 'Never'
                    }
                  </div>
                  {metrics.averageLatency && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">
                        Avg. Performance: {' '}
                      </span>
                      {metrics.averageLatency.toFixed(2)} ms
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900">
          Recent Events
        </h3>
        <div className="mt-4 bg-white shadow overflow-hidden rounded-lg">
          <EventList events={events} />
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900">
          Performance Metrics
        </h3>
        <div className="mt-4">
          <PerformanceMonitor 
            results={[
              // Add sample results if needed or use an empty array
              /* Example:
              {
                name: 'fps',
                summary: {
                  avg: 60,
                  median: 60,
                  stdDev: 5,
                  p95: 60,
                  min: 45,
                  max: 60,
                  count: 100
                },
                timestamp: new Date()
              }
              */
            ]} 
            title="Performance Metrics" 
          />
        </div>
      </div>
    </div>
  );
};
