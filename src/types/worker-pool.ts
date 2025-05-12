import { ErrorSeverity, ErrorType } from "./error";

export interface WorkerPoolOptions {
  maxWorkers?: number;
  workerScript?: string;
  initialWorkers?: number;
  timeout?: number;
  errorHandler?: (
    error: Error,
    context: { taskId?: string; operation?: string },
  ) => void;
}

export interface WorkerTask<TData = unknown, TResult = unknown> {
  id: string;
  data: TData;
  resolve: (value: TResult) => void;
  reject: (reason: Error | unknown) => void;
  createdAt?: number;
  priority?: number;
  category?: string;
  timeoutId?: ReturnType<typeof setTimeout>;
}

export interface WorkerPoolStats {
  totalWorkers: number;
  availableWorkers: number;
  busyWorkers: number;
  queueSize: number;
  errorCount: number;
  errorStats: {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
    errorTypeDistribution: Record<ErrorType, number>;
    severityDistribution: Record<ErrorSeverity, number>;
  };
  errorTrends: {
    daily: Record<string, number>;
    weekly: Record<string, number>;
    monthly: Record<string, number>;
  };
  taskStartTimes: Record<string, number>;
  taskCompletionTimes: Record<string, number>;
  peakQueueSize: number;
  avgWaitTime: number;
  queueSizeHistory: number[];
  lastResetTime: number;
}

export interface WorkerStats {
  id: string;
  status: "idle" | "busy";
  taskCount: number;
  errorCount: number;
  avgProcessingTime: number;
  performance: {
    avgWaitTime: number;
    avgExecutionTime: number;
    throughput: number;
  };
  lastError?: WorkerPoolError;
  taskStartTimes: Map<string, number>;
  totalErrors: number;
}

export interface WorkerPoolError extends Error {
  workerId: string;
  error: string;
  timestamp: string;
  operation: string;
  category: string;
  stackTrace: string;
  type: ErrorType;
  severity: ErrorSeverity;
  code: string;
  details: {
    taskId?: string;
    errorTime: number;
    workerId: string;
  };
}

export interface WorkerPool {
  terminate(): void;
  execute<T = unknown, R = unknown>(data: T): Promise<R>;
  getStatistics(): WorkerPoolStats;
}
