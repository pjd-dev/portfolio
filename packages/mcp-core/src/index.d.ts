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
export declare function createMcpServer(
  serverInfo: McpServerInfo,
  tools?: McpToolDef[], // heterogeneous tools, so we use the default AnySchema here
  options?: Partial<ServerOptions>
): McpServer;
export declare function createMcpTool<TSchema = SchemaLike>(
  name: string,
  llmInput: LlmInputDef<TSchema>,
  cb: McpToolCallback
): McpToolDef<TSchema>;
//# sourceMappingURL=index.d.ts.map
