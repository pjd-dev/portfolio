import { describe, it, expect } from 'vitest';
import {
  buildGoalIndex,
  normalizeGoalWeight,
  scoreTaskWithGoals,
} from '../goals.js';

describe('COD Goals', () => {
  describe('normalizeGoalWeight', () => {
    it('normalizes 0..1 weights as-is', () => {
      expect(normalizeGoalWeight(0)).toBe(0);
      expect(normalizeGoalWeight(0.8)).toBe(0.8);
    });

    it('normalizes 1..10 weights to 0..1', () => {
      expect(normalizeGoalWeight(5)).toBeCloseTo(0.5, 5);
      expect(normalizeGoalWeight(10)).toBeCloseTo(1, 5);
    });

    it('clamps out-of-range values', () => {
      expect(normalizeGoalWeight(-1)).toBe(0);
      expect(normalizeGoalWeight(50)).toBe(1);
    });
  });

  describe('buildGoalIndex', () => {
    it('selects the highest-weight active goal as primary', () => {
      const index = buildGoalIndex([
        { id: 'goal-a', title: 'Goal A', active: true, priority: 0.4 },
        { id: 'goal-b', title: 'Goal B', active: true, priority: 0.8 },
        { id: 'goal-c', title: 'Goal C', active: false, priority: 1 },
      ]);

      expect(index.primaryGoalId).toBe('goal-b');
      expect(index.activeGoalIds).toEqual(['goal-a', 'goal-b']);
    });
  });

  describe('scoreTaskWithGoals', () => {
    it('boosts active goals and tags', () => {
      const index = buildGoalIndex([
        {
          id: 'goal-a',
          title: 'Goal A',
          active: true,
          priority: 1,
          tags: ['core', 'vaulty'],
        },
      ]);

      const result = scoreTaskWithGoals(
        1,
        { goal: 'goal-a', tags: ['vaulty'] },
        index,
        { contextTolerance: 'med' }
      );

      expect(result.breakdown.goalWeightFactor).toBeGreaterThan(1);
      expect(result.breakdown.tagBoostFactor).toBeGreaterThan(1);
      expect(result.score).toBeGreaterThan(1);
    });

    it('penalizes non-primary goals when context tolerance is low', () => {
      const index = buildGoalIndex([
        { id: 'primary', title: 'Primary', active: true, priority: 1 },
        { id: 'secondary', title: 'Secondary', active: true, priority: 0.2 },
      ]);

      const result = scoreTaskWithGoals(
        1,
        { goal: 'secondary', tags: ['x', 'y'] },
        index,
        { contextTolerance: 'low' }
      );

      expect(result.breakdown.contextPenaltyFactor).toBeLessThan(1);
      expect(result.score).toBeLessThan(1);
    });
  });
});
