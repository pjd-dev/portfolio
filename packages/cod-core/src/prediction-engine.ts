/**
 * Prediction Engine - ML Integration Layer
 *
 * Orchestrates all ML models to produce unified predictions:
 * - Duration: Uses trained duration predictor with linear regression
 * - State: Uses Kalman filtering via state-forecaster
 * - Transitions: Uses Markov chains for state/task transitions
 * - Session: Uses logistic regression for success probability
 *
 * This replaces simple heuristics with learned models.
 */

import type { TaskExecutionRecord } from './prediction-history.js';
import type { HumanStateSnapshot } from './human-state-series.js';
import type { GoalProjection } from './goal-projections.js';
import type { TaskTypePattern } from './pattern-detection.js';
import type { ContextCostMetrics } from './context-costs.js';

import {
  trainDurationPredictor,
  predictDuration,
  type DurationPrediction,
  type DurationPredictorFeatures,
} from './duration-predictor.js';
import {
  forecastState,
  analyzeStatePatterns,
  type StateForecast,
  type StatePatternAnalysis,
  type StateVector,
} from './state-forecaster.js';
import {
  buildHumanStateChain,
  forecastHumanState,
  buildTaskStatusChain,
  forecastTaskCompletion,
  buildSessionFlowChain,
  optimizeSessionFlow,
  categorizeHumanState,
  type HumanStateCategory,
  type HumanStateForecast,
  type TaskCompletionForecast,
  type SessionOptimization,
  type HumanStateTransition,
  type TaskStatusTransition,
  type SessionTaskTransition,
  type TaskStatus,
} from './markov-chains.js';
import {
  trainSessionClassifier,
  predictSessionSuccess,
  recommendSessionTiming,
  type SessionFeatures,
  type SessionOutcome,
  type SessionPrediction,
  type SessionTimingRecommendation,
} from './session-classifier.js';
import { type MarkovChain, type LinearRegressionResult } from './ml-utils.js';

// ============================================================================
// Types
// ============================================================================

export interface PredictionEngineConfig {
  /** Minimum samples before using ML (fallback to heuristics) */
  minSamplesForML: number;
  /** Weight for ML vs heuristics blending (0-1, 1 = full ML) */
  mlWeight: number;
  /** Enable Markov chain predictions */
  enableMarkov: boolean;
  /** Enable Kalman filtering */
  enableKalman: boolean;
  /** Forecast horizon for state predictions (hours) */
  forecastHorizon: number;
}

export interface PredictionEngineState {
  /** Trained duration model */
  durationModel?: LinearRegressionResult;
  /** Human state Markov chain */
  humanStateChain?: MarkovChain;
  /** Task status Markov chain */
  taskStatusChain?: MarkovChain;
  /** Session flow Markov chain */
  sessionFlowChain?: MarkovChain;
  /** Raw transition data for forecasts */
  humanStateTransitions: HumanStateTransition[];
  taskStatusTransitions: TaskStatusTransition[];
  sessionTaskTransitions: SessionTaskTransition[];
  /** Historical sessions for classifier */
  sessionHistory: Array<{ features: SessionFeatures; outcome: SessionOutcome }>;
  /** Training sample counts */
  sampleCounts: {
    duration: number;
    session: number;
    humanState: number;
    taskStatus: number;
  };
  /** Last training timestamp */
  lastTraining?: Date;
}

export interface MLPredictionInput {
  /** Task being predicted */
  taskId: string;
  taskType: string;
  plannedDuration: number;
  plannedEffort: number;

  /** Goal context */
  goalId?: string;
  goalProjection?: GoalProjection;

  /** Current human state */
  currentHumanState: HumanStateSnapshot;

  /** Historical data for training */
  taskHistory?: TaskExecutionRecord[];
  stateVectors?: StateVector[];
  taskTypePattern?: TaskTypePattern;

  /** Session context */
  sessionPosition?: number;
  sessionDurationSoFar?: number;
  sessionTasksCompleted?: number;
  sessionTaskTypes?: string[];

  /** Environment */
  contextCosts?: ContextCostMetrics;
  currentTime?: Date;
}

export interface MLPrediction {
  taskId: string;

  // Duration (ML-enhanced)
  duration: {
    predicted: number;
    confidence: number;
    method: 'ml' | 'heuristic' | 'blended';
    breakdown: {
      baseDuration: number;
      humanStateAdjustment: number;
      contextSwitchCost: number;
      patternAdjustment: number;
    };
  };

  // Quality (ML-enhanced)
  quality: {
    predicted: number; // 1-5
    confidence: number;
    factors: {
      energy: number;
      focus: number;
      stress: number;
      historicalAvg?: number;
    };
  };

  // Completion (ML-enhanced)
  completion: {
    probability: number;
    risk?: string;
    taskForecast?: TaskCompletionForecast;
  };

  // State forecast (Kalman)
  stateForecast?: {
    current: StateForecast;
    pattern?: StatePatternAnalysis;
  };

  // Markov predictions
  markov?: {
    humanState?: HumanStateForecast;
    taskCompletion?: TaskCompletionForecast;
    sessionFlow?: SessionOptimization;
  };

  // Session success (logistic regression)
  sessionPrediction?: SessionPrediction;

  // Optimal timing
  timing?: {
    recommendation?: SessionTimingRecommendation;
  };

  // Risk assessment
  risks: {
    type: string;
    probability: number;
    impact: string;
    source: 'ml' | 'heuristic';
  }[];

  // Overall
  overallConfidence: number;
  recommendation?: string;
  modelInfo: {
    durationMethod: 'ml' | 'heuristic' | 'blended';
    sessionMethod: 'ml' | 'heuristic';
    markovEnabled: boolean;
    kalmanEnabled: boolean;
  };
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: PredictionEngineConfig = {
  minSamplesForML: 5,
  mlWeight: 0.7,
  enableMarkov: true,
  enableKalman: true,
  forecastHorizon: 4,
};

// ============================================================================
// Helper: Convert history to transitions
// ============================================================================

function historyToHumanStateTransitions(
  snapshots: HumanStateSnapshot[]
): HumanStateTransition[] {
  const transitions: HumanStateTransition[] = [];
  for (let i = 0; i < snapshots.length - 1; i++) {
    const s1 = snapshots[i];
    const s2 = snapshots[i + 1];
    const from = categorizeHumanState(s1.energy, s1.stress, s1.focus);
    const to = categorizeHumanState(s2.energy, s2.stress, s2.focus);
    const duration =
      (new Date(s2.timestamp).getTime() - new Date(s1.timestamp).getTime()) /
      60000;
    transitions.push({ from, to, timestamp: s1.timestamp, duration });
  }
  return transitions;
}

function historyToTaskStatusTransitions(
  records: TaskExecutionRecord[]
): TaskStatusTransition[] {
  const transitions: TaskStatusTransition[] = [];
  // Group by task
  const byTask = new Map<string, TaskExecutionRecord[]>();
  records.forEach((r) => {
    const existing = byTask.get(r.taskId) || [];
    existing.push(r);
    byTask.set(r.taskId, existing);
  });

  // Create transitions from task lifecycle
  byTask.forEach((taskRecords, taskId) => {
    // Simplified: assume pending -> in-progress -> done/cancelled
    if (taskRecords.length > 0) {
      const record = taskRecords[taskRecords.length - 1];
      const finalStatus: TaskStatus = record.completed ? 'done' : 'cancelled';
      const timestamp = record.recordedAt;
      transitions.push({
        taskId,
        from: 'pending',
        to: 'in-progress',
        timestamp,
        duration: record.plannedDuration || 30,
      });
      transitions.push({
        taskId,
        from: 'in-progress',
        to: finalStatus,
        timestamp,
        duration: record.actualDuration || 30,
      });
    }
  });
  return transitions;
}

// ============================================================================
// Prediction Engine Functions
// ============================================================================

/**
 * Initialize prediction engine state with historical data
 */
export function initializePredictionEngine(
  taskHistory: TaskExecutionRecord[],
  humanStateSnapshots: HumanStateSnapshot[],
  sessionHistory: Array<{ features: SessionFeatures; outcome: SessionOutcome }>,
  config: Partial<PredictionEngineConfig> = {}
): PredictionEngineState {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Convert histories to transitions
  const humanStateTransitions =
    historyToHumanStateTransitions(humanStateSnapshots);
  const taskStatusTransitions = historyToTaskStatusTransitions(taskHistory);

  const state: PredictionEngineState = {
    humanStateTransitions,
    taskStatusTransitions,
    sessionTaskTransitions: [],
    sessionHistory,
    sampleCounts: {
      duration: taskHistory.length,
      session: sessionHistory.length,
      humanState: humanStateSnapshots.length,
      taskStatus: taskHistory.length,
    },
    lastTraining: new Date(),
  };

  // Train duration model if enough samples
  if (taskHistory.length >= cfg.minSamplesForML) {
    state.durationModel = trainDurationPredictor(taskHistory) || undefined;
  }

  // Build Markov chains if enabled
  if (cfg.enableMarkov) {
    if (humanStateTransitions.length >= cfg.minSamplesForML) {
      state.humanStateChain = buildHumanStateChain(humanStateTransitions);
    }
    if (taskStatusTransitions.length >= cfg.minSamplesForML) {
      state.taskStatusChain = buildTaskStatusChain(taskStatusTransitions);
    }
  }

  return state;
}

/**
 * Generate ML-enhanced prediction for a task
 */
export function generateMLPrediction(
  input: MLPredictionInput,
  engineState: PredictionEngineState,
  config: Partial<PredictionEngineConfig> = {}
): MLPrediction {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const {
    taskId,
    taskType,
    plannedDuration,
    currentHumanState,
    taskHistory = [],
    stateVectors = [],
    sessionPosition = 0,
    sessionDurationSoFar = 0,
    sessionTasksCompleted = 0,
    sessionTaskTypes = [],
    contextCosts,
    currentTime = new Date(),
  } = input;

  // -------------------------------------------------------------------------
  // DURATION PREDICTION
  // -------------------------------------------------------------------------
  let duration: MLPrediction['duration'];
  const hasDurationModel =
    engineState.durationModel &&
    engineState.sampleCounts.duration >= cfg.minSamplesForML;

  if (hasDurationModel && taskHistory.length >= cfg.minSamplesForML) {
    // Use ML model
    const features: DurationPredictorFeatures = {
      estimatedDuration: plannedDuration,
      taskType,
      priority: 3, // default
      complexity: 3, // default
      effortEstimate: plannedDuration / 60,
      humanStateEnergy: currentHumanState.energy,
      humanStateStress: currentHumanState.stress,
      humanStateFocus: currentHumanState.focus,
      hourOfDay: currentTime.getHours(),
      dayOfWeek: currentTime.getDay(),
    };

    const mlPrediction = predictDuration(features, taskHistory);

    // Calculate context switch cost
    const contextSwitchCost =
      sessionPosition > 0 && contextCosts ? contextCosts.avgRecoveryTime : 0;

    // Blend with heuristic
    const heuristicDuration = computeHeuristicDuration(
      plannedDuration,
      currentHumanState,
      contextSwitchCost
    );

    const blendedDuration =
      cfg.mlWeight * mlPrediction.predictedMinutes +
      (1 - cfg.mlWeight) * heuristicDuration;

    duration = {
      predicted: Math.ceil(blendedDuration),
      confidence:
        mlPrediction.accuracy * cfg.mlWeight + 0.5 * (1 - cfg.mlWeight),
      method:
        cfg.mlWeight > 0.9
          ? 'ml'
          : cfg.mlWeight < 0.1
            ? 'heuristic'
            : 'blended',
      breakdown: {
        baseDuration: plannedDuration,
        humanStateAdjustment: mlPrediction.adjustmentFactor,
        contextSwitchCost,
        patternAdjustment: 1.0,
      },
    };
  } else {
    // Fallback to heuristic
    const contextSwitchCost =
      sessionPosition > 0 && contextCosts ? contextCosts.avgRecoveryTime : 0;
    const heuristicDuration = computeHeuristicDuration(
      plannedDuration,
      currentHumanState,
      contextSwitchCost
    );

    duration = {
      predicted: Math.ceil(heuristicDuration),
      confidence: 0.5,
      method: 'heuristic',
      breakdown: {
        baseDuration: plannedDuration,
        humanStateAdjustment: currentHumanState.energy < 0.4 ? 1.3 : 1.0,
        contextSwitchCost,
        patternAdjustment: 1.0,
      },
    };
  }

  // -------------------------------------------------------------------------
  // QUALITY PREDICTION
  // -------------------------------------------------------------------------
  const quality = computeQualityPrediction(currentHumanState, taskHistory);

  // -------------------------------------------------------------------------
  // COMPLETION PREDICTION
  // -------------------------------------------------------------------------
  let completion: MLPrediction['completion'];
  let taskForecast: TaskCompletionForecast | undefined;

  if (
    cfg.enableMarkov &&
    engineState.taskStatusChain &&
    engineState.taskStatusTransitions.length >= cfg.minSamplesForML
  ) {
    taskForecast = forecastTaskCompletion(
      engineState.taskStatusChain,
      'pending',
      engineState.taskStatusTransitions
    );
    completion = {
      probability: taskForecast.completionProbability,
      risk:
        taskForecast.completionProbability < 0.5
          ? 'High risk of incompletion based on historical patterns'
          : undefined,
      taskForecast,
    };
  } else {
    // Heuristic
    const completionRate =
      taskHistory.length > 0
        ? taskHistory.filter((h) => h.completed).length / taskHistory.length
        : 0.8;
    completion = {
      probability: completionRate,
      risk:
        completionRate < 0.5
          ? 'High risk - consider breaking into smaller tasks'
          : undefined,
    };
  }

  // -------------------------------------------------------------------------
  // STATE FORECAST (Kalman)
  // -------------------------------------------------------------------------
  let stateForecast: MLPrediction['stateForecast'];

  if (cfg.enableKalman && stateVectors.length >= 3) {
    const currentForecast = forecastState(stateVectors);
    const pattern = analyzeStatePatterns(stateVectors);

    stateForecast = {
      current: currentForecast,
      pattern,
    };
  }

  // -------------------------------------------------------------------------
  // MARKOV PREDICTIONS
  // -------------------------------------------------------------------------
  let markov: MLPrediction['markov'];

  if (cfg.enableMarkov) {
    const humanStateCategory = categorizeHumanState(
      currentHumanState.energy,
      currentHumanState.stress,
      currentHumanState.focus
    );

    if (
      engineState.humanStateChain &&
      engineState.humanStateTransitions.length >= cfg.minSamplesForML
    ) {
      // Check if the current state exists in the Markov chain before forecasting
      if (engineState.humanStateChain.states.includes(humanStateCategory)) {
        const humanStateForecast = forecastHumanState(
          engineState.humanStateChain,
          humanStateCategory,
          engineState.humanStateTransitions
        );
        markov = {
          humanState: humanStateForecast,
          taskCompletion: taskForecast,
        };
      } else {
        // State not in chain - use taskForecast only
        markov = {
          taskCompletion: taskForecast,
        };
      }
    }

    // Session flow optimization
    if (
      engineState.sessionFlowChain &&
      engineState.sessionTaskTransitions.length > 0 &&
      sessionTaskTypes.length > 0
    ) {
      const lastTaskType = sessionTaskTypes[sessionTaskTypes.length - 1];
      const remainingTime = 120 - sessionDurationSoFar; // assume 2hr session
      markov = {
        ...markov,
        sessionFlow: optimizeSessionFlow(
          engineState.sessionFlowChain,
          lastTaskType,
          engineState.sessionTaskTransitions,
          remainingTime
        ),
      };
    }
  }

  // -------------------------------------------------------------------------
  // SESSION PREDICTION
  // -------------------------------------------------------------------------
  let sessionPrediction: SessionPrediction | undefined;

  if (engineState.sessionHistory.length >= 10) {
    const features: SessionFeatures = {
      startEnergy: currentHumanState.energy,
      startStress: currentHumanState.stress,
      startFocus: currentHumanState.focus,
      plannedDuration: sessionDurationSoFar + duration.predicted,
      taskCount: sessionTasksCompleted + 1,
      totalEffort: (sessionDurationSoFar + duration.predicted) / 60,
      avgTaskComplexity: 3,
      highPriorityCount: 1,
      hourOfDay: currentTime.getHours(),
      dayOfWeek: currentTime.getDay(),
      consecutiveSessions: 1,
      recentCompletionRate: 0.8,
    };
    sessionPrediction = predictSessionSuccess(
      features,
      engineState.sessionHistory
    );
  }

  // -------------------------------------------------------------------------
  // TIMING
  // -------------------------------------------------------------------------
  let timing: MLPrediction['timing'];

  if (engineState.sessionHistory.length >= 5) {
    timing = {
      recommendation: recommendSessionTiming(engineState.sessionHistory),
    };
  }

  // -------------------------------------------------------------------------
  // RISK ASSESSMENT
  // -------------------------------------------------------------------------
  const risks: MLPrediction['risks'] = [];

  // ML-based risks
  if (stateForecast?.current.trend === 'declining') {
    risks.push({
      type: 'energy-decline',
      probability: 0.7,
      impact: 'State will worsen during task execution',
      source: 'ml',
    });
  }

  if (markov?.humanState?.nextLikelyStates[0]?.state === 'fatigued') {
    risks.push({
      type: 'fatigue-imminent',
      probability: markov.humanState.nextLikelyStates[0].probability,
      impact: 'High probability of fatigue state',
      source: 'ml',
    });
  }

  if (sessionPrediction && sessionPrediction.successProbability < 0.5) {
    risks.push({
      type: 'session-failure',
      probability: 1 - sessionPrediction.successProbability,
      impact: 'Session unlikely to complete successfully',
      source: 'ml',
    });
  }

  // Heuristic risks
  if (currentHumanState.energy < 0.3) {
    risks.push({
      type: 'low-energy',
      probability: 0.8,
      impact: 'Very low energy - task quality will suffer',
      source: 'heuristic',
    });
  }

  if (currentHumanState.stress > 0.8) {
    risks.push({
      type: 'high-stress',
      probability: 0.75,
      impact: 'May abandon task due to stress',
      source: 'heuristic',
    });
  }

  // -------------------------------------------------------------------------
  // OVERALL CONFIDENCE & RECOMMENDATION
  // -------------------------------------------------------------------------
  const mlConfidence =
    (duration.confidence +
      quality.confidence +
      (sessionPrediction?.confidence || 0.5)) /
    3;
  const overallConfidence = Math.max(0.3, mlConfidence - risks.length * 0.1);

  let recommendation: string | undefined;

  if (risks.length >= 3) {
    recommendation = `Multiple risks detected (${risks.length}). Strongly consider postponing.`;
  } else if (completion.probability < 0.4) {
    recommendation = `Low completion probability (${Math.round(completion.probability * 100)}%). Break into smaller tasks.`;
  } else if (stateForecast?.current.trend === 'declining') {
    recommendation =
      'Energy is declining. Consider a shorter task or take a break first.';
  } else if (
    currentHumanState.energy > 0.7 &&
    currentHumanState.stress < 0.3 &&
    completion.probability > 0.7
  ) {
    recommendation = 'Optimal conditions! Execute now.';
  } else if (timing?.recommendation) {
    const rec = timing.recommendation;
    recommendation = `Best time: ${rec.bestHourOfDay}:00. ${rec.reasoning}`;
  }

  return {
    taskId,
    duration,
    quality,
    completion,
    stateForecast,
    markov,
    sessionPrediction,
    timing,
    risks,
    overallConfidence,
    recommendation,
    modelInfo: {
      durationMethod: duration.method,
      sessionMethod:
        engineState.sessionHistory.length >= 10 ? 'ml' : 'heuristic',
      markovEnabled: cfg.enableMarkov && !!engineState.humanStateChain,
      kalmanEnabled: cfg.enableKalman && stateVectors.length >= 3,
    },
  };
}

/**
 * Update engine state with new execution data (incremental learning)
 */
export function updatePredictionEngine(
  state: PredictionEngineState,
  newTaskExecution?: TaskExecutionRecord,
  newHumanStateSnapshot?: HumanStateSnapshot,
  allTaskHistory?: TaskExecutionRecord[],
  allHumanStateSnapshots?: HumanStateSnapshot[]
): PredictionEngineState {
  const updated = { ...state };

  if (newTaskExecution) {
    updated.sampleCounts.duration++;
    updated.sampleCounts.taskStatus++;

    // Add task status transitions
    const newTransitions = historyToTaskStatusTransitions([newTaskExecution]);
    updated.taskStatusTransitions = [
      ...updated.taskStatusTransitions,
      ...newTransitions,
    ];
  }

  if (
    newHumanStateSnapshot &&
    allHumanStateSnapshots &&
    allHumanStateSnapshots.length > 1
  ) {
    updated.sampleCounts.humanState++;

    // Rebuild human state transitions
    updated.humanStateTransitions = historyToHumanStateTransitions(
      allHumanStateSnapshots
    );
  }

  // Retrain if we have significant new data (every 10 samples)
  const totalNew =
    updated.sampleCounts.duration -
    state.sampleCounts.duration +
    (updated.sampleCounts.humanState - state.sampleCounts.humanState);

  if (totalNew >= 10 && allTaskHistory && allHumanStateSnapshots) {
    // Retrain duration model
    if (allTaskHistory.length >= 5) {
      updated.durationModel =
        trainDurationPredictor(allTaskHistory) || undefined;
    }

    // Rebuild Markov chains
    if (updated.humanStateTransitions.length >= 5) {
      updated.humanStateChain = buildHumanStateChain(
        updated.humanStateTransitions
      );
    }
    if (updated.taskStatusTransitions.length >= 5) {
      updated.taskStatusChain = buildTaskStatusChain(
        updated.taskStatusTransitions
      );
    }

    updated.lastTraining = new Date();
  }

  return updated;
}

/**
 * Get prediction engine diagnostics
 */
export function getPredictionEngineDiagnostics(state: PredictionEngineState): {
  status: 'ready' | 'warming-up' | 'insufficient-data';
  models: {
    duration: { trained: boolean; samples: number };
    session: { trained: boolean; samples: number };
    humanStateMarkov: { trained: boolean; samples: number };
    taskStatusMarkov: { trained: boolean; samples: number };
  };
  lastTraining?: Date;
  recommendations: string[];
} {
  const recommendations: string[] = [];

  if (state.sampleCounts.duration < 5) {
    recommendations.push(
      `Need ${5 - state.sampleCounts.duration} more task completions for ML duration predictions`
    );
  }
  if (state.sampleCounts.session < 10) {
    recommendations.push(
      `Need ${10 - state.sampleCounts.session} more sessions for ML session predictions`
    );
  }
  if (state.sampleCounts.humanState < 5) {
    recommendations.push(
      `Need ${5 - state.sampleCounts.humanState} more state recordings for Markov predictions`
    );
  }

  const durationTrained = !!state.durationModel;
  const sessionTrained = state.sessionHistory.length >= 10;
  const humanMarkovTrained = !!state.humanStateChain;
  const taskMarkovTrained = !!state.taskStatusChain;

  const allTrained =
    durationTrained &&
    sessionTrained &&
    humanMarkovTrained &&
    taskMarkovTrained;
  const anyTrained =
    durationTrained ||
    sessionTrained ||
    humanMarkovTrained ||
    taskMarkovTrained;

  return {
    status: allTrained
      ? 'ready'
      : anyTrained
        ? 'warming-up'
        : 'insufficient-data',
    models: {
      duration: {
        trained: durationTrained,
        samples: state.sampleCounts.duration,
      },
      session: {
        trained: sessionTrained,
        samples: state.sampleCounts.session,
      },
      humanStateMarkov: {
        trained: humanMarkovTrained,
        samples: state.sampleCounts.humanState,
      },
      taskStatusMarkov: {
        trained: taskMarkovTrained,
        samples: state.sampleCounts.taskStatus,
      },
    },
    lastTraining: state.lastTraining,
    recommendations,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function computeHeuristicDuration(
  plannedDuration: number,
  humanState: HumanStateSnapshot,
  contextSwitchCost: number
): number {
  let adjustment = 1.0;

  if (humanState.energy < 0.4) {
    adjustment *= 1.3;
  }
  if (humanState.focus < 0.5) {
    adjustment *= 1.2;
  }
  if (humanState.stress > 0.7) {
    adjustment *= 1.15;
  }

  return plannedDuration * adjustment + contextSwitchCost;
}

function computeQualityPrediction(
  humanState: HumanStateSnapshot,
  taskHistory: TaskExecutionRecord[]
): MLPrediction['quality'] {
  let baseQuality = 3.5;
  let confidence = 0.6;

  // Historical average
  const completed = taskHistory.filter((h) => h.completed && h.qualityRating);
  let historicalAvg: number | undefined;
  if (completed.length > 0) {
    historicalAvg =
      completed.reduce((sum, h) => sum + (h.qualityRating || 0), 0) /
      completed.length;
    baseQuality = historicalAvg;
    confidence = 0.7;
  }

  // State adjustments
  if (humanState.energy > 0.8 && humanState.stress < 0.3) {
    baseQuality = Math.min(5, baseQuality + 0.5);
  } else if (humanState.energy < 0.3 || humanState.stress > 0.7) {
    baseQuality = Math.max(1, baseQuality - 1.0);
    confidence *= 0.7;
  }

  return {
    predicted: clamp(baseQuality, 1, 5),
    confidence,
    factors: {
      energy: humanState.energy,
      focus: humanState.focus,
      stress: humanState.stress,
      historicalAvg,
    },
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
