import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config, validateConfig } from './config/index.js';
import { authPlugin } from './plugins/auth.js';
import { healthRoutes } from './routes/health.js';
import { toolsRoutes, registerTools } from './routes/tools.js';
import {
  notesRoutes,
  tasksRoutes,
  sessionsRoutes,
  graphRoutes,
  codRoutes,
} from './routes/convenience.js';
import { loadMcpTools } from './tools/loader.js';

async function main() {
  // Validate configuration
  try {
    validateConfig();
    console.log('✓ Configuration validated');
  } catch (error) {
    console.error('Configuration error:', error);
    process.exit(1);
  }

  // Create Fastify instance
  const fastify = Fastify({
    logger: {
      level: config.logLevel,
      transport:
        config.nodeEnv === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  });

  // Register plugins
  await fastify.register(cors, {
    origin: config.corsOrigin,
    credentials: true,
  });

  await fastify.register(authPlugin);

  // Load and register MCP tools
  try {
    const tools = await loadMcpTools();
    registerTools(tools);
    console.log(`✓ Loaded ${tools.length} MCP tools`);
  } catch (error) {
    console.error('Failed to load MCP tools:', error);
    process.exit(1);
  }

  // Register routes
  await fastify.register(healthRoutes);
  await fastify.register(toolsRoutes, { prefix: '/api/v1' });
  await fastify.register(notesRoutes, { prefix: '/api/v1' });
  await fastify.register(tasksRoutes, { prefix: '/api/v1' });
  await fastify.register(sessionsRoutes, { prefix: '/api/v1' });
  await fastify.register(graphRoutes, { prefix: '/api/v1' });
  await fastify.register(codRoutes, { prefix: '/api/v1' });

  // Error handler
  fastify.setErrorHandler(
    (error: Error & { statusCode?: number }, request, reply) => {
      fastify.log.error(error);
      reply.code(error.statusCode || 500).send({
        error: error.name || 'InternalError',
        message: error.message,
        statusCode: error.statusCode || 500,
      });
    }
  );

  // Start server
  try {
    await fastify.listen({ port: config.port, host: config.host });
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                     VAULT API SERVER                       ║
╠════════════════════════════════════════════════════════════╣
║  Status:     Running                                       ║
║  Port:       ${String(config.port).padEnd(44)}║
║  Host:       ${config.host.padEnd(44)}║
║  Env:        ${config.nodeEnv.padEnd(44)}║
║  Auth:       ${(config.authEnabled ? 'Enabled' : 'Disabled (stub)').padEnd(44)}║
╚════════════════════════════════════════════════════════════╝

Endpoints:
  GET  /health                    - Health check
  GET  /api/v1/tools              - List all tools
  GET  /api/v1/tools/:name        - Get tool info
  POST /api/v1/tools/:name/execute - Execute a tool

  GET  /api/v1/notes              - List notes
  GET  /api/v1/notes/search       - Search notes
  GET  /api/v1/tasks              - List tasks
  GET  /api/v1/tasks/next-actions - Get COD-aware next actions
  GET  /api/v1/sessions           - List sessions
  GET  /api/v1/graph/search       - Search knowledge graph
  GET  /api/v1/cod/avatar         - Get avatar state
  GET  /api/v1/cod/hard-stop      - Get HARD_STOP status
`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
