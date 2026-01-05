import { z } from 'zod';

const TaskStatusEnum = z.enum([
  'todo',
  'in_progress',
  'done',
  'blocked',
  'dropped',
]);

export const inputSchema = z.object({
  projectId: z.string().optional().describe('Filter by project ID'),
  max: z.number().optional().describe('Maximum number of results'),
  maxEffort: z.number().optional().describe('Maximum effort level'),
  maxFocusCost: z.number().optional().describe('Maximum focus cost'),
  statusFilter: z
    .array(TaskStatusEnum)
    .optional()
    .describe("Status filter (default: ['todo', 'in_progress'])"),
});

const taskNodeSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: TaskStatusEnum,
  effort: z.number().optional(),
  reward: z.number().optional(),
  focusCost: z.number().optional(),
  projectId: z.string().optional(),
  goal: z.string().optional(),
  tags: z.array(z.string()).optional(),
  path: z.string(),
  dependencies: z.array(z.string()).optional(),
  blockers: z.array(z.string()).optional(),
});

const rankedTaskSchema = z.object({
  task: taskNodeSchema,
  blocked: z.boolean(),
  unmetDependencies: z.array(z.string()),
  score: z.number(),
  scoreBreakdown: z.unknown().optional(),
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
  worldSignalsUsed: z.array(z.string()),
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

export const outputSchema = z.object({
  unblocked: z.array(rankedTaskSchema),
  blocked: z.array(rankedTaskSchema),
  failed: z.array(rankedTaskSchema),
  total: z.number(),
  goalContext: goalContextSchema,
  humanState: humanStateSchema,
});

type ToolContent = { type: 'text'; text: string };

export type TaskNextActionsInput = z.infer<typeof inputSchema>;
export type TaskNextActionsStructuredContent = z.infer<typeof outputSchema>;
export type TaskNextActionsOutput = {
  content: ToolContent[];
  structuredContent?: TaskNextActionsStructuredContent;
  isError?: boolean;
};
