import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { McpToolDef } from '@vault/mcp-core';
import { writePipeline } from '@vault/handlers';

/**
 * Tool registry - maps tool names to their definitions
 */
const toolRegistry = new Map<string, McpToolDef>();

/**
 * Register tools for API access
 */
export function registerTools(tools: McpToolDef[]): void {
  for (const tool of tools) {
    toolRegistry.set(tool.name, tool);
  }
}

/**
 * Get a tool by name
 */
export function getTool(name: string): McpToolDef | undefined {
  return toolRegistry.get(name);
}

/**
 * List all registered tools
 */
export function listTools(): Array<{
  name: string;
  title: string;
  description: string;
}> {
  return Array.from(toolRegistry.values()).map((tool) => ({
    name: tool.name,
    title: tool.llmInput.title || tool.name,
    description: tool.llmInput.description || '',
  }));
}

/**
 * Execute a tool with given input
 */
export async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<unknown> {
  const tool = toolRegistry.get(name);
  if (!tool) {
    throw new Error(`Tool not found: ${name}`);
  }

  // Call the tool's callback with the input
  const result = await tool.cb(input);
  return result;
}

/**
 * Tools routes plugin
 */
export async function toolsRoutes(fastify: FastifyInstance): Promise<void> {
  // List all available tools
  fastify.get(
    '/tools',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tools = listTools();
      return {
        tools,
        count: tools.length,
      };
    }
  );

  // Get tool info
  fastify.get<{ Params: { name: string } }>(
    '/tools/:name',
    async (request, reply) => {
      const { name } = request.params;
      const tool = getTool(name);

      if (!tool) {
        reply.code(404).send({
          error: 'NotFound',
          message: `Tool not found: ${name}`,
        });
        return;
      }

      return {
        name: tool.name,
        title: tool.llmInput.title,
        description: tool.llmInput.description,
        inputSchema: tool.llmInput.inputSchema,
      };
    }
  );

  // Execute a tool
  fastify.post<{ Params: { name: string }; Body: Record<string, unknown> }>(
    '/tools/:name/execute',
    async (request, reply) => {
      const { name } = request.params;
      const input = request.body || {};

      try {
        const result = await executeTool(name, input);
        return {
          success: true,
          tool: name,
          result,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        if (message.includes('not found')) {
          reply.code(404).send({
            error: 'NotFound',
            message,
          });
          return;
        }

        reply.code(500).send({
          error: 'ExecutionError',
          message,
          tool: name,
        });
      }
    }
  );

  // Create/update a pipeline definition (simple helper)
  fastify.post<{
    Body: { name: string; pipeline: unknown };
  }>('/pipelines', async (request, reply) => {
    const { name, pipeline } = request.body || {};
    if (!name || !pipeline || typeof pipeline !== 'object') {
      reply
        .code(400)
        .send({ error: 'BadRequest', message: 'name + pipeline required' });
      return;
    }
    const result = await writePipeline(name, pipeline);
    return { success: true, ...result };
  });
}
