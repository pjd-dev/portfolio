import type { FastifyInstance } from 'fastify';
import { executeTool } from './tools.js';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Notes routes - convenience endpoints for note operations
 * Maps to obsidian_* tools
 */
export async function notesRoutes(fastify: FastifyInstance): Promise<void> {
  // List notes
  fastify.get<{ Querystring: { pattern?: string } }>(
    '/notes',
    async (request) => {
      const { pattern = '**/*.md' } = request.query;
      return executeTool('obsidian_list_notes', { pattern });
    }
  );

  // Search notes
  fastify.get<{ Querystring: { query: string; pattern?: string } }>(
    '/notes/search',
    async (request, reply) => {
      const { query, pattern = '**/*.md' } = request.query;

      if (!query) {
        reply.code(400).send({
          error: 'BadRequest',
          message: 'Query parameter is required',
        });
        return;
      }

      return executeTool('obsidian_search_notes', { query, pattern });
    }
  );

  // Read a note
  fastify.get<{ Params: { path: string } }>('/notes/:path', async (request) => {
    const { path } = request.params;
    return executeTool('obsidian_read_note', {
      path: decodeURIComponent(path),
    });
  });

  // Get note frontmatter
  fastify.get<{ Params: { path: string } }>(
    '/notes/:path/frontmatter',
    async (request) => {
      const { path } = request.params;
      return executeTool('obsidian_get_frontmatter', {
        path: decodeURIComponent(path),
      });
    }
  );
}

/**
 * Tasks routes - convenience endpoints for task operations
 */
export async function tasksRoutes(fastify: FastifyInstance): Promise<void> {
  // List tasks
  fastify.get<{
    Querystring: {
      status?: string;
      limit?: number;
      sortBy?: string;
      sortOrder?: string;
    };
  }>('/tasks', async (request) => {
    const {
      status = 'all',
      limit = 20,
      sortBy = 'priority',
      sortOrder = 'desc',
    } = request.query;
    return executeTool('obsidian_list_tasks', {
      status,
      limit,
      sortBy,
      sortOrder,
    });
  });

  // Find tasks with filters
  fastify.post<{ Body: Record<string, unknown> }>(
    '/tasks/find',
    async (request) => {
      return executeTool('obsidian_find_tasks', request.body);
    }
  );

  // Get a task
  fastify.get<{ Params: { path: string } }>('/tasks/:path', async (request) => {
    const { path } = request.params;
    return executeTool('obsidian_get_task', { path: decodeURIComponent(path) });
  });

  // Get next actions (COD-aware)
  fastify.get<{
    Querystring: { max?: number; maxEffort?: number; maxFocusCost?: number };
  }>('/tasks/next-actions', async (request) => {
    return executeTool('obsidian_task_next_actions', request.query);
  });

  // Get task metrics
  fastify.get<{ Params: { path: string } }>(
    '/tasks/:path/metrics',
    async (request) => {
      const { path } = request.params;
      return executeTool('obsidian_calculate_task_metrics', {
        taskPath: decodeURIComponent(path),
      });
    }
  );
}

/**
 * Sessions routes - convenience endpoints for session operations
 */
export async function sessionsRoutes(fastify: FastifyInstance): Promise<void> {
  // List sessions
  fastify.get<{ Querystring: { status?: string; limit?: number } }>(
    '/sessions',
    async (request) => {
      return executeTool('obsidian_list_sessions', request.query);
    }
  );

  // Get a session
  fastify.get<{ Params: { id: string } }>('/sessions/:id', async (request) => {
    const { id } = request.params;
    return executeTool('obsidian_get_session', { id });
  });

  // Get session stats
  fastify.get('/sessions/stats', async () => {
    return executeTool('obsidian_get_session_stats', {});
  });
}

/**
 * Graph routes - knowledge graph operations
 */
export async function graphRoutes(fastify: FastifyInstance): Promise<void> {
  // Graph search
  fastify.get<{ Querystring: { query: string; limit?: number } }>(
    '/graph/search',
    async (request, reply) => {
      const { query, limit = 20 } = request.query;

      if (!query) {
        reply.code(400).send({
          error: 'BadRequest',
          message: 'Query parameter is required',
        });
        return;
      }

      return executeTool('obsidian_graph_search', { query, limit });
    }
  );

  // Graph stats
  fastify.get('/graph/stats', async () => {
    return executeTool('obsidian_graph_stats', {});
  });

  // Find related notes
  fastify.get<{ Params: { path: string }; Querystring: { limit?: number } }>(
    '/graph/related/:path',
    async (request) => {
      const { path } = request.params;
      const { limit = 10 } = request.query;
      return executeTool('obsidian_find_related', {
        path: decodeURIComponent(path),
        limit,
      });
    }
  );
}

/**
 * COD routes - Cognitive Operating Discipline endpoints
 */
export async function codRoutes(fastify: FastifyInstance): Promise<void> {
  const vaultPath =
    process.env.VAULT_PATH || process.env.VAULT_ROOT || '/vault';

  // Combined status for viewer dashboard
  fastify.get('/cod/status', async () => {
    try {
      // Try to read human state from the COD state file
      let humanState = {
        energy: 0,
        focusCapacity: 'unknown' as string,
        stress: 0,
        sleepDebt: 0,
        timeAvailableMin: 0,
        source: 'none' as string,
        timestamp: null as string | null,
      };

      try {
        // Read the human state JSON file directly from the vault
        const humanStatePath = join(vaultPath, '_state/cod/human-state.json');
        const content = await readFile(humanStatePath, 'utf-8');
        const parsed = JSON.parse(content) as {
          energy?: number;
          focusCapacity?: string;
          stress?: number;
          sleepHours?: number;
          timeAvailableMin?: number;
          source?: string;
          ts?: string;
        };
        humanState = {
          energy: Math.round((parsed.energy || 0) * 100),
          focusCapacity: parsed.focusCapacity || 'unknown',
          stress: Math.round((parsed.stress || 0) * 100),
          sleepDebt: parsed.sleepHours ? Math.max(0, 8 - parsed.sleepHours) : 0,
          timeAvailableMin: parsed.timeAvailableMin || 0,
          source: parsed.source || 'none',
          timestamp: parsed.ts || null,
        };
      } catch {
        // Human state file not found or invalid - use defaults
      }

      // Get planning prerequisites for session info
      const prereqResult = (await executeTool(
        'obsidian_planning_prerequisites',
        {}
      )) as Record<string, unknown>;
      const prereq = (prereqResult?.structuredContent ||
        prereqResult ||
        {}) as Record<string, unknown>;

      // Session info (if active)
      const session = prereq.activeSession || null;

      return {
        humanState,
        session,
        canProceed: prereq.canProceed ?? true,
        warnings: prereq.warnings || [],
      };
    } catch (err) {
      return {
        humanState: null,
        session: null,
        canProceed: false,
        warnings: [],
        error: String(err),
      };
    }
  });

  // Get avatar state
  fastify.get('/cod/avatar', async () => {
    return executeTool('obsidian_get_avatar_state', {});
  });

  // Get world state
  fastify.get('/cod/world', async () => {
    return executeTool('obsidian_get_world_state', {});
  });

  // Get HARD_STOP status
  fastify.get('/cod/hard-stop', async () => {
    return executeTool('obsidian_hard_stop_status', {});
  });

  // Get decision loop state
  fastify.get('/cod/decision-loop', async () => {
    return executeTool('obsidian_get_decision_loop_state', {});
  });

  // Get productivity patterns
  fastify.get('/cod/productivity', async () => {
    return executeTool('obsidian_get_productivity_patterns', {});
  });

  // Get peak hours
  fastify.get('/cod/productivity/peak-hours', async () => {
    return executeTool('obsidian_get_peak_hours', {});
  });

  // ============================================================================
  // COD Write Endpoints
  // ============================================================================

  // Update human state
  fastify.post<{
    Body: {
      energy: number;
      focusCapacity: 'low' | 'med' | 'high';
      stress: number;
      sleepHours: number;
      timeAvailableMin: number;
      source?: 'morning-check' | 'moment-check' | 'manual';
    };
  }>('/cod/human-state', async (request) => {
    const {
      energy,
      focusCapacity,
      stress,
      sleepHours,
      timeAvailableMin,
      source = 'manual',
    } = request.body;

    return executeTool('obsidian_write_human_state', {
      energy,
      focusCapacity,
      stress,
      sleepHours,
      timeAvailableMin,
      source,
    });
  });

  // Start a new session
  fastify.post<{
    Body: {
      taskIds?: string[];
      budgetMin?: number;
    };
  }>('/cod/session/start', async (request) => {
    const { taskIds = [], budgetMin = 60 } = request.body;
    return executeTool('obsidian_start_session', {
      taskIds,
      budgetMin,
    });
  });

  // End current session
  fastify.post<{
    Body: {
      sessionId: string;
      status?: 'completed' | 'aborted';
    };
  }>('/cod/session/end', async (request) => {
    const { sessionId, status = 'completed' } = request.body;
    return executeTool('obsidian_end_session', {
      sessionId,
      status,
    });
  });

  // Transition decision loop state
  fastify.post<{
    Body: {
      transition: string;
      reason?: string;
    };
  }>('/cod/decision-loop/transition', async (request) => {
    const { transition, reason } = request.body;
    return executeTool('obsidian_decision_loop_transition', {
      transition,
      reason,
    });
  });

  // Update avatar state
  fastify.patch<{
    Body: {
      patch: Record<string, unknown>;
    };
  }>('/cod/avatar', async (request) => {
    const { patch } = request.body;
    return executeTool('obsidian_update_avatar_state', { patch });
  });

  // Update world state
  fastify.patch<{
    Body: {
      patch: Record<string, unknown>;
    };
  }>('/cod/world', async (request) => {
    const { patch } = request.body;
    return executeTool('obsidian_update_world_state', { patch });
  });
}
