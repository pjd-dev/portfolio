/**
 * Operation types for vault file operations
 */

export type OperationType = 'read' | 'write' | 'delete' | 'move' | 'mkdir';
export type OperationStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface Operation {
  id: string;
  type: OperationType;
  path: string;
  targetPath?: string;
  timestamp: number;
  status: OperationStatus;
  error?: string;
  metadata?: Record<string, any>;
}

export interface OperationBatch {
  id: string;
  operations: Operation[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  completedCount: number;
  failedCount: number;
}

export interface OperationLog {
  batchId: string;
  operations: Operation[];
  timestamp: number;
}
