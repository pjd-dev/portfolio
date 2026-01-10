import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import { toolsRoutes, registerTools } from '../routes/tools.js';
import { pipelinesRoutes } from '../routes/pipelines.js';
import { loadMcpTools } from '../tools/loader.js';

describe('API server bootstrap', () => {
  it('tool registry rejects duplicate tool names', async () => {
    const tools = await loadMcpTools();
    const names = tools.map((t) => t.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it('registers routes without duplicate /pipelines POST', async () => {
    const app = Fastify({ logger: false });
    const tools = await loadMcpTools();
    registerTools(tools);
    await app.register(toolsRoutes, { prefix: '/api/v1' });
    await app.register(pipelinesRoutes, { prefix: '/api/v1' });
    await app.ready();
    await app.close();
    expect(true).toBe(true); // if we reached here, no duplicate route error
  });
});
