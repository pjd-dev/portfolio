import type { McpToolDef } from '@vault/mcp-core';
import {
  listNotes,
  listTasks,
  readNote,
  getFrontmatter,
  searchNotes,
  findByFrontmatter,
  findRelated,
  graphSearch,
  graphStats,
  graphExport,
  graphRebuild,
  findTasks,
  getTask,
  getTaskMetrics,
  getTaskHistory,
  taskNextActions,
  cacheStats,
} from '@vault/handlers';

/**
 * Load local tools (no MCP dependency) using shared handlers.
 */
export async function loadMcpTools(): Promise<McpToolDef[]> {
  const tools: McpToolDef[] = [
    {
      name: 'obsidian_list_notes',
      llmInput: {
        title: 'List Notes',
        description: 'List notes in the vault matching a pattern',
        inputSchema: { pattern: { type: 'string', default: '**/*.md' } },
      },
      cb: async (input: Record<string, unknown>) => {
        const pattern =
          typeof input?.pattern === 'string' ? input.pattern : '**/*.md';
        const notes = await listNotes(pattern);
        return {
          content: [{ type: 'text', text: notes.join('\n') }],
          structuredContent: { notes },
        };
      },
    },
    {
      name: 'obsidian_list_tasks',
      llmInput: {
        title: 'List Tasks',
        description: 'List task notes with optional filters',
      },
      cb: async (input: Record<string, unknown>) => {
        const tasks = await listTasks({
          status: (input.status as string) || 'all',
          limit: (input.limit as number) || undefined,
          sortBy: (input.sortBy as string) || 'priority',
          sortOrder: (input.sortOrder as string) || 'desc',
        });
        return {
          content: [{ type: 'text', text: `Found ${tasks.length} tasks` }],
          structuredContent: { tasks, total: tasks.length },
        };
      },
    },
    {
      name: 'obsidian_read_note',
      llmInput: {
        title: 'Read Note',
        description: 'Read a note content and frontmatter',
      },
      cb: async (input: Record<string, unknown>) => {
        const path = String(input.path || '');
        const note = await readNote(path);
        return {
          content: [{ type: 'text', text: note.content }],
          structuredContent: {
            path,
            frontmatter: note.frontmatter,
            content: note.content,
          },
        };
      },
    },
    {
      name: 'obsidian_get_frontmatter',
      llmInput: {
        title: 'Get Frontmatter',
        description: 'Retrieve frontmatter for a note',
      },
      cb: async (input: Record<string, unknown>) => {
        const path = String(input.path || '');
        const frontmatter = await getFrontmatter(path);
        return {
          content: [
            { type: 'text', text: JSON.stringify(frontmatter, null, 2) },
          ],
          structuredContent: { path, frontmatter },
        };
      },
    },
    {
      name: 'obsidian_search_notes',
      llmInput: {
        title: 'Search Notes',
        description: 'Search note contents for a query string',
      },
      cb: async (input: Record<string, unknown>) => {
        const query = String(input.query || '');
        const pattern =
          typeof input?.pattern === 'string' ? input.pattern : '**/*.md';
        const results = query ? await searchNotes(query, pattern) : [];
        return {
          content: [{ type: 'text', text: `Found ${results.length} matches` }],
          structuredContent: { results },
        };
      },
    },
    {
      name: 'obsidian_find_by_frontmatter',
      llmInput: {
        title: 'Find Notes by Frontmatter',
        description: 'Search notes matching frontmatter criteria',
      },
      cb: async (input: Record<string, unknown>) => {
        const operator =
          (input.operator as Parameters<
            typeof findByFrontmatter
          >[0]['operator']) || 'equals';
        const result = await findByFrontmatter({
          field: String(input.field || ''),
          value: input.value,
          operator,
          pattern: (input.pattern as string) || '**/*.md',
          limit: (input.limit as number) || undefined,
          offset: (input.offset as number) || 0,
        });
        return {
          content: [
            {
              type: 'text',
              text: `Found ${result.total} matches`,
            },
          ],
          structuredContent: result,
        };
      },
    },
    {
      name: 'obsidian_find_related',
      llmInput: {
        title: 'Find Related Notes',
        description:
          'Find notes related to a given path based on tags and links',
      },
      cb: async (input: Record<string, unknown>) => {
        const related = await findRelated({
          path: String(input.path || ''),
          limit: (input.limit as number) || 10,
          minScore: (input.minScore as number) || 1,
        });
        return {
          content: [
            { type: 'text', text: `Found ${related.length} related notes` },
          ],
          structuredContent: { related, total: related.length },
        };
      },
    },
    {
      name: 'obsidian_graph_search',
      llmInput: {
        title: 'Search Notes with Graph Context',
        description: 'Full-text search with optional tag/path filters',
      },
      cb: async (input: Record<string, unknown>) => {
        const results = await graphSearch({
          query: String(input.query || ''),
          pathPrefix: (input.pathPrefix as string) || undefined,
          tags: (input.tags as string[]) || [],
          caseSensitive: Boolean(input.caseSensitive),
          limit: (input.limit as number) || 20,
          includeContext:
            input.includeContext === undefined
              ? true
              : Boolean(input.includeContext),
        });
        return {
          content: [{ type: 'text', text: `Found ${results.length} notes` }],
          structuredContent: { results, total: results.length },
        };
      },
    },
    {
      name: 'obsidian_graph_export',
      llmInput: {
        title: 'Export Knowledge Graph',
        description: 'Export graph nodes/edges; supports optional rebuild',
      },
      cb: async (input: Record<string, unknown>) => {
        const exported = await graphExport({
          rebuild: Boolean(input.rebuild),
        });
        return {
          content: [
            {
              type: 'text',
              text: `Exported knowledge graph: ${exported.stats.totalNotes} notes, ${exported.stats.totalLinks} links`,
            },
          ],
          structuredContent: exported,
        };
      },
    },
    {
      name: 'obsidian_graph_rebuild',
      llmInput: {
        title: 'Rebuild Knowledge Graph',
        description: 'Rebuild graph cache and return stats',
      },
      cb: async (input: Record<string, unknown>) => {
        const result = await graphRebuild({
          verify: input.verify === undefined ? true : Boolean(input.verify),
        });
        return {
          content: [
            {
              type: 'text',
              text: `Rebuilt graph in ${result.buildTime}ms with ${result.stats.totalNotes} notes`,
            },
          ],
          structuredContent: result,
        };
      },
    },
    {
      name: 'obsidian_cache_stats',
      llmInput: {
        title: 'Cache Stats',
        description: 'Return cache statistics (handlers)',
      },
      cb: async () => {
        const stats = await cacheStats();
        return {
          content: [{ type: 'text', text: 'Cache stats ready' }],
          structuredContent: stats,
        };
      },
    },
    {
      name: 'obsidian_graph_stats',
      llmInput: {
        title: 'Knowledge Graph Statistics',
        description: 'Basic graph stats (hubs, orphans, link counts)',
      },
      cb: async (input: Record<string, unknown>) => {
        const stats = await graphStats({
          includeHubs: input.includeHubs !== false,
          includeOrphans: input.includeOrphans !== false,
          hubLimit: (input.hubLimit as number) || 10,
        });
        return {
          content: [{ type: 'text', text: 'Graph stats ready' }],
          structuredContent: stats,
        };
      },
    },
    {
      name: 'obsidian_find_tasks',
      llmInput: {
        title: 'Find Tasks',
        description: 'Search tasks with filters',
      },
      cb: async (input: Record<string, unknown>) => {
        const result = await findTasks({
          query: (input.query as string) || undefined,
          status: (input.status as string) || 'all',
          hasBlockers:
            input.hasBlockers === undefined
              ? undefined
              : Boolean(input.hasBlockers),
          minEffortScore: (input.minEffortScore as number) || undefined,
          maxEffortScore: (input.maxEffortScore as number) || undefined,
          minFocusCost: (input.minFocusCost as number) || undefined,
          maxFocusCost: (input.maxFocusCost as number) || undefined,
          sortBy: (input.sortBy as string) || 'priority',
          sortOrder: (input.sortOrder as string) || 'desc',
          limit: (input.limit as number) || 20,
          offset: (input.offset as number) || 0,
        });
        return {
          content: [
            {
              type: 'text',
              text: `Found ${result.total} tasks (showing ${result.tasks.length})`,
            },
          ],
          structuredContent: result,
        };
      },
    },
    {
      name: 'obsidian_get_task',
      llmInput: {
        title: 'Get Task',
        description: 'Fetch a task note with frontmatter and content',
      },
      cb: async (input: Record<string, unknown>) => {
        const task = await getTask(String(input.path || ''));
        return {
          content: [{ type: 'text', text: `Loaded task: ${task.path}` }],
          structuredContent: task,
        };
      },
    },
    {
      name: 'obsidian_calculate_task_metrics',
      llmInput: {
        title: 'Calculate Task Metrics',
        description:
          'Return basic task metrics (stub) such as priority and estimated time',
      },
      cb: async (input: Record<string, unknown>) => {
        const metrics = await getTaskMetrics(
          String(input.taskPath || input.path || '')
        );
        return {
          content: [{ type: 'text', text: 'Task metrics ready' }],
          structuredContent: metrics,
        };
      },
    },
    {
      name: 'obsidian_get_task_history',
      llmInput: {
        title: 'Get Task History',
        description: 'Return task history entries (stub)',
      },
      cb: async (input: Record<string, unknown>) => {
        const history = await getTaskHistory(String(input.path || ''));
        return {
          content: [{ type: 'text', text: 'Task history ready' }],
          structuredContent: history,
        };
      },
    },
    {
      name: 'obsidian_task_next_actions',
      llmInput: {
        title: 'Task Next Actions',
        description: 'Ranked unblocked tasks',
      },
      cb: async (input: Record<string, unknown>) => {
        const tasks = await taskNextActions({
          max: (input.max as number) || 10,
          maxEffort: (input.maxEffort as number) || undefined,
          maxFocusCost: (input.maxFocusCost as number) || undefined,
        });
        return {
          content: [
            { type: 'text', text: `Top ${tasks.length} next actions ready` },
          ],
          structuredContent: { tasks, total: tasks.length },
        };
      },
    },
  ];
  return tools;
}

/**
 * Read-only tools filter
 * Returns only tools that are safe for unauthenticated read-only access
 */
export const READ_ONLY_TOOLS = new Set([
  'obsidian_list_notes',
  'obsidian_search_notes',
  'obsidian_read_note',
  'obsidian_get_frontmatter',
  'obsidian_find_by_frontmatter',
  'obsidian_find_related',
  'obsidian_graph_search',
  'obsidian_graph_export',
  'obsidian_graph_rebuild',
  'obsidian_graph_stats',
  'obsidian_list_tasks',
  'obsidian_find_tasks',
  'obsidian_get_task',
  'obsidian_calculate_task_metrics',
  'obsidian_get_task_progress',
  'obsidian_get_task_history',
  'obsidian_list_blockers',
  'obsidian_get_available_rewards',
  'obsidian_rank_tasks_by_effort_reward',
  'obsidian_task_graph',
  'obsidian_task_dependencies',
  'obsidian_task_critical_path',
  'obsidian_task_next_actions',
  'obsidian_list_sessions',
  'obsidian_get_session',
  'obsidian_get_session_stats',
  'obsidian_list_templates',
  'obsidian_get_templates_by_category',
  'obsidian_get_template_info',
  'obsidian_preview_template',
  'obsidian_cache_stats',
  'obsidian_list_operations',
  'obsidian_get_operation',
  'obsidian_journal_stats',
  'obsidian_list_schemas',
  'obsidian_get_schema',
  'obsidian_validate_note_structure',
  'obsidian_get_avatar_state',
  'obsidian_get_world_state',
  'obsidian_hard_stop_status',
  'obsidian_hard_stop_info',
  'obsidian_check_session_review',
  'obsidian_get_planning_prerequisites',
  'obsidian_check_task_authority',
  'obsidian_get_task_authority_info',
  'obsidian_get_decision_loop_state',
  'obsidian_check_transition',
  'obsidian_get_allowed_transitions',
  'obsidian_get_productivity_patterns',
  'obsidian_get_productivity_warning',
  'obsidian_get_scheduling_recommendation',
  'obsidian_get_peak_hours',
  'obsidian_get_avoid_hours',
  'obsidian_github_status',
  'obsidian_analyze_context_costs',
  'obsidian_estimate_switch_cost',
  'obsidian_goal_projection',
  'obsidian_all_goal_projections',
  'obsidian_simulate_avatar_rewards',
  'obsidian_simulate_world_constraints',
  'obsidian_simulate_interest_projection',
]);

/**
 * Check if a tool is read-only
 */
export function isReadOnlyTool(name: string): boolean {
  return READ_ONLY_TOOLS.has(name);
}
