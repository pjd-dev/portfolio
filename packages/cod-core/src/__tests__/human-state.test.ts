import { describe, it, expect } from 'vitest';
import { evaluateHumanStateSnapshot } from '../human-state';

const BASE_TS = '2025-01-01T08:00:00Z';
const NOW = new Date('2025-01-01T08:00:00Z');

const baseSnapshot = {
  ts: BASE_TS,
  source: 'morning-check' as const,
  energy: 0.6,
  focusCapacity: 'med' as const,
  stress: 0.3,
  sleepHours: 7,
  timeAvailableMin: 120,
  contextTolerance: 'med' as const,
};

describe('Human State evaluation', () => {
  it('marks low energy as conservative and caps duration', () => {
    const res = evaluateHumanStateSnapshot(
      {
        ...baseSnapshot,
        energy: 0.3,
      },
      { now: NOW }
    );

    expect(res.status).toBe('ok');
    expect(res.recommendedMode).toBe('conservative');
    expect(res.durationCapMin).toBe(45);
    expect(res.maxFocusCost).toBe(2);
  });

  it('caps duration for high stress', () => {
    const res = evaluateHumanStateSnapshot(
      {
        ...baseSnapshot,
        stress: 0.8,
      },
      { now: NOW }
    );

    expect(res.status).toBe('ok');
    expect(res.recommendedMode).toBe('conservative');
    expect(res.durationCapMin).toBe(25);
  });

  it('preserves world bands when provided', () => {
    const res = evaluateHumanStateSnapshot(
      {
        ...baseSnapshot,
        healthBand: 'amber',
        runwayBand: 'red',
      },
      { now: NOW }
    );

    expect(res.status).toBe('ok');
    expect(res.snapshot.healthBand).toBe('amber');
    expect(res.snapshot.runwayBand).toBe('red');
  });

  it('treats stale snapshots as unknown with HS4 warning', () => {
    const res = evaluateHumanStateSnapshot(
      {
        ...baseSnapshot,
        ts: '2024-12-31T10:00:00Z',
        energy: 0.9,
        focusCapacity: 'high',
      },
      { now: NOW }
    );

    expect(res.status).toBe('stale');
    expect(res.warnings.some((w) => w.startsWith('HS4'))).toBe(true);
    expect(res.snapshot.focusCapacity).toBe('low');
    expect(res.snapshot.energy).toBe(0.4);
    expect(res.durationCapMin).toBe(25);
  });

  it('flags missing fields as invalid', () => {
    const res = evaluateHumanStateSnapshot({}, { now: NOW });

    expect(res.status).toBe('invalid');
    expect(res.warnings.some((w) => w.startsWith('HS1'))).toBe(true);
    expect(res.recommendedMode).toBe('conservative');
  });
});
