import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { pipelinesRoutes } from '../routes/pipelines.js';
import { toolsRoutes } from '../routes/tools.js';

/**
 * Fastify.inject tests for the pipelines routes.
 * Uses a temporary vault root to avoid touching real vault data.
 */
describe('pipelines routes', () => {
  let app: FastifyInstance;
  let vaultRoot: string;

  beforeAll(async () => {
    vaultRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'api-pipelines-'));
    process.env.VAULT_ROOT = vaultRoot;
    process.env.VAULT_PATH = vaultRoot;

    app = Fastify({ logger: false });
    await app.register(pipelinesRoutes, { prefix: '/api/v1' });
    await app.ready();
  });

  beforeEach(async () => {
    // Clean pipelines between tests
    await fs
      .rm(path.join(vaultRoot, '.vaulty'), { recursive: true, force: true })
      .catch(() => {});
  });

  afterAll(async () => {
    if (app) await app.close();
    if (vaultRoot) {
      await fs.rm(vaultRoot, { recursive: true, force: true }).catch(() => {});
    }
  });

  it('returns an empty list when no pipelines exist', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/pipelines' });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { pipelines: string[] };
    expect(body.pipelines).toEqual([]);
  });

  it('rejects bad payloads', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/pipelines',
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it('creates, lists, and reads a pipeline', async () => {
    const pipeline = {
      name: 'demo',
      steps: [
        {
          type: 'patch',
          operations: [{ type: 'insert', line: 1, replacement: '# Demo\n' }],
        },
      ],
    };

    const createRes = await app.inject({
      method: 'POST',
      url: '/api/v1/pipelines',
      payload: { name: 'demo', pipeline },
    });
    expect(createRes.statusCode).toBe(200);
    const created = createRes.json() as { success: boolean; name: string };
    expect(created.success).toBe(true);
    expect(created.name).toBe('demo');

    const listRes = await app.inject({
      method: 'GET',
      url: '/api/v1/pipelines',
    });
    const listBody = listRes.json() as { pipelines: string[] };
    expect(listBody.pipelines).toContain('demo');

    const readRes = await app.inject({
      method: 'GET',
      url: '/api/v1/pipelines/demo',
    });
    expect(readRes.statusCode).toBe(200);
    const readBody = readRes.json() as { name: string; pipeline: any };
    expect(readBody.name).toBe('demo');
    expect(readBody.pipeline.steps).toHaveLength(1);
    expect(readBody.pipeline.options).toEqual({
      stopOnError: false,
      previewMode: true,
    });
  });

  it('returns 404 for missing pipeline', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/pipelines/not-here',
    });
    expect(res.statusCode).toBe(404);
  });

  it('returns validation error for invalid step type', async () => {
    const badPipeline = { steps: [{ type: 'unknown' }] };
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/pipelines',
      payload: { name: 'bad', pipeline: badPipeline },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json() as { message?: string };
    expect(body.message).toContain('unknown type');
  });

  it('returns validation error when steps are missing', async () => {
    const badPipeline = { name: 'no-steps' };
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/pipelines',
      payload: { name: 'no-steps', pipeline: badPipeline },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json() as { message?: string };
    expect(body.message).toContain('Pipeline.steps must be an array');
  });

  it('validates move steps require from/to', async () => {
    const badPipeline = { steps: [{ type: 'move', from: 'a.md' }] };
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/pipelines',
      payload: { name: 'bad-move', pipeline: badPipeline },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json() as { message?: string };
    expect(body.message).toContain('requires from and to');
  });

  it('creates via tools route and reads via pipelines route (cross-route)', async () => {
    const app2 = Fastify({ logger: false });
    await app2.register(toolsRoutes, { prefix: '/api/v1/tools' });
    // Register pipelines routes under a different prefix to avoid route collisions with tools helper
    await app2.register(pipelinesRoutes, { prefix: '/api/v1/pipes' });
    await app2.ready();

    const pipeline = { steps: [{ type: 'autoLink', path: 'notes' }] };
    const createRes = await app2.inject({
      method: 'POST',
      url: '/api/v1/tools/pipelines',
      payload: { name: 'via-tools', pipeline },
    });
    expect(createRes.statusCode).toBe(200);

    const readRes = await app2.inject({
      method: 'GET',
      url: '/api/v1/pipes/pipelines/via-tools',
    });
    expect(readRes.statusCode).toBe(200);
    const readBody = readRes.json() as { pipeline: any };
    expect(readBody.pipeline.steps).toHaveLength(1);
    expect(readBody.pipeline.steps[0].type).toBe('autoLink');

    await app2.close();
  });
});
