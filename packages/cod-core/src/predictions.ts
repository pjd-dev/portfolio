/**
 * COD Prediction Engine
 *
 * Main coordination layer combining all prediction signals:
 * - Duration prediction (how long will task take?)
 * - Quality prediction (will we do good work?)
 * - Completion prediction (will we finish this task/goal?)
 * - Optimal timing (when should we do this task?)
 * - Risk detection (what could go wrong?)
 *
 * Used by: Session planning, task ranking, recommendations
 */

import type { TaskExecutionRecord } from './prediction-history.js';
import type { HumanStateSnapshot } from './human-state-series.js';
import type { GoalProjection } from './goal-projections.js';
import type { TaskTypePattern } from './pattern-detection.js';
import type { ContextCostMetrics } from './context-costs.js';

export interface PredictionInput {
  /** Task being predicted */
  taskId: string;
  taskType: string;
  plannedDuration: number;
  plannedEffort: number;

  /** Goal context (if task is part of goal) */
  goalId?: string;
  goalProjection?: GoalProjection;

  /** Current human state */
  currentHumanState: HumanStateSnapshot;

  /** Historical data */
  taskHistory?: TaskExecutionRecord[];
  taskTypePattern?: TaskTypePattern;

  /** Session context */
  sessionPosition?: number; // 0 = first task, 1 = second, etc
  sessionDuration?: number; // minutes

  /** Environment */
  contextCosts?: ContextCostMetrics;
  currentTime?: Date;
}

export interface TaskPrediction {
  taskId: string;

  // Duration prediction
  predictedDuration: number; // minutes
  durationConfidence: number; // 0-1
  durationFactors: {
    historical?: number; // minutes
    humanState?: number; // adjustment factor
    contextSwitch?: number; // additional minutes
    goal?: number; // pressure adjustment
  };

  // Quality prediction
  predictedQuality: number; // 1-5 scale
  qualityConfidence: number; // 0-1
  qualityFactors: {
    humanEnergy?: number; // 0-1
    stress?: number; // 0-1
    focus?: number; // 0-1
  };

  // Completion probability
  completionProbability: number; // 0-1
  completionRisk?: string; // Why might this not complete?

  // Timing
  optimalTime?: string; // ISO - best time to do this
  optimalState?: {
    energy?: [number, number];
    stress?: [number, number];
    focus?: [number, number];
  };

  // Risk assessment
  risks: {
    riskType: string; // 'context-switch', 'energy-crash', 'blocker', etc
    probability: number; // 0-1
    impact: string; // what happens if this occurs
  }[];

  // Recommendation
  recommendation?: string;

  // Confidence in overall prediction
  overallConfidence: number; // 0-1
}

/**
 * Generate comprehensive prediction for a task
 */
export function predictTask(input: PredictionInput): TaskPrediction {
  const {
    taskId,
    taskType,
    plannedDuration,
    plannedEffort,
    goalId,
    goalProjection,
    currentHumanState,
    taskHistory,
    taskTypePattern,
    sessionPosition = 0,
    sessionDuration,
    contextCosts,
    currentTime = new Date(),
  } = input;

  // DURATION PREDICTION
  let historicalDuration = plannedDuration;
  let durationConfidence = 0.5;

  if (taskHistory && taskHistory.length > 0) {
    const completed = taskHistory.filter((h) => h.completed);
    if (completed.length > 0) {
      historicalDuration =
        completed.reduce((sum, h) => sum + (h.actualDuration || 0), 0) /
        completed.length;
      durationConfidence = Math.min(1, 0.5 + completed.length / 20);
    }
  }

  // Human state adjustment
  let humanStateAdjustment = 1.0;
  if (currentHumanState.energy < 0.4) {
    humanStateAdjustment *= 1.3; // Takes longer when tired
    durationConfidence *= 0.8;
  }
  if (currentHumanState.focus < 0.5) {
    humanStateAdjustment *= 1.2;
    durationConfidence *= 0.8;
  }

  // Context switch cost
  let contextSwitchMinutes = 0;
  if (sessionPosition > 0 && contextCosts) {
    contextSwitchMinutes = contextCosts.avgRecoveryTime;
  }

  const predictedDuration = Math.ceil(
    historicalDuration * humanStateAdjustment + contextSwitchMinutes
  );

  // QUALITY PREDICTION
  let baseQuality = 3.5; // neutral
  let qualityConfidence = 0.6;

  if (taskHistory && taskHistory.length > 0) {
    const completed = taskHistory.filter((h) => h.completed && h.qualityRating);
    if (completed.length > 0) {
      baseQuality =
        completed.reduce((sum, h) => sum + (h.qualityRating || 0), 0) /
        completed.length;
      qualityConfidence = 0.7;
    }
  }

  // Adjust based on human state
  if (currentHumanState.energy > 0.8 && currentHumanState.stress < 0.3) {
    baseQuality = Math.min(5, baseQuality + 0.5);
  } else if (currentHumanState.energy < 0.3 || currentHumanState.stress > 0.7) {
    baseQuality = Math.max(1, baseQuality - 1.0);
    qualityConfidence *= 0.7;
  }

  const predictedQuality = Math.max(1, Math.min(5, baseQuality));

  // COMPLETION PROBABILITY
  let completionProb = 0.8; // baseline optimism

  if (taskHistory) {
    const completionRate =
      taskHistory.filter((h) => h.completed).length / taskHistory.length;
    completionProb = completionRate;
  }

  // Risk factors
  if (currentHumanState.stress > 0.7) {
    completionProb *= 0.85;
  }
  if (goalProjection?.status === 'blocked') {
    completionProb *= 0.6;
  }

  let completionRisk: string | undefined;
  if (completionProb < 0.5) {
    completionRisk =
      'High risk of incompletion - consider breaking into smaller subtasks';
  } else if (completionProb < 0.7) {
    completionRisk = 'Moderate risk - ensure clear blockers are removed';
  }

  // OPTIMAL TIMING
  let optimalTime: string | undefined;
  let optimalState: TaskPrediction['optimalState'];

  if (taskTypePattern?.bestHours && taskTypePattern.bestHours.length > 0) {
    const nextBestHour = taskTypePattern.bestHours[0];
    const nowHour = currentTime.getHours();

    if (nowHour < nextBestHour) {
      optimalTime = new Date(
        currentTime.getFullYear(),
        currentTime.getMonth(),
        currentTime.getDate(),
        nextBestHour,
        0
      ).toISOString();
    } else {
      // Tomorrow at best hour
      const tomorrow = new Date(currentTime);
      tomorrow.setDate(tomorrow.getDate() + 1);
      optimalTime = new Date(
        tomorrow.getFullYear(),
        tomorrow.getMonth(),
        tomorrow.getDate(),
        nextBestHour,
        0
      ).toISOString();
    }
  }

  if (taskTypePattern?.optimalState) {
    optimalState = taskTypePattern.optimalState;
  }

  // RISK ASSESSMENT
  const risks: TaskPrediction['risks'] = [];

  // Risk: Energy crash
  if (currentHumanState.energy < 0.4) {
    risks.push({
      riskType: 'energy-crash',
      probability: 0.6,
      impact: 'Task will take much longer, quality will suffer',
    });
  }

  // Risk: High stress
  if (currentHumanState.stress > 0.7) {
    risks.push({
      riskType: 'focus-loss',
      probability: 0.7,
      impact: 'May context-switch away before finishing',
    });
  }

  // Risk: Context switch cost
  if (
    sessionPosition > 2 &&
    contextCosts &&
    contextCosts.avgRecoveryTime > 15
  ) {
    risks.push({
      riskType: 'context-switch-fatigue',
      probability: 0.5,
      impact: 'Too many switches - consider ending session',
    });
  }

  // Risk: Goal pressure
  if (goalProjection?.status === 'at-risk') {
    risks.push({
      riskType: 'deadline-pressure',
      probability: 0.4,
      impact: 'Goal is behind schedule - may rush and reduce quality',
    });
  }

  // OVERALL CONFIDENCE
  const overallConfidence =
    (durationConfidence + qualityConfidence + (1 - risks.length * 0.15)) / 3;

  // RECOMMENDATION
  let recommendation: string | undefined;

  if (risks.length > 2) {
    recommendation = `Multiple risks detected (${risks.length}). Consider postponing until conditions improve.`;
  } else if (completionProb < 0.5) {
    recommendation = `Low completion probability (${Math.round(completionProb * 100)}%). Break into smaller tasks.`;
  } else if (currentHumanState.energy > 0.7 && currentHumanState.stress < 0.4) {
    recommendation = `Optimal conditions right now! Execute this task immediately.`;
  } else if (optimalTime) {
    recommendation = `Better to do this at ${optimalTime.split('T')[1].split(':').slice(0, 2).join(':')} when conditions are optimal.`;
  }

  return {
    taskId,
    predictedDuration,
    durationConfidence,
    durationFactors: {
      historical: historicalDuration,
      humanState: humanStateAdjustment,
      contextSwitch: contextSwitchMinutes,
    },
    predictedQuality,
    qualityConfidence,
    qualityFactors: {
      humanEnergy: currentHumanState.energy,
      stress: currentHumanState.stress,
      focus: currentHumanState.focus,
    },
    completionProbability: completionProb,
    completionRisk,
    optimalTime,
    optimalState,
    risks,
    recommendation,
    overallConfidence,
  };
}
