/**
 * Markov Chains Tests
 */

import { describe, it, expect } from 'vitest';
import {
  categorizeHumanState,
  buildHumanStateChain,
  forecastHumanState,
  buildTaskStatusChain,
  forecastTaskCompletion,
  buildSessionFlowChain,
  optimizeSessionFlow,
  analyzeAllMarkovChains,
  type HumanStateTransition,
  type TaskStatusTransition,
  type SessionTaskTransition,
} from '../markov-chains.js';

describe('Human State Markov Chain', () => {
  describe('categorizeHumanState', () => {
    it('should categorize peak state', () => {
      expect(categorizeHumanState(0.8, 0.2, 0.8)).toBe('peak');
    });

    it('should categorize productive state', () => {
      expect(categorizeHumanState(0.6, 0.4, 0.6)).toBe('productive');
    });

    it('should categorize stressed state', () => {
      expect(categorizeHumanState(0.5, 0.7, 0.4)).toBe('stressed');
    });

    it('should categorize recovery state', () => {
      expect(categorizeHumanState(0.3, 0.2, 0.5)).toBe('recovery');
    });

    it('should categorize fatigued state', () => {
      expect(categorizeHumanState(0.4, 0.5, 0.4)).toBe('fatigued');
    });
  });

  describe('buildHumanStateChain', () => {
    it('should build transition matrix from state history', () => {
      const transitions: HumanStateTransition[] = [
        {
          from: 'peak',
          to: 'productive',
          timestamp: '2025-01-01T09:00:00Z',
          duration: 60,
        },
        {
          from: 'productive',
          to: 'fatigued',
          timestamp: '2025-01-01T10:00:00Z',
          duration: 90,
        },
        {
          from: 'fatigued',
          to: 'recovery',
          timestamp: '2025-01-01T11:30:00Z',
          duration: 30,
        },
        {
          from: 'recovery',
          to: 'productive',
          timestamp: '2025-01-01T12:00:00Z',
          duration: 60,
        },
      ];

      const chain = buildHumanStateChain(transitions);

      expect(chain.states).toContain('peak');
      expect(chain.states).toContain('productive');
      expect(chain.states).toContain('fatigued');
      expect(chain.states).toContain('recovery');
    });
  });

  describe('forecastHumanState', () => {
    it('should forecast next likely states', () => {
      const transitions: HumanStateTransition[] = [
        {
          from: 'peak',
          to: 'productive',
          timestamp: '2025-01-01T09:00:00Z',
          duration: 60,
        },
        {
          from: 'peak',
          to: 'productive',
          timestamp: '2025-01-02T09:00:00Z',
          duration: 55,
        },
        {
          from: 'peak',
          to: 'fatigued',
          timestamp: '2025-01-03T09:00:00Z',
          duration: 70,
        },
        {
          from: 'productive',
          to: 'fatigued',
          timestamp: '2025-01-01T10:00:00Z',
          duration: 90,
        },
      ];

      const chain = buildHumanStateChain(transitions);
      const forecast = forecastHumanState(chain, 'peak', transitions);

      expect(forecast.currentState).toBe('peak');
      expect(forecast.nextLikelyStates.length).toBeGreaterThan(0);
      expect(forecast.expectedDurationMinutes).toBeGreaterThan(0);
      expect(forecast.recommendation).toBeDefined();
    });

    it('should provide optimal task recommendation for peak state', () => {
      const transitions: HumanStateTransition[] = [
        {
          from: 'peak',
          to: 'productive',
          timestamp: '2025-01-01T09:00:00Z',
          duration: 60,
        },
      ];

      const chain = buildHumanStateChain(transitions);
      const forecast = forecastHumanState(chain, 'peak', transitions);

      expect(forecast.recommendation).toContain('high-complexity');
    });

    it('should recommend break for stressed state', () => {
      const transitions: HumanStateTransition[] = [
        {
          from: 'stressed',
          to: 'fatigued',
          timestamp: '2025-01-01T09:00:00Z',
          duration: 30,
        },
        {
          from: 'stressed',
          to: 'fatigued',
          timestamp: '2025-01-02T09:00:00Z',
          duration: 25,
        },
      ];

      const chain = buildHumanStateChain(transitions);
      const forecast = forecastHumanState(chain, 'stressed', transitions);

      expect(forecast.recommendation.toLowerCase()).toContain('stress');
    });
  });
});

describe('Task Status Markov Chain', () => {
  describe('buildTaskStatusChain', () => {
    it('should build chain from task transitions', () => {
      const transitions: TaskStatusTransition[] = [
        {
          taskId: 't1',
          from: 'pending',
          to: 'in-progress',
          timestamp: '2025-01-01T09:00:00Z',
          duration: 1440,
        },
        {
          taskId: 't1',
          from: 'in-progress',
          to: 'done',
          timestamp: '2025-01-01T10:00:00Z',
          duration: 60,
        },
        {
          taskId: 't2',
          from: 'pending',
          to: 'in-progress',
          timestamp: '2025-01-01T09:00:00Z',
          duration: 720,
        },
        {
          taskId: 't2',
          from: 'in-progress',
          to: 'blocked',
          timestamp: '2025-01-01T11:00:00Z',
          duration: 120,
        },
      ];

      const chain = buildTaskStatusChain(transitions);

      expect(chain.states).toContain('pending');
      expect(chain.states).toContain('in-progress');
      expect(chain.states).toContain('done');
      expect(chain.states).toContain('blocked');
    });
  });

  describe('forecastTaskCompletion', () => {
    it('should forecast completion probability for in-progress task', () => {
      const transitions: TaskStatusTransition[] = [
        {
          taskId: 't1',
          from: 'in-progress',
          to: 'done',
          timestamp: '2025-01-01T10:00:00Z',
          duration: 60,
        },
        {
          taskId: 't2',
          from: 'in-progress',
          to: 'done',
          timestamp: '2025-01-01T10:00:00Z',
          duration: 45,
        },
        {
          taskId: 't3',
          from: 'in-progress',
          to: 'blocked',
          timestamp: '2025-01-01T10:00:00Z',
          duration: 90,
        },
        {
          taskId: 't3',
          from: 'blocked',
          to: 'done',
          timestamp: '2025-01-01T11:30:00Z',
          duration: 120,
        },
      ];

      const chain = buildTaskStatusChain(transitions);
      const forecast = forecastTaskCompletion(
        chain,
        'in-progress',
        transitions
      );

      expect(forecast.currentStatus).toBe('in-progress');
      expect(forecast.completionProbability).toBeGreaterThan(0);
      expect(forecast.completionProbability).toBeLessThanOrEqual(1);
      expect(forecast.recommendation).toBeDefined();
    });

    it('should warn about blocked task risk', () => {
      const transitions: TaskStatusTransition[] = [
        {
          taskId: 't1',
          from: 'blocked',
          to: 'cancelled',
          timestamp: '2025-01-01T10:00:00Z',
          duration: 60,
        },
        {
          taskId: 't2',
          from: 'blocked',
          to: 'cancelled',
          timestamp: '2025-01-01T10:00:00Z',
          duration: 45,
        },
        {
          taskId: 't3',
          from: 'blocked',
          to: 'done',
          timestamp: '2025-01-01T10:00:00Z',
          duration: 90,
        },
      ];

      const chain = buildTaskStatusChain(transitions);
      const forecast = forecastTaskCompletion(chain, 'blocked', transitions);

      expect(forecast.recommendation).toContain('blocked');
    });
  });
});

describe('Session Flow Markov Chain', () => {
  describe('buildSessionFlowChain', () => {
    it('should build chain from task type transitions', () => {
      const transitions: SessionTaskTransition[] = [
        {
          sessionId: 's1',
          fromTaskType: 'coding',
          toTaskType: 'review',
          timestamp: '2025-01-01T09:00:00Z',
          contextSwitchCost: 5,
        },
        {
          sessionId: 's1',
          fromTaskType: 'review',
          toTaskType: 'meeting',
          timestamp: '2025-01-01T10:00:00Z',
          contextSwitchCost: 15,
        },
        {
          sessionId: 's2',
          fromTaskType: 'coding',
          toTaskType: 'coding',
          timestamp: '2025-01-02T09:00:00Z',
          contextSwitchCost: 2,
        },
      ];

      const chain = buildSessionFlowChain(transitions);

      expect(chain.states).toContain('coding');
      expect(chain.states).toContain('review');
      expect(chain.states).toContain('meeting');
    });
  });

  describe('optimizeSessionFlow', () => {
    it('should recommend next tasks with switch costs', () => {
      const transitions: SessionTaskTransition[] = [
        {
          sessionId: 's1',
          fromTaskType: 'coding',
          toTaskType: 'review',
          timestamp: '2025-01-01T09:00:00Z',
          contextSwitchCost: 5,
        },
        {
          sessionId: 's1',
          fromTaskType: 'coding',
          toTaskType: 'meeting',
          timestamp: '2025-01-02T09:00:00Z',
          contextSwitchCost: 20,
        },
        {
          sessionId: 's2',
          fromTaskType: 'coding',
          toTaskType: 'coding',
          timestamp: '2025-01-03T09:00:00Z',
          contextSwitchCost: 2,
        },
      ];

      const chain = buildSessionFlowChain(transitions);
      const optimization = optimizeSessionFlow(
        chain,
        'coding',
        transitions,
        120
      );

      expect(optimization.currentTaskType).toBe('coding');
      expect(optimization.nextRecommendedTasks.length).toBeGreaterThan(0);
      expect(optimization.expectedProductivity).toBeGreaterThanOrEqual(0);
      expect(optimization.expectedProductivity).toBeLessThanOrEqual(1);
    });

    it('should warn about high context switch costs', () => {
      const transitions: SessionTaskTransition[] = [
        {
          sessionId: 's1',
          fromTaskType: 'coding',
          toTaskType: 'admin',
          timestamp: '2025-01-01T09:00:00Z',
          contextSwitchCost: 30,
        },
        {
          sessionId: 's2',
          fromTaskType: 'coding',
          toTaskType: 'admin',
          timestamp: '2025-01-02T09:00:00Z',
          contextSwitchCost: 25,
        },
      ];

      const chain = buildSessionFlowChain(transitions);
      const optimization = optimizeSessionFlow(
        chain,
        'coding',
        transitions,
        60
      );

      expect(optimization.advice.toLowerCase()).toContain('cost');
    });
  });
});

describe('analyzeAllMarkovChains', () => {
  it('should produce comprehensive analysis', () => {
    const humanTransitions: HumanStateTransition[] = [
      {
        from: 'peak',
        to: 'productive',
        timestamp: '2025-01-01T09:00:00Z',
        duration: 60,
      },
      {
        from: 'productive',
        to: 'fatigued',
        timestamp: '2025-01-01T10:00:00Z',
        duration: 90,
      },
    ];

    const taskTransitions: TaskStatusTransition[] = [
      {
        taskId: 't1',
        from: 'pending',
        to: 'in-progress',
        timestamp: '2025-01-01T09:00:00Z',
        duration: 30,
      },
      {
        taskId: 't1',
        from: 'in-progress',
        to: 'done',
        timestamp: '2025-01-01T10:00:00Z',
        duration: 60,
      },
    ];

    const sessionTransitions: SessionTaskTransition[] = [
      {
        sessionId: 's1',
        fromTaskType: 'coding',
        toTaskType: 'review',
        timestamp: '2025-01-01T09:00:00Z',
        contextSwitchCost: 10,
      },
    ];

    const analysis = analyzeAllMarkovChains(
      humanTransitions,
      taskTransitions,
      sessionTransitions,
      'productive'
    );

    expect(analysis.humanState.chain).toBeDefined();
    expect(analysis.humanState.currentForecast).not.toBeNull();
    expect(analysis.humanState.currentForecast?.currentState).toBe(
      'productive'
    );

    expect(analysis.taskStatus.chain).toBeDefined();
    expect(analysis.taskStatus.completionRate).toBeGreaterThan(0);

    expect(analysis.sessionFlow.chain).toBeDefined();
    expect(analysis.sessionFlow.worstSwitches).toBeDefined();
  });

  it('should handle empty data gracefully', () => {
    const analysis = analyzeAllMarkovChains([], [], []);

    expect(analysis.humanState.chain).toBeDefined();
    expect(analysis.humanState.currentForecast).toBeNull();
    expect(analysis.taskStatus.completionRate).toBe(0);
  });
});
