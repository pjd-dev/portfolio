import {
  McpServer,
  type RegisteredTool,
} from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerOptions } from '@modelcontextprotocol/sdk/server';

export type SchemaLike = unknown;

export type McpToolCallback = (...args: any[]) => unknown;

export type McpServerInfo = {
  name: string;
  version: string;
};

export type LlmInputDef<TSchema = SchemaLike> = {
  title?: string;
  description?: string;
  // This is the same schema type TSchema that ToolCallback will receive.
  inputSchema?: TSchema;
  outputSchema?: SchemaLike;
  annotations?: RegisteredTool['annotations'];
  _meta?: Record<string, unknown>;
};

export type McpToolDef<TSchema = SchemaLike> = {
  name: string;
  llmInput: LlmInputDef<TSchema>;
  cb: McpToolCallback;
};

export function createMcpServer(
  serverInfo: McpServerInfo,
  tools: McpToolDef[] = [], // heterogeneous tools, so we use the default AnySchema here
  options: Partial<ServerOptions> = {}
): McpServer {
  if (!serverInfo.name || !serverInfo.version) {
    throw new Error('MCP server options must include name and version.');
  }

  const server = new McpServer(serverInfo, options);
  const seen = new Set<string>();

  for (const tool of tools) {
    const { name, llmInput, cb } = tool;

    if (!name) {
      throw new Error(`Tool missing name: ${JSON.stringify(tool)}`);
    }

    if (seen.has(name)) {
      throw new Error(`Duplicate MCP tool name: ${name}`);
    }
    seen.add(name);

    if (!llmInput) {
      throw new Error(`Tool "${name}" is missing llmInput`);
    }

    if (!llmInput.title || !llmInput.description) {
      throw new Error(
        `Tool "${name}" is missing llmInput.title or llmInput.description`
      );
    }

    if (!cb) {
      throw new Error(`Tool "${name}" is missing cb handler`);
    }

    server.registerTool(name, llmInput as any, cb as any);
  }

  return server;
}

export function createMcpTool<TSchema = SchemaLike>(
  name: string,
  llmInput: LlmInputDef<TSchema>,
  cb: McpToolCallback
): McpToolDef<TSchema> {
  if (!name) {
    throw new Error('Tool name is required');
  }
  if (!llmInput) {
    throw new Error(`Tool "${name}" llmInput is required`);
  }
  if (!llmInput.title || !llmInput.description) {
    throw new Error(
      `Tool "${name}" requires llmInput.title and llmInput.description`
    );
  }
  if (!cb) {
    throw new Error(`Tool "${name}" callback is required`);
  }

  return {
    name,
    llmInput,
    cb,
  };
}
