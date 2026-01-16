import type { TaskNextActionsInput, TaskNextActionsOutput } from './schema.js';
import {
  checkHardStop,
  canIncludeInAgentSession,
  extractAuthorityConfig,
  type HardStopCheckResult,
  type CallerAuthority,
  type CodProfile,
  normalizeTaskState,
} from '@vault/cod';

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
  // Authority fields
  delegation_mode?: string;
  delegatable?: boolean;
  human_only?: boolean;
  ai_token_budget?: number;
  ai_time_budget_min?: number;
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

type TaskStatus =
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'done'
  | 'blocked'
  | 'dropped';

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
  goal?: string | null;
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
      profile?: CodProfile;
    }) => Promise<RankedTask[]>;
  };
  goalService: {
    loadGoals: () => Promise<GoalLoadResult>;
  };
  humanStateService: {
    loadPlanningContext: () => Promise<HumanStateContext>;
  };
  avatarService?: {
    loadAvatarState: () => Promise<{
      state?: {
        vitals?: { money?: any; notoriety?: number; health?: number };
        profile?: { archetype?: string; title?: string; handle?: string };
        flags?: Record<string, unknown>;
      };
    }>;
  };
  avatarWorkloadService?: {
    checkWorkloadGating: (
      date: Date,
      threshold?: number
    ) => Promise<{
      blocked: boolean;
      reason?: string;
      workloadToday: number;
      threshold: number;
      date: string;
    }>;
    getAvatarFreshness: (timezone?: string) => Promise<{
      stale: boolean;
      age?: number;
      lastUpdate?: string;
      reason?: string;
    }>;
  };
  codValidator: {
    validateTask: (
      task: Partial<TaskState>,
      context?: {
        goalsMap?: Record<string, boolean>;
        tasksMap?: Record<string, boolean | number | 'duplicate'>;
      },
      options?: { profile?: CodProfile }
    ) => ValidationResult & { issues?: any[]; warnings?: string[] };
  };
};

function computeRescueActions(
  ranked: RankedTask[],
  options: { startabilityThreshold?: number; energy?: number }
): Array<{
  id: string;
  title: string;
  status: TaskStatus;
  path: string;
  priority?: number;
}> {
  const startabilityThreshold = options.startabilityThreshold ?? 0.6;
  const energyLow = options.energy !== undefined && options.energy < 0.4;

  const breakdown = (rt: RankedTask) =>
    (rt.scoreBreakdown ?? {}) as Record<string, any>;

  const startable = ranked.filter(
    (r) => (breakdown(r).adhdStartability ?? 0) >= startabilityThreshold
  );
  const needRescue = energyLow || startable.length === 0;
  if (!needRescue) return [];

  const candidates = ranked
    .filter((r) => {
      const bd = breakdown(r);
      const clarity = bd.adhdBreakdown?.clarity ?? 2;
      const fric = bd.adhdBreakdown?.friction ?? 3;
      const short = (r.task as any).estimatedTimeMin
        ? (r.task as any).estimatedTimeMin <= 10
        : false;
      return (
        (r.task as any).adhd?.rescue === true ||
        short ||
        (clarity >= 3 && fric <= 2)
      );
    })
    .sort(
      (a, b) =>
        (breakdown(b).adhdDopamineROI ?? 0) -
        (breakdown(a).adhdDopamineROI ?? 0)
    )
    .slice(0, 3)
    .map((r) => ({
      id: r.task.id,
      title: r.task.title,
      status: r.task.status,
      priority: (r.task as any).priority,
      path: (r.task as any).path,
    }));

  return candidates;
}

const deriveProfileFromAvatar = (avatarState?: {
  profile?: { archetype?: string; title?: string; handle?: string };
  flags?: Record<string, unknown>;
}): CodProfile | undefined => {
  if (!avatarState) return undefined;
  const archetype =
    avatarState.profile?.archetype ||
    avatarState.profile?.title ||
    avatarState.profile?.handle;
  if (
    typeof archetype === 'string' &&
    archetype.toLowerCase().includes('adhd')
  ) {
    return 'adhd';
  }
  if (avatarState.flags) {
    for (const [k, v] of Object.entries(avatarState.flags)) {
      if (
        k.toLowerCase().includes('adhd') &&
        (v === true || (typeof v === 'string' && v.toLowerCase() === 'true'))
      ) {
        return 'adhd';
      }
    }
  }
  return undefined;
};

export async function handler(
  input: TaskNextActionsInput,
  deps: TaskNextActionsDeps
): Promise<TaskNextActionsOutput> {
  try {
    let profile: CodProfile = input.profile ?? 'basic';
    // HARD_STOP guardrail: prevent work during late-night window
    const hardStopResult = checkHardStop(new Date(), {}, profile);
    if (hardStopResult.blocked && !input.overrideHardStop) {
      return {
        content: [
          {
            type: 'text',
            text: `# 🛑 HARD_STOP Active\n\n${hardStopResult.reason}\n\n**Recommendation:** Sleep now. Capture any critical thoughts in a quick note, then rest.\n\nIf you must continue, pass \`overrideHardStop: true\` (not recommended).`,
          },
        ],
        structuredContent: {
          unblocked: [],
          blocked: [],
          failed: [],
          total: 0,
          goalContext: {
            source: 'blocked',
            count: 0,
            warnings: ['HARD_STOP active'],
          },
          humanState: {
            status: 'blocked',
            warnings: [hardStopResult.reason || 'Late-night work blocked'],
            recommendedMode: 'conservative',
            durationCapMin: 0,
            worldSignalsUsed: [],
            snapshot: {
              source: 'hard-stop',
              energy: 0,
              focusCapacity: 'low',
              stress: 10,
              sleepHours: 0,
              timeAvailableMin: 0,
            },
          },
        },
        isError: false,
      };
    }

    // Workload gating: check if today's workload exceeds threshold
    if (deps.avatarWorkloadService && !input.overrideHardStop) {
      try {
        const workloadResult =
          await deps.avatarWorkloadService.checkWorkloadGating(
            new Date(),
            20 // Default threshold
          );
        if (workloadResult.blocked) {
          return {
            content: [
              {
                type: 'text',
                text: `# 🛑 Workload Limit Reached\n\n${workloadResult.reason}\n\n**Today's workload:** ${workloadResult.workloadToday} events (limit: ${workloadResult.threshold})\n\n**Recommendation:** Take a break. You've done enough for today.`,
              },
            ],
            structuredContent: {
              unblocked: [],
              blocked: [],
              failed: [],
              total: 0,
              goalContext: {
                source: 'blocked',
                count: 0,
                warnings: ['Workload gating active'],
              },
              humanState: {
                status: 'blocked',
                warnings: [workloadResult.reason || 'Workload limit exceeded'],
                recommendedMode: 'conservative',
                durationCapMin: 0,
                worldSignalsUsed: [],
                snapshot: {
                  source: 'workload-gating',
                  energy: 0,
                  focusCapacity: 'low',
                  stress: 10,
                  sleepHours: 0,
                  timeAvailableMin: 0,
                },
              },
            },
            isError: false,
          };
        }
      } catch (error) {
        // Log but don't block on workload service errors
        console.warn('Workload gating check failed:', error);
      }
    }

    // Freshness gating: require Avatar vitals to be fresh for today
    if (deps.avatarWorkloadService && !input.overrideHardStop) {
      try {
        const freshness = await deps.avatarWorkloadService.getAvatarFreshness();
        if (freshness.stale) {
          const reasonText =
            freshness.reason ||
            `Avatar vitals are stale${freshness.lastUpdate ? ` (last update: ${freshness.lastUpdate})` : ''}.`;
          return {
            content: [
              {
                type: 'text',
                text: `# 🛑 Avatar Vitals Stale\n\n${reasonText}\n\n**Action:** Please record your human-state for today to refresh Avatar vitals.`,
              },
            ],
            structuredContent: {
              unblocked: [],
              blocked: [],
              failed: [],
              total: 0,
              goalContext: {
                source: 'blocked',
                count: 0,
                warnings: ['Avatar freshness gating active'],
              },
              humanState: {
                status: 'blocked',
                warnings: [reasonText],
                recommendedMode: 'conservative',
                durationCapMin: 0,
                worldSignalsUsed: [],
                snapshot: {
                  source: 'avatar-freshness',
                  energy: 0,
                  focusCapacity: 'low',
                  stress: 10,
                  sleepHours: 0,
                  timeAvailableMin: 0,
                },
              },
            },
            isError: false,
          };
        }
      } catch (error) {
        console.warn('Avatar freshness check failed:', error);
      }
    }

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

    // Money-aware scoring context + profile derive from avatar
    let moneyLow = false;
    try {
      const avatar = await deps.avatarService?.loadAvatarState?.();
      if (avatar) {
        const state = avatar?.state;
        const money = state?.vitals?.money;
        const avatarProfile = deriveProfileFromAvatar(state);
        if (!input.profile && avatarProfile) {
          profile = avatarProfile ?? profile;
        }
        if (money) {
          const defaultCurrency =
            money.default_currency ||
            money.defaultCurrency ||
            Object.keys(money.balances || {})[0];
          const defaultBalance =
            (money.balances && money.balances[defaultCurrency]) ?? 0;
          moneyLow = defaultBalance < 1000; // basic threshold; tune as needed
        }
      }
    } catch {
      // ignore avatar fetch errors
    }

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
      profile,
    });

    const isRecurringTask = (ranked: RankedTask): boolean => {
      const tags = ranked.task.tags || [];
      const tagHit = tags.some((t) => t.toLowerCase().includes('recurring'));
      const flag =
        (ranked.task as any).recurring === true ||
        (ranked.task as any).recurrence === true;
      return tagHit || flag;
    };

    const recurringMode = input.recurringMode ?? 'exclude';
    const filteredTasks = tasks.filter((t) => {
      if (recurringMode === 'include') return true;
      const recurring = isRecurringTask(t);
      if (recurringMode === 'only') return recurring;
      // exclude
      return !recurring;
    });

    const adjustForMoney = (ranked: RankedTask): RankedTask => {
      if (!moneyLow) return ranked;
      const tags = ranked.task.tags || [];
      const financeTags = ['finance', 'money', 'revenue', 'invoice', 'billing'];
      const hasFinanceTag = tags.some((t) =>
        financeTags.includes(t.toLowerCase())
      );
      if (!hasFinanceTag) return ranked;
      return {
        ...ranked,
        score: ranked.score * 1.5,
        scoreBreakdown: {
          ...(ranked.scoreBreakdown || {}),
          moneyBoost: 1.5,
        },
      };
    };

    const adjustedTasks = filteredTasks
      .map(adjustForMoney)
      .sort((a, b) => b.score - a.score);

    const tasksMap: Record<string, number> = {};
    for (const ranked of filteredTasks) {
      const id = ranked.task.id;
      if (id) {
        tasksMap[id] = (tasksMap[id] || 0) + 1;
      }
    }

    const validationMap = new Map<
      string,
      { valid: boolean; reason?: string; issues?: any[]; warnings?: string[] }
    >();

    for (const ranked of filteredTasks) {
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

      const result = deps.codValidator.validateTask(
        normalizeTaskState(taskState),
        { goalsMap, tasksMap },
        { profile }
      );
      const verdict = result.status ?? result.state;
      validationMap.set(ranked.task.id, {
        valid: verdict === 'PASS' || verdict === 'WARN',
        reason: verdict === 'FAIL' ? result.reason : undefined,
        issues: result.issues,
        warnings: result.warnings,
      });
    }

    // Authority enforcement: filter out human-only tasks for non-human callers
    const callerAuthority: CallerAuthority = input.callerAuthority ?? 'human';
    const authorityExcluded: RankedTask[] = [];

    const authorityFilteredTasks = adjustedTasks.filter((ranked) => {
      if (callerAuthority === 'human') {
        return true; // Humans see all tasks
      }

      const authorityConfig = extractAuthorityConfig({
        delegation_mode: ranked.task.delegation_mode,
        delegatable: ranked.task.delegatable,
        human_only: ranked.task.human_only,
        ai_token_budget: ranked.task.ai_token_budget,
        ai_time_budget_min: ranked.task.ai_time_budget_min,
        tags: ranked.task.tags ?? [],
      });

      const inclusion = canIncludeInAgentSession(authorityConfig);
      if (!inclusion.includable) {
        authorityExcluded.push(ranked);
        return false;
      }
      return true;
    });

    const unblocked = authorityFilteredTasks.filter(
      (t) => !t.blocked && validationMap.get(t.task.id)?.valid
    );
    const blocked = authorityFilteredTasks.filter((t) => t.blocked);
    const failed = authorityFilteredTasks.filter((t) => {
      const validation = validationMap.get(t.task.id);
      return validation && !validation.valid;
    });

    const rescueActions = computeRescueActions(authorityFilteredTasks, {
      startabilityThreshold: 0.6,
      energy: humanState.snapshot.energy,
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
    if (rescueActions.length > 0) {
      text += `- **Rescue actions suggested:** ${rescueActions.length}\n`;
    }
    if (authorityExcluded.length > 0) {
      text += `- **Human-only (excluded):** ${authorityExcluded.length}\n`;
    }
    text += `- **Total:** ${filteredTasks.length}\n`;
    text += `- **Caller authority:** ${callerAuthority}\n\n`;

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
    const ageText = humanState.ageHours?.toFixed(1) ?? 'unknown';
    text += `- **Age (hours):** ${ageText}\n`;
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
        const validation = validationMap.get(ranked.task.id);
        const reason = validation?.reason || 'Unknown issue';
        const issues = validation?.issues;
        text += `- **${ranked.task.title}** (\`${ranked.task.id}\`)\n`;
        text += `  Issue: ${reason}\n`;
        if (issues && issues.length > 0) {
          for (const issue of issues) {
            const code = issue.code || 'UNKNOWN';
            const hint = issue.fixHint || issue.suggestion || '';
            text += `    - [${code}] ${issue.message}`;
            if (hint) text += ` — Fix: ${hint}`;
            text += `\n`;
          }
        }
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

    if (rescueActions.length > 0) {
      text += `## Rescue Actions (quick wins)\n\n`;
      for (const task of rescueActions) {
        text += `- **${task.title}** (\`${task.id}\`)\n`;
      }
      text += `\n`;
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
          avatar: humanState.avatar,
          avatarStatus: humanState.avatarStatus,
          avatarWarnings: humanState.avatarWarnings,
          avatarPath: humanState.avatarPath,
          world: humanState.world,
          worldStatus: humanState.worldStatus,
          worldWarnings: humanState.worldWarnings,
          worldPath: humanState.worldPath,
          snapshot: humanState.snapshot,
        },
        rescueActions,
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

  // Fallback (should be unreachable)
  return {
    content: [
      {
        type: 'text',
        text: '❌ task_next_actions hit an unexpected fallback with no result. This is a bug.',
      },
    ],
    isError: true,
  };
}
