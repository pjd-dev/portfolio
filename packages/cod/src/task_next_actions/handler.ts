import type { TaskNextActionsInput, TaskNextActionsOutput } from './schema.js';

type TaskNode = {
  id: string;
  title: string;
  status: TaskStatus;
  effort?: number;
  reward?: number;
  focusCost?: number;
  projectId?: string;
  goal?: string;
  tags?: string[];
  path: string;
  dependencies?: string[];
  blockers?: string[];
};

type RankedTask = {
  task: TaskNode;
  blocked: boolean;
  unmetDependencies: string[];
  score: number;
  scoreBreakdown?: unknown;
};

type GoalLoadResult = {
  source: string;
  warnings: string[];
  index: GoalIndex;
};

type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked' | 'dropped';

type ValidationTaskStatus = TaskStatus | 'in-progress' | 'completed';

type ContextTolerance = 'low' | 'med' | 'high';

type FocusCapacity = 'low' | 'med' | 'high';

type RecommendedMode = 'conservative' | 'normal' | 'focused';

type GoalStatus = 'active' | 'inactive' | 'completed' | 'archived';

type GoalRecord = {
  id: string;
  title: string;
  status: GoalStatus;
  active: boolean;
  weight: number;
  tags: string[];
  horizon?: string;
  sourcePath?: string;
};

type GoalIndex = {
  goals: GoalRecord[];
  goalsById: Record<string, GoalRecord>;
  activeGoalIds: string[];
  primaryGoalId?: string;
};

type HumanStateContext = {
  status: string;
  warnings: string[];
  recommendedMode: RecommendedMode;
  durationCapMin: number;
  ageHours?: number;
  snapshot: {
    source: string;
    energy: number;
    focusCapacity: FocusCapacity;
    stress: number;
    sleepDebt: number;
    timeAvailableMin: number;
    contextTolerance?: ContextTolerance;
    healthBand?: string;
    runwayBand?: string;
  };
};

type ValidationResult = {
  status?: string;
  state?: string;
  reason?: string;
};

type TaskState = {
  id: string;
  title: string;
  status: ValidationTaskStatus;
  effort?: number;
  reward?: number;
  focusCost?: number;
  projectId?: string;
  goal?: string;
  path?: string;
  dependencies?: string[];
  blockers?: string[];
};

export type TaskNextActionsDeps = {
  taskGraphService: {
    getNextActions: (options: {
      projectId?: string;
      max?: number;
      maxEffort?: number;
      maxFocusCost?: number;
      statusFilter?: TaskStatus[];
      goalContext?: {
        goalIndex?: GoalIndex;
        contextTolerance?: ContextTolerance;
      };
      focusCapacity?: FocusCapacity;
      recommendedMode?: RecommendedMode;
    }) => Promise<RankedTask[]>;
  };
  goalService: {
    loadGoals: () => Promise<GoalLoadResult>;
  };
  humanStateService: {
    loadPlanningContext: () => Promise<HumanStateContext>;
  };
  codValidator: {
    validateTask: (
      task: Partial<TaskState>,
      context?: {
        goalsMap?: Record<string, boolean>;
        tasksMap?: Record<string, boolean>;
      }
    ) => ValidationResult;
  };
};

export async function handler(
  input: TaskNextActionsInput,
  deps: TaskNextActionsDeps
): Promise<TaskNextActionsOutput> {
  try {
    const goalLoad = await deps.goalService.loadGoals();
    const humanState = await deps.humanStateService.loadPlanningContext();
    const contextTolerance = humanState.snapshot.contextTolerance ?? 'med';
    const goalWarnings = [...goalLoad.warnings];
    if (goalLoad.source === 'none') {
      goalWarnings.push('No goals found in Goals/ or dump/Goals.');
    }
    const goalContext = {
      source: goalLoad.source,
      count: goalLoad.index.goals.length,
      primaryGoalId: goalLoad.index.primaryGoalId,
      warnings: goalWarnings,
    };
    const goalsMap = Object.fromEntries(
      goalLoad.index.goals.map((goal) => [goal.id, true])
    );

    const tasks = await deps.taskGraphService.getNextActions({
      projectId: input.projectId,
      max: input.max,
      maxEffort: input.maxEffort,
      maxFocusCost: input.maxFocusCost,
      statusFilter: input.statusFilter,
      goalContext: {
        goalIndex: goalLoad.index,
        contextTolerance,
      },
      focusCapacity: humanState.snapshot.focusCapacity,
      recommendedMode: humanState.recommendedMode,
    });

    const validationMap = new Map<
      string,
      { valid: boolean; reason?: string }
    >();

    for (const ranked of tasks) {
      const taskState: TaskState = {
        id: ranked.task.id,
        title: ranked.task.title,
        status: ranked.task.status,
        effort: ranked.task.effort,
        reward: ranked.task.reward,
        focusCost: ranked.task.focusCost,
        projectId: ranked.task.projectId,
        goal: ranked.task.goal,
        path: ranked.task.path,
        dependencies: ranked.task.dependencies || [],
        blockers: ranked.task.blockers || [],
      };

      const result = deps.codValidator.validateTask(taskState, { goalsMap });
      const verdict = result.status ?? result.state;
      validationMap.set(ranked.task.id, {
        valid: verdict === 'PASS' || verdict === 'WARN',
        reason: verdict === 'FAIL' ? result.reason : undefined,
      });
    }

    const unblocked = tasks.filter(
      (t) => !t.blocked && validationMap.get(t.task.id)?.valid
    );
    const blocked = tasks.filter((t) => t.blocked);
    const failed = tasks.filter((t) => {
      const validation = validationMap.get(t.task.id);
      return validation && !validation.valid;
    });

    const worldSignalsUsed: string[] = [];
    if (humanState.snapshot.healthBand) {
      worldSignalsUsed.push(`healthBand:${humanState.snapshot.healthBand}`);
    }
    if (humanState.snapshot.runwayBand) {
      worldSignalsUsed.push(`runwayBand:${humanState.snapshot.runwayBand}`);
    }

    let text = `# Next Actions\n\n`;

    text += `## Summary\n\n`;
    text += `- **Unblocked tasks:** ${unblocked.length}\n`;
    text += `- **Blocked tasks:** ${blocked.length}\n`;
    text += `- **Failed validation:** ${failed.length}\n`;
    text += `- **Total:** ${tasks.length}\n\n`;

    if (goalContext.count > 0 || goalContext.warnings.length > 0) {
      text += `## Goals Context\n\n`;
      text += `- **Source:** ${goalContext.source}\n`;
      text += `- **Goals loaded:** ${goalContext.count}\n`;
      if (goalContext.primaryGoalId) {
        text += `- **Primary goal:** ${goalContext.primaryGoalId}\n`;
      }
      if (goalContext.warnings.length > 0) {
        text += `- **Warnings:** ${goalContext.warnings.join('; ')}\n`;
      }
      text += `\n`;
    }

    text += `## Human State\n\n`;
    text += `- **Status:** ${humanState.status}\n`;
    text += `- **Source:** ${humanState.snapshot.source}\n`;
    text += `- **Energy:** ${humanState.snapshot.energy}\n`;
    text += `- **Focus capacity:** ${humanState.snapshot.focusCapacity}\n`;
    text += `- **Stress:** ${humanState.snapshot.stress}\n`;
    text += `- **Sleep debt:** ${humanState.snapshot.sleepDebt}\n`;
    text += `- **Time available (min):** ${humanState.snapshot.timeAvailableMin}\n`;
    text += `- **Context tolerance:** ${humanState.snapshot.contextTolerance}\n`;
    if (worldSignalsUsed.length > 0) {
      text += `- **World signals used:** ${worldSignalsUsed.join(', ')}\n`;
    }
    text += `- **Recommended mode:** ${humanState.recommendedMode}\n`;
    text += `- **Duration cap (min):** ${humanState.durationCapMin}\n`;
    if (humanState.ageHours !== undefined) {
      text += `- **Age (hours):** ${humanState.ageHours.toFixed(1)}\n`;
    }
    if (humanState.warnings.length > 0) {
      text += `- **Warnings:** ${humanState.warnings.join('; ')}\n`;
    }
    text += `\n`;

    if (unblocked.length > 0) {
      text += `## Unblocked Tasks (Ready to Start)\n\n`;
      text += `Sorted by score (reward / (effort × focus cost)):\n\n`;

      for (const ranked of unblocked.slice(0, input.max || 10)) {
        text += `### ${ranked.task.title}\n\n`;
        text += `- **ID:** \`${ranked.task.id}\`\n`;
        text += `- **Status:** ${ranked.task.status}\n`;
        text += `- **Score:** ${ranked.score.toFixed(2)}\n`;

        if (ranked.task.effort) text += `- **Effort:** ${ranked.task.effort}\n`;
        if (ranked.task.reward) text += `- **Reward:** ${ranked.task.reward}\n`;
        if (ranked.task.focusCost)
          text += `- **Focus Cost:** ${ranked.task.focusCost}\n`;
        if (ranked.task.projectId)
          text += `- **Project:** ${ranked.task.projectId}\n`;
        if (ranked.task.goal) text += `- **Goal:** ${ranked.task.goal}\n`;

        text += `- **Path:** ${ranked.task.path}\n\n`;
      }

      if (unblocked.length > (input.max || 10)) {
        text += `\n*... and ${unblocked.length - (input.max || 10)} more unblocked tasks*\n\n`;
      }
    } else {
      text += `## No Unblocked Tasks\n\n`;
      text += `All tasks are either blocked, failed validation, or filtered out.\n\n`;
    }

    if (failed.length > 0 && failed.length <= 5) {
      text += `## Failed Validation (COD)\n\n`;

      for (const ranked of failed) {
        const reason =
          validationMap.get(ranked.task.id)?.reason || 'Unknown issue';
        text += `- **${ranked.task.title}** (\`${ranked.task.id}\`)\n`;
        text += `  Issue: ${reason}\n`;
      }
      text += `\n`;
    } else if (failed.length > 0) {
      text += `## Failed Validation (COD)\n\n`;
      text += `${failed.length} tasks failed COD validation.\n\n`;
    }

    if (blocked.length > 0 && blocked.length <= 5) {
      text += `## Blocked Tasks\n\n`;

      for (const ranked of blocked) {
        text += `- **${ranked.task.title}** (\`${ranked.task.id}\`)\n`;
        text += `  Waiting on: ${ranked.unmetDependencies.join(', ')}\n`;
      }
      text += `\n`;
    } else if (blocked.length > 0) {
      text += `## Blocked Tasks\n\n`;
      text += `${blocked.length} tasks are blocked by dependencies.\n\n`;
    }

    return {
      content: [
        {
          type: 'text',
          text,
        },
      ],
      structuredContent: {
        unblocked,
        blocked,
        failed,
        total: tasks.length,
        goalContext,
        humanState: {
          status: humanState.status,
          warnings: humanState.warnings,
          recommendedMode: humanState.recommendedMode,
          durationCapMin: humanState.durationCapMin,
          ageHours: humanState.ageHours,
          worldSignalsUsed,
          snapshot: humanState.snapshot,
        },
      },
    };
  } catch (error) {
    const errorMsg =
      error instanceof Error
        ? `${error.message}\n\nStack: ${error.stack}`
        : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `❌ Failed to get next actions: ${errorMsg}`,
        },
      ],
      isError: true,
    };
  }
}
