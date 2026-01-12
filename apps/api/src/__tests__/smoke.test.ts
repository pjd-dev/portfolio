import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { toolsRoutes, registerTools } from '../routes/tools.js';
import { notesRoutes, tasksRoutes } from '../routes/convenience.js';
import { healthRoutes } from '../routes/health.js';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

/**
 * Lightweight in-process smoke test using Fastify.inject.
 * Avoids network and external MCP dependencies by stubbing tools.
 */
describe('API Service Smoke Test', () => {
  let app: FastifyInstance;
  let vaultRoot: string;

  beforeAll(async () => {
    // Create temp vault with one note and one task
    vaultRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'api-smoke-vault-'));
    await fs.mkdir(path.join(vaultRoot, 'notes'));
    await fs.mkdir(path.join(vaultRoot, 'tasks'));
    await fs.writeFile(
      path.join(vaultRoot, 'notes', 'sample.md'),
      `---\ntitle: Sample Note\ntype: note\n---\nHello from smoke test.`
    );
    await fs.writeFile(
      path.join(vaultRoot, 'tasks', 'sample-task.md'),
      `---\ntitle: Sample Task\ntype: task\nstatus: todo\npriority: 5\n---\nDo something.`
    );
    process.env.VAULT_ROOT = vaultRoot;
    process.env.VAULT_PATH = vaultRoot;

    app = Fastify({ logger: false });
    await app.register(cors, { origin: true });

    // Stub tool registry
    registerTools([
      {
        name: 'obsidian_list_notes',
        llmInput: {
          title: 'List Notes',
          description: 'Stub list notes',
          inputSchema: {},
        },
        cb: async () => ({ structuredContent: { notes: ['notes/sample.md'] } }),
      },
      {
        name: 'obsidian_list_tasks',
        llmInput: {
          title: 'List Tasks',
          description: 'Stub list tasks',
          inputSchema: {},
        },
        cb: async () => ({
          structuredContent: {
            tasks: [{ path: 'tasks/sample.md', status: 'todo', priority: 5 }],
          },
        }),
      },
    ]);

    await app.register(healthRoutes);
    await app.register(toolsRoutes, { prefix: '/api/v1' });
    await app.register(notesRoutes, { prefix: '/api/v1' });
    await app.register(tasksRoutes, { prefix: '/api/v1' });
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
    if (vaultRoot) {
      await fs.rm(vaultRoot, { recursive: true, force: true }).catch(() => {});
    }
  });

  it('should respond to health check', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    const data = response.json() as { status: string; service: string };
    expect(data.status).toBe('ok');
    expect(data.service).toBe('vault-api');
  });

  it('should list available tools', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/tools' });
    expect(response.statusCode).toBe(200);
    const data = response.json() as { tools: unknown[]; count: number };
    expect(data.tools).toBeInstanceOf(Array);
    expect(data.count).toBeGreaterThan(0);
  });

  it('should get tool info', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/tools/obsidian_list_notes',
    });
    expect(response.statusCode).toBe(200);
    const data = response.json() as {
      name: string;
      title?: string;
      description?: string;
    };
    expect(data.name).toBe('obsidian_list_notes');
    expect(data.title).toBeDefined();
    expect(data.description).toBeDefined();
  });

  it('should execute a tool', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/tools/obsidian_list_notes/execute',
      payload: { pattern: '**/*.md' },
    });
    expect(response.statusCode).toBe(200);
    const data = response.json() as {
      success: boolean;
      tool: string;
      result: unknown;
    };
    expect(data.success).toBe(true);
    expect(data.tool).toBe('obsidian_list_notes');
    expect(data.result).toBeDefined();
  });

  it('should list notes via convenience route', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/notes' });
    expect(response.statusCode).toBe(200);
    const data = response.json();
    expect(data).toBeDefined();
  });

  it('should list tasks via convenience route', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/tasks' });
    expect(response.statusCode).toBe(200);
    const data = response.json();
    expect(data).toBeDefined();
  });
});
