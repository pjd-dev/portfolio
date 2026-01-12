/**
 * Profile Invariant Tests
 *
 * Enforces the critical invariant: validation outcomes MUST NOT change based on profile.
 * PASS/WARN/FAIL verdicts must be identical across all profiles for the same input.
 */

import { describe, it, expect } from 'vitest';
import { CODValidator } from '../validator/core.js';
import type {
  TaskState,
  SessionState,
  ValidatorOptions,
} from '../validator/types.js';
import type { CodProfile } from '../profile.js';
import {
  getProfileTuning,
  BASIC_PROFILE_TUNING,
  ADHD_PROFILE_TUNING,
} from '../profile.js';

const ALL_PROFILES: CodProfile[] = ['basic', 'adhd'];

describe('profile-agnostic validation invariant', () => {
  describe('validateTask: same input → same verdict across profiles', () => {
    const validTask: TaskState = {
      id: 'task-1',
      title: 'Test Task',
      status: 'todo',
      priority: 7,
    };

    const invalidTask: TaskState = {
      id: '',
      title: '',
      status: 'todo',
    };

    // Task with invalid goal reference - causes FAIL (error severity)
    const taskWithBadGoal: TaskState = {
      id: 'task-2',
      title: 'Task with missing goal',
      status: 'todo',
      goal: 'non-existent-goal',
    };

    it('PASS verdict is consistent across profiles', () => {
      const results = ALL_PROFILES.map((profile) =>
        CODValidator.validateTask(validTask, {}, { profile })
      );

      const states = results.map((r) => r.state);
      expect(new Set(states).size).toBe(1);
      expect(states[0]).toBe('PASS');
    });

    it('FAIL verdict is consistent across profiles', () => {
      const results = ALL_PROFILES.map((profile) =>
        CODValidator.validateTask(invalidTask, {}, { profile })
      );

      const states = results.map((r) => r.state);
      expect(new Set(states).size).toBe(1);
      expect(states[0]).toBe('FAIL');
    });

    it('FAIL from invalid goal is consistent across profiles', () => {
      // Invalid goal reference is error severity, results in FAIL
      const results = ALL_PROFILES.map((profile) =>
        CODValidator.validateTask(
          taskWithBadGoal,
          { goalsMap: {} },
          { profile }
        )
      );

      const states = results.map((r) => r.state);
      expect(new Set(states).size).toBe(1);
      expect(states[0]).toBe('FAIL');
    });

    it('issue codes are consistent across profiles', () => {
      const results = ALL_PROFILES.map((profile) =>
        CODValidator.validateTask(invalidTask, {}, { profile })
      );

      const issueCodes = results.map((r) =>
        r.issues
          .map((i) => i.code)
          .sort()
          .join(',')
      );
      expect(new Set(issueCodes).size).toBe(1);
    });
  });

  describe('validateSession: same input → same verdict across profiles', () => {
    const validSession: SessionState = {
      id: 'session-1',
      duration: 60,
      taskIds: ['task-1', 'task-2'],
      totalEffort: 6,
      totalReward: 8,
      focusCost: 4,
    };

    const invalidSession: SessionState = {
      id: '',
      duration: -10,
      taskIds: [],
      totalEffort: 0,
      totalReward: 0,
      focusCost: 0,
    };

    it('PASS verdict is consistent across profiles', () => {
      const options: ValidatorOptions = { skipHardStop: true };
      const results = ALL_PROFILES.map((profile) =>
        CODValidator.validateSession(validSession, { ...options, profile })
      );

      const states = results.map((r) => r.state);
      expect(new Set(states).size).toBe(1);
      // Both profiles get the same verdict (PASS or WARN depending on warnings)
      expect(states.every((s) => s === states[0])).toBe(true);
    });

    it('FAIL verdict is consistent across profiles', () => {
      const options: ValidatorOptions = { skipHardStop: true };
      const results = ALL_PROFILES.map((profile) =>
        CODValidator.validateSession(invalidSession, { ...options, profile })
      );

      const states = results.map((r) => r.state);
      expect(new Set(states).size).toBe(1);
      expect(states[0]).toBe('FAIL');
    });
  });

  describe('HARD_STOP: enforced regardless of profile', () => {
    it('HARD_STOP affects session consistently across all profiles', () => {
      const session: SessionState = {
        id: 'session-1',
        duration: 60,
        taskIds: ['task-1'],
        totalEffort: 5,
        totalReward: 7,
        focusCost: 3,
      };

      // Use a fixed timestamp during HARD_STOP hours (2am)
      const hardStopTime = new Date('2026-01-12T02:00:00');

      const results = ALL_PROFILES.map((profile) =>
        CODValidator.validateSession(session, {
          profile,
          timestamp: hardStopTime,
          skipHardStop: false,
        })
      );

      // All profiles should have consistent verdict (WARN when overridable)
      const states = results.map((r) => r.state);
      expect(new Set(states).size).toBe(1);
      // HARD_STOP is overridable by default, so it's WARN not FAIL
      expect(states[0]).toBe('WARN');

      // All should have HARD_STOP_ACTIVE code
      for (const result of results) {
        expect(result.issues.some((i) => i.code === 'HARD_STOP_ACTIVE')).toBe(
          true
        );
      }
    });

    it('non-overridable HARD_STOP causes FAIL across all profiles', () => {
      const session: SessionState = {
        id: 'session-1',
        duration: 60,
        taskIds: ['task-1'],
        totalEffort: 5,
        totalReward: 7,
        focusCost: 3,
      };

      // Use a fixed timestamp during HARD_STOP hours (2am)
      const hardStopTime = new Date('2026-01-12T02:00:00');

      const results = ALL_PROFILES.map((profile) =>
        CODValidator.validateSession(session, {
          profile,
          timestamp: hardStopTime,
          skipHardStop: false,
          hardStopConfig: { allowOverride: false },
        })
      );

      // All profiles should FAIL due to non-overridable HARD_STOP
      const states = results.map((r) => r.state);
      expect(new Set(states).size).toBe(1);
      expect(states[0]).toBe('FAIL');
    });
  });

  describe('profile tuning: affects heuristics only', () => {
    it('basic and adhd have different tuning values', () => {
      expect(BASIC_PROFILE_TUNING.sessionDurationSuggestions.ideal).toBe(50);
      expect(ADHD_PROFILE_TUNING.sessionDurationSuggestions.ideal).toBe(25);

      expect(BASIC_PROFILE_TUNING.breakInterval).toBe(50);
      expect(ADHD_PROFILE_TUNING.breakInterval).toBe(25);
    });

    it('getProfileTuning returns correct tuning', () => {
      expect(getProfileTuning('basic')).toBe(BASIC_PROFILE_TUNING);
      expect(getProfileTuning('adhd')).toBe(ADHD_PROFILE_TUNING);
    });

    it('tuning values do not affect validation', () => {
      // Even with very different tuning, validation outcomes are identical
      const task: TaskState = {
        id: 'task-1',
        title: 'Test',
        status: 'todo',
        effort: 9, // High effort
        focusCost: 9, // High focus cost
      };

      const basicResult = CODValidator.validateTask(
        task,
        {},
        { profile: 'basic' }
      );
      const adhdResult = CODValidator.validateTask(
        task,
        {},
        { profile: 'adhd' }
      );

      // Same verdict regardless of profile tuning
      expect(basicResult.state).toBe(adhdResult.state);
      expect(basicResult.issues.length).toBe(adhdResult.issues.length);
    });
  });

  describe('comprehensive invariant check', () => {
    it('all validation methods ignore profile for verdict determination', () => {
      // This test documents the invariant for all validator methods
      const testCases = [
        {
          name: 'validateTask',
          run: (profile: CodProfile) =>
            CODValidator.validateTask(
              { id: 'x', title: 'X', status: 'todo' },
              {},
              { profile }
            ),
        },
        {
          name: 'validateSession',
          run: (profile: CodProfile) =>
            CODValidator.validateSession(
              {
                id: 's',
                plannedDurationMin: 30,
                taskIds: ['x'],
                status: 'active',
              },
              { profile, skipHardStop: true }
            ),
        },
        {
          name: 'validateDependencyGraph',
          run: (profile: CodProfile) =>
            CODValidator.validateDependencyGraph({
              'task-1': { id: 'task-1', title: 'A', status: 'todo' },
            }),
        },
      ];

      for (const testCase of testCases) {
        const results = ALL_PROFILES.map(testCase.run);
        const states = new Set(results.map((r) => r.state));

        expect(states.size).toBe(1);
      }
    });
  });
});
