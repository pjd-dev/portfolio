import type { McpToolDef } from '@vault/mcp-core';

/**
 * Dynamically load MCP tools from the mcp app
 *
 * This loader imports the pre-configured tools from apps/mcp
 * which already have all dependencies wired up.
 *
 * Note: This requires the mcp app to be built first.
 */
export async function loadMcpTools(): Promise<McpToolDef[]> {
  try {
    // Import the tools from the mcp app's built output
    // The mcp app exports all tools with dependencies already wired
    const mcpToolsModule = await import(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Path only exists after MCP build
      '../../mcp/dist/mcp/obsidian/tools/index.js'
    );
    const tools = mcpToolsModule.default as McpToolDef[];

    console.log(`Loaded ${tools.length} tools from MCP app`);
    return tools;
  } catch (error) {
    console.error('Failed to load MCP tools:', error);

    // Return a minimal set of tools for development/testing
    console.warn('Falling back to stub tools');
    return getStubTools();
  }
}

/**
 * Stub tools for development when MCP tools aren't available
 */
function getStubTools(): McpToolDef[] {
  return [
    {
      name: 'obsidian_list_notes',
      llmInput: {
        title: 'List Notes (stub)',
        description: 'List notes in the vault - STUB MODE',
      },
      cb: async () => ({
        content: [{ type: 'text', text: 'Stub: No notes available' }],
        structuredContent: { notes: [], stub: true },
      }),
    },
    {
      name: 'obsidian_search_notes',
      llmInput: {
        title: 'Search Notes (stub)',
        description: 'Search notes in the vault - STUB MODE',
      },
      cb: async () => ({
        content: [{ type: 'text', text: 'Stub: Search not available' }],
        structuredContent: { results: [], stub: true },
      }),
    },
  ];
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
