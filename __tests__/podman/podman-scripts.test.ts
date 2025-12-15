import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Podman Scripts Tests
 * Tests configuration and environment handling for podman scripts.
 * Does NOT actually run podman commands (would require podman installed).
 */

const REPO_ROOT = join(__dirname, '../..');
const PODMAN_DIR = join(REPO_ROOT, 'podman');

describe('Podman Scripts - File Existence', () => {
  it('should have run-all.sh', () => {
    expect(existsSync(join(PODMAN_DIR, 'run-all.sh'))).toBe(true);
  });

  it('should have run-mcp.sh', () => {
    expect(existsSync(join(PODMAN_DIR, 'run-mcp.sh'))).toBe(true);
  });

  it('should have run-vault.sh', () => {
    expect(existsSync(join(PODMAN_DIR, 'run-vault.sh'))).toBe(true);
  });

  it('should have podman-compose.sh', () => {
    expect(existsSync(join(PODMAN_DIR, 'podman-compose.sh'))).toBe(true);
  });
});

describe('Podman Scripts - Script Content Validation', () => {
  describe('run-all.sh', () => {
    it('should call run-vault.sh and run-mcp.sh', () => {
      const content = readFileSync(join(PODMAN_DIR, 'run-all.sh'), 'utf-8');
      expect(content).toContain('run-vault.sh');
      expect(content).toContain('run-mcp.sh');
    });
  });

  describe('run-mcp.sh', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(join(PODMAN_DIR, 'run-mcp.sh'), 'utf-8');
    });

    it('should source .env file', () => {
      expect(content).toContain('source "$ENV_FILE"');
    });

    it('should build mcp image', () => {
      expect(content).toContain('podman build -t mcp');
    });

    it('should use VAULT_DATA_VOLUME with default', () => {
      expect(content).toContain('${VAULT_DATA_VOLUME:-vault}');
    });

    it('should use MCP_PORT with default 4000', () => {
      expect(content).toContain('${MCP_PORT:-4000}');
    });

    it('should mount /vault volume', () => {
      expect(content).toContain(':/vault');
    });
  });

  describe('run-vault.sh', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(join(PODMAN_DIR, 'run-vault.sh'), 'utf-8');
    });

    it('should source .env file', () => {
      expect(content).toContain('source "$ENV_FILE"');
    });

    it('should build vault image', () => {
      expect(content).toContain('podman build -t vault');
    });

    it('should use VAULT_DATA_VOLUME with default', () => {
      expect(content).toContain('${VAULT_DATA_VOLUME:-vault}');
    });

    it('should pass env-file to container', () => {
      expect(content).toContain('--env-file');
    });

    it('should name container vaulty', () => {
      expect(content).toContain('--name vaulty');
    });
  });

  describe('podman-compose.sh', () => {
    let content: string;

    beforeEach(() => {
      content = readFileSync(join(PODMAN_DIR, 'podman-compose.sh'), 'utf-8');
    });

    it('should source .env file', () => {
      expect(content).toContain('source "$ENV_FILE"');
    });

    it('should accept volume name as first argument', () => {
      expect(content).toContain('VOLUME_NAME="${1:-');
    });

    it('should accept local path as second argument', () => {
      expect(content).toContain('LOCAL_PATH="${2:-');
    });

    it('should call init-volume.sh', () => {
      expect(content).toContain('init-volume.sh');
    });

    it('should build both vault and mcp images', () => {
      expect(content).toContain('podman build -t vault');
      expect(content).toContain('podman build -t mcp');
    });

    it('should start vaulty container with SYNC_MODE', () => {
      expect(content).toContain('SYNC_MODE');
      expect(content).toContain('--name vaulty');
    });

    it('should start mcp container with port mapping', () => {
      expect(content).toContain('--name mcp');
      expect(content).toContain('${MCP_PORT:-4000}');
    });

    it('should start sync process in background', () => {
      expect(content).toContain('sync-volume-to-local.sh');
      expect(content).toContain('&');
    });
  });
});

describe('Podman Scripts - Environment Variable Defaults', () => {
  let originalEnv: Record<string, string | undefined>;

  beforeEach(() => {
    originalEnv = {
      VAULT_DATA_VOLUME: process.env.VAULT_DATA_VOLUME,
      MCP_PORT: process.env.MCP_PORT,
      SYNC_MODE: process.env.SYNC_MODE,
      SYNC_INTERVAL: process.env.SYNC_INTERVAL,
    };
  });

  afterEach(() => {
    Object.entries(originalEnv).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  });

  it('should default VAULT_DATA_VOLUME to "vault"', () => {
    delete process.env.VAULT_DATA_VOLUME;
    const volume = process.env.VAULT_DATA_VOLUME || 'vault';
    expect(volume).toBe('vault');
  });

  it('should default MCP_PORT to 4000', () => {
    delete process.env.MCP_PORT;
    const port = process.env.MCP_PORT || '4000';
    expect(port).toBe('4000');
  });

  it('should default SYNC_MODE to "interval"', () => {
    delete process.env.SYNC_MODE;
    const mode = process.env.SYNC_MODE || 'interval';
    expect(mode).toBe('interval');
  });

  it('should default SYNC_INTERVAL to 60', () => {
    delete process.env.SYNC_INTERVAL;
    const interval = process.env.SYNC_INTERVAL || '60';
    expect(interval).toBe('60');
  });

  it('should allow overriding VAULT_DATA_VOLUME', () => {
    process.env.VAULT_DATA_VOLUME = 'custom-vault';
    expect(process.env.VAULT_DATA_VOLUME).toBe('custom-vault');
  });

  it('should allow overriding MCP_PORT', () => {
    process.env.MCP_PORT = '5000';
    expect(process.env.MCP_PORT).toBe('5000');
  });
});

describe('Podman Scripts - Dockerfile References', () => {
  it('should reference apps/mcp/Dockerfile for mcp', () => {
    const content = readFileSync(join(PODMAN_DIR, 'run-mcp.sh'), 'utf-8');
    expect(content).toContain('apps/mcp/Dockerfile');
  });

  it('should reference apps/vaulty/Dockerfile for vault', () => {
    const content = readFileSync(join(PODMAN_DIR, 'run-vault.sh'), 'utf-8');
    expect(content).toContain('apps/vaulty/Dockerfile');
  });

  it('should have Dockerfile in apps/mcp', () => {
    expect(existsSync(join(REPO_ROOT, 'apps/mcp/Dockerfile'))).toBe(true);
  });

  it('should have Dockerfile in apps/vaulty', () => {
    expect(existsSync(join(REPO_ROOT, 'apps/vaulty/Dockerfile'))).toBe(true);
  });
});

describe('Podman Scripts - Service Files', () => {
  it('should have mcp.service systemd unit', () => {
    expect(existsSync(join(PODMAN_DIR, 'mcp.service'))).toBe(true);
  });

  it('should have vault.service systemd unit', () => {
    expect(existsSync(join(PODMAN_DIR, 'vault.service'))).toBe(true);
  });
});
