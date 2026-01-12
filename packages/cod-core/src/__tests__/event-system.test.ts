/**
 * Event System Tests
 */

import { describe, it, expect } from 'vitest';
import {
  KNOWN_EVENTS,
  SURPRISE_EVENT_DEFAULTS,
  findKnownEvent,
  isKnownEventType,
  getSurpriseEventDefaults,
  validateSurpriseEvent,
  createEventLogEntry,
  calculateEventImpact,
  processEvent,
  getAllEventTypes,
  getEventsAffecting,
} from '../guardrails/event-system.js';

describe('Event System', () => {
  describe('KNOWN_EVENTS registry', () => {
    it('has avatar-related events', () => {
      const avatarEvents = KNOWN_EVENTS.filter(
        (e) => e.affects === 'avatar' || e.affects === 'both'
      );
      expect(avatarEvents.length).toBeGreaterThan(0);
      expect(avatarEvents.some((e) => e.type === 'task_completed')).toBe(true);
      expect(avatarEvents.some((e) => e.type === 'session_ended')).toBe(true);
    });

    it('has world-related events', () => {
      const worldEvents = KNOWN_EVENTS.filter(
        (e) => e.affects === 'world' || e.affects === 'both'
      );
      expect(worldEvents.length).toBeGreaterThan(0);
      expect(worldEvents.some((e) => e.type === 'location_changed')).toBe(true);
      expect(worldEvents.some((e) => e.type === 'disruption_started')).toBe(
        true
      );
    });

    it('has daily events affecting both', () => {
      const bothEvents = KNOWN_EVENTS.filter((e) => e.affects === 'both');
      expect(bothEvents.length).toBeGreaterThan(0);
      expect(bothEvents.some((e) => e.type === 'day_started')).toBe(true);
      expect(bothEvents.some((e) => e.type === 'day_ended')).toBe(true);
    });

    it('each event has a handler', () => {
      for (const event of KNOWN_EVENTS) {
        expect(event.handler).toBeDefined();
        expect(event.handler.length).toBeGreaterThan(0);
      }
    });
  });

  describe('SURPRISE_EVENT_DEFAULTS', () => {
    it('positive events increase energy and give xp', () => {
      const positive = SURPRISE_EVENT_DEFAULTS.positive;
      expect(positive.avatar?.energy).toBeGreaterThan(0);
      expect(positive.avatar?.xp).toBeGreaterThan(0);
    });

    it('negative events decrease energy and increase stress', () => {
      const negative = SURPRISE_EVENT_DEFAULTS.negative;
      expect(negative.avatar?.energy).toBeLessThan(0);
      expect(negative.avatar?.stress).toBeGreaterThan(0);
      expect(negative.world?.disrupted).toBe(true);
    });

    it('neutral events have no impact', () => {
      const neutral = SURPRISE_EVENT_DEFAULTS.neutral;
      expect(neutral.avatar).toBeUndefined();
      expect(neutral.world).toBeUndefined();
    });
  });

  describe('findKnownEvent', () => {
    it('finds existing events', () => {
      const event = findKnownEvent('task_completed');
      expect(event).toBeDefined();
      expect(event?.handler).toBe('applyTaskReward');
    });

    it('returns undefined for unknown events', () => {
      const event = findKnownEvent('unknown_event');
      expect(event).toBeUndefined();
    });
  });

  describe('isKnownEventType', () => {
    it('returns true for known events', () => {
      expect(isKnownEventType('task_completed')).toBe(true);
      expect(isKnownEventType('session_ended')).toBe(true);
      expect(isKnownEventType('day_started')).toBe(true);
    });

    it('returns false for unknown events', () => {
      expect(isKnownEventType('unknown')).toBe(false);
      expect(isKnownEventType('surprise')).toBe(false); // surprise is handled separately
    });
  });

  describe('getSurpriseEventDefaults', () => {
    it('returns correct defaults for each category', () => {
      expect(
        getSurpriseEventDefaults('positive').avatar?.energy
      ).toBeGreaterThan(0);
      expect(getSurpriseEventDefaults('negative').avatar?.energy).toBeLessThan(
        0
      );
      expect(getSurpriseEventDefaults('neutral').avatar).toBeUndefined();
    });
  });

  describe('validateSurpriseEvent', () => {
    it('accepts valid surprise event', () => {
      const result = validateSurpriseEvent({
        type: 'surprise',
        category: 'positive',
        description: 'Got a great review!',
        affects: 'avatar',
      });
      expect(result.valid).toBe(true);
      expect(result.event).toBeDefined();
      expect(result.event?.category).toBe('positive');
    });

    it('rejects non-object', () => {
      const result = validateSurpriseEvent('not an object');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be an object');
    });

    it('rejects wrong type', () => {
      const result = validateSurpriseEvent({
        type: 'not_surprise',
        category: 'positive',
        description: 'Test',
        affects: 'avatar',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('type="surprise"');
    });

    it('rejects invalid category', () => {
      const result = validateSurpriseEvent({
        type: 'surprise',
        category: 'invalid',
        description: 'Test',
        affects: 'avatar',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('category');
    });

    it('rejects missing description', () => {
      const result = validateSurpriseEvent({
        type: 'surprise',
        category: 'positive',
        affects: 'avatar',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('description');
    });

    it('rejects invalid affects', () => {
      const result = validateSurpriseEvent({
        type: 'surprise',
        category: 'positive',
        description: 'Test',
        affects: 'invalid',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('affects');
    });
  });

  describe('createEventLogEntry', () => {
    it('creates entry with timestamp', () => {
      const entry = createEventLogEntry('task_completed', {
        avatar: { xp: 5 },
      });
      expect(entry.ts).toBeDefined();
      expect(entry.type).toBe('task_completed');
      expect(entry.impact.avatar?.xp).toBe(5);
    });

    it('includes optional data', () => {
      const entry = createEventLogEntry(
        'task_completed',
        { avatar: { xp: 5 } },
        { taskId: 'task-123', source: 'system' }
      );
      expect(entry.taskId).toBe('task-123');
      expect(entry.source).toBe('system');
    });
  });

  describe('calculateEventImpact', () => {
    it('returns defaults for surprise events', () => {
      const impact = calculateEventImpact('surprise', {
        category: 'positive',
      });
      expect(impact.avatar?.energy).toBeGreaterThan(0);
    });

    it('merges suggested impact with defaults', () => {
      const impact = calculateEventImpact('surprise', {
        category: 'positive',
        suggestedImpact: { avatar: { xp: 10 } },
      });
      expect(impact.avatar?.xp).toBe(10);
      expect(impact.avatar?.energy).toBeGreaterThan(0); // from defaults
    });

    it('returns empty for known events (handled by handlers)', () => {
      const impact = calculateEventImpact('task_completed', { taskId: 't123' });
      // Known events are calculated by handlers, not here
      expect(impact).toBeDefined();
    });
  });

  describe('processEvent', () => {
    it('processes known events', () => {
      const result = processEvent('task_completed', { taskId: 't123' });
      expect(result.success).toBe(true);
      expect(result.eventType).toBe('task_completed');
      expect(result.timestamp).toBeDefined();
    });

    it('processes valid surprise events', () => {
      const result = processEvent('surprise', {
        type: 'surprise',
        category: 'positive',
        description: 'Great news!',
        affects: 'avatar',
      });
      expect(result.success).toBe(true);
      expect(result.impact?.avatar).toBeDefined();
    });

    it('rejects invalid surprise events', () => {
      const result = processEvent('surprise', {
        type: 'surprise',
        category: 'invalid',
      });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('rejects unknown event types', () => {
      const result = processEvent('unknown_event', {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown event type');
      expect(result.error).toContain('surprise');
    });
  });

  describe('getAllEventTypes', () => {
    it('includes all known events plus surprise', () => {
      const types = getAllEventTypes();
      expect(types).toContain('task_completed');
      expect(types).toContain('session_ended');
      expect(types).toContain('surprise');
      expect(types.length).toBe(KNOWN_EVENTS.length + 1);
    });
  });

  describe('getEventsAffecting', () => {
    it('gets avatar events', () => {
      const events = getEventsAffecting('avatar');
      expect(events.length).toBeGreaterThan(0);
      expect(
        events.every((e) => e.affects === 'avatar' || e.affects === 'both')
      ).toBe(true);
    });

    it('gets world events', () => {
      const events = getEventsAffecting('world');
      expect(events.length).toBeGreaterThan(0);
      expect(
        events.every((e) => e.affects === 'world' || e.affects === 'both')
      ).toBe(true);
    });
  });
});
