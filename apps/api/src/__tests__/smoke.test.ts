import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, type ChildProcess } from 'child_process';

describe('API Service Smoke Test', () => {
  let apiProcess: ChildProcess;
  const API_PORT = process.env.TEST_API_PORT || 4201; // Use different port for tests
  const API_URL = `http://localhost:${API_PORT}`;

  beforeAll(async () => {
    // Set test environment
    process.env.PORT = String(API_PORT);
    process.env.NODE_ENV = 'test';
    process.env.VAULT_ROOT = process.env.VAULT_ROOT || '/tmp/test-vault';
    process.env.AUTH_ENABLED = 'false';

    // Start API server in background
    apiProcess = spawn('pnpm', ['start'], {
      cwd: __dirname,
      env: process.env,
      stdio: 'ignore',
    });

    // Wait for server to start
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }, 10000);

  afterAll(() => {
    if (apiProcess) {
      apiProcess.kill();
    }
  });

  it('should respond to health check', async () => {
    const response = await fetch(`${API_URL}/health`);
    expect(response.status).toBe(200);

    const data = (await response.json()) as { status: string; service: string };
    expect(data.status).toBe('ok');
    expect(data.service).toBe('vault-api');
  });

  it('should list available tools', async () => {
    const response = await fetch(`${API_URL}/api/v1/tools`);
    expect(response.status).toBe(200);

    const data = (await response.json()) as { tools: unknown[]; count: number };
    expect(data.tools).toBeInstanceOf(Array);
    expect(data.count).toBeGreaterThan(0);
  });

  it('should get tool info', async () => {
    const response = await fetch(`${API_URL}/api/v1/tools/obsidian_list_notes`);
    expect(response.status).toBe(200);

    const data = (await response.json()) as {
      name: string;
      title?: string;
      description?: string;
    };
    expect(data.name).toBe('obsidian_list_notes');
    expect(data.title).toBeDefined();
    expect(data.description).toBeDefined();
  });

  it('should execute a tool', async () => {
    const response = await fetch(
      `${API_URL}/api/v1/tools/obsidian_list_notes/execute`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern: '**/*.md' }),
      }
    );

    expect(response.status).toBe(200);

    const data = (await response.json()) as {
      success: boolean;
      tool: string;
      result: unknown;
    };
    expect(data.success).toBe(true);
    expect(data.tool).toBe('obsidian_list_notes');
    expect(data.result).toBeDefined();
  });

  it('should list notes via convenience route', async () => {
    const response = await fetch(`${API_URL}/api/v1/notes`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toBeDefined();
  });

  it('should list tasks via convenience route', async () => {
    const response = await fetch(`${API_URL}/api/v1/tasks`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toBeDefined();
  });
});
