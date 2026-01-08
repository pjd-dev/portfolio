/**
 * Productivity Patterns Tests
 *
 * Test cases from spec: projects/COD/19-Productivity-Patterns-Spec.md
 *
 * 1. createProductivityEntry extracts correct hour/day
 * 2. computeProductivityPatterns groups correctly
 * 3. Peak hours sorted by completion rate
 * 4. Avoid hours are lowest 3
 * 5. getProductivityWarning triggers on avoid hour
 * 6. Summary string generated correctly
 */

import { describe, it, expect } from 'vitest';
import {
  createProductivityEntry,
  computeProductivityPatterns,
  getProductivityWarning,
  type ProductivityEntry,
  type SessionForProductivity,
} from '../productivity-patterns.js';

describe('Productivity Patterns', () => {
  // Test 1: createProductivityEntry extracts correct hour/day
  describe('createProductivityEntry', () => {
    it('extracts correct hour and day from session', () => {
      // Create a date that's 9 AM local time
      const startTime = new Date();
      startTime.setHours(9, 0, 0, 0);

      // Monday is day 1
      const dayOffset = (1 - startTime.getDay() + 7) % 7;
      startTime.setDate(startTime.getDate() + dayOffset);

      const endTime = new Date(startTime.getTime() + 90 * 60 * 1000); // 90 minutes later

      const session: SessionForProductivity = {
        id: 'session-1',
        startedAt: startTime.toISOString(),
        endedAt: endTime.toISOString(),
        tasks: [
          { status: 'done', effortScore: 3 },
          { status: 'done', effortScore: 5 },
          { status: 'pending', effortScore: 2 },
        ],
      };

      const entry = createProductivityEntry(session);

      expect(entry.hourOfDay).toBe(9);
      expect(entry.dayOfWeek).toBe(1); // Monday
      expect(entry.tasksCompleted).toBe(2);
      expect(entry.completionRate).toBeCloseTo(2 / 3);
      expect(entry.sessionId).toBe('session-1');
      expect(entry.effortCompleted).toBe(8); // 3 + 5
    });

    it('includes human state when provided', () => {
      const session: SessionForProductivity = {
        id: 'session-2',
        startedAt: '2026-01-07T14:00:00.000Z', // Tuesday 2 PM UTC
        endedAt: '2026-01-07T15:00:00.000Z',
        tasks: [{ status: 'done', effortScore: 3 }],
      };

      const entry = createProductivityEntry(session, {
        energy: 80,
        focusCapacity: 'high',
      });

      expect(entry.humanStateEnergy).toBe(80);
      expect(entry.humanStateFocus).toBe('high');
    });

    it('handles empty task list', () => {
      const session: SessionForProductivity = {
        id: 'session-3',
        startedAt: '2026-01-08T10:00:00.000Z',
        endedAt: '2026-01-08T10:30:00.000Z',
        tasks: [],
      };

      const entry = createProductivityEntry(session);

      expect(entry.tasksCompleted).toBe(0);
      expect(entry.completionRate).toBe(0);
    });
  });

  // Test 2: computeProductivityPatterns groups correctly
  describe('computeProductivityPatterns', () => {
    it('groups entries by hour and day correctly', () => {
      const entries: ProductivityEntry[] = [
        // 9 AM on Monday - high completion
        {
          ts: '2026-01-06T10:00:00.000Z',
          hourOfDay: 9,
          dayOfWeek: 1,
          tasksCompleted: 5,
          effortCompleted: 15,
          sessionDurationMin: 60,
          completionRate: 1.0,
          sessionId: 's1',
        },
        // 9 AM on Monday - high completion (same hour/day)
        {
          ts: '2026-01-13T10:00:00.000Z',
          hourOfDay: 9,
          dayOfWeek: 1,
          tasksCompleted: 4,
          effortCompleted: 12,
          sessionDurationMin: 60,
          completionRate: 0.8,
          sessionId: 's2',
        },
        // 3 PM on Friday - low completion
        {
          ts: '2026-01-10T16:00:00.000Z',
          hourOfDay: 15,
          dayOfWeek: 5,
          tasksCompleted: 1,
          effortCompleted: 3,
          sessionDurationMin: 60,
          completionRate: 0.2,
          sessionId: 's3',
        },
      ];

      const patterns = computeProductivityPatterns(entries);

      // Should have 2 hours (9 and 15)
      expect(patterns.byHour.length).toBe(2);

      // Hour 9 should have 2 data points with avg rate 0.9
      const hour9 = patterns.byHour.find((h) => h.hour === 9);
      expect(hour9).toBeDefined();
      expect(hour9!.dataPoints).toBe(2);
      expect(hour9!.avgCompletionRate).toBeCloseTo(0.9);
      expect(hour9!.quality).toBe('high');

      // Hour 15 should have 1 data point with low rate
      const hour15 = patterns.byHour.find((h) => h.hour === 15);
      expect(hour15).toBeDefined();
      expect(hour15!.dataPoints).toBe(1);
      expect(hour15!.avgCompletionRate).toBeCloseTo(0.2);
      expect(hour15!.quality).toBe('low');

      // Should have 2 days (Monday=1 and Friday=5)
      expect(patterns.byDay.length).toBe(2);

      const monday = patterns.byDay.find((d) => d.day === 1);
      expect(monday).toBeDefined();
      expect(monday!.dayName).toBe('Monday');
      expect(monday!.dataPoints).toBe(2);
    });

    it('returns empty patterns for empty input', () => {
      const patterns = computeProductivityPatterns([]);

      expect(patterns.totalDataPoints).toBe(0);
      expect(patterns.byHour).toEqual([]);
      expect(patterns.byDay).toEqual([]);
      expect(patterns.peakHours).toEqual([]);
    });
  });

  // Test 3: Peak hours sorted by completion rate
  describe('peakHours', () => {
    it('returns top 3 hours sorted by completion rate', () => {
      const entries: ProductivityEntry[] = [
        {
          ts: '',
          hourOfDay: 9,
          dayOfWeek: 1,
          tasksCompleted: 5,
          effortCompleted: 15,
          sessionDurationMin: 60,
          completionRate: 0.95,
          sessionId: 's1',
        },
        {
          ts: '',
          hourOfDay: 10,
          dayOfWeek: 1,
          tasksCompleted: 4,
          effortCompleted: 12,
          sessionDurationMin: 60,
          completionRate: 0.85,
          sessionId: 's2',
        },
        {
          ts: '',
          hourOfDay: 11,
          dayOfWeek: 1,
          tasksCompleted: 4,
          effortCompleted: 12,
          sessionDurationMin: 60,
          completionRate: 0.75,
          sessionId: 's3',
        },
        {
          ts: '',
          hourOfDay: 14,
          dayOfWeek: 1,
          tasksCompleted: 2,
          effortCompleted: 6,
          sessionDurationMin: 60,
          completionRate: 0.5,
          sessionId: 's4',
        },
        {
          ts: '',
          hourOfDay: 15,
          dayOfWeek: 1,
          tasksCompleted: 1,
          effortCompleted: 3,
          sessionDurationMin: 60,
          completionRate: 0.25,
          sessionId: 's5',
        },
      ];

      const patterns = computeProductivityPatterns(entries);

      // Peak hours should be 9, 10, 11 (highest completion rates)
      expect(patterns.peakHours).toHaveLength(3);
      expect(patterns.peakHours[0]).toBe(9); // 95%
      expect(patterns.peakHours[1]).toBe(10); // 85%
      expect(patterns.peakHours[2]).toBe(11); // 75%
    });
  });

  // Test 4: Avoid hours are lowest 3
  describe('avoidHours', () => {
    it('returns lowest 3 hours by completion rate', () => {
      const entries: ProductivityEntry[] = [
        {
          ts: '',
          hourOfDay: 9,
          dayOfWeek: 1,
          tasksCompleted: 5,
          effortCompleted: 15,
          sessionDurationMin: 60,
          completionRate: 0.95,
          sessionId: 's1',
        },
        {
          ts: '',
          hourOfDay: 10,
          dayOfWeek: 1,
          tasksCompleted: 4,
          effortCompleted: 12,
          sessionDurationMin: 60,
          completionRate: 0.85,
          sessionId: 's2',
        },
        {
          ts: '',
          hourOfDay: 14,
          dayOfWeek: 1,
          tasksCompleted: 2,
          effortCompleted: 6,
          sessionDurationMin: 60,
          completionRate: 0.5,
          sessionId: 's3',
        },
        {
          ts: '',
          hourOfDay: 15,
          dayOfWeek: 1,
          tasksCompleted: 1,
          effortCompleted: 3,
          sessionDurationMin: 60,
          completionRate: 0.3,
          sessionId: 's4',
        },
        {
          ts: '',
          hourOfDay: 16,
          dayOfWeek: 1,
          tasksCompleted: 1,
          effortCompleted: 3,
          sessionDurationMin: 60,
          completionRate: 0.2,
          sessionId: 's5',
        },
      ];

      const patterns = computeProductivityPatterns(entries);

      // Avoid hours should be 16, 15, 14 (lowest completion rates)
      expect(patterns.avoidHours).toHaveLength(3);
      expect(patterns.avoidHours).toContain(16); // 20%
      expect(patterns.avoidHours).toContain(15); // 30%
      expect(patterns.avoidHours).toContain(14); // 50%
    });
  });

  // Test 5: getProductivityWarning triggers on avoid hour
  describe('getProductivityWarning', () => {
    it('triggers warning on avoid hour', () => {
      // Need enough hours so that bottom 3 (avoidHours) doesn't include top hours
      const patterns = computeProductivityPatterns([
        // High productivity hours (top 3)
        {
          ts: '',
          hourOfDay: 9,
          dayOfWeek: 1,
          tasksCompleted: 5,
          effortCompleted: 15,
          sessionDurationMin: 60,
          completionRate: 0.95,
          sessionId: 's1',
        },
        {
          ts: '',
          hourOfDay: 10,
          dayOfWeek: 1,
          tasksCompleted: 5,
          effortCompleted: 15,
          sessionDurationMin: 60,
          completionRate: 0.9,
          sessionId: 's2',
        },
        {
          ts: '',
          hourOfDay: 11,
          dayOfWeek: 1,
          tasksCompleted: 5,
          effortCompleted: 15,
          sessionDurationMin: 60,
          completionRate: 0.85,
          sessionId: 's3',
        },
        // Low productivity hours (bottom 3 = avoidHours)
        {
          ts: '',
          hourOfDay: 15,
          dayOfWeek: 1,
          tasksCompleted: 1,
          effortCompleted: 3,
          sessionDurationMin: 60,
          completionRate: 0.2,
          sessionId: 's4',
        },
        {
          ts: '',
          hourOfDay: 16,
          dayOfWeek: 1,
          tasksCompleted: 1,
          effortCompleted: 3,
          sessionDurationMin: 60,
          completionRate: 0.15,
          sessionId: 's5',
        },
        {
          ts: '',
          hourOfDay: 17,
          dayOfWeek: 1,
          tasksCompleted: 1,
          effortCompleted: 3,
          sessionDurationMin: 60,
          completionRate: 0.1,
          sessionId: 's6',
        },
      ]);

      // 17:00 should be in avoidHours (lowest rate)
      expect(patterns.avoidHours).toContain(17);

      // Create a date at 17:00 local time
      const testDate = new Date();
      testDate.setHours(17, 0, 0, 0);
      const warning = getProductivityWarning(testDate, patterns);

      expect(warning).toBeDefined();
      expect(warning).toContain('17:00');
      expect(warning).toContain('10%'); // 0.10 = 10%
    });

    it('triggers warning on avoid day', () => {
      // Need at least 4 different hours so avoidHours (bottom 3) doesn't include hour 9
      // and at least 4 different days so avoidDays (bottom 2) includes Saturday
      const patterns = computeProductivityPatterns([
        // High productivity: various hours on good days
        {
          ts: '',
          hourOfDay: 9,
          dayOfWeek: 1,
          tasksCompleted: 5,
          effortCompleted: 15,
          sessionDurationMin: 60,
          completionRate: 0.95,
          sessionId: 's1',
        },
        {
          ts: '',
          hourOfDay: 10,
          dayOfWeek: 2,
          tasksCompleted: 5,
          effortCompleted: 15,
          sessionDurationMin: 60,
          completionRate: 0.92,
          sessionId: 's2',
        },
        {
          ts: '',
          hourOfDay: 11,
          dayOfWeek: 3,
          tasksCompleted: 5,
          effortCompleted: 15,
          sessionDurationMin: 60,
          completionRate: 0.88,
          sessionId: 's3',
        },
        {
          ts: '',
          hourOfDay: 14,
          dayOfWeek: 4,
          tasksCompleted: 5,
          effortCompleted: 15,
          sessionDurationMin: 60,
          completionRate: 0.85,
          sessionId: 's4',
        },
        // Low productivity: different hours on bad days (Friday, Saturday)
        {
          ts: '',
          hourOfDay: 15,
          dayOfWeek: 5,
          tasksCompleted: 1,
          effortCompleted: 3,
          sessionDurationMin: 60,
          completionRate: 0.2,
          sessionId: 's5',
        },
        {
          ts: '',
          hourOfDay: 16,
          dayOfWeek: 5,
          tasksCompleted: 1,
          effortCompleted: 3,
          sessionDurationMin: 60,
          completionRate: 0.18,
          sessionId: 's6',
        },
        {
          ts: '',
          hourOfDay: 17,
          dayOfWeek: 6,
          tasksCompleted: 1,
          effortCompleted: 3,
          sessionDurationMin: 60,
          completionRate: 0.15,
          sessionId: 's7',
        },
        {
          ts: '',
          hourOfDay: 9,
          dayOfWeek: 6,
          tasksCompleted: 1,
          effortCompleted: 3,
          sessionDurationMin: 60,
          completionRate: 0.12,
          sessionId: 's8',
        },
      ]);

      // With 7 different hours (9,10,11,14,15,16,17), avoidHours should be bottom 3: 15,16,17
      // With 5 different days (1,2,3,4,5,6), avoidDays should be bottom 2: 5 (Friday), 6 (Saturday)
      expect(patterns.avoidDays).toContain(6); // Saturday
      expect(patterns.avoidHours).not.toContain(9); // Hour 9 should NOT be avoid (it has mixed but mostly good)

      // Create a Saturday at hour 9 (should trigger DAY warning, not HOUR warning)
      const testDate = new Date();
      const dayOffset = (6 - testDate.getDay() + 7) % 7 || 7; // Ensure it's next Saturday
      testDate.setDate(testDate.getDate() + dayOffset);
      testDate.setHours(9, 0, 0, 0);

      const saturdayWarning = getProductivityWarning(testDate, patterns);

      expect(saturdayWarning).toBeDefined();
      expect(saturdayWarning).toContain('Saturday');
    });

    it('returns undefined for good time', () => {
      const patterns = computeProductivityPatterns([
        {
          ts: '',
          hourOfDay: 9,
          dayOfWeek: 1,
          tasksCompleted: 5,
          effortCompleted: 15,
          sessionDurationMin: 60,
          completionRate: 0.95,
          sessionId: 's1',
        },
        {
          ts: '',
          hourOfDay: 15,
          dayOfWeek: 1,
          tasksCompleted: 1,
          effortCompleted: 3,
          sessionDurationMin: 60,
          completionRate: 0.2,
          sessionId: 's2',
        },
        {
          ts: '',
          hourOfDay: 16,
          dayOfWeek: 1,
          tasksCompleted: 1,
          effortCompleted: 3,
          sessionDurationMin: 60,
          completionRate: 0.15,
          sessionId: 's3',
        },
        {
          ts: '',
          hourOfDay: 17,
          dayOfWeek: 1,
          tasksCompleted: 1,
          effortCompleted: 3,
          sessionDurationMin: 60,
          completionRate: 0.1,
          sessionId: 's4',
        },
      ]);

      // 9:00 on Monday is a peak hour - should not warn
      const warning = getProductivityWarning(
        new Date('2026-01-06T09:00:00.000Z'),
        patterns
      );

      expect(warning).toBeUndefined();
    });
  });

  // Test 6: Summary string generated correctly
  describe('bestTimeSlot summary', () => {
    it('generates summary string correctly', () => {
      const patterns = computeProductivityPatterns([
        // High on Monday and Tuesday at 9 AM
        {
          ts: '',
          hourOfDay: 9,
          dayOfWeek: 1,
          tasksCompleted: 5,
          effortCompleted: 15,
          sessionDurationMin: 60,
          completionRate: 0.95,
          sessionId: 's1',
        },
        {
          ts: '',
          hourOfDay: 9,
          dayOfWeek: 2,
          tasksCompleted: 5,
          effortCompleted: 15,
          sessionDurationMin: 60,
          completionRate: 0.9,
          sessionId: 's2',
        },
        // Low on other times
        {
          ts: '',
          hourOfDay: 15,
          dayOfWeek: 5,
          tasksCompleted: 1,
          effortCompleted: 3,
          sessionDurationMin: 60,
          completionRate: 0.2,
          sessionId: 's3',
        },
      ]);

      expect(patterns.bestTimeSlot).toBeDefined();
      expect(patterns.bestTimeSlot).toContain('Monday');
      expect(patterns.bestTimeSlot).toContain('9:00');
    });

    it('generates worstTimeSlot correctly', () => {
      const patterns = computeProductivityPatterns([
        {
          ts: '',
          hourOfDay: 9,
          dayOfWeek: 1,
          tasksCompleted: 5,
          effortCompleted: 15,
          sessionDurationMin: 60,
          completionRate: 0.95,
          sessionId: 's1',
        },
        {
          ts: '',
          hourOfDay: 9,
          dayOfWeek: 2,
          tasksCompleted: 5,
          effortCompleted: 15,
          sessionDurationMin: 60,
          completionRate: 0.9,
          sessionId: 's2',
        },
        {
          ts: '',
          hourOfDay: 15,
          dayOfWeek: 5,
          tasksCompleted: 1,
          effortCompleted: 3,
          sessionDurationMin: 60,
          completionRate: 0.2,
          sessionId: 's3',
        },
        {
          ts: '',
          hourOfDay: 16,
          dayOfWeek: 6,
          tasksCompleted: 1,
          effortCompleted: 3,
          sessionDurationMin: 60,
          completionRate: 0.1,
          sessionId: 's4',
        },
      ]);

      expect(patterns.worstTimeSlot).toBeDefined();
      // Worst should include lowest days (Friday/Saturday) and lowest hours
      expect(patterns.worstTimeSlot).toMatch(/Friday|Saturday/);
    });
  });
});
