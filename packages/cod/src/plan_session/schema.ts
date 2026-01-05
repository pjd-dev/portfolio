import { z } from 'zod';

export const inputSchema = z.object({
  durationMinutes: z
    .number()
    .describe('Session duration in minutes (e.g., 45, 90, 120)'),
  maxFocusCost: z
    .number()
    .optional()
    .describe(
      'Maximum focus cost per task (e.g., 3 for low focus, 5 for high focus)'
    ),
  projectId: z.string().optional().describe('Filter tasks to specific project'),
  tags: z.array(z.string()).optional().describe('Filter tasks by tags'),
  maxTasks: z
    .number()
    .optional()
    .describe('Maximum number of tasks to include'),
});

const sessionTaskSchema = z.object({
  taskId: z.string(),
  title: z.string(),
  path: z.string(),
  estimatedEffort: z.number(),
  reward: z.number().optional(),
  focusCost: z.number().optional(),
  status: z.string(),
});

const sessionSchema = z.object({
  id: z.string(),
  status: z.string(),
  params: z.object({
    durationMinutes: z.number(),
    maxFocusCost: z.number().optional(),
    projectId: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
  totals: z.object({
    plannedTasks: z.number(),
    plannedEffort: z.number(),
    plannedReward: z.number(),
  }),
  tasks: z.array(sessionTaskSchema),
});

const goalContextSchema = z.object({
  source: z.string(),
  count: z.number(),
  primaryGoalId: z.string().optional(),
  warnings: z.array(z.string()),
});

const humanStateSchema = z.object({
  status: z.string(),
  warnings: z.array(z.string()),
  recommendedMode: z.string(),
  durationCapMin: z.number(),
  ageHours: z.number().optional(),
  worldSignalsUsed: z.array(z.string()).optional(),
  snapshot: z.object({
    source: z.string(),
    energy: z.number(),
    focusCapacity: z.string(),
    stress: z.number(),
    sleepDebt: z.number(),
    timeAvailableMin: z.number(),
    contextTolerance: z.string().optional(),
    healthBand: z.string().optional(),
    runwayBand: z.string().optional(),
  }),
});

const validationIssueSchema = z.object({
  code: z.string(),
  message: z.string(),
  suggestion: z.string().optional(),
});

export const outputSchema = z
  .object({
    session: sessionSchema.optional(),
    noTasksAvailable: z.boolean().optional(),
    goalContext: goalContextSchema.optional(),
    humanState: humanStateSchema.optional(),
    blockingReasons: z.array(z.string()).optional(),
    validationState: z.string().optional(),
    issues: z.array(validationIssueSchema).optional(),
    reason: z.string().optional(),
  })
  .passthrough();

type ToolContent = { type: 'text'; text: string };

export type PlanSessionInput = z.infer<typeof inputSchema>;
export type PlanSessionStructuredContent = z.infer<typeof outputSchema>;
export type PlanSessionOutput = {
  content: ToolContent[];
  structuredContent?: PlanSessionStructuredContent;
  isError?: boolean;
};
