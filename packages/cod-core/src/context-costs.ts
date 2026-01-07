/**
 * Context Switching Cost Analysis
 *
 * Measure the real cost of switching between different types of work:
 * - Time to regain focus after switch
 * - Quality loss from interruptions
 * - Energy drain from task switching
 *
 * Used by: Session planning, workload balancing
 */

export interface ContextSwitchEvent {
  /** When did switch occur */
  timestamp: string; // ISO

  /** Task we switched from */
  fromTask: {
    taskId: string;
    type: string;
    duration: number;
  };

  /** Task we switched to */
  toTask: {
    taskId: string;
    type: string;
    expectedDuration: number;
  };

  /** How long until we reached 80% focus on new task? */
  focusRecoveryTime?: number; // minutes

  /** Quality impact */
  qualityDropPercent?: number; // 0-100

  /** Reason for switch */
  reason: 'blocker' | 'interrupt' | 'priority-change' | 'voluntary' | 'unknown';
}

export interface ContextCostMetrics {
  /** Average time to refocus after any switch (minutes) */
  avgRecoveryTime: number;

  /** By task type: how expensive is switching FROM this type? */
  costsBySourceType: Record<
    string,
    { avgRecoveryTime: number; frequency: number }
  >;

  /** By task type: how expensive is switching TO this type? */
  costsByDestType: Record<
    string,
    { avgRecoveryTime: number; frequency: number }
  >;

  /** Worst switch combinations (most expensive) */
  mostExpensiveSwitches: Array<{
    from: string;
    to: string;
    avgRecoveryTime: number;
    frequency: number;
  }>;

  /** Cheapest switch combinations (least expensive) */
  cheapestSwitches: Array<{
    from: string;
    to: string;
    avgRecoveryTime: number;
    frequency: number;
  }>;

  /** Total productivity loss from switching (hours/week) */
  weeklyProductivityLoss: number;

  /** Recommendation */
  recommendation?: string;
}

/**
 * Record a context switch event
 */
export function recordContextSwitch(
  event: ContextSwitchEvent
): ContextSwitchEvent {
  return event;
}

/**
 * Analyze context switching costs
 */
export function analyzeContextCosts(
  switches: ContextSwitchEvent[]
): ContextCostMetrics {
  if (switches.length === 0) {
    throw new Error('No switch events provided');
  }

  // Overall recovery time
  const recoveryTimes = switches
    .filter((s) => s.focusRecoveryTime !== undefined)
    .map((s) => s.focusRecoveryTime!);

  const avgRecoveryTime =
    recoveryTimes.length > 0
      ? recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length
      : 0;

  // By source type
  const costsBySourceType: Record<
    string,
    { times: number[]; frequency: number }
  > = {};
  switches.forEach((s) => {
    const type = s.fromTask.type;
    if (!costsBySourceType[type]) {
      costsBySourceType[type] = { times: [], frequency: 0 };
    }
    if (s.focusRecoveryTime !== undefined) {
      costsBySourceType[type].times.push(s.focusRecoveryTime);
    }
    costsBySourceType[type].frequency += 1;
  });

  const costsBySourceTypeAgg: Record<
    string,
    { avgRecoveryTime: number; frequency: number }
  > = {};
  Object.entries(costsBySourceType).forEach(([type, data]) => {
    costsBySourceTypeAgg[type] = {
      avgRecoveryTime:
        data.times.length > 0
          ? data.times.reduce((a, b) => a + b, 0) / data.times.length
          : 0,
      frequency: data.frequency,
    };
  });

  // By destination type
  const costsByDestType: Record<
    string,
    { times: number[]; frequency: number }
  > = {};
  switches.forEach((s) => {
    const type = s.toTask.type;
    if (!costsByDestType[type]) {
      costsByDestType[type] = { times: [], frequency: 0 };
    }
    if (s.focusRecoveryTime !== undefined) {
      costsByDestType[type].times.push(s.focusRecoveryTime);
    }
    costsByDestType[type].frequency += 1;
  });

  const costsByDestTypeAgg: Record<
    string,
    { avgRecoveryTime: number; frequency: number }
  > = {};
  Object.entries(costsByDestType).forEach(([type, data]) => {
    costsByDestTypeAgg[type] = {
      avgRecoveryTime:
        data.times.length > 0
          ? data.times.reduce((a, b) => a + b, 0) / data.times.length
          : 0,
      frequency: data.frequency,
    };
  });

  // Most expensive switches
  const switchCombinations: Record<
    string,
    { times: number[]; frequency: number }
  > = {};
  switches.forEach((s) => {
    const key = `${s.fromTask.type}->${s.toTask.type}`;
    if (!switchCombinations[key]) {
      switchCombinations[key] = { times: [], frequency: 0 };
    }
    if (s.focusRecoveryTime !== undefined) {
      switchCombinations[key].times.push(s.focusRecoveryTime);
    }
    switchCombinations[key].frequency += 1;
  });

  const sortedCombos = Object.entries(switchCombinations)
    .map(([combo, data]) => {
      const [from, to] = combo.split('->');
      return {
        from,
        to,
        avgRecoveryTime:
          data.times.length > 0
            ? data.times.reduce((a, b) => a + b, 0) / data.times.length
            : 0,
        frequency: data.frequency,
      };
    })
    .sort((a, b) => b.avgRecoveryTime - a.avgRecoveryTime);

  const mostExpensiveSwitches = sortedCombos.slice(0, 3);
  const cheapestSwitches = sortedCombos.slice(-3).reverse();

  // Weekly productivity loss
  const weeklyLoss = (avgRecoveryTime * switches.length * 7) / 60; // hours

  // Recommendation
  let recommendation: string | undefined;
  if (avgRecoveryTime > 15) {
    recommendation = `High switching cost (${Math.round(avgRecoveryTime)} min recovery). Consider batching similar tasks.`;
  } else if (mostExpensiveSwitches.length > 0) {
    const worst = mostExpensiveSwitches[0];
    recommendation = `Most expensive switch: ${worst.from} → ${worst.to} (${Math.round(worst.avgRecoveryTime)} min). Try grouping ${worst.from} tasks together.`;
  }

  return {
    avgRecoveryTime,
    costsBySourceType: costsBySourceTypeAgg,
    costsByDestType: costsByDestTypeAgg,
    mostExpensiveSwitches,
    cheapestSwitches,
    weeklyProductivityLoss: weeklyLoss,
    recommendation,
  };
}

/**
 * Estimate cost of a potential switch before it happens
 */
export function estimateSwitchCost(
  metrics: ContextCostMetrics,
  fromType: string,
  toType: string
): number {
  // Look for exact combination
  const exact = metrics.mostExpensiveSwitches.find(
    (s) => s.from === fromType && s.to === toType
  );
  if (exact) return exact.avgRecoveryTime;

  // Average of source and dest costs
  const sourceAvg = metrics.costsBySourceType[fromType]?.avgRecoveryTime ?? 0;
  const destAvg = metrics.costsByDestType[toType]?.avgRecoveryTime ?? 0;

  return Math.max(sourceAvg, destAvg, metrics.avgRecoveryTime * 0.5);
}
