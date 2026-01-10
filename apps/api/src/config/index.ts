import 'dotenv/config';

export const config = {
  // Server
  port: parseInt(process.env.PORT || '4200', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',

  // CORS - Allow multiple origins for viewer, proxy, and development
  corsOrigin: parseCorsOrigin(process.env.CORS_ORIGIN),

  // Vault
  vaultRoot: process.env.VAULT_ROOT || process.env.VAULT_PATH || '/vault', // default for containers,

  // Auth
  authEnabled: process.env.AUTH_ENABLED === 'true',
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:4100',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
} as const;

export function validateConfig(): void {
  const errors: string[] = [];

  if (!config.vaultRoot) {
    errors.push('VAULT_ROOT/VAULT_PATH is required (default /vault)');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
}

function parseCorsOrigin(raw: string | undefined): true | string | string[] {
  // Default: allow all in dev for local viewer/proxy setups
  if (!raw || raw.trim().length === 0) return true;
  if (raw === 'true') return true;
  if (raw === 'false') return '';
  // Support comma-separated list of origins
  const origins = raw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  if (origins.length === 1) return origins[0];
  return origins;
}
