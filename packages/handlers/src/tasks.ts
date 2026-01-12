import path from 'node:path';
import fs from 'node:fs/promises';
import {
  getVaultRoot,
  readMarkdownFile,
  walkMarkdownFiles,
  writeMarkdownFile,
} from './utils.js';

type TaskFrontmatter = Record<string, any>;

export async function listTasks(options?: {
  status?: string;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}) {
  const {
    status = 'all',
    limit,
    sortBy = 'priority',
    sortOrder = 'desc',
  } = options || {};
  const files = await walkMarkdownFiles(getVaultRoot(), '');
  const tasks: any[] = [];

  for (const file of files) {
    try {
      const { frontmatter } = await readMarkdownFile(file);
      if (frontmatter.type !== 'task') continue;
      if (status !== 'all' && frontmatter.status !== status) continue;
      tasks.push({
        path: file,
        ...frontmatter,
      });
    } catch {
      // ignore unreadable files
    }
  }

  sortTasks(tasks, sortBy, sortOrder);

  return limit ? tasks.slice(0, limit) : tasks;
}

export async function getTask(taskPath: string) {
  const { frontmatter, content } = await readMarkdownFile(taskPath);
  if (frontmatter.type !== 'task') {
    throw new Error(`Not a task: ${taskPath}`);
  }
  return { path: taskPath, frontmatter, content };
}

export async function getTaskMetrics(taskPath: string) {
  const task = await getTask(taskPath);
  // Minimal stub metrics; real logic lives in MCP core. Extend here if needed.
  const estimatedTimeMin = task.frontmatter.estimatedTimeMin ?? null;
  const priority = task.frontmatter.priority ?? null;
  return {
    path: taskPath,
    metrics: {
      estimatedTimeMin,
      priority,
    },
  };
}

export async function getTaskHistory(taskPath: string) {
  // History section parsing could be added here; for now, return empty.
  void taskPath;
  return { entries: [] };
}

export async function findTasks(options?: {
  query?: string;
  status?: string;
  hasBlockers?: boolean;
  minEffortScore?: number;
  maxEffortScore?: number;
  minFocusCost?: number;
  maxFocusCost?: number;
  sortBy?: string;
  sortOrder?: string;
  limit?: number;
  offset?: number;
}) {
  const {
    query,
    status = 'all',
    hasBlockers,
    minEffortScore,
    maxEffortScore,
    minFocusCost,
    maxFocusCost,
    sortBy = 'priority',
    sortOrder = 'desc',
    limit = 20,
    offset = 0,
  } = options || {};

  const files = await walkMarkdownFiles(getVaultRoot(), '');
  const tasks: any[] = [];

  for (const file of files) {
    try {
      const { frontmatter, content } = await readMarkdownFile(file);
      if (frontmatter.type !== 'task') continue;
      if (status !== 'all' && frontmatter.status !== status) continue;

      if (query) {
        const searchText =
          `${frontmatter.title || ''} ${content}`.toLowerCase();
        if (!searchText.includes(query.toLowerCase())) continue;
      }

      if (hasBlockers !== undefined) {
        const blockers =
          frontmatter.blockers ||
          frontmatter.blocker ||
          frontmatter.blocked ||
          [];
        const has = Array.isArray(blockers) ? blockers.length > 0 : !!blockers;
        if (hasBlockers && !has) continue;
        if (!hasBlockers && has) continue;
      }

      if (
        minEffortScore !== undefined &&
        (!frontmatter.effortScore || frontmatter.effortScore < minEffortScore)
      )
        continue;
      if (
        maxEffortScore !== undefined &&
        frontmatter.effortScore &&
        frontmatter.effortScore > maxEffortScore
      )
        continue;
      if (
        minFocusCost !== undefined &&
        (!frontmatter.focusCost || frontmatter.focusCost < minFocusCost)
      )
        continue;
      if (
        maxFocusCost !== undefined &&
        frontmatter.focusCost &&
        frontmatter.focusCost > maxFocusCost
      )
        continue;

      tasks.push({
        path: file,
        ...frontmatter,
      });
    } catch {
      // ignore bad files
    }
  }

  sortTasks(tasks, sortBy, sortOrder);

  const total = tasks.length;
  const paginated = tasks.slice(offset, offset + limit);

  return { tasks: paginated, total, offset, limit };
}

// Legacy taskNextActions removed: use MCP COD handler instead

export async function updateTask(input: {
  path: string;
  frontmatterPatch?: Record<string, any>;
  includeMetrics?: boolean;
}) {
  const rel = input.path;
  const { frontmatter, content } = await readMarkdownFile(rel);
  if (frontmatter.type !== 'task') {
    throw new Error(`Not a task note: ${rel}`);
  }

  const previousStatus = frontmatter.status;
  const updatedFrontmatter = {
    ...frontmatter,
    ...(input.frontmatterPatch || {}),
  };

  // Mark completion timestamp if newly completed
  const newlyCompleted =
    previousStatus !== 'completed' && updatedFrontmatter.status === 'completed';
  if (newlyCompleted && !updatedFrontmatter.completedAt) {
    updatedFrontmatter.completedAt = new Date().toISOString();
  }

  let finalPath = rel;
  let moved: { from: string; to: string } | undefined;

  // Auto-archive tasks under tasks/ when completed
  if (newlyCompleted && shouldAutoArchive(rel)) {
    const archivePath = getArchivePath(rel);
    await fs.mkdir(path.join(getVaultRoot(), path.dirname(archivePath)), {
      recursive: true,
    });
    await fs.rename(
      path.join(getVaultRoot(), rel),
      path.join(getVaultRoot(), archivePath)
    );
    finalPath = archivePath;
    moved = { from: rel, to: archivePath };
  }

  // Apply avatar rewards if present and newly completed
  let rewards: { xpGained?: number; appliedSources: string[] } | undefined;
  if (newlyCompleted) {
    let rewardSpec =
      (updatedFrontmatter as any).avatar_rewards ??
      (frontmatter as any)?.avatar_rewards ??
      {};
    if (typeof rewardSpec === 'string') {
      try {
        rewardSpec = JSON.parse(rewardSpec);
      } catch {
        rewardSpec = {};
      }
    }
    const xpDelta = Number(rewardSpec?.progression?.xp ?? 0) || 0;
    await applyAvatarRewards(finalPath, rewardSpec);
    rewards = { xpGained: xpDelta || undefined, appliedSources: [finalPath] };
  }

  // Write updated task (after possible move, but we need to write finalPath)
  await writeMarkdownFile(finalPath, {
    frontmatter: updatedFrontmatter,
    content,
  });

  return {
    path: finalPath,
    frontmatter: updatedFrontmatter,
    moved,
    rewards,
  };
}

function shouldAutoArchive(relPath: string): boolean {
  const normalized = normalizeTaskPath(relPath);
  return (
    normalized.startsWith('tasks/') && !normalized.startsWith('tasks/archive/')
  );
}

function normalizeTaskPath(relPath: string): string {
  return relPath.replace(/^\.?[\\/]+/, '').replace(/\\/g, '/');
}

function getArchivePath(relPath: string): string {
  const normalized = normalizeTaskPath(relPath);
  const remainder = normalized.startsWith('tasks/')
    ? normalized.slice('tasks/'.length)
    : normalized;
  return path.posix.join('tasks', 'archive', remainder);
}

async function applyAvatarRewards(
  taskPath: string,
  rewards: any
): Promise<{ xpGained?: number; appliedSources: string[] }> {
  if (!rewards || typeof rewards !== 'object') {
    return { appliedSources: [], xpGained: undefined };
  }
  const avatarPath = 'core/avatar/Avatar.md';
  let avatar;
  try {
    avatar = await readMarkdownFile(avatarPath);
  } catch {
    avatar = {
      frontmatter: { type: 'avatar', id: 'primary' },
      content: '# Avatar\n\n## Events\n',
    };
  }

  const currentVitals = {
    ...((avatar.frontmatter as any).vitals || {}),
  } as Record<string, number>;
  const currentProg = {
    ...((avatar.frontmatter as any).progression || {}),
  } as Record<string, number>;

  // Apply vitals deltas
  if (rewards.vitals && typeof rewards.vitals === 'object') {
    for (const [k, v] of Object.entries(rewards.vitals)) {
      const delta = Number(v) || 0;
      const prev = Number(currentVitals[k] ?? 0);
      currentVitals[k] = clamp(prev + delta, 0, 100);
    }
  }

  let xpGained = Number(rewards?.progression?.xp ?? 0);
  if (Number.isNaN(xpGained)) xpGained = 0;
  if (rewards.progression && typeof rewards.progression === 'object') {
    const prev = Number(currentProg.xp ?? 0);
    currentProg.xp = prev + xpGained;
    if (rewards.progression.level !== undefined) {
      currentProg.level = Number(rewards.progression.level) || 0;
    }
  }

  // Update avatar note
  const updatedFrontmatter = {
    ...(avatar.frontmatter || {}),
    type: 'avatar',
    id: avatar.frontmatter.id || 'primary',
    vitals: Object.keys(currentVitals).length ? currentVitals : undefined,
    progression: Object.keys(currentProg).length ? currentProg : undefined,
    updated: new Date().toISOString(),
  };

  // Add event line
  const timestamp = new Date().toISOString();
  const eventLine = `- [${timestamp}] Reward applied from: ${path.basename(taskPath, '.md')}${xpGained ? ` (+${xpGained} XP)` : ''}`;
  let content = avatar.content || '# Avatar\n';
  if (content.includes('## Events')) {
    const insertAt = content.indexOf('## Events') + '## Events'.length;
    const nextHeading = content.indexOf('\n## ', insertAt);
    const sectionEnd = nextHeading === -1 ? content.length : nextHeading;
    const headerEnd = content.indexOf('\n', insertAt);
    const insertPoint = headerEnd === -1 ? sectionEnd : headerEnd + 1;
    content =
      content.slice(0, insertPoint) +
      eventLine +
      '\n' +
      content.slice(insertPoint);
  } else {
    content += `\n## Events\n\n${eventLine}\n`;
  }

  await writeMarkdownFile(avatarPath, {
    frontmatter: updatedFrontmatter,
    content,
  });

  return {
    xpGained,
    appliedSources: [taskPath],
  };
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function sortTasks(tasks: any[], sortBy: string, sortOrder: string) {
  tasks.sort((a, b) => {
    let aVal: any = 0;
    let bVal: any = 0;
    switch (sortBy) {
      case 'priority':
        aVal = a.priority || 0;
        bVal = b.priority || 0;
        break;
      case 'dueDate':
        aVal = a.dueDate || '';
        bVal = b.dueDate || '';
        break;
      case 'effortScore':
        aVal = a.effortScore || 0;
        bVal = b.effortScore || 0;
        break;
      case 'focusCost':
        aVal = a.focusCost || 0;
        bVal = b.focusCost || 0;
        break;
      default:
        aVal = a.title || '';
        bVal = b.title || '';
    }
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
}
