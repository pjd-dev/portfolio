/**
 * Decision Loop State Machine Tests
 *
 * Tests for the COD decision loop finite state machine that tracks
 * the human-AI work cycle (idle → planning → executing → reviewing → idle).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  type DecisionLoopState,
  type DecisionLoopContext,
  type DecisionLoopSnapshot,
  type TransitionTrigger,
  getAllowedTransitions,
  canTransition,
  executeTransition,
  createInitialSnapshot,
  getStateInfo,
  formatSnapshotDisplay,
  getTransitionDiagram,
} from '../decision-loop.js';

describe('decision-loop', () => {
  describe('createInitialSnapshot', () => {
    it('creates snapshot in idle state', () => {
      const snapshot = createInitialSnapshot();

      expect(snapshot.state).toBe('idle');
      expect(snapshot.history).toEqual([]);
      expect(snapshot.enteredAt).toBeDefined();
    });

    it('accepts initial context', () => {
      const snapshot = createInitialSnapshot({
        humanStateAgeHours: 2,
        lastSessionReviewed: true,
      });

      expect(snapshot.context.humanStateAgeHours).toBe(2);
      expect(snapshot.context.lastSessionReviewed).toBe(true);
    });
  });

  describe('getAllowedTransitions', () => {
    it('returns start_planning from idle for human', () => {
      const transitions = getAllowedTransitions('idle', 'human');
      const triggers = transitions.map((t) => t.trigger);

      expect(triggers).toContain('start_planning');
    });

    it('returns confirm_plan and cancel_plan from planning', () => {
      const transitions = getAllowedTransitions('planning', 'human');
      const triggers = transitions.map((t) => t.trigger);

      expect(triggers).toContain('confirm_plan');
      expect(triggers).toContain('cancel_plan');
    });

    it('returns complete_session, abort_session, pause_session from executing', () => {
      const transitions = getAllowedTransitions('executing', 'human');
      const triggers = transitions.map((t) => t.trigger);

      expect(triggers).toContain('complete_session');
      expect(triggers).toContain('abort_session');
      expect(triggers).toContain('pause_session');
    });

    it('does not allow agent to pause session', () => {
      const transitions = getAllowedTransitions('executing', 'agent');
      const triggers = transitions.map((t) => t.trigger);

      expect(triggers).not.toContain('pause_session');
    });

    it('returns review transitions from reviewing', () => {
      const transitions = getAllowedTransitions('reviewing', 'human');
      const triggers = transitions.map((t) => t.trigger);

      expect(triggers).toContain('complete_review');
      expect(triggers).toContain('skip_review');
      expect(triggers).toContain('start_new_session');
    });
  });

  describe('canTransition guards', () => {
    describe('canStartPlanning', () => {
      it('blocks when HARD_STOP is active', () => {
        const result = canTransition('idle', 'start_planning', 'human', {
          hardStopActive: true,
        });

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('HARD_STOP');
      });

      it('blocks when last session not reviewed', () => {
        const result = canTransition('idle', 'start_planning', 'human', {
          lastSessionReviewed: false,
        });

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('not reviewed');
      });

      it('warns when human state is stale', () => {
        const result = canTransition('idle', 'start_planning', 'human', {
          humanStateAgeHours: 6,
          lastSessionReviewed: true,
        });

        expect(result.allowed).toBe(true);
        expect(result.warnings).toBeDefined();
        expect(result.warnings?.[0]).toContain('Human state');
      });

      it('allows when conditions are met', () => {
        const result = canTransition('idle', 'start_planning', 'human', {
          lastSessionReviewed: true,
          hardStopActive: false,
          humanStateAgeHours: 1,
        });

        expect(result.allowed).toBe(true);
      });
    });

    describe('canConfirmPlan', () => {
      it('blocks with no tasks', () => {
        const result = canTransition('planning', 'confirm_plan', 'human', {
          taskCount: 0,
          plannedDurationMin: 60,
        });

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('no tasks');
      });

      it('blocks with invalid duration', () => {
        const result = canTransition('planning', 'confirm_plan', 'human', {
          taskCount: 3,
          plannedDurationMin: 0,
        });

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('duration');
      });

      it('allows with valid plan', () => {
        const result = canTransition('planning', 'confirm_plan', 'human', {
          taskCount: 3,
          plannedDurationMin: 60,
        });

        expect(result.allowed).toBe(true);
      });
    });

    describe('canCompleteSession', () => {
      it('blocks with no session', () => {
        const result = canTransition('executing', 'complete_session', 'human', {
          sessionId: undefined,
        });

        expect(result.allowed).toBe(false);
      });

      it('allows with active session', () => {
        const result = canTransition('executing', 'complete_session', 'human', {
          sessionId: 'session-123',
        });

        expect(result.allowed).toBe(true);
      });
    });

    describe('canSkipReview', () => {
      it('warns about skipping', () => {
        const result = canTransition('reviewing', 'skip_review', 'human', {});

        expect(result.allowed).toBe(true);
        expect(result.warnings).toBeDefined();
        expect(result.warnings?.some((w) => w.includes('learning'))).toBe(true);
      });

      it('extra warning for frequent skips', () => {
        const result = canTransition('reviewing', 'skip_review', 'human', {
          reviewSkipCount: 3,
        });

        expect(result.allowed).toBe(true);
        expect(result.warnings?.some((w) => w.includes('skipped 3'))).toBe(
          true
        );
      });
    });

    describe('canStartNewSession', () => {
      it('blocks when HARD_STOP active', () => {
        const result = canTransition(
          'reviewing',
          'start_new_session',
          'human',
          {
            hardStopActive: true,
          }
        );

        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('HARD_STOP');
      });
    });
  });

  describe('executeTransition', () => {
    let snapshot: DecisionLoopSnapshot;

    beforeEach(() => {
      snapshot = createInitialSnapshot({
        lastSessionReviewed: true,
        hardStopActive: false,
      });
    });

    it('transitions from idle to planning', () => {
      const result = executeTransition(snapshot, 'start_planning', 'human');

      expect(result.success).toBe(true);
      expect(result.snapshot?.state).toBe('planning');
      expect(result.snapshot?.history).toHaveLength(1);
      expect(result.snapshot?.history[0]).toMatchObject({
        from: 'idle',
        to: 'planning',
        trigger: 'start_planning',
        actor: 'human',
      });
    });

    it('transitions from planning to executing', () => {
      // First go to planning
      const planResult = executeTransition(snapshot, 'start_planning', 'human');

      // Then confirm with context
      const execResult = executeTransition(
        planResult.snapshot!,
        'confirm_plan',
        'human',
        { taskCount: 3, plannedDurationMin: 60 }
      );

      expect(execResult.success).toBe(true);
      expect(execResult.snapshot?.state).toBe('executing');
    });

    it('fails invalid transition', () => {
      const result = executeTransition(
        snapshot,
        'complete_session' as TransitionTrigger,
        'human'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid transition');
    });

    it('clears session context when returning to idle', () => {
      // Set up a snapshot in reviewing state with session context
      const reviewingSnapshot: DecisionLoopSnapshot = {
        state: 'reviewing',
        enteredAt: new Date().toISOString(),
        context: {
          sessionId: 'session-123',
          sessionStartedAt: new Date().toISOString(),
          plannedDurationMin: 60,
          taskCount: 3,
        },
        history: [],
      };

      const result = executeTransition(
        reviewingSnapshot,
        'complete_review',
        'human'
      );

      expect(result.success).toBe(true);
      expect(result.snapshot?.state).toBe('idle');
      expect(result.snapshot?.context.sessionId).toBeUndefined();
      expect(result.snapshot?.context.sessionStartedAt).toBeUndefined();
    });

    it('preserves context update on transition', () => {
      const planResult = executeTransition(
        snapshot,
        'start_planning',
        'human',
        {
          sessionId: 'new-session-456',
        }
      );

      expect(planResult.snapshot?.context.sessionId).toBe('new-session-456');
    });

    it('limits history to 20 entries', () => {
      // Create a snapshot with 19 history entries
      const fullHistorySnapshot: DecisionLoopSnapshot = {
        state: 'idle',
        enteredAt: new Date().toISOString(),
        context: { lastSessionReviewed: true },
        history: Array(19).fill({
          from: 'idle',
          to: 'planning',
          trigger: 'start_planning',
          at: new Date().toISOString(),
          actor: 'human',
        }),
      };

      const result = executeTransition(
        fullHistorySnapshot,
        'start_planning',
        'human'
      );

      expect(result.snapshot?.history).toHaveLength(20);
    });
  });

  describe('getStateInfo', () => {
    it('returns info for idle state', () => {
      const info = getStateInfo('idle');

      expect(info.name).toBe('Idle');
      expect(info.emoji).toBe('💤');
      expect(info.allowedActions).toContain('Start planning a new session');
    });

    it('returns info for planning state', () => {
      const info = getStateInfo('planning');

      expect(info.name).toBe('Planning');
      expect(info.emoji).toBe('📋');
    });

    it('returns info for executing state', () => {
      const info = getStateInfo('executing');

      expect(info.name).toBe('Executing');
      expect(info.emoji).toBe('⚡');
    });

    it('returns info for reviewing state', () => {
      const info = getStateInfo('reviewing');

      expect(info.name).toBe('Reviewing');
      expect(info.emoji).toBe('🔍');
    });
  });

  describe('formatSnapshotDisplay', () => {
    it('formats idle snapshot', () => {
      const snapshot = createInitialSnapshot();
      const display = formatSnapshotDisplay(snapshot);

      expect(display).toContain('Idle');
      expect(display).toContain('Allowed Actions');
    });

    it('includes session info when present', () => {
      const snapshot: DecisionLoopSnapshot = {
        state: 'executing',
        enteredAt: new Date().toISOString(),
        context: {
          sessionId: 'session-123',
          taskCount: 3,
          plannedDurationMin: 60,
        },
        history: [],
      };

      const display = formatSnapshotDisplay(snapshot);

      expect(display).toContain('session-123');
      expect(display).toContain('3');
      expect(display).toContain('60 min');
    });
  });

  describe('getTransitionDiagram', () => {
    it('returns mermaid diagram', () => {
      const diagram = getTransitionDiagram();

      expect(diagram).toContain('```mermaid');
      expect(diagram).toContain('stateDiagram-v2');
      expect(diagram).toContain('idle --> planning');
      expect(diagram).toContain('planning --> executing');
      expect(diagram).toContain('executing --> reviewing');
      expect(diagram).toContain('reviewing --> idle');
    });
  });

  describe('full workflow', () => {
    it('completes idle → planning → executing → reviewing → idle', () => {
      let snapshot = createInitialSnapshot({
        lastSessionReviewed: true,
        hardStopActive: false,
      });

      // Start planning
      let result = executeTransition(snapshot, 'start_planning', 'human');
      expect(result.success).toBe(true);
      snapshot = result.snapshot!;
      expect(snapshot.state).toBe('planning');

      // Confirm plan
      result = executeTransition(snapshot, 'confirm_plan', 'human', {
        taskCount: 2,
        plannedDurationMin: 45,
        sessionId: 'session-test',
      });
      expect(result.success).toBe(true);
      snapshot = result.snapshot!;
      expect(snapshot.state).toBe('executing');

      // Complete session
      result = executeTransition(snapshot, 'complete_session', 'human');
      expect(result.success).toBe(true);
      snapshot = result.snapshot!;
      expect(snapshot.state).toBe('reviewing');

      // Complete review
      result = executeTransition(snapshot, 'complete_review', 'human');
      expect(result.success).toBe(true);
      snapshot = result.snapshot!;
      expect(snapshot.state).toBe('idle');

      // Verify history
      expect(snapshot.history).toHaveLength(4);
    });

    it('supports abort workflow', () => {
      let snapshot = createInitialSnapshot({ lastSessionReviewed: true });

      // Start and confirm
      snapshot = executeTransition(
        snapshot,
        'start_planning',
        'human'
      ).snapshot!;
      snapshot = executeTransition(snapshot, 'confirm_plan', 'human', {
        taskCount: 1,
        plannedDurationMin: 30,
        sessionId: 'session-abort',
      }).snapshot!;

      // Abort
      const result = executeTransition(snapshot, 'abort_session', 'human');

      expect(result.success).toBe(true);
      expect(result.snapshot?.state).toBe('reviewing');
    });
  });
});
