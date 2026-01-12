#!/usr/bin/env node
/**
 * Auto-claim earned rewards:
 * - For each task, call obsidian_get_available_rewards (MCP/API) to find earned milestones.
 * - Log a history entry for each newly-claimed reward.
 * - Apply avatar/world patches from config/reward-effects.json.
 * - Idempotent: skips rewards already marked as claimed in history.
 * - Supports --dry-run.
 *
 * Requirements:
 * - API_BASE: base URL for Tasker API (e.g., http://localhost:4200)
 * - AUTH_HEADER (optional): JSON string of headers to include (e.g., {"Authorization":"Bearer ..."})
 * - VAULT_PATH: vault root (used only for logging paths)
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_EFFECTS_PATH = path.resolve('config/reward-effects.json');

const parseArgs = (argv) => {
  const args = {
    apiBase: process.env.API_BASE || 'http://localhost:4200',
    effectsPath: DEFAULT_EFFECTS_PATH,
    dryRun: false,
    tasks: [],
    headers: {},
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--api') args.apiBase = argv[i + 1] ?? args.apiBase;
    if (arg === '--effects') args.effectsPath = argv[i + 1] ?? args.effectsPath;
    if (arg === '--dry-run') args.dryRun = true;
    if (arg === '--task') args.tasks.push(argv[i + 1]);
    if (arg === '--all') args.tasks.push('*');
    if (arg === '--headers') {
      try {
        args.headers = JSON.parse(argv[i + 1] ?? '{}');
      } catch {
        args.headers = {};
      }
    }
  }
  return args;
};

const loadEffects = async (effectsPath) => {
  try {
    const raw = await fs.readFile(effectsPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { default: { avatarPatch: {}, worldPatch: {} } };
  }
};

const defaultHeaders = (extra = {}) => ({
  'Content-Type': 'application/json',
  ...extra,
});

const postTool = async (apiBase, tool, input, headers = {}) => {
  const res = await fetch(`${apiBase}/api/v1/tools/${tool}/execute`, {
    method: 'POST',
    headers: defaultHeaders(headers),
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tool ${tool} failed: ${res.status} ${text}`);
  }
  return res.json();
};

const claimReward = async ({
  apiBase,
  taskPath,
  reward,
  effects,
  dryRun,
  headers,
}) => {
  const effect = effects[reward.id] || effects.default || {};
  const lines = [`Claiming ${reward.id} @ ${taskPath}`, `- ${reward.content}`];
  if (effect.avatarPatch && Object.keys(effect.avatarPatch).length) {
    lines.push(`- avatarPatch: ${JSON.stringify(effect.avatarPatch)}`);
  }
  if (effect.worldPatch && Object.keys(effect.worldPatch).length) {
    lines.push(`- worldPatch: ${JSON.stringify(effect.worldPatch)}`);
  }

  if (dryRun) {
    console.log('[dry-run]', lines.join('\n'));
    return;
  }

  // Log history on the task
  await postTool(apiBase, 'obsidian_append_note', {
    path: taskPath,
    content: `\n- 🎁 Claimed reward ${reward.id || reward.content} (milestone ${reward.milestone ?? 'n/a'}%)`,
  }, headers);

  // Apply avatar patch
  if (effect.avatarPatch && Object.keys(effect.avatarPatch).length) {
    await postTool(apiBase, 'obsidian_update_avatar_state', {
      patch: effect.avatarPatch,
    }, headers);
  }

  // Apply world patch
  if (effect.worldPatch && Object.keys(effect.worldPatch).length) {
    await postTool(apiBase, 'obsidian_update_world_state', {
      patch: effect.worldPatch,
    }, headers);
  }

  console.log(lines.join('\n'));
};

const alreadyClaimed = (history = [], rewardId) =>
  history.some((entry) => entry.note && entry.note.includes(`Claimed reward ${rewardId}`));

const fetchAllTasks = async (apiBase, headers = {}) => {
  const res = await fetch(`${apiBase}/api/v1/tasks`, {
    method: 'GET',
    headers: defaultHeaders(headers),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET /api/v1/tasks failed: ${res.status} ${text}`);
  }
  const body = await res.json();
  const tasks = body?.structuredContent?.tasks || body?.tasks || [];
  return tasks.map((t) => t.path).filter(Boolean);
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const effects = await loadEffects(args.effectsPath);
  const headers = args.headers;

  let tasksToCheck = args.tasks.length > 0 ? args.tasks : [];

  if (tasksToCheck.includes('*')) {
    try {
      const allTaskPaths = await fetchAllTasks(args.apiBase, headers);
      tasksToCheck = allTaskPaths;
      console.log(`Fetched ${allTaskPaths.length} tasks from API.`);
    } catch (err) {
      console.error('Failed to fetch tasks for --all:', err.message);
      process.exit(1);
    }
  }

  if (tasksToCheck.length === 0) {
    console.log('No tasks specified. Pass --task <path> ... or --all');
    process.exit(0);
  }

  for (const taskPath of tasksToCheck) {
    try {
      const rewardsResp = await postTool(
        args.apiBase,
        'obsidian_get_available_rewards',
        { taskPath },
        headers
      );
      const available = rewardsResp?.structuredContent?.available || [];

      // Fetch history to avoid double-claim
      const historyResp = await postTool(
        args.apiBase,
        'obsidian_get_task_history',
        { taskPath },
        headers
      );
      const history = historyResp?.structuredContent || [];

      for (const reward of available) {
        const rid = reward.id || reward.content;
        if (alreadyClaimed(history, rid)) continue;
        await claimReward({
          apiBase: args.apiBase,
          taskPath,
          reward,
          effects,
          dryRun: args.dryRun,
          headers,
        });
      }
    } catch (err) {
      console.error(`Error processing ${taskPath}:`, err.message);
      if (!args.dryRun) process.exitCode = 1;
    }
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
