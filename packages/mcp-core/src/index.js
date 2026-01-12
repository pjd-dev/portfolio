import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
export function createMcpServer(
  serverInfo,
  tools = [], // heterogeneous tools, so we use the default AnySchema here
  options = {}
) {
  if (!serverInfo.name || !serverInfo.version) {
    throw new Error('MCP server options must include name and version.');
  }
  const server = new McpServer(serverInfo, options);
  const seen = new Set();
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
    server.registerTool(name, llmInput, cb);
  }
  return server;
}
export function createMcpTool(name, llmInput, cb) {
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
//# sourceMappingURL=index.js.map
