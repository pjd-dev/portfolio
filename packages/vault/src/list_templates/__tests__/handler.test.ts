import { describe, expect, it } from 'vitest';
import { handler } from '../handler.js';
import { inputSchema } from '../schema.js';

describe('list_templates handler', () => {
  const templates = [
    {
      name: 'daily',
      category: 'notes',
      path: 'templates/daily.md',
      description: 'Daily note',
      tags: ['daily'],
    },
    {
      name: 'task',
      category: 'tasks',
      path: 'templates/task.md',
    },
  ];

  it('lists templates and supports category filtering', async () => {
    const deps = {
      templateDiscoveryService: {
        discoverTemplates: async () => templates,
      },
    };

    const result = await handler(
      { category: 'tasks', forceRefresh: false },
      deps
    );

    expect(result.structuredContent.total).toBe(1);
    expect(result.structuredContent.templates[0].name).toBe('task');
    expect(result.content[0]?.text).toContain('Found 1 template(s)');
  });

  it('is deterministic for identical inputs', async () => {
    const deps = {
      templateDiscoveryService: {
        discoverTemplates: async () => templates,
      },
    };

    const first = await handler({ forceRefresh: false }, deps);
    const second = await handler({ forceRefresh: false }, deps);

    expect(first).toEqual(second);
  });

  it('rejects invalid forceRefresh in schema validation', () => {
    const result = inputSchema.safeParse({ forceRefresh: 'nope' });
    expect(result.success).toBe(false);
  });
});
