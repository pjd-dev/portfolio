/**
 * Task and workflow types for vault platform
 */

export type ChecklistItemType = 'todo' | 'task';
export type NeedType = 'task' | 'resource';
export type TaskStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface ChecklistItem {
  id: string;
  type: ChecklistItemType;
  relatedTaskId?: string;
  text: string;
  done: boolean;
  doneAt?: string | null;
  priority: number;
}

export interface Need {
  id: string;
  type: NeedType;
  relatedTaskId?: string;
  description: string;
  fulfilled: boolean;
  createdAt: string;
  fulfilledAt?: string | null;
}

export interface Blocker {
  description: string;
  since: string;
  solution?: string | null;
  solve?: string | null;
}

export interface Reward {
  content: string;
  milestone: number;
  impactScore?: number;
}

export interface HistoryEntry {
  note: string;
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: number;
  dueDate?: string;
  effortScore?: number;
  focusCost?: number;
  started?: string | null;
  completed?: string | null;
  estimatedTimeMin?: number;
  actualTimeMin?: number | null;
  linkedNote?: string[];
  checklist?: ChecklistItem[];
  needs?: Need[];
  blockers?: Blocker[];
  history?: HistoryEntry[];
  reward?: Reward;
}

export interface TaskDependency {
  id: string;
  from: string;
  to: string;
  type: 'blocks' | 'depends_on' | 'related_to';
}

export interface TaskGraph {
  tasks: Map<string, Task>;
  dependencies: TaskDependency[];
  executionOrder: string[];
}

export interface WorkflowSession {
  id: string;
  taskId: string;
  startTime: number;
  endTime?: number;
  actions: SessionAction[];
}

export interface SessionAction {
  type: 'task_start' | 'task_complete' | 'note_created' | 'note_modified';
  timestamp: number;
  data?: any;
}
