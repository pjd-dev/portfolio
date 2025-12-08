import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/supabase.js';
import type { AuthTokens } from '../types/auth.js';

interface TokenPayload {
  id: string;
  email: string;
  role?: string;
}

/**
 * Create JWT access and refresh tokens
 */
export function createTokens(payload: TokenPayload): AuthTokens {
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'vault-auth',
    audience: 'vault-api',
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(
    { id: payload.id },
    JWT_SECRET,
    {
      expiresIn: '30d',
      issuer: 'vault-auth',
      audience: 'vault-api',
    } as jwt.SignOptions
  );

  // Calculate expiration time in seconds
  const decoded = jwt.decode(accessToken) as any;
  const expiresIn = decoded.exp - decoded.iat;

  return {
    accessToken,
    refreshToken,
    expiresIn,
    tokenType: 'Bearer',
  };
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      issuer: 'vault-auth',
      audience: 'vault-api',
    }) as TokenPayload;

    return payload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Decode JWT token without verification (for inspection)
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
}
