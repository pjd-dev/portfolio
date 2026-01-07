/**
 * @vault/cod
 *
 * COD (Cognitive Organizer & Operator) core library.
 *
 * Deterministic validation for tasks/sessions plus shared effort/cost helpers.
 * Pure utilities only: no I/O, no external dependencies, no side effects.
 * Designed for reuse in MCP adapters and tests.
 *
 * Spec: doc/COD_VALIDATION_SPEC.md
 */

export { CODValidator } from './validator/core.js';
export * from './validator/types.js';
export {
  EFFORT_UNIT_MIN,
  computeTaskEffortScore,
  computeTaskCostMin,
} from './runtime.js';
export {
  checkHardStop,
  toValidationBlocker,
  isHardStopActive,
  timeUntilHardStopEnd,
  type HardStopConfig,
  type HardStopCheckResult,
} from './hard-stop.js';
export {
  checkSessionReviewNeeded,
  formatSessionReviewPrompt,
  type SessionReviewConfig,
  type SessionReviewState,
  type SessionReviewCheckResult,
  type SessionReviewInput,
} from './session-review.js';
export {
  recordTaskExecution,
  recordSessionOutcome,
  computeTaskStats,
  type TaskExecutionRecord,
  type SessionExecutionRecord,
  type TaskExecutionStats,
} from './prediction-history.js';
export {
  recordHumanState,
  analyzeTrend,
  analyzeCorrelation,
  findOptimalState,
  type HumanStateSnapshot,
  type HumanStateTrend,
  type HumanStateCorrelation,
} from './human-state-series.js';
export {
  projectGoalCompletion,
  analyzeMilestoneProgress,
  type GoalProjection,
} from './goal-projections.js';
export {
  analyzeTaskTypePattern,
  detectWorkHabitPatterns,
  type TaskTypePattern,
  type WorkHabitPattern,
} from './pattern-detection.js';
export {
  recordContextSwitch,
  analyzeContextCosts,
  estimateSwitchCost,
  type ContextSwitchEvent,
  type ContextCostMetrics,
} from './context-costs.js';
export {
  predictTask,
  predictTaskML,
  mlToTaskPrediction,
  initializePredictionEngine,
  updatePredictionEngine,
  getPredictionEngineDiagnostics,
  type PredictionInput,
  type TaskPrediction,
  type MLPrediction,
  type PredictionEngineState,
} from './predictions.js';
export * from './prediction-engine.js';

// Export ML modules
export * from './ml-utils.js';
export * from './duration-predictor.js';
export * from './markov-chains.js';
export * from './state-forecaster.js';
export * from './session-classifier.js';

export * from './goals.js';
export * from './human-state.js';
export * from './time-sensitivity.js';
