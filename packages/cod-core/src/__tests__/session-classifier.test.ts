/**
 * Session Classifier Tests
 */

import { describe, it, expect } from 'vitest';
import {
  trainSessionClassifier,
  predictSessionSuccess,
  analyzeSuccessFactors,
  recommendSessionTiming,
  type SessionFeatures,
  type SessionOutcome,
} from '../session-classifier.js';

// Helper to create session data
function createSession(
  featuresOverrides: Partial<SessionFeatures> = {},
  outcomeOverrides: Partial<SessionOutcome> = {}
): { features: SessionFeatures; outcome: SessionOutcome } {
  return {
    features: {
      startEnergy: 0.7,
      startStress: 0.3,
      startFocus: 0.7,
      plannedDuration: 120,
      taskCount: 4,
      totalEffort: 8,
      avgTaskComplexity: 3,
      highPriorityCount: 1,
      hourOfDay: 10,
      dayOfWeek: 2,
      consecutiveSessions: 1,
      recentCompletionRate: 0.75,
      ...featuresOverrides,
    },
    outcome: {
      completed: true,
      completionRate: 0.8,
      qualityScore: 7,
      endedEarly: false,
      extendedBeyondPlan: false,
      ...outcomeOverrides,
    },
  };
}

describe('Session Classifier', () => {
  describe('trainSessionClassifier', () => {
    it('should return null with insufficient data', () => {
      const sessions = [createSession(), createSession(), createSession()];

      expect(trainSessionClassifier(sessions)).toBeNull();
    });

    it('should train model with sufficient data', () => {
      // Create training data with 15 sessions
      const sessions: Array<{
        features: SessionFeatures;
        outcome: SessionOutcome;
      }> = [];

      // Successful sessions (high energy, low stress)
      for (let i = 0; i < 8; i++) {
        sessions.push(
          createSession(
            { startEnergy: 0.8, startStress: 0.2 },
            { completed: true, completionRate: 0.85 }
          )
        );
      }

      // Failed sessions (low energy, high stress)
      for (let i = 0; i < 7; i++) {
        sessions.push(
          createSession(
            { startEnergy: 0.3, startStress: 0.8 },
            { completed: false, completionRate: 0.3 }
          )
        );
      }

      const model = trainSessionClassifier(sessions);

      expect(model).not.toBeNull();
      expect(model!.weights).toHaveLength(12); // 12 features
      expect(model!.accuracy).toBeGreaterThan(0.5);
    });
  });

  describe('predictSessionSuccess', () => {
    it('should predict success for optimal conditions', () => {
      const features: SessionFeatures = {
        startEnergy: 0.9,
        startStress: 0.1,
        startFocus: 0.9,
        plannedDuration: 90,
        taskCount: 3,
        totalEffort: 4,
        avgTaskComplexity: 2,
        highPriorityCount: 1,
        hourOfDay: 10,
        dayOfWeek: 2,
        consecutiveSessions: 0,
        recentCompletionRate: 0.9,
      };

      const prediction = predictSessionSuccess(features, []);

      expect(prediction.successProbability).toBeGreaterThan(0.5);
      expect(prediction.risks.length).toBe(0);
    });

    it('should identify low energy risk', () => {
      const features: SessionFeatures = {
        startEnergy: 0.2,
        startStress: 0.3,
        startFocus: 0.7,
        plannedDuration: 120,
        taskCount: 4,
        totalEffort: 8,
        avgTaskComplexity: 3,
        highPriorityCount: 1,
        hourOfDay: 10,
        dayOfWeek: 2,
        consecutiveSessions: 1,
        recentCompletionRate: 0.75,
      };

      const prediction = predictSessionSuccess(features, []);

      expect(prediction.risks).toContain('Low starting energy');
      expect(
        prediction.recommendations.some((r) => r.toLowerCase().includes('rest'))
      ).toBe(true);
    });

    it('should identify high stress risk', () => {
      const features: SessionFeatures = {
        startEnergy: 0.7,
        startStress: 0.8,
        startFocus: 0.5,
        plannedDuration: 120,
        taskCount: 4,
        totalEffort: 8,
        avgTaskComplexity: 3,
        highPriorityCount: 1,
        hourOfDay: 10,
        dayOfWeek: 2,
        consecutiveSessions: 1,
        recentCompletionRate: 0.75,
      };

      const prediction = predictSessionSuccess(features, []);

      expect(prediction.risks).toContain('High stress level');
    });

    it('should identify poor focus risk', () => {
      const features: SessionFeatures = {
        startEnergy: 0.7,
        startStress: 0.3,
        startFocus: 0.2,
        plannedDuration: 120,
        taskCount: 4,
        totalEffort: 8,
        avgTaskComplexity: 3,
        highPriorityCount: 1,
        hourOfDay: 10,
        dayOfWeek: 2,
        consecutiveSessions: 1,
        recentCompletionRate: 0.75,
      };

      const prediction = predictSessionSuccess(features, []);

      expect(prediction.risks).toContain('Poor focus at session start');
    });

    it('should warn about overbooked sessions', () => {
      const features: SessionFeatures = {
        startEnergy: 0.7,
        startStress: 0.3,
        startFocus: 0.7,
        plannedDuration: 60, // short duration
        taskCount: 10,
        totalEffort: 20, // high effort
        avgTaskComplexity: 4,
        highPriorityCount: 5,
        hourOfDay: 10,
        dayOfWeek: 2,
        consecutiveSessions: 1,
        recentCompletionRate: 0.75,
      };

      const prediction = predictSessionSuccess(features, []);

      expect(prediction.risks).toContain('Session may be overbooked');
    });

    it('should warn about consecutive sessions', () => {
      const features: SessionFeatures = {
        startEnergy: 0.7,
        startStress: 0.3,
        startFocus: 0.7,
        plannedDuration: 120,
        taskCount: 4,
        totalEffort: 8,
        avgTaskComplexity: 3,
        highPriorityCount: 1,
        hourOfDay: 10,
        dayOfWeek: 2,
        consecutiveSessions: 4,
        recentCompletionRate: 0.75,
      };

      const prediction = predictSessionSuccess(features, []);

      expect(prediction.risks).toContain(
        'Multiple consecutive sessions without break'
      );
    });

    it('should warn about off-hours', () => {
      const features: SessionFeatures = {
        startEnergy: 0.7,
        startStress: 0.3,
        startFocus: 0.7,
        plannedDuration: 120,
        taskCount: 4,
        totalEffort: 8,
        avgTaskComplexity: 3,
        highPriorityCount: 1,
        hourOfDay: 23,
        dayOfWeek: 2,
        consecutiveSessions: 1,
        recentCompletionRate: 0.75,
      };

      const prediction = predictSessionSuccess(features, []);

      expect(prediction.risks).toContain('Off-hours scheduling');
    });

    it('should use trained model when available', () => {
      const sessions: Array<{
        features: SessionFeatures;
        outcome: SessionOutcome;
      }> = [];

      // Success pattern: high energy
      for (let i = 0; i < 10; i++) {
        sessions.push(
          createSession(
            { startEnergy: 0.9 },
            { completed: true, completionRate: 0.9 }
          )
        );
      }

      // Failure pattern: low energy
      for (let i = 0; i < 10; i++) {
        sessions.push(
          createSession(
            { startEnergy: 0.2 },
            { completed: false, completionRate: 0.2 }
          )
        );
      }

      const highEnergyPrediction = predictSessionSuccess(
        { ...createSession().features, startEnergy: 0.85 },
        sessions
      );

      const lowEnergyPrediction = predictSessionSuccess(
        { ...createSession().features, startEnergy: 0.25 },
        sessions
      );

      expect(highEnergyPrediction.successProbability).toBeGreaterThan(
        lowEnergyPrediction.successProbability
      );
    });
  });

  describe('analyzeSuccessFactors', () => {
    it('should return empty analysis with insufficient data', () => {
      const sessions = [createSession(), createSession()];
      const analysis = analyzeSuccessFactors(sessions);

      expect(analysis.insights).toContain(
        'Insufficient data for factor analysis'
      );
    });

    it('should identify positive and negative factors', () => {
      const sessions: Array<{
        features: SessionFeatures;
        outcome: SessionOutcome;
      }> = [];

      // Create varied data
      for (let i = 0; i < 20; i++) {
        const isSuccess = i % 2 === 0;
        sessions.push(
          createSession(
            {
              startEnergy: isSuccess ? 0.8 : 0.3,
              startStress: isSuccess ? 0.2 : 0.7,
              recentCompletionRate: isSuccess ? 0.9 : 0.4,
            },
            {
              completed: isSuccess,
              completionRate: isSuccess ? 0.85 : 0.3,
            }
          )
        );
      }

      const analysis = analyzeSuccessFactors(sessions);

      expect(analysis.topPositiveFactors.length).toBeGreaterThan(0);
      expect(analysis.topNegativeFactors.length).toBeGreaterThan(0);
      expect(analysis.insights.length).toBeGreaterThan(0);
    });
  });

  describe('recommendSessionTiming', () => {
    it('should return defaults with insufficient data', () => {
      const sessions = [createSession(), createSession()];
      const recommendation = recommendSessionTiming(sessions);

      expect(recommendation.reasoning).toContain('insufficient');
    });

    it('should recommend based on successful sessions', () => {
      const sessions: Array<{
        features: SessionFeatures;
        outcome: SessionOutcome;
      }> = [];

      // Successful sessions at 10am on Tuesday
      for (let i = 0; i < 10; i++) {
        sessions.push(
          createSession(
            { hourOfDay: 10, dayOfWeek: 2, plannedDuration: 90, taskCount: 3 },
            { completed: true, completionRate: 0.85 }
          )
        );
      }

      // Failed sessions at other times
      for (let i = 0; i < 5; i++) {
        sessions.push(
          createSession(
            { hourOfDay: 16, dayOfWeek: 5, plannedDuration: 180, taskCount: 8 },
            { completed: false, completionRate: 0.3 }
          )
        );
      }

      const recommendation = recommendSessionTiming(sessions);

      expect(recommendation.bestHourOfDay).toBe(10);
      expect(recommendation.bestDayOfWeek).toBe(2);
      expect(recommendation.optimalDuration).toBeCloseTo(90, -1);
      expect(recommendation.maxTaskCount).toBeCloseTo(3, 0);
    });

    it('should return conservative recommendations with no successful sessions', () => {
      const sessions: Array<{
        features: SessionFeatures;
        outcome: SessionOutcome;
      }> = [];

      for (let i = 0; i < 10; i++) {
        sessions.push(
          createSession({}, { completed: false, completionRate: 0.4 })
        );
      }

      const recommendation = recommendSessionTiming(sessions);

      expect(recommendation.reasoning).toContain('No successful sessions');
      expect(recommendation.optimalDuration).toBe(90); // conservative
      expect(recommendation.maxTaskCount).toBe(3); // conservative
    });
  });
});
