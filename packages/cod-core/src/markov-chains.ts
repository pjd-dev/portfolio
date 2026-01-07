/**
 * Markov Chains - State transition modeling for COD system
 * Models: human state transitions, task status flows, session patterns
 */

import {
  createMarkovChain,
  predictNextState,
  simulateMarkovChain,
  type MarkovChain,
} from './ml-utils.js';

/**
 * Human State Markov Chain
 * Models transitions between different energy/focus/stress states
 */

export type HumanStateCategory =
  | 'peak' // high energy, low stress, high focus
  | 'productive' // good energy, moderate stress, good focus
  | 'fatigued' // low energy, moderate stress, low focus
  | 'stressed' // moderate energy, high stress, low focus
  | 'recovery'; // low energy, low stress, moderate focus

export interface HumanStateTransition {
  from: HumanStateCategory;
  to: HumanStateCategory;
  timestamp: string;
  duration: number; // minutes in 'from' state
}

export function categorizeHumanState(
  energy: number,
  stress: number,
  focus: number
): HumanStateCategory {
  if (energy > 0.7 && stress < 0.3 && focus > 0.7) {
    return 'peak';
  }
  if (energy > 0.5 && stress < 0.5 && focus > 0.5) {
    return 'productive';
  }
  if (stress > 0.6) {
    return 'stressed';
  }
  if (energy < 0.4 && stress < 0.4) {
    return 'recovery';
  }
  return 'fatigued';
}

export function buildHumanStateChain(
  transitions: HumanStateTransition[]
): MarkovChain {
  return createMarkovChain(
    transitions.map((t) => ({ from: t.from, to: t.to }))
  );
}

export interface HumanStateForecast {
  currentState: HumanStateCategory;
  nextLikelyStates: Array<{ state: HumanStateCategory; probability: number }>;
  expectedDurationMinutes: number;
  recommendation: string;
}

export function forecastHumanState(
  chain: MarkovChain,
  currentState: HumanStateCategory,
  transitions: HumanStateTransition[]
): HumanStateForecast {
  const nextStates = predictNextState(chain, currentState);

  // Calculate expected duration in current state
  const stateTransitions = transitions.filter((t) => t.from === currentState);
  const avgDuration =
    stateTransitions.length > 0
      ? stateTransitions.reduce((sum, t) => sum + t.duration, 0) /
        stateTransitions.length
      : 60;

  // Generate recommendation
  let recommendation = '';
  const topNext = nextStates[0];
  if (currentState === 'peak') {
    recommendation =
      'Optimal for high-complexity tasks. Expect to maintain this state for ~' +
      Math.round(avgDuration) +
      ' minutes.';
  } else if (currentState === 'stressed' && topNext?.state === 'fatigued') {
    recommendation =
      'High stress detected. Take a break to avoid fatigue. Consider recovery activities.';
  } else if (currentState === 'fatigued' && topNext?.state === 'recovery') {
    recommendation =
      'Energy low. Schedule easier tasks or take a proper break.';
  } else if (currentState === 'recovery' && topNext?.state === 'productive') {
    recommendation =
      'Recovery in progress. Light tasks recommended, productive state likely next.';
  } else {
    recommendation = `Currently ${currentState}. Most likely transition: ${topNext?.state || 'unknown'}.`;
  }

  return {
    currentState,
    nextLikelyStates: nextStates.slice(0, 3) as Array<{
      state: HumanStateCategory;
      probability: number;
    }>,
    expectedDurationMinutes: Math.round(avgDuration),
    recommendation,
  };
}

/**
 * Task Status Markov Chain
 * Models how tasks transition through statuses
 */

export type TaskStatus =
  | 'pending'
  | 'in-progress'
  | 'blocked'
  | 'done'
  | 'cancelled';

export interface TaskStatusTransition {
  taskId: string;
  from: TaskStatus;
  to: TaskStatus;
  timestamp: string;
  duration: number; // minutes in 'from' status
}

export function buildTaskStatusChain(
  transitions: TaskStatusTransition[]
): MarkovChain {
  return createMarkovChain(
    transitions.map((t) => ({ from: t.from, to: t.to }))
  );
}

export interface TaskCompletionForecast {
  currentStatus: TaskStatus;
  completionProbability: number;
  expectedStatusChanges: number;
  riskOfCancellation: number;
  recommendation: string;
}

export function forecastTaskCompletion(
  chain: MarkovChain,
  currentStatus: TaskStatus,
  transitions: TaskStatusTransition[]
): TaskCompletionForecast {
  // Simulate task progression
  const simulations = 100;
  let completions = 0;
  let cancellations = 0;
  const pathLengths: number[] = [];

  for (let i = 0; i < simulations; i++) {
    const path = simulateMarkovChain(chain, currentStatus, 20);
    pathLengths.push(path.length);
    if (path.includes('done')) completions++;
    if (path.includes('cancelled')) cancellations++;
  }

  const completionProbability = completions / simulations;
  const riskOfCancellation = cancellations / simulations;
  const expectedStatusChanges =
    pathLengths.reduce((sum, len) => sum + len, 0) / simulations;

  // Generate recommendation
  let recommendation = '';
  if (currentStatus === 'blocked') {
    recommendation =
      'Task blocked. Resolve blockers to avoid cancellation risk.';
  } else if (currentStatus === 'in-progress' && completionProbability < 0.5) {
    recommendation =
      'Low completion probability. Review task scope and dependencies.';
  } else if (riskOfCancellation > 0.2) {
    recommendation =
      'High cancellation risk. Consider task priority and feasibility.';
  } else if (completionProbability > 0.7) {
    recommendation = 'On track for completion. Continue current approach.';
  } else {
    recommendation =
      'Moderate completion probability. Monitor progress closely.';
  }

  return {
    currentStatus,
    completionProbability,
    expectedStatusChanges: Math.round(expectedStatusChanges),
    riskOfCancellation,
    recommendation,
  };
}

/**
 * Session Flow Markov Chain
 * Models task sequence patterns within work sessions
 */

export interface SessionTaskTransition {
  sessionId: string;
  fromTaskType: string;
  toTaskType: string;
  timestamp: string;
  contextSwitchCost: number; // minutes lost to switching
}

export function buildSessionFlowChain(
  transitions: SessionTaskTransition[]
): MarkovChain {
  return createMarkovChain(
    transitions.map((t) => ({ from: t.fromTaskType, to: t.toTaskType }))
  );
}

export interface SessionOptimization {
  currentTaskType: string;
  nextRecommendedTasks: Array<{
    type: string;
    probability: number;
    switchCost: number;
  }>;
  optimalSequence: string[];
  expectedProductivity: number; // 0-1 scale
  advice: string;
}

export function optimizeSessionFlow(
  chain: MarkovChain,
  currentTaskType: string,
  transitions: SessionTaskTransition[],
  remainingTime: number
): SessionOptimization {
  const nextTasks = predictNextState(chain, currentTaskType);

  // Calculate average switch costs
  const switchCosts = nextTasks.map((nt) => {
    const relevantSwitches = transitions.filter(
      (t) => t.fromTaskType === currentTaskType && t.toTaskType === nt.state
    );
    const avgCost =
      relevantSwitches.length > 0
        ? relevantSwitches.reduce((sum, t) => sum + t.contextSwitchCost, 0) /
          relevantSwitches.length
        : 10; // default 10 min
    return { type: nt.state, probability: nt.probability, switchCost: avgCost };
  });

  // Generate optimal sequence (minimize switch costs)
  const optimalSequence = simulateMarkovChain(
    chain,
    currentTaskType,
    Math.min(5, Math.floor(remainingTime / 30)) // assume 30min per task
  );

  // Calculate expected productivity (inverse of switch costs)
  const totalSwitchCost = switchCosts.reduce(
    (sum, sc) => sum + sc.switchCost * sc.probability,
    0
  );
  const expectedProductivity = Math.max(
    0,
    Math.min(1, 1 - totalSwitchCost / 60)
  );

  // Generate advice
  let advice = '';
  const bestNext = switchCosts[0];
  if (bestNext && bestNext.switchCost < 5) {
    advice = `Continue with ${bestNext.type} - minimal context switch cost (${Math.round(bestNext.switchCost)} min).`;
  } else if (bestNext && bestNext.switchCost > 20) {
    advice = `Switching to ${bestNext.type} has high cost (${Math.round(bestNext.switchCost)} min). Consider batching similar tasks.`;
  } else if (expectedProductivity < 0.5) {
    advice =
      'Frequent context switching detected. Try batching similar task types.';
  } else {
    advice = 'Good task flow pattern. Productivity remains high.';
  }

  return {
    currentTaskType,
    nextRecommendedTasks: switchCosts.slice(0, 3),
    optimalSequence,
    expectedProductivity,
    advice,
  };
}

/**
 * Aggregate Markov analysis
 */
export interface MarkovAnalysis {
  humanState: {
    chain: MarkovChain;
    currentForecast: HumanStateForecast | null;
  };
  taskStatus: {
    chain: MarkovChain;
    completionRate: number;
    avgTimeToCompletion: number;
  };
  sessionFlow: {
    chain: MarkovChain;
    optimalPatterns: string[][];
    worstSwitches: Array<{ from: string; to: string; avgCost: number }>;
  };
}

export function analyzeAllMarkovChains(
  humanStateTransitions: HumanStateTransition[],
  taskStatusTransitions: TaskStatusTransition[],
  sessionTransitions: SessionTaskTransition[],
  currentHumanState?: HumanStateCategory
): MarkovAnalysis {
  // Build chains
  const humanStateChain = buildHumanStateChain(humanStateTransitions);
  const taskStatusChain = buildTaskStatusChain(taskStatusTransitions);
  const sessionFlowChain = buildSessionFlowChain(sessionTransitions);

  // Human state forecast
  const currentForecast = currentHumanState
    ? forecastHumanState(
        humanStateChain,
        currentHumanState,
        humanStateTransitions
      )
    : null;

  // Task completion metrics
  const completedTasks = taskStatusTransitions.filter((t) => t.to === 'done');
  const completionRate =
    completedTasks.length / Math.max(1, taskStatusTransitions.length);

  const completionDurations = completedTasks.map((t) => t.duration);
  const avgTimeToCompletion =
    completionDurations.length > 0
      ? completionDurations.reduce((sum, d) => sum + d, 0) /
        completionDurations.length
      : 0;

  // Session flow patterns
  const optimalPatterns: string[][] = [];
  const uniqueTaskTypes = Array.from(
    new Set(sessionTransitions.map((t) => t.fromTaskType))
  );
  uniqueTaskTypes.slice(0, 5).forEach((type) => {
    const pattern = simulateMarkovChain(sessionFlowChain, type, 3);
    optimalPatterns.push(pattern);
  });

  // Find worst context switches
  const switchCosts: { [key: string]: { count: number; totalCost: number } } =
    {};
  sessionTransitions.forEach((t) => {
    const key = `${t.fromTaskType}->${t.toTaskType}`;
    if (!switchCosts[key]) {
      switchCosts[key] = { count: 0, totalCost: 0 };
    }
    switchCosts[key].count++;
    switchCosts[key].totalCost += t.contextSwitchCost;
  });

  const worstSwitches = Object.entries(switchCosts)
    .map(([key, data]) => {
      const [from, to] = key.split('->');
      return { from, to, avgCost: data.totalCost / data.count };
    })
    .sort((a, b) => b.avgCost - a.avgCost)
    .slice(0, 5);

  return {
    humanState: {
      chain: humanStateChain,
      currentForecast,
    },
    taskStatus: {
      chain: taskStatusChain,
      completionRate,
      avgTimeToCompletion: Math.round(avgTimeToCompletion),
    },
    sessionFlow: {
      chain: sessionFlowChain,
      optimalPatterns,
      worstSwitches,
    },
  };
}
