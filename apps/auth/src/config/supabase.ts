import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase configuration
export const SUPABASE_URL = process.env.SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// JWT configuration
export const JWT_SECRET = process.env.JWT_SECRET || 'vault-secret-key-change-in-production';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Server configuration
export const PORT = parseInt(process.env.AUTH_PORT || '3001', 10);
export const NODE_ENV = process.env.NODE_ENV || 'development';

// OAuth providers configuration
export const OAUTH_PROVIDERS = {
  google: {
    enabled: process.env.OAUTH_GOOGLE_ENABLED === 'true',
    clientId: process.env.OAUTH_GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.OAUTH_GOOGLE_CLIENT_SECRET || '',
  },
  github: {
    enabled: process.env.OAUTH_GITHUB_ENABLED === 'true',
    clientId: process.env.OAUTH_GITHUB_CLIENT_ID || '',
    clientSecret: process.env.OAUTH_GITHUB_CLIENT_SECRET || '',
  },
  discord: {
    enabled: process.env.OAUTH_DISCORD_ENABLED === 'true',
    clientId: process.env.OAUTH_DISCORD_CLIENT_ID || '',
    clientSecret: process.env.OAUTH_DISCORD_CLIENT_SECRET || '',
  },
};

// CORS configuration
export const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Create Supabase clients
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
  },
});

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Validate required environment variables
export function validateConfig(): void {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
