import type { PlanSessionInput, PlanSessionOutput } from './schema.js';
import { checkHardStop, type HardStopCheckResult } from '@vault/cod';

type ValidationIssue = {
  code: string;
  message: string;
  suggestion?: string;
};

type ValidationResult = {
  state: string;
  issues: ValidationIssue[];
};

type ContextTolerance = 'low' | 'med' | 'high';

type FocusCapacity = 'low' | 'med' | 'high';

type RecommendedMode = 'conservative' | 'normal' | 'focused';

type ValidationTaskStatus =
  | 'backlog'
  | 'todo'
  | 'in-progress'
  | 'in_progress'
  | 'completed'
  | 'blocked'
  | 'done'
  | 'dropped';

type TaskState = {
  id: string;
  title: string;
  status: ValidationTaskStatus;
  priority?: number;
};

type SessionTask = {
  taskId: string;
  title: string;
  path: string;
  estimatedEffort: number;
  reward?: number;
  focusCost?: number;
  status: string;
};

type PlanSessionResult = {
  session: {
    id: string;
    status: string;
    params: {
      durationMinutes: number;
      maxFocusCost?: number;
      projectId?: string;
      tags?: string[];
    };
    totals: {
      plannedTasks: number;
      plannedEffort: number;
      plannedReward: number;
    };
    tasks: SessionTask[];
  };
  noTasksAvailable?: boolean;
  goalContext?: {
    source: string;
    count: number;
    primaryGoalId?: string;
    warnings: string[];
  };
  humanState?: {
    status: string;
    warnings: string[];
    recommendedMode: RecommendedMode;
    durationCapMin: number;
    ageHours?: number;
    avatar?: unknown;
    avatarStatus?: string;
    avatarWarnings?: string[];
    avatarPath?: string;
    world?: unknown;
    worldStatus?: string;
    worldWarnings?: string[];
    worldPath?: string;
    snapshot: {
      source: string;
      energy: number;
      focusCapacity: FocusCapacity;
      stress: number;
      sleepHours: number;
      timeAvailableMin: number;
      contextTolerance?: ContextTolerance;
      healthBand?: string;
      runwayBand?: string;
    };
  };
};

export type PlanSessionDeps = {
  sessionPlannerService: {
    planSession: (input: {
      durationMinutes: number;
      maxFocusCost?: number;
      projectId?: string;
      tags?: string[];
      maxTasks?: number;
    }) => Promise<PlanSessionResult>;
  };
  codValidator: {
    validateSession: (
      session: {
        id: string;
        duration: number;
        taskIds: string[];
        totalEffort: number;
        totalReward: number;
        focusCost: number;
      },
      options?: { strict?: boolean }
    ) => ValidationResult;
    validateTask: (task: Partial<TaskState>) => ValidationResult;
  };
};

export async function handler(
  input: PlanSessionInput,
  deps: PlanSessionDeps
): Promise<PlanSessionOutput> {
  try {
    // HARD_STOP guardrail: prevent session planning during late-night window
    const hardStopResult = checkHardStop();
    if (hardStopResult.blocked && !input.overrideHardStop) {
      return {
        content: [
          {
            type: 'text',
            text: `# 🛑 HARD_STOP Active\n\n${hardStopResult.reason}\n\n**Recommendation:** Sleep now. Don't plan new work sessions during late-night hours.\n\nIf you must continue, pass \`overrideHardStop: true\` (not recommended).`,
          },
        ],
        structuredContent: {
          hardStop: hardStopResult,
          session: null,
          validation: {
            state: 'BLOCKED',
            issues: [
              {
                code: 'HARD_STOP',
                message: hardStopResult.reason || 'Late-night work blocked',
              },
            ],
          },
        },
        isError: false,
      };
    }

    const sessionValidation = deps.codValidator.validateSession(
      {
        id: 'temp-session',
        duration: input.durationMinutes,
        taskIds: [],
        totalEffort: 0,
        totalReward: 0,
        focusCost: input.maxFocusCost ?? 0,
      },
      { strict: false }
    );

    if (sessionValidation.state === 'FAIL') {
      let text = `# ❌ Cannot Plan Session\n\n`;
      text += `Session parameters failed validation:\n\n`;

      for (const issue of sessionValidation.issues) {
        text += `- **${issue.code}**: ${issue.message}\n`;
        if (issue.suggestion) {
          text += `  *Suggestion: ${issue.suggestion}*\n`;
        }
      }

      text += `\n**Blocking Reasons:**\n`;
      for (const issue of sessionValidation.issues) {
        text += `- ${issue.code}\n`;
      }

      return {
        content: [
          {
            type: 'text',
            text,
          },
        ],
        structuredContent: {
          blockingReasons: sessionValidation.issues.map((i) => i.code),
          validationState: sessionValidation.state,
          issues: sessionValidation.issues,
        },
      };
    }

    const result = await deps.sessionPlannerService.planSession({
      durationMinutes: input.durationMinutes,
      maxFocusCost: input.maxFocusCost,
      projectId: input.projectId,
      tags: input.tags,
      maxTasks: input.maxTasks,
    });

    if (result.session && result.session.tasks.length > 0) {
      const taskValidationErrors: string[] = [];

      for (const task of result.session.tasks) {
        const taskState: TaskState = {
          id: task.taskId,
          title: task.title,
          status: task.status === 'pending' ? 'todo' : 'in-progress',
          priority: 5,
        };

        const validation = deps.codValidator.validateTask(taskState);

        if (validation.state === 'FAIL') {
          taskValidationErrors.push(
            `Task ${task.taskId}: ${validation.issues.map((i) => i.code).join(', ')}`
          );
        }
      }

      if (taskValidationErrors.length > 0) {
        let text = `# ⚠️ Session Planning Blocked\n\n`;
        text += `Some selected tasks failed validation:\n\n`;

        for (const error of taskValidationErrors) {
          text += `- ${error}\n`;
        }

        text += `\n**Action Required:**\n`;
        text += `- Fix task validation issues\n`;
        text += `- Try planning again with different filters\n`;

        return {
          content: [
            {
              type: 'text',
              text,
            },
          ],
          structuredContent: {
            blockingReasons: taskValidationErrors,
            validationState: 'FAIL',
            reason: 'Task validation failed',
          },
        };
      }
    }

    const worldSignalsUsed = result.humanState
      ? [
          ...(result.humanState.snapshot.healthBand
            ? [`healthBand:${result.humanState.snapshot.healthBand}`]
            : []),
          ...(result.humanState.snapshot.runwayBand
            ? [`runwayBand:${result.humanState.snapshot.runwayBand}`]
            : []),
        ]
      : [];

    const structuredContent = result.humanState
      ? {
          ...result,
          humanState: {
            ...result.humanState,
            ...(worldSignalsUsed.length > 0 ? { worldSignalsUsed } : {}),
          },
        }
      : result;

    if (result.noTasksAvailable) {
      let text = `# No Tasks Available\n\n`;
      text += `No unblocked tasks found matching your criteria:\n\n`;
      text += `- **Duration:** ${input.durationMinutes} minutes\n`;
      if (input.maxFocusCost)
        text += `- **Max Focus Cost:** ${input.maxFocusCost}\n`;
      if (input.projectId) text += `- **Project:** ${input.projectId}\n`;
      if (input.tags && input.tags.length > 0)
        text += `- **Tags:** ${input.tags.join(', ')}\n`;
      text += `\nPossible reasons:\n`;
      text += `- All tasks are blocked by dependencies\n`;
      text += `- Tasks exceed your focus cost limit\n`;
      text += `- No tasks match the filter criteria\n`;

      return {
        content: [
          {
            type: 'text',
            text,
          },
        ],
        structuredContent,
      };
    }

    const session = result.session;

    let text = `# Work Session Planned\n\n`;
    text += `**Session ID:** \`${session.id}\`\n`;
    if (session.params.durationMinutes !== input.durationMinutes) {
      text += `**Duration (capped):** ${session.params.durationMinutes} minutes (requested ${input.durationMinutes})\n`;
    } else {
      text += `**Duration:** ${session.params.durationMinutes} minutes\n`;
    }
    text += `**Status:** ${session.status}\n\n`;

    text += `## Summary\n\n`;
    text += `- **Tasks:** ${session.totals.plannedTasks}\n`;
    text += `- **Estimated Effort:** ${session.totals.plannedEffort} units (~${Math.round(session.totals.plannedEffort * 15)} minutes)\n`;
    text += `- **Expected Reward:** ${session.totals.plannedReward}\n\n`;

    if (result.goalContext) {
      const goalContext = result.goalContext;
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
    }

    if (result.humanState) {
      const humanState = result.humanState;
      text += `## Human State\n\n`;
      text += `- **Status:** ${humanState.status}\n`;
      text += `- **Source:** ${humanState.snapshot.source}\n`;
      text += `- **Energy:** ${humanState.snapshot.energy}\n`;
      text += `- **Focus capacity:** ${humanState.snapshot.focusCapacity}\n`;
      text += `- **Stress:** ${humanState.snapshot.stress}\n`;
      text += `- **Sleep hours:** ${humanState.snapshot.sleepHours}\n`;
      text += `- **Time available (min):** ${humanState.snapshot.timeAvailableMin}\n`;
      text += `- **Context tolerance:** ${humanState.snapshot.contextTolerance}\n`;
      if (humanState.worldStatus) {
        text += `- **World status:** ${humanState.worldStatus}\n`;
      }
      if (humanState.worldPath) {
        text += `- **World note:** ${humanState.worldPath}\n`;
      }
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
    }

    if (session.params.maxFocusCost) {
      text += `**Focus Constraint:** Max ${session.params.maxFocusCost}\n`;
    }
    if (session.params.projectId) {
      text += `**Project:** ${session.params.projectId}\n`;
    }
    if (session.params.tags && session.params.tags.length > 0) {
      text += `**Tags:** ${session.params.tags.join(', ')}\n`;
    }
    text += `\n`;

    text += `## Tasks\n\n`;

    for (const task of session.tasks) {
      text += `### ${task.title}\n\n`;
      text += `- **ID:** \`${task.taskId}\`\n`;
      text += `- **Path:** ${task.path}\n`;
      text += `- **Effort:** ${task.estimatedEffort}\n`;
      if (task.reward) text += `- **Reward:** ${task.reward}\n`;
      if (task.focusCost) text += `- **Focus Cost:** ${task.focusCost}\n`;
      text += `- **Status:** ${task.status}\n\n`;
    }

    text += `## Next Steps\n\n`;
    text += `To start the session:\n`;
    text += `\`\`\`\nobsidian_start_session(sessionId: "${session.id}")\n\`\`\`\n\n`;
    text += `To update task status:\n`;
    text += `\`\`\`\nobsidian_update_session_task(sessionId: "${session.id}", taskId: "...", status: "in_progress")\n\`\`\`\n`;

    return {
      content: [
        {
          type: 'text',
          text,
        },
      ],
      structuredContent,
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ Failed to plan session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}
