import type { FastifyInstance } from 'fastify';
import path from 'node:path';
import fs from 'fs-extra';
import { VAULT_ROOT } from '@vault/common';

type SchedulerMode = 'simulate' | 'apply';

type SchedulerConfig = {
  enabled: boolean;
  tz: string;
  mode: SchedulerMode;
  allowlist: Set<string>;
  stateDir: string;
};

type SchedulerJob = {
  id: string;
  pipeline: string;
  cron?: string;
  intervalSec?: number;
  mode?: SchedulerMode;
  maxRuntimeSec: number;
  lockTtlSec: number;
  idempotencyKey?: string;
};

function loadSchedulerConfigFromEnv(): SchedulerConfig {
  const enabled = process.env.VAULTY_SCHED_ENABLED === '1';
  const mode =
    (process.env.VAULTY_SCHED_MODE as SchedulerMode | undefined) || 'simulate';
  const tz = process.env.VAULTY_SCHED_TZ || 'Europe/Paris';
  const allow = (process.env.VAULTY_SCHED_ALLOWLIST || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    enabled,
    tz,
    mode,
    allowlist: new Set(allow),
    stateDir:
      process.env.VAULTY_SCHED_STATE_DIR ||
      path.join(VAULT_ROOT, '.vaulty', 'scheduler'),
  };
}

function loadJobsFromEnv(config: SchedulerConfig): SchedulerJob[] {
  const jobsById = new Map<string, Partial<SchedulerJob>>();
  const prefix = 'VAULTY_SCHED_JOB__';

  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith(prefix)) continue;
    const parts = key.slice(prefix.length).split('__');
    if (parts.length < 2) continue;
    const [jobId, field] = parts;
    const job = jobsById.get(jobId) || { id: jobId };

    switch (field) {
      case 'PIPELINE':
        job.pipeline = value;
        break;
      case 'CRON':
        job.cron = value;
        break;
      case 'INTERVAL_SEC':
        job.intervalSec = Number(value);
        break;
      case 'MODE':
        job.mode = value as SchedulerMode;
        break;
      case 'MAX_RUNTIME_SEC':
        job.maxRuntimeSec = Number(value);
        break;
      case 'LOCK_TTL_SEC':
        job.lockTtlSec = Number(value);
        break;
      case 'IDEMPOTENCY_KEY':
        job.idempotencyKey = value;
        break;
      default:
        break;
    }

    jobsById.set(jobId, job);
  }

  const jobs: SchedulerJob[] = [];
  for (const job of jobsById.values()) {
    if (!job.pipeline) continue;
    if (!!job.cron === !!job.intervalSec) continue;
    if (!config.allowlist.has(job.pipeline)) continue;
    jobs.push({
      id: job.id!,
      pipeline: job.pipeline,
      cron: job.cron,
      intervalSec: job.intervalSec,
      mode: job.mode,
      maxRuntimeSec: job.maxRuntimeSec ?? 900,
      lockTtlSec: job.lockTtlSec ?? (job.maxRuntimeSec ?? 900) + 60,
      idempotencyKey: job.idempotencyKey,
    });
  }

  return jobs;
}

async function readLastRuns(stateDir: string): Promise<Record<string, any>> {
  const indexFile = path.join(stateDir, 'last-runs.json');
  if (await fs.pathExists(indexFile)) {
    try {
      return await fs.readJSON(indexFile);
    } catch {
      return {};
    }
  }
  return {};
}

export async function schedulerRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/scheduler/status', async () => {
    const cfg = loadSchedulerConfigFromEnv();
    const jobs = loadJobsFromEnv(cfg);
    const lastRuns = await readLastRuns(cfg.stateDir);

    return {
      enabled: cfg.enabled,
      mode: cfg.mode,
      tz: cfg.tz,
      allowlist: Array.from(cfg.allowlist),
      jobs: jobs.map((j) => ({
        id: j.id,
        pipeline: j.pipeline,
        cron: j.cron,
        intervalSec: j.intervalSec,
        mode: j.mode ?? cfg.mode,
        maxRuntimeSec: j.maxRuntimeSec,
        lockTtlSec: j.lockTtlSec,
        idempotencyKey: j.idempotencyKey,
        lastRun: lastRuns[j.id] || null,
      })),
    };
  });
}
