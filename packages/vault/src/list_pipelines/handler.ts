import type { ListPipelinesInput, ListPipelinesOutput } from './schema.js';

type PipelineSummary = {
  id: string;
  name?: string;
  steps: number;
  filesChanged: number;
};

export type ListPipelinesDeps = {
  pipelineService: {
    listActive: () => PipelineSummary[];
  };
};

export async function handler(
  _input: ListPipelinesInput,
  deps: ListPipelinesDeps
): Promise<ListPipelinesOutput> {
  const pipelines = deps.pipelineService.listActive();

  if (pipelines.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: 'No active pipelines. Run a simulation first with obsidian_run_pipeline_simulation.',
        },
      ],
    };
  }

  let text = `# Active Pipelines\n\n`;
  text += `Found ${pipelines.length} pipeline(s) ready to apply:\n\n`;

  for (const pipeline of pipelines) {
    text += `## ${pipeline.name || 'Unnamed Pipeline'}\n\n`;
    text += `- **ID:** \`${pipeline.id}\`\n`;
    text += `- **Steps:** ${pipeline.steps}\n`;
    text += `- **Files changed:** ${pipeline.filesChanged}\n\n`;
  }

  text += `\nUse \`obsidian_apply_pipeline\` with the pipeline ID to apply changes.`;

  return {
    content: [
      {
        type: 'text',
        text,
      },
    ],
    structuredContent: { pipelines },
  };
}
