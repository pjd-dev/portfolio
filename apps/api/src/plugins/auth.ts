import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config/index.js';

/**
 * Auth middleware stub
 *
 * When AUTH_ENABLED=true, this will verify tokens against the auth service.
 * For now, it's a passthrough that adds a stub user context.
 */
export interface AuthContext {
  userId: string;
  scopes: string[];
  authenticated: boolean;
}

declare module 'fastify' {
  interface FastifyRequest {
    auth: AuthContext;
  }
}

export async function authPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.decorateRequest('auth', undefined as any);

  fastify.addHook(
    'preHandler',
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!config.authEnabled) {
        // Stub auth context when auth is disabled
        request.auth = {
          userId: 'dev-user',
          scopes: ['read', 'write', 'admin'],
          authenticated: false,
        };
        return;
      }

      // Extract bearer token
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        reply.code(401).send({
          error: 'Unauthorized',
          message: 'Missing or invalid Authorization header',
        });
        return;
      }

      const token = authHeader.slice(7);

      try {
        // TODO: Verify token with auth service
        // For now, just decode and trust (will be replaced with real verification)
        const payload = decodeTokenPayload(token);

        request.auth = {
          userId: payload.sub || 'unknown',
          scopes: payload.scopes || ['read'],
          authenticated: true,
        };
      } catch (error) {
        reply.code(401).send({
          error: 'Unauthorized',
          message: 'Invalid token',
        });
      }
    }
  );
}

/**
 * Decode JWT payload without verification (stub)
 * Will be replaced with proper verification against auth service
 */
function decodeTokenPayload(token: string): {
  sub?: string;
  scopes?: string[];
} {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(payload) as { sub?: string; scopes?: string[] };
  } catch {
    return { sub: 'unknown', scopes: ['read'] };
  }
}

/**
 * Scope checking helper
 */
export function requireScope(scope: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (
      !request.auth.scopes.includes(scope) &&
      !request.auth.scopes.includes('admin')
    ) {
      reply.code(403).send({
        error: 'Forbidden',
        message: `Missing required scope: ${scope}`,
      });
    }
  };
}
