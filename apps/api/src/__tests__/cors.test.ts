import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';

/**
 * Ensures CORS settings work for viewer proxy origins.
 */
describe('CORS configuration', () => {
  let app: FastifyInstance;
  const allowed = ['http://localhost:8000', 'http://localhost:4200'];

  beforeAll(async () => {
    app = Fastify({ logger: false });
    await app.register(cors, {
      origin: allowed,
      credentials: true,
    });
    app.get('/ping', async () => ({ ok: true }));
    await app.ready();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('allows viewer origins', async () => {
    for (const origin of allowed) {
      const res = await app.inject({
        method: 'GET',
        url: '/ping',
        headers: { origin },
      });
      expect(res.statusCode).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe(origin);
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    }
  });

  it('rejects disallowed origin', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/ping',
      headers: { origin: 'https://evil.test' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
