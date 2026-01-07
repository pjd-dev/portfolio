import { describe, it, expect } from 'vitest';
import {
  projectGoalCompletion,
  analyzeMilestoneProgress,
} from '../goal-projections';

describe('Goal Projections', () => {
  it('projects goal completion date', () => {
    const projection = projectGoalCompletion({
      goalId: 'goal-1',
      remainingTasks: 5,
      remainingEffort: 40,
      recentVelocity: 10, // 10 effort points/day
      historicalVelocity: 8,
      daysSinceStarted: 10,
    });

    expect(projection.goalId).toBe('goal-1');
    expect(projection.daysToCompletion).toBeCloseTo(4, 0); // 40 / 10
    expect(projection.status).toBe('on-track');
    expect(projection.velocityTrend).toBe('accelerating');
  });

  it('detects at-risk status when behind schedule', () => {
    const targetDate = new Date(
      Date.now() + 2 * 24 * 60 * 60 * 1000
    ).toISOString(); // 2 days from now

    const projection = projectGoalCompletion({
      goalId: 'goal-1',
      remainingTasks: 10,
      remainingEffort: 100,
      targetDate,
      recentVelocity: 5, // Only 5 effort/day
      historicalVelocity: 15,
      daysSinceStarted: 7,
    });

    expect(projection.status).toBe('at-risk');
    expect(projection.velocityTrend).toBe('decelerating');
    expect(projection.recommendation).toBeDefined();
  });

  it('detects blocked status', () => {
    const projection = projectGoalCompletion({
      goalId: 'goal-1',
      remainingTasks: 5,
      remainingEffort: 40,
      recentVelocity: 8,
      historicalVelocity: 8,
      blockedTaskCount: 3,
      daysSinceStarted: 5,
    });

    expect(projection.status).toBe('blocked');
    expect(projection.blockers).toBeDefined();
    expect(projection.recommendation).toContain('blocked');
  });

  it('analyzes milestone progress - ahead of schedule', () => {
    const result = analyzeMilestoneProgress({
      goalId: 'goal-1',
      totalEffort: 100,
      completedEffort: 65, // 65% effort done
      targetDays: 20,
      elapsedDays: 10, // 50% time used - so 65% > 50% + 10% = ahead
    });

    expect(result.effortProgress).toBe(0.65);
    expect(result.timeProgress).toBe(0.5);
    expect(result.status).toBe('ahead');
    expect(result.statusMessage).toContain('Ahead');
  });

  it('analyzes milestone progress - behind schedule', () => {
    const result = analyzeMilestoneProgress({
      goalId: 'goal-1',
      totalEffort: 100,
      completedEffort: 20,
      targetDays: 20,
      elapsedDays: 15,
    });

    expect(result.effortProgress).toBe(0.2);
    expect(result.timeProgress).toBe(0.75);
    expect(result.status).toBe('behind');
    expect(result.statusMessage).toContain('Behind');
  });
});
