/**
 * Root Script Directory Tests
 * Tests for scripts in /script directory
 * - cloudflared.tunnel.sh: Cloudflare tunnel management
 * - common.sh: Shared utilities and functions
 * - init-volume.sh: Volume initialization
 * - sync-volume-to-local.sh: Volume synchronization
 * - verify-shared-vault.sh: Vault mount verification
 * - restart-all.sh: Complete platform restart
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const WORKSPACE_ROOT = join(__dirname, '..', '..');
const SCRIPT_DIR = join(WORKSPACE_ROOT, 'script');

describe('Root Scripts - File Existence', () => {
  it('should have cloudflared.tunnel.sh', () => {
    expect(existsSync(join(SCRIPT_DIR, 'cloudflared.tunnel.sh'))).toBe(true);
  });

  it('should have common.sh', () => {
    expect(existsSync(join(SCRIPT_DIR, 'common.sh'))).toBe(true);
  });

  it('should have init-volume.sh', () => {
    expect(existsSync(join(SCRIPT_DIR, 'init-volume.sh'))).toBe(true);
  });

  it('should have restart-all.sh', () => {
    expect(existsSync(join(SCRIPT_DIR, 'restart-all.sh'))).toBe(true);
  });

  it('should have sync-volume-to-local.sh', () => {
    expect(existsSync(join(SCRIPT_DIR, 'sync-volume-to-local.sh'))).toBe(true);
  });

  it('should have verify-shared-vault.sh', () => {
    expect(existsSync(join(SCRIPT_DIR, 'verify-shared-vault.sh'))).toBe(true);
  });
});

describe('common.sh - Shared Utilities', () => {
  let content: string;

  it('should have proper shebang', () => {
    content = readFileSync(join(SCRIPT_DIR, 'common.sh'), 'utf-8');
    expect(content).toMatch(/^#!\/usr\/bin\/env bash/);
  });

  it('should have ROOT_DIR or info functions', () => {
    content = readFileSync(join(SCRIPT_DIR, 'common.sh'), 'utf-8');
    expect(content).toMatch(/ROOT_DIR|info\(\)/);
  });

  it('should have load_env_files function', () => {
    content = readFileSync(join(SCRIPT_DIR, 'common.sh'), 'utf-8');
    expect(content).toContain('load_env_files()');
    expect(content).toContain('set -o allexport');
    expect(content).toContain('set +o allexport');
  });

  it('should have logging functions', () => {
    content = readFileSync(join(SCRIPT_DIR, 'common.sh'), 'utf-8');
    expect(content).toContain('info()');
    expect(content).toContain('warn()');
    expect(content).toContain('fail()');
  });

  it('should have ensure_command function', () => {
    content = readFileSync(join(SCRIPT_DIR, 'common.sh'), 'utf-8');
    expect(content).toContain('ensure_command()');
    expect(content).toContain('command -v');
  });

  it('should have resolve_path function', () => {
    content = readFileSync(join(SCRIPT_DIR, 'common.sh'), 'utf-8');
    expect(content).toContain('resolve_path()');
  });

  it('should detect root directory', () => {
    content = readFileSync(join(SCRIPT_DIR, 'common.sh'), 'utf-8');
    expect(content).toMatch(/ROOT_DIR|SCRIPT_DIR/);
    expect(content).toContain('dirname');
  });
});

describe('cloudflared.tunnel.sh - Cloudflare Tunnel', () => {
  let content: string;

  it('should source common.sh', () => {
    content = readFileSync(join(SCRIPT_DIR, 'cloudflared.tunnel.sh'), 'utf-8');
    expect(content).toContain('source');
    expect(content).toContain('common.sh');
  });

  it('should use CF_TUNNEL_NAME variable', () => {
    content = readFileSync(join(SCRIPT_DIR, 'cloudflared.tunnel.sh'), 'utf-8');
    expect(content).toContain('CF_TUNNEL_NAME');
  });

  it('should use CF_TUNNEL_CONFIG variable', () => {
    content = readFileSync(join(SCRIPT_DIR, 'cloudflared.tunnel.sh'), 'utf-8');
    expect(content).toContain('CF_TUNNEL_CONFIG');
  });

  it('should run cloudflared tunnel command', () => {
    content = readFileSync(join(SCRIPT_DIR, 'cloudflared.tunnel.sh'), 'utf-8');
    expect(content).toContain('cloudflared');
    expect(content).toContain('tunnel');
  });
});

describe('init-volume.sh - Volume Initialization', () => {
  let content: string;

  it('should source common.sh', () => {
    content = readFileSync(join(SCRIPT_DIR, 'init-volume.sh'), 'utf-8');
    expect(content).toContain('source');
    expect(content).toContain('common.sh');
  });

  it('should use VAULT_DATA_VOLUME variable', () => {
    content = readFileSync(join(SCRIPT_DIR, 'init-volume.sh'), 'utf-8');
    expect(content).toContain('VAULT_DATA_VOLUME');
  });

  it('should use LOCAL_VAULT_PATH variable', () => {
    content = readFileSync(join(SCRIPT_DIR, 'init-volume.sh'), 'utf-8');
    expect(content).toContain('LOCAL_VAULT_PATH');
  });

  it('should create volume if needed', () => {
    content = readFileSync(join(SCRIPT_DIR, 'init-volume.sh'), 'utf-8');
    expect(content).toContain('podman volume create');
  });

  it('should copy files including hidden files', () => {
    content = readFileSync(join(SCRIPT_DIR, 'init-volume.sh'), 'utf-8');
    expect(content).toContain('cp -a');
    expect(content).toMatch(/\/\./); // Should copy hidden files
  });

  it('should mount volume in temporary container', () => {
    content = readFileSync(join(SCRIPT_DIR, 'init-volume.sh'), 'utf-8');
    expect(content).toContain('podman run');
    expect(content).toContain('--rm');
    expect(content).toContain('-v');
  });
});

describe('sync-volume-to-local.sh - Volume Synchronization', () => {
  let content: string;

  it('should source common.sh', () => {
    content = readFileSync(
      join(SCRIPT_DIR, 'sync-volume-to-local.sh'),
      'utf-8'
    );
    expect(content).toContain('source');
    expect(content).toContain('common.sh');
  });

  it('should use VAULT_DATA_VOLUME variable', () => {
    content = readFileSync(
      join(SCRIPT_DIR, 'sync-volume-to-local.sh'),
      'utf-8'
    );
    expect(content).toContain('VAULT_DATA_VOLUME');
  });

  it('should use LOCAL_VAULT_PATH variable', () => {
    content = readFileSync(
      join(SCRIPT_DIR, 'sync-volume-to-local.sh'),
      'utf-8'
    );
    expect(content).toContain('LOCAL_VAULT_PATH');
  });

  it('should use Alpine-compatible cp flags', () => {
    content = readFileSync(
      join(SCRIPT_DIR, 'sync-volume-to-local.sh'),
      'utf-8'
    );
    expect(content).toContain('cp -rpu');
  });

  it('should support continuous sync mode', () => {
    content = readFileSync(
      join(SCRIPT_DIR, 'sync-volume-to-local.sh'),
      'utf-8'
    );
    expect(content).toMatch(/INTERVAL|continuous|while true/);
  });

  it('should validate volume exists', () => {
    content = readFileSync(
      join(SCRIPT_DIR, 'sync-volume-to-local.sh'),
      'utf-8'
    );
    expect(content).toMatch(/podman volume (exists|inspect)/);
  });
});

describe('verify-shared-vault.sh - Vault Mount Verification', () => {
  let content: string;

  it('should source common.sh', () => {
    content = readFileSync(join(SCRIPT_DIR, 'verify-shared-vault.sh'), 'utf-8');
    expect(content).toContain('source');
    expect(content).toContain('common.sh');
  });

  it('should check both containers', () => {
    content = readFileSync(join(SCRIPT_DIR, 'verify-shared-vault.sh'), 'utf-8');
    expect(content).toContain('vaulty');
    expect(content).toContain('mcp');
  });

  it('should verify volume mounts', () => {
    content = readFileSync(join(SCRIPT_DIR, 'verify-shared-vault.sh'), 'utf-8');
    expect(content).toMatch(/podman (exec|inspect)/);
    expect(content).toContain('/vault');
  });

  it('should check mount sources', () => {
    content = readFileSync(join(SCRIPT_DIR, 'verify-shared-vault.sh'), 'utf-8');
    expect(content).toMatch(/mount|source|Mounts/);
  });
});

describe('restart-all.sh - Platform Restart', () => {
  let content: string;

  it('should source common.sh', () => {
    content = readFileSync(join(SCRIPT_DIR, 'restart-all.sh'), 'utf-8');
    expect(content).toContain('source');
    expect(content).toContain('common.sh');
  });

  it('should stop and remove pods', () => {
    content = readFileSync(join(SCRIPT_DIR, 'restart-all.sh'), 'utf-8');
    expect(content).toContain('podman pod stop');
    expect(content).toContain('podman pod rm');
  });

  it('should restart vaulty app', () => {
    content = readFileSync(join(SCRIPT_DIR, 'restart-all.sh'), 'utf-8');
    expect(content).toContain('restart-vaulty');
  });

  it('should restart mcp app', () => {
    content = readFileSync(join(SCRIPT_DIR, 'restart-all.sh'), 'utf-8');
    expect(content).toContain('restart-mcp');
  });

  it('should call sync-volume-to-local.sh', () => {
    content = readFileSync(join(SCRIPT_DIR, 'restart-all.sh'), 'utf-8');
    expect(content).toContain('sync-volume-to-local.sh');
  });
});

describe('Script Integration', () => {
  it('all scripts should be executable bash scripts', () => {
    const scripts = [
      'cloudflared.tunnel.sh',
      'common.sh',
      'init-volume.sh',
      'restart-all.sh',
      'sync-volume-to-local.sh',
      'verify-shared-vault.sh',
    ];

    scripts.forEach((script) => {
      const content = readFileSync(join(SCRIPT_DIR, script), 'utf-8');
      expect(content).toMatch(/^#!/);
    });
  });

  it('all scripts except common.sh should source common.sh', () => {
    const scripts = [
      'cloudflared.tunnel.sh',
      'init-volume.sh',
      'restart-all.sh',
      'sync-volume-to-local.sh',
      'verify-shared-vault.sh',
    ];

    scripts.forEach((script) => {
      const content = readFileSync(join(SCRIPT_DIR, script), 'utf-8');
      expect(content).toContain('common.sh');
    });
  });
});
