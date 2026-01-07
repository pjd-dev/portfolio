import { describe, it, expect } from 'vitest';
import {
  checkSessionReviewNeeded,
  toValidationBlocker,
  formatSessionReviewPrompt,
  SessionReviewState,
} from '../session-review';

describe('SESSION_REVIEW Guardrail', () => {
  describe('checkSessionReviewNeeded', () => {
    it('returns reviewNeeded=false when no previous session', () => {
      const state: Partial<SessionReviewState> = {
        lastSessionId: undefined,
        lastSessionReviewed: false,
      };

      const result = checkSessionReviewNeeded(state);
      expect(result.reviewNeeded).toBe(false);
      expect(result.skipAllowed).toBe(false);
    });

    it('returns reviewNeeded=false when last session was reviewed', () => {
      const state: Partial<SessionReviewState> = {
        lastSessionId: 'session-123',
        lastSessionReviewed: true,
      };

      const result = checkSessionReviewNeeded(state);
      expect(result.reviewNeeded).toBe(false);
      expect(result.skipAllowed).toBe(false);
    });

    it('returns hard blocker when review required and not skippable', () => {
      const endTime = new Date('2026-01-07T14:00:00');
      const state: Partial<SessionReviewState> = {
        lastSessionId: 'session-123',
        lastSessionReviewed: false,
        lastSessionEndedAt: endTime.toISOString(),
        currentSessionId: 'session-124',
      };

      const result = checkSessionReviewNeeded(state, {
        enforceReview: true,
        allowSkip: false,
      });

      expect(result.reviewNeeded).toBe(true);
      expect(result.skipAllowed).toBe(false);
      expect(result.reason).toContain('Session review required');
      expect(result.previousSession?.sessionId).toBe('session-123');
    });

    it('returns soft blocker when review recommended but skippable', () => {
      const state: Partial<SessionReviewState> = {
        lastSessionId: 'session-123',
        lastSessionReviewed: false,
        lastSessionEndedAt: new Date().toISOString(),
      };

      const result = checkSessionReviewNeeded(state, {
        enforceReview: true,
        allowSkip: true,
      });

      expect(result.reviewNeeded).toBe(true);
      expect(result.skipAllowed).toBe(true);
      expect(result.reason).toContain('Review recommended');
    });

    it('returns no review needed when enforceReview=false', () => {
      const state: Partial<SessionReviewState> = {
        lastSessionId: 'session-123',
        lastSessionReviewed: false,
      };

      const result = checkSessionReviewNeeded(state, {
        enforceReview: false,
      });

      expect(result.reviewNeeded).toBe(false);
      expect(result.skipAllowed).toBe(true);
    });

    it('calculates minutes since session end', () => {
      const endTime = new Date();
      endTime.setMinutes(endTime.getMinutes() - 15);

      const state: Partial<SessionReviewState> = {
        lastSessionId: 'session-123',
        lastSessionReviewed: false,
        lastSessionEndedAt: endTime.toISOString(),
      };

      const result = checkSessionReviewNeeded(state, {
        enforceReview: true,
        allowSkip: false,
      });

      expect(result.minutesSinceEnd).toBeCloseTo(15, 1);
    });

    it('respects custom review duration config', () => {
      const state: Partial<SessionReviewState> = {
        lastSessionId: 'session-123',
        lastSessionReviewed: false,
        lastSessionEndedAt: new Date().toISOString(),
      };

      const result = checkSessionReviewNeeded(state, {
        reviewMinDuration: 30,
      });

      expect(result.reviewRequired).toBe(30);
    });
  });

  describe('toValidationBlocker', () => {
    it('returns null when review not needed', () => {
      const result = checkSessionReviewNeeded({
        lastSessionId: undefined,
      });

      const blocker = toValidationBlocker(result);
      expect(blocker).toBeNull();
    });

    it('returns hard blocker when review required and not skippable', () => {
      const state: Partial<SessionReviewState> = {
        lastSessionId: 'session-123',
        lastSessionReviewed: false,
        lastSessionEndedAt: new Date().toISOString(),
      };

      const result = checkSessionReviewNeeded(state, {
        enforceReview: true,
        allowSkip: false,
      });

      const blocker = toValidationBlocker(result);
      expect(blocker).toBeDefined();
      expect(blocker?.blocking).toBe(true);
    });

    it('returns soft blocker when review recommended but skippable', () => {
      const state: Partial<SessionReviewState> = {
        lastSessionId: 'session-123',
        lastSessionReviewed: false,
        lastSessionEndedAt: new Date().toISOString(),
      };

      const result = checkSessionReviewNeeded(state, {
        enforceReview: true,
        allowSkip: true,
      });

      const blocker = toValidationBlocker(result);
      expect(blocker).toBeDefined();
      expect(blocker?.blocking).toBe(false);
    });
  });

  describe('formatSessionReviewPrompt', () => {
    it('formats review prompt with session info and time', () => {
      const previousSession = {
        sessionId: 'session-123',
        endedAt: new Date('2026-01-07T14:00:00').toISOString(),
      };

      const prompt = formatSessionReviewPrompt(previousSession, 10);

      expect(prompt).toContain('session-123');
      expect(prompt).toContain('10 minutes');
      expect(prompt).toContain('What worked well');
      expect(prompt).toContain('What could improve');
    });

    it('includes all review questions', () => {
      const prompt = formatSessionReviewPrompt(
        { sessionId: 'test', endedAt: new Date().toISOString() },
        15
      );

      expect(prompt).toContain('worked well');
      expect(prompt).toContain('could improve');
      expect(prompt).toContain('insight');
      expect(prompt).toContain('Recommendations');
    });
  });

  describe('integration scenarios', () => {
    it('typical flow: session ends → review needed → review done → ready for next', () => {
      // Session 1 completes without review
      let state: Partial<SessionReviewState> = {
        lastSessionId: 'session-1',
        lastSessionReviewed: false,
        lastSessionEndedAt: new Date().toISOString(),
      };

      let check = checkSessionReviewNeeded(state);
      expect(check.reviewNeeded).toBe(true);

      // After user completes review
      state = { ...state, lastSessionReviewed: true };
      check = checkSessionReviewNeeded(state);
      expect(check.reviewNeeded).toBe(false);

      // Ready to start new session
      expect(check.skipAllowed).toBe(false);
    });

    it('user-initiated skip: allows skipping when configured', () => {
      const state: Partial<SessionReviewState> = {
        lastSessionId: 'session-1',
        lastSessionReviewed: false,
        lastSessionEndedAt: new Date().toISOString(),
      };

      const result = checkSessionReviewNeeded(state, {
        enforceReview: true,
        allowSkip: true, // User can skip
      });

      expect(result.reviewNeeded).toBe(true);
      expect(result.skipAllowed).toBe(true);
      expect(result.reason).toContain('recommended');
    });

    it('strict mode: blocks starting new session until review done', () => {
      const state: Partial<SessionReviewState> = {
        lastSessionId: 'session-1',
        lastSessionReviewed: false,
        lastSessionEndedAt: new Date().toISOString(),
        currentSessionId: 'session-2', // User trying to start new session
      };

      const result = checkSessionReviewNeeded(state, {
        enforceReview: true,
        allowSkip: false, // Strict mode
      });

      const blocker = toValidationBlocker(result);
      expect(blocker?.blocking).toBe(true); // Blocks validation
    });
  });
});
