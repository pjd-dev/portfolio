/**
 * Journal entry types for vault platform
 */
export type JournalEntryType =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'review'
  | 'planning';
export interface JournalEntry {
  id: string;
  date: string;
  type: JournalEntryType;
  title: string;
  content: string;
  tags?: string[];
  linkedTasks?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  metrics?: Record<string, number>;
  createdAt: number;
  updatedAt: number;
}
export interface JournalSection {
  name: string;
  entries: JournalEntry[];
  metadata?: Record<string, any>;
}
export interface JournalMetadata {
  totalEntries: number;
  dateRange: {
    start: string;
    end: string;
  };
  tags: Record<string, number>;
  taskReferences: Record<string, number>;
}
//# sourceMappingURL=journal.d.ts.map
