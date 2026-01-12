import type { FastifyInstance } from 'fastify';
import { listPipelines, readPipeline, writePipeline } from '@vault/handlers';

export async function pipelinesRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/pipelines', async () => {
    const names = await listPipelines();
    return { pipelines: names };
  });

  fastify.get<{ Params: { name: string } }>(
    '/pipelines/:name',
    async (req, reply) => {
      const { name } = req.params;
      try {
        const pipeline = await readPipeline(name);
        return { name, pipeline };
      } catch (error) {
        reply.code(404).send({ error: 'NotFound', message: String(error) });
      }
    }
  );

  fastify.post<{ Body: { name: string; pipeline: unknown } }>(
    '/pipelines',
    async (req, reply) => {
      const { name, pipeline } = req.body || {};
      if (!name || !pipeline || typeof pipeline !== 'object') {
        reply
          .code(400)
          .send({ error: 'BadRequest', message: 'name + pipeline required' });
        return;
      }
      try {
        const result = await writePipeline(name, pipeline);
        return { success: true, ...result };
      } catch (error: any) {
        reply
          .code(400)
          .send({
            error: 'ValidationFailed',
            message: error.message || String(error),
          });
      }
    }
  );
}
