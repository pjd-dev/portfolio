import fs from 'node:fs/promises';
import path from 'node:path';
import {
  extractWikiLinks,
  getVaultRoot,
  globToRegExp,
  normalizeTags,
  readMarkdownFile,
  walkMarkdownFiles,
  writeMarkdownFile,
} from './utils.js';
import { createGraph } from './graph.js';

// ---------------------------------------------------------------------------
// Note helpers
// ---------------------------------------------------------------------------

export async function readNote(relPath: string) {
  const { frontmatter, content } = await readMarkdownFile(relPath);
  return { frontmatter, content };
}

export async function getFrontmatter(relPath: string) {
  const { frontmatter } = await readMarkdownFile(relPath);
  return frontmatter;
}

export async function listNotes(pattern = '**/*.md') {
  const regex = globToRegExp(pattern);
  const files = await walkMarkdownFiles(getVaultRoot(), '');
  return files.filter((f) => regex.test(f));
}

export async function searchNotes(query: string, pattern = '**/*.md') {
  const regex = globToRegExp(pattern);
  const files = await walkMarkdownFiles(getVaultRoot(), '');
  const matches: { path: string; excerpt: string }[] = [];
  const needle = query.toLowerCase();

  for (const file of files) {
    if (!regex.test(file)) continue;
    try {
      const raw = await fs.readFile(path.join(getVaultRoot(), file), 'utf8');
      const haystack = raw.toLowerCase();
      if (haystack.includes(needle)) {
        const idx = haystack.indexOf(needle);
        const excerpt = raw.slice(
          Math.max(0, idx - 30),
          idx + needle.length + 30
        );
        matches.push({ path: file, excerpt });
      }
    } catch {
      /* ignore unreadable files */
    }
  }
  return matches;
}

export async function appendNote(relPath: string, content: string) {
  const note = await readMarkdownFileSafe(relPath);
  const combined =
    note.content && note.content.trim().length > 0
      ? `${note.content}\n\n${content}`
      : content;
  await writeMarkdownFile(relPath, {
    frontmatter: note.frontmatter,
    content: combined,
  });
  return { path: relPath };
}

export async function updateFrontmatter(
  relPath: string,
  patch: Record<string, any>
) {
  const note = await readMarkdownFileSafe(relPath);
  const updatedFrontmatter = { ...note.frontmatter, ...patch };
  await writeMarkdownFile(relPath, {
    frontmatter: updatedFrontmatter,
    content: note.content,
  });
  return { path: relPath, frontmatter: updatedFrontmatter };
}

// Find notes by frontmatter criteria (read-only convenience)
export async function findByFrontmatter(params: {
  field: string;
  value?: any;
  operator?:
    | 'equals'
    | 'contains'
    | 'exists'
    | 'gt'
    | 'lt'
    | 'gte'
    | 'lte'
    | 'in'
    | 'regex';
  pattern?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  matches: Array<{ path: string; frontmatter: any }>;
  total: number;
}> {
  const {
    field,
    value,
    operator = 'equals',
    pattern = '**/*.md',
    limit,
    offset = 0,
  } = params;

  const regex = globToRegExp(pattern);
  const files = await walkMarkdownFiles(getVaultRoot(), '');
  let matches: Array<{ path: string; frontmatter: any }> = [];

  for (const file of files) {
    if (!regex.test(file)) continue;
    try {
      const { frontmatter } = await readMarkdownFile(file);
      if (matchesCriteria(frontmatter[field], value, operator)) {
        matches.push({ path: file, frontmatter });
      }
    } catch {
      /* ignore bad files */
    }
  }

  const total = matches.length;
  matches = matches.slice(offset, limit ? offset + limit : undefined);

  return { matches, total };
}

function matchesCriteria(
  fieldValue: any,
  value: any,
  operator:
    | 'equals'
    | 'contains'
    | 'exists'
    | 'gt'
    | 'lt'
    | 'gte'
    | 'lte'
    | 'in'
    | 'regex'
): boolean {
  switch (operator) {
    case 'exists':
      return fieldValue !== undefined;
    case 'equals':
      return fieldValue === value;
    case 'contains':
      if (typeof fieldValue === 'string')
        return fieldValue.includes(String(value));
      if (Array.isArray(fieldValue)) return fieldValue.includes(value);
      return false;
    case 'gt':
      return fieldValue > value;
    case 'lt':
      return fieldValue < value;
    case 'gte':
      return fieldValue >= value;
    case 'lte':
      return fieldValue <= value;
    case 'in':
      return Array.isArray(value) ? value.includes(fieldValue) : false;
    case 'regex':
      return typeof fieldValue === 'string' && typeof value === 'string'
        ? new RegExp(value).test(fieldValue)
        : false;
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Graph helpers (lightweight, file-based)
// ---------------------------------------------------------------------------

type RelatedResult = { path: string; score: number; reasons: string[] };

export async function findRelated(params: {
  path: string;
  limit?: number;
  minScore?: number;
}): Promise<RelatedResult[]> {
  const graph = createGraph();
  const related = await graph.findRelated(params.path, params.limit || 10);
  const minScore = params.minScore ?? 0;
  return related.filter((r) => r.score >= minScore);
}

export async function graphSearch(params: {
  query: string;
  pathPrefix?: string;
  tags?: string[];
  caseSensitive?: boolean;
  limit?: number;
  includeContext?: boolean;
}): Promise<
  | Array<{
      path: string;
      title?: string;
      matchCount: number;
    }>
  | Array<{
      path: string;
      title?: string;
      matches: Array<{ text: string; start?: number; end?: number }>;
    }>
> {
  const graph = createGraph();
  const results = await graph.search(params.query, {
    pathPrefix: params.pathPrefix,
    tags: params.tags,
    caseSensitive: params.caseSensitive,
    limit: params.limit,
  });

  if (params.includeContext === false) {
    return results.map((r) => ({
      path: r.path,
      title: r.title,
      matchCount: r.matches.length,
    }));
  }

  return results;
}

export async function graphStats(params?: {
  includeHubs?: boolean;
  includeOrphans?: boolean;
  hubLimit?: number;
}) {
  const {
    includeHubs = true,
    includeOrphans = true,
    hubLimit = 10,
  } = params || {};
  const graph = createGraph();
  const exported = await graph.exportGraph();
  const hubs = includeHubs ? await graph.getHubs(hubLimit) : [];
  const orphans = includeOrphans ? await graph.getOrphans() : [];

  return {
    stats: exported.stats,
    hubs,
    orphans,
  };
}

export async function graphExport(params?: { rebuild?: boolean }) {
  const graph = createGraph();
  if (params?.rebuild) graph.invalidateCache();
  return graph.exportGraph();
}

export async function graphRebuild(params?: { verify?: boolean }) {
  const { verify = true } = params || {};
  const graph = createGraph();
  graph.invalidateCache();
  const start = Date.now();
  const rebuilt = await graph.exportGraph();
  const buildTime = Date.now() - start;

  let verification: {
    orphans?: string[];
    hubs?: Array<{ path: string; connections: number }>;
  } = {};
  if (verify) {
    verification = {
      orphans: await graph.getOrphans(),
      hubs: await graph.getHubs(5),
    };
  }

  return { stats: rebuilt.stats, buildTime, verification };
}

// ---------------------------------------------------------------------------
// Cache helpers (lightweight placeholder)
// ---------------------------------------------------------------------------

export async function cacheStats() {
  return {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
    hitRate: 0,
  };
}

async function readMarkdownFileSafe(relPath: string) {
  try {
    return await readMarkdownFile(relPath);
  } catch {
    return { frontmatter: {}, content: '', raw: '' };
  }
}

// ---------------------------------------------------------------------------
// Task exports
// ---------------------------------------------------------------------------

export {
  listTasks,
  getTask,
  getTaskMetrics,
  getTaskHistory,
  findTasks,
  taskNextActions,
  updateTask,
} from './tasks.js';

export { listPipelines, readPipeline, writePipeline } from './pipelines.js';
