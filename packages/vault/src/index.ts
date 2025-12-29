import type { McpToolDef } from '@vault/mcp-core';
import {
  createListTemplatesTool,
  type ListTemplatesDeps,
} from './list_templates/index.js';
import {
  createListPipelinesTool,
  type ListPipelinesDeps,
} from './list_pipelines/index.js';

export type VaultToolsDeps = {
  listTemplates: ListTemplatesDeps;
  listPipelines: ListPipelinesDeps;
};

export const createVaultTools = (deps: VaultToolsDeps): McpToolDef[] => [
  createListTemplatesTool(deps.listTemplates),
  createListPipelinesTool(deps.listPipelines),
];

export default createVaultTools;
export { createListTemplatesTool, createListPipelinesTool };
