import type { 
  WorkerPoolOptions, 
  WorkerTask, 
  WorkerPoolStats,
  WorkerStats,
  ErrorDistribution,
  WorkerPoolErrorDetails
} from "../../types/worker-pool";

// Re-export all centralized types
export type { 
  WorkerPoolOptions, 
  WorkerTask, 
  WorkerPoolStats,
  WorkerStats,
  ErrorDistribution,
  WorkerPoolErrorDetails
};

export { WorkerPoolError } from "../../types/worker-pool";
