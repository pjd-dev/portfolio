import { describe, expect, it } from 'vitest';
import {
  normalizeTaskState,
  normalizeTaskStatus,
  normalizePriority,
} from '../task-shape.js';

describe('task-shape normalization', () => {
  it('normalizes status aliases', () => {
    expect(normalizeTaskStatus('in-progress')).toBe('in_progress');
    expect(normalizeTaskStatus('completed')).toBe('done');
    expect(normalizeTaskStatus('')).toBe('todo');
  });

  it('clamps priority and defaults', () => {
    expect(normalizePriority(11)).toBe(10);
    expect(normalizePriority(-1)).toBe(0);
    expect(normalizePriority(undefined)).toBe(5);
  });

  it('normalizes aliases and defaults in task state', () => {
    const normalized = normalizeTaskState({
      id: 't1',
      title: 'Test',
      status: 'in-progress',
      priority: 12,
      focus_cost: '3',
      effortMin: '45',
      goal_id: 'g-1',
    });

    expect(normalized.status).toBe('in_progress');
    expect(normalized.priority).toBe(10);
    expect(normalized.focusCost).toBe(3);
    expect(normalized.estimatedTimeMin).toBe(45);
    expect(normalized.goal).toBe('g-1');
  });
});
