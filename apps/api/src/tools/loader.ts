import type { McpToolDef } from '@vault/mcp-core';

const MCP_URL = process.env.MCP_URL || 'http://mcp-server-dev:4000';

/**
 * Create a proxy tool that calls the MCP server via JSON-RPC
 */
function createProxyTool(
  name: string,
  title: string,
  description: string,
  inputSchema?: unknown
): McpToolDef {
  return {
    name,
    llmInput: { title, description, inputSchema },
    cb: async (input: Record<string, unknown>) => {
      const response = await fetch(`${MCP_URL}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: { name, arguments: input },
        }),
      });

      if (!response.ok) {
        throw new Error(`MCP call failed: ${response.status}`);
      }

      const result = (await response.json()) as {
        result?: { content?: unknown[]; structuredContent?: unknown };
        error?: { message: string };
      };
      if (result.error) {
        throw new Error(result.error.message);
      }

      return {
        content: result.result?.content || [],
        structuredContent: result.result?.structuredContent,
      };
    },
  };
}

/**
 * Load tools by discovering them from the MCP server
 * This creates proxy tools that forward calls to MCP via JSON-RPC
 */
export async function loadMcpTools(): Promise<McpToolDef[]> {
  try {
    console.log(`Connecting to MCP server at ${MCP_URL}...`);

    // List tools from MCP server
    const response = await fetch(`${MCP_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/list',
        params: {},
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to list MCP tools: ${response.status}`);
    }

    const result = (await response.json()) as {
      result?: {
        tools?: Array<{
          name: string;
          description?: string;
          inputSchema?: unknown;
        }>;
      };
      error?: { message: string };
    };
    if (result.error) {
      throw new Error(result.error.message);
    }

    const toolDefs = result.result?.tools || [];
    console.log(`✓ Discovered ${toolDefs.length} tools from MCP server`);

    // Create proxy tools for each discovered tool
    return toolDefs.map((t) =>
      createProxyTool(
        t.name,
        t.name
          .replace(/^obsidian_/, '')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        t.description || '',
        t.inputSchema
      )
    );
  } catch (error) {
    console.error('Failed to connect to MCP server:', error);
    console.warn('Falling back to stub tools - MCP server may not be running');
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
