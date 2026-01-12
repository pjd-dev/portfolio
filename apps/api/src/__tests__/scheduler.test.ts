import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

/**
 * Validates scheduler status route using env-driven config.
 */
describe('scheduler routes', () => {
  let app: FastifyInstance;
  let vaultRoot: string;
  let schedulerRoutes: (fastify: FastifyInstance) => Promise<void>;
  const originalEnv = { ...process.env };

  beforeAll(async () => {
    vaultRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'api-scheduler-'));
    process.env.VAULT_ROOT = vaultRoot;
    process.env.VAULT_PATH = vaultRoot;
    process.env.VAULTY_SCHED_ENABLED = '1';
    process.env.VAULTY_SCHED_MODE = 'apply';
    process.env.VAULTY_SCHED_TZ = 'UTC';
    process.env.VAULTY_SCHED_ALLOWLIST = 'nightly-index,weekly-audit';
    process.env.VAULTY_SCHED_STATE_DIR = path.join(
      vaultRoot,
      '.vaulty',
      'scheduler'
    );
    process.env.VAULTY_SCHED_JOB__nightly__PIPELINE = 'nightly-index';
    process.env.VAULTY_SCHED_JOB__nightly__CRON = '0 2 * * *';
    process.env.VAULTY_SCHED_JOB__nightly__MAX_RUNTIME_SEC = '600';
    process.env.VAULTY_SCHED_JOB__weekly__PIPELINE = 'weekly-audit';
    process.env.VAULTY_SCHED_JOB__weekly__INTERVAL_SEC = '604800';

    // Import after env is set so VAULT_PATH/ROOT are available
    ({ schedulerRoutes } = await import('../routes/scheduler.js'));

    app = Fastify({ logger: false });
    await app.register(schedulerRoutes, { prefix: '/api/v1' });
    await app.ready();
  });

  afterAll(async () => {
    process.env = originalEnv;
    if (app) await app.close();
    if (vaultRoot) {
      await fs.rm(vaultRoot, { recursive: true, force: true }).catch(() => {});
    }
  });

  it('returns scheduler status with jobs and allowlist', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/scheduler/status',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      enabled: boolean;
      mode: string;
      allowlist: string[];
      jobs: Array<{
        id: string;
        pipeline: string;
        cron?: string;
        intervalSec?: number;
        mode?: string;
      }>;
    };

    expect(body.enabled).toBe(true);
    expect(body.mode).toBe('apply');
    expect(body.allowlist).toEqual(['nightly-index', 'weekly-audit']);
    expect(body.jobs).toHaveLength(2);

    const nightly = body.jobs.find((j) => j.id === 'nightly');
    expect(nightly?.pipeline).toBe('nightly-index');
    expect(nightly?.cron).toBe('0 2 * * *');
    expect(nightly?.intervalSec).toBeUndefined();

    const weekly = body.jobs.find((j) => j.id === 'weekly');
    expect(weekly?.pipeline).toBe('weekly-audit');
    expect(weekly?.intervalSec).toBe(604800);
    expect(weekly?.cron).toBeUndefined();
  });
});
