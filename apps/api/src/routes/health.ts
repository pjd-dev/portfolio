import type { FastifyInstance } from 'fastify';

/**
 * Health check routes
 */
export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  // Basic health check
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      service: 'vault-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // Detailed health with dependencies
  fastify.get('/health/detailed', async () => {
    return {
      status: 'ok',
      service: 'vault-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      node: process.version,
    };
  });
}
