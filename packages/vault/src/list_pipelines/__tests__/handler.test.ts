import { describe, expect, it } from 'vitest';
import { handler } from '../handler.js';
import { inputSchema } from '../schema.js';

describe('list_pipelines handler', () => {
  it('returns empty message when no pipelines are active', async () => {
    const deps = {
      pipelineService: {
        listActive: () => [],
      },
    };

    const result = await handler({}, deps);

    expect(result.content[0]?.text).toContain('No active pipelines');
  });

  it('lists active pipelines with summary', async () => {
    const deps = {
      pipelineService: {
        listActive: () => [
          { id: 'p1', name: 'Pipeline A', steps: 2, filesChanged: 1 },
        ],
      },
    };

    const result = await handler({}, deps);

    expect(result.structuredContent.pipelines).toHaveLength(1);
    expect(result.content[0]?.text).toContain('Active Pipelines');
  });

  it('is deterministic for identical inputs', async () => {
    const deps = {
      pipelineService: {
        listActive: () => [
          { id: 'p1', name: 'Pipeline A', steps: 2, filesChanged: 1 },
        ],
      },
    };

    const first = await handler({}, deps);
    const second = await handler({}, deps);

    expect(first).toEqual(second);
  });

  it('rejects non-object input in schema validation', () => {
    const result = inputSchema.safeParse(undefined);
    expect(result.success).toBe(false);
  });
});
