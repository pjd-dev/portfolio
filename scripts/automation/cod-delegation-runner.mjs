#!/usr/bin/env node
import fs from 'fs-extra';
import path from 'node:path';
import { glob } from 'glob';
import matter from 'gray-matter';
import { execSync } from 'node:child_process';

const DEFAULT_MAX = 2;
const DEFAULT_BRANCH_PREFIX = 'delegation/';

const parseArgs = (argv) => {
  const args = {
    max: DEFAULT_MAX,
    dryRun: false,
    createBranch: false,
    branchPrefix: DEFAULT_BRANCH_PREFIX,
    repoRoot: process.cwd(),
    vaultPath: process.env.VAULT_PATH,
    token: process.env.GITHUB_TOKEN,
    projectId: process.env.GITHUB_PROJECT_ID,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') args.dryRun = true;
    if (arg === '--create-branch') args.createBranch = true;
    if (arg === '--max') args.max = Number(argv[i + 1] ?? DEFAULT_MAX);
    if (arg === '--vault') args.vaultPath = argv[i + 1];
    if (arg === '--project-id') args.projectId = argv[i + 1];
    if (arg === '--token') args.token = argv[i + 1];
    if (arg === '--branch-prefix') args.branchPrefix = argv[i + 1];
    if (arg === '--repo-root') args.repoRoot = argv[i + 1];
  }

  args.max = Number.isFinite(args.max) ? Math.min(args.max, DEFAULT_MAX) : DEFAULT_MAX;
  return args;
};

const slugify = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);

const buildDraftBody = (task) => {
  const lines = [
    `Source: ${task.path}`,
    `Task ID: ${task.id ?? 'n/a'}`,
    `Status: ${task.status ?? 'unknown'}`,
    task.priority !== undefined ? `Priority: ${task.priority}` : null,
    task.effortScore !== undefined ? `Effort: ${task.effortScore}` : null,
    task.focusCost !== undefined ? `Focus: ${task.focusCost}` : null,
    '',
    task.description ?? '',
  ].filter(Boolean);

  return lines.join('\n');
};

const isEligibleTask = (task) => {
  const tags = Array.isArray(task.tags)
    ? task.tags.map((t) => String(t).toLowerCase())
    : [];
  const delegationValue = String(
    task.delegation ?? task.delegation_mode ?? ''
  ).toLowerCase();

  const delegationOk = [
    'agent',
    'agent+review',
    'agent-review',
    'agent_with_review',
  ].includes(delegationValue);
  const agentOk =
    tags.includes('agent-ok') ||
    task.agent_ok === true ||
    task.agentOk === true;
  const delegatable =
    task.delegatable === true ||
    tags.includes('delegatable') ||
    tags.includes('delegatable-with-review');

  const status = String(task.status ?? '').toLowerCase();
  const hasProjectItem = Boolean(task.projectItemId || task.projectItemUrl);

  return (
    !hasProjectItem &&
    status !== 'completed' &&
    (delegationOk || delegatable) &&
    (agentOk || delegatable)
  );
};

const graphqlRequest = async (token, query, variables) => {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  const payload = await response.json();
  if (!response.ok || payload.errors) {
    const message = payload.errors?.map((e) => e.message).join('; ');
    throw new Error(message || `GitHub API error (${response.status})`);
  }

  return payload.data;
};

const ensureBranch = (repoRoot, branchName) => {
  try {
    execSync(`git -C "${repoRoot}" rev-parse --verify ${branchName}`, {
      stdio: 'ignore',
    });
    return { created: false };
  } catch {
    execSync(`git -C "${repoRoot}" branch ${branchName}`, {
      stdio: 'ignore',
    });
    return { created: true };
  }
};

const main = async () => {
  const config = parseArgs(process.argv.slice(2));

  if (!config.vaultPath) {
    console.error('Missing VAULT_PATH (set env or pass --vault).');
    process.exit(1);
  }

  if (!config.dryRun && (!config.token || !config.projectId)) {
    console.error(
      'Missing GITHUB_TOKEN or GITHUB_PROJECT_ID (set env or pass --token/--project-id).'
    );
    process.exit(1);
  }

  const files = await glob('tasks/**/*.md', {
    cwd: config.vaultPath,
    nodir: true,
    ignore: [
      'tasks/archive/**',
      'tasks/fixture/**',
      'tasks/fixtures/**',
    ],
  });

  const tasks = [];
  for (const relPath of files) {
    const fullPath = path.join(config.vaultPath, relPath);
    const raw = await fs.readFile(fullPath, 'utf-8');
    const parsed = matter(raw);
    const data = parsed.data ?? {};
    if (data.type !== 'task') continue;
    tasks.push({
      ...data,
      path: relPath,
    });
  }

  const eligible = tasks
    .filter(isEligibleTask)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    .slice(0, config.max);

  if (eligible.length === 0) {
    console.log('No eligible tasks found.');
    return;
  }

  console.log(`Eligible tasks: ${eligible.length}`);

  let UpdateFrontmatterTool;
  if (!config.dryRun) {
    const toolModule = await import(
      '../../apps/mcp/src/mcp/obsidian/tools/update_frontmatter.js'
    );
    UpdateFrontmatterTool = toolModule.UpdateFrontmatterTool;
  }

  for (const task of eligible) {
    const title = task.title ?? task.id ?? task.path;
    const branchName = `${config.branchPrefix}${slugify(task.id ?? title)}`;

    if (config.createBranch) {
      const { created } = ensureBranch(config.repoRoot, branchName);
      console.log(
        created
          ? `Created branch: ${branchName}`
          : `Branch exists: ${branchName}`
      );
    }

    if (config.dryRun) {
      console.log(`[dry-run] Would create project item for ${task.path}`);
      continue;
    }

    const body = buildDraftBody(task);
    const mutation = `
      mutation($projectId: ID!, $title: String!, $body: String!) {
        addProjectV2DraftIssue(
          input: { projectId: $projectId, title: $title, body: $body }
        ) {
          item { id }
        }
      }
    `;

    const data = await graphqlRequest(config.token, mutation, {
      projectId: config.projectId,
      title,
      body,
    });

    const itemId = data.addProjectV2DraftIssue.item.id;
    const query = `
      query($id: ID!) {
        node(id: $id) {
          ... on ProjectV2Item { id url }
        }
      }
    `;
    const itemData = await graphqlRequest(config.token, query, { id: itemId });
    const itemUrl = itemData.node?.url ?? null;

    const patch = {
      projectItemId: itemId,
      projectItemUrl: itemUrl,
      delegation_status: 'queued',
      delegation_updated_at: new Date().toISOString(),
    };

    await UpdateFrontmatterTool.cb({
      path: task.path,
      patch,
    });

    console.log(`Linked ${task.path} → ${itemId}`);
  }
};

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
