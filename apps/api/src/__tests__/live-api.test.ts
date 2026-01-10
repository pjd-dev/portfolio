import { beforeAll, describe, expect, it } from 'vitest';

// Live integration smoke tests against a running API.
// Configure the target with API_BASE_URL (default: http://127.0.0.1:4300).
const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:4300';

let apiAvailable = false;

async function fetchJson(path: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { accept: 'application/json' },
  });
  expect(res.ok).toBe(true);
  return res.json();
}

beforeAll(async () => {
  try {
    await fetchJson('/health');
    apiAvailable = true;
  } catch (err) {
    // Leave apiAvailable false; tests will be skipped to avoid network failures in sandboxed envs.
  }
}, 10_000);

describe('live API smoke', () => {
  it.skipIf(!apiAvailable)('health endpoint responds', async () => {
    const body = await fetchJson('/health');
    expect(body).toHaveProperty('status');
  });

  it.skipIf(!apiAvailable)('lists tasks', async () => {
    const body: any = await fetchJson('/api/v1/tasks');
    const tasks = body?.structuredContent?.tasks ?? body?.tasks;
    expect(Array.isArray(tasks)).toBe(true);
  });

  it.skipIf(!apiAvailable)('COD status available', async () => {
    const body: any = await fetchJson('/api/v1/cod/status');
    expect(body).toHaveProperty('structuredContent');
  });

  it.skipIf(!apiAvailable)('graph search returns results array', async () => {
    const res: any = await fetchJson('/api/v1/graph/search?query=task&limit=5');
    const results = res?.structuredContent?.results ?? res?.results;
    expect(Array.isArray(results)).toBe(true);
  });
});
