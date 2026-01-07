import { describe, it, expect } from 'vitest';
import {
  isHardStopActive,
  timeUntilHardStopEnd,
  checkHardStop,
  toValidationBlocker,
  HardStopCheckResult,
} from '../hard-stop';

describe('HARD_STOP Guardrail', () => {
  describe('isHardStopActive', () => {
    it('returns true during late-night window (23:00-07:00)', () => {
      const late = new Date('2026-01-07T23:30:00');
      expect(isHardStopActive(late)).toBe(true);

      const midnight = new Date('2026-01-08T00:30:00');
      expect(isHardStopActive(midnight)).toBe(true);

      const earlyMorning = new Date('2026-01-08T06:30:00');
      expect(isHardStopActive(earlyMorning)).toBe(true);
    });

    it('returns false during work hours (07:00-23:00)', () => {
      const morning = new Date('2026-01-07T08:00:00');
      expect(isHardStopActive(morning)).toBe(false);

      const afternoon = new Date('2026-01-07T15:30:00');
      expect(isHardStopActive(afternoon)).toBe(false);

      const evening = new Date('2026-01-07T22:59:00');
      expect(isHardStopActive(evening)).toBe(false);
    });

    it('respects custom window config', () => {
      const config = { windowStart: 20, windowEnd: 6 }; // 8 PM - 6 AM
      const at9pm = new Date('2026-01-07T21:00:00');
      expect(isHardStopActive(at9pm, config)).toBe(true);

      const at7pm = new Date('2026-01-07T19:00:00');
      expect(isHardStopActive(at7pm, config)).toBe(false);
    });

    it('handles boundary times correctly', () => {
      const atExactStart = new Date('2026-01-07T23:00:00');
      expect(isHardStopActive(atExactStart)).toBe(true);

      const justBefore = new Date('2026-01-07T22:59:59');
      expect(isHardStopActive(justBefore)).toBe(false);

      const atExactEnd = new Date('2026-01-08T07:00:00');
      expect(isHardStopActive(atExactEnd)).toBe(false);

      const justBefore7am = new Date('2026-01-08T06:59:59');
      expect(isHardStopActive(justBefore7am)).toBe(true);
    });
  });

  describe('timeUntilHardStopEnd', () => {
    it('calculates minutes until window ends during active window', () => {
      const at11pm = new Date('2026-01-07T23:00:00');
      const until7am = timeUntilHardStopEnd(at11pm);
      expect(until7am).toBe(8 * 60); // 8 hours

      const at1am = new Date('2026-01-08T01:00:00');
      const until7amFrom1 = timeUntilHardStopEnd(at1am);
      expect(until7amFrom1).toBe(6 * 60); // 6 hours
    });

    it('returns time to next window end when outside window', () => {
      const at3pm = new Date('2026-01-07T15:00:00');
      const minutes = timeUntilHardStopEnd(at3pm);
      // 15:00 to 07:00 (next day) = 16 hours = 960 minutes
      expect(minutes).toBe(16 * 60);
    });

    it('respects custom window end time', () => {
      const at9pm = new Date('2026-01-07T21:00:00');
      const until6am = timeUntilHardStopEnd(at9pm, { windowEnd: 6 });
      expect(until6am).toBe(9 * 60); // 9 hours until 6 AM
    });
  });

  describe('checkHardStop', () => {
    it('returns blocked=true with reason during HARD_STOP', () => {
      const late = new Date('2026-01-07T23:30:00');
      const result = checkHardStop(late);

      expect(result.blocked).toBe(true);
      expect(result.reason).toBeDefined();
      expect(result.window).toEqual({ start: '23:00', end: '07:00' });
      expect(result.timeUntilResume).toBeDefined();
      expect(result.overridable).toBe(true);
    });

    it('returns blocked=false outside HARD_STOP', () => {
      const afternoon = new Date('2026-01-07T14:00:00');
      const result = checkHardStop(afternoon);

      expect(result.blocked).toBe(false);
      expect(result.reason).toBeUndefined();
      expect(result.overridable).toBe(false);
    });

    it('respects allowOverride config', () => {
      const late = new Date('2026-01-07T23:30:00');

      const overridable = checkHardStop(late, { allowOverride: true });
      expect(overridable.overridable).toBe(true);

      const notOverridable = checkHardStop(late, { allowOverride: false });
      expect(notOverridable.overridable).toBe(false);
    });

    it('formats duration correctly in reason', () => {
      const at11pm = new Date('2026-01-07T23:00:00');
      const result = checkHardStop(at11pm);

      expect(result.reason).toContain('8h'); // 8 hours until 7 AM
    });
  });

  describe('toValidationBlocker', () => {
    it('returns null when not blocked', () => {
      const afternoon = new Date('2026-01-07T14:00:00');
      const result = checkHardStop(afternoon);
      const blocker = toValidationBlocker(result);

      expect(blocker).toBeNull();
    });

    it('returns soft blocker (blocking=false) when overridable', () => {
      const late = new Date('2026-01-07T23:30:00');
      const result = checkHardStop(late, { allowOverride: true });
      const blocker = toValidationBlocker(result);

      expect(blocker).toBeDefined();
      expect(blocker?.blocking).toBe(false); // Soft block (warning)
      expect(blocker?.reason).toContain('HARD_STOP');
    });

    it('returns hard blocker (blocking=true) when not overridable', () => {
      const late = new Date('2026-01-07T23:30:00');
      const result = checkHardStop(late, { allowOverride: false });
      const blocker = toValidationBlocker(result);

      expect(blocker).toBeDefined();
      expect(blocker?.blocking).toBe(true); // Hard block (fail)
    });
  });

  describe('integration with COD validation', () => {
    it('example: MCP adapter checks HARD_STOP before planning session', () => {
      const userTime = new Date('2026-01-08T01:00:00'); // 1 AM
      const hardStopResult = checkHardStop(userTime);

      // Adapter would do:
      if (hardStopResult.blocked) {
        // Add blocker to validation result
        expect(hardStopResult.reason).toContain('HARD_STOP');
        expect(hardStopResult.timeUntilResume).toBe('6h');
      }
    });
  });
});
