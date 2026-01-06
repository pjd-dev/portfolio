import { describe, it, expect } from 'vitest';
import { computeTimeSensitivity } from '../time-sensitivity.js';

describe('computeTimeSensitivity', () => {
  it('boosts score for tasks due today', () => {
    const res = computeTimeSensitivity({
      now: '2025-01-10T00:00:00Z',
      dueDate: '2025-01-10',
    });

    expect(res.factor).toBeGreaterThan(1);
    expect(res.flags).toContain('due_soon');
  });

  it('boosts score for overdue tasks', () => {
    const res = computeTimeSensitivity({
      now: '2025-01-10T00:00:00Z',
      dueDate: '2025-01-01',
    });

    expect(res.factor).toBeGreaterThan(1.5);
    expect(res.flags).toContain('overdue');
  });

  it('does not boost tasks far in the future', () => {
    const res = computeTimeSensitivity({
      now: '2025-01-10T00:00:00Z',
      dueDate: '2025-02-20',
    });

    expect(res.factor).toBe(1);
  });

  it('penalizes tasks scheduled in the future', () => {
    const res = computeTimeSensitivity({
      now: '2025-01-10T00:00:00Z',
      scheduledDate: '2025-01-12',
    });

    expect(res.factor).toBeLessThan(1);
    expect(res.flags).toContain('scheduled_future');
  });
});
