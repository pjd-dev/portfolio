import type { McpToolDef } from '@vault/mcp-core';
import {
  createTaskNextActionsTool,
  type TaskNextActionsDeps,
} from './task_next_actions/index.js';
import {
  createPlanSessionTool,
  type PlanSessionDeps,
} from './plan_session/index.js';

export type CodToolsDeps = {
  taskNextActions: TaskNextActionsDeps;
  planSession: PlanSessionDeps;
};

export const createCodTools = (deps: CodToolsDeps): McpToolDef[] => [
  createTaskNextActionsTool(deps.taskNextActions),
  createPlanSessionTool(deps.planSession),
];

export default createCodTools;
export { createTaskNextActionsTool, createPlanSessionTool };
