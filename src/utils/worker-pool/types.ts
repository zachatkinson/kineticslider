import { ErrorType, ErrorSeverity } from '../../types/error';

export interface WorkerPoolOptions {
  workerScript: string;
  maxWorkers?: number;
  initialWorkers?: number;
}

export interface WorkerTask<T = unknown, R = unknown> {
  id: string;
  data: T;
  resolve?: (value: R) => void;
  reject?: (error: unknown) => void;
  createdAt?: number;
}

export interface WorkerStats {
  id: string;
  status: 'available' | 'busy';
  tasksProcessed: number;
  lastActive: number;
  errors: number;
}

export interface ErrorDistribution {
  daily: Record<string, number>;
  weekly: Record<string, number>;
  monthly: Record<string, number>;
  rateChangePercent: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export class WorkerPoolError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly workerId: string;
  public readonly error: Error;
  public readonly timestamp: string;
  public readonly operation: string;
  public readonly category: string;
  public readonly stackTrace: string;
  public readonly code: string;
  public readonly details: {
    taskId?: string;
    errorTime: number;
    workerId: string;
  };

  constructor({
    message,
    type,
    severity,
    workerId,
    error,
    timestamp,
    operation,
    category,
    stackTrace,
    code,
    details
  }: {
    message: string;
    type: ErrorType;
    severity: ErrorSeverity;
    workerId: string;
    error: Error;
    timestamp: string;
    operation: string;
    category: string;
    stackTrace: string;
    code: string;
    details: {
      taskId?: string;
      errorTime: number;
      workerId: string;
    };
  }) {
    super(message);
    this.name = 'WorkerPoolError';
    this.type = type;
    this.severity = severity;
    this.workerId = workerId;
    this.error = error;
    this.timestamp = timestamp;
    this.operation = operation;
    this.category = category;
    this.stackTrace = stackTrace;
    this.code = code;
    this.details = details;
  }
}

export interface WorkerPoolStats {
  queueSize: number;
  activeWorkers: number;
  totalWorkers: number;
  availableWorkers: number;
  busyWorkers: number;
  pendingTasks: number;
  maxWorkers: number;
  utilization: number;
  completedTasks: number;
  failedTasks: number;
  avgExecutionTime: number;
  throughput: number;
  errorStats: {
    errorDistribution: Record<ErrorType, number>;
    severityCounts: Record<ErrorSeverity, number>;
    dailyTrends: Record<string, number>;
    averageProcessingTime: number;
    topErrorPatterns: string[];
    errorTimeDistribution: ErrorDistribution;
  };
} 