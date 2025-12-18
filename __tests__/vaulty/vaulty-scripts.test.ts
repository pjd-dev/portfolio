import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Vaulty Scripts Tests
 * Tests configuration and environment handling for vaulty bash scripts.
 * Does NOT actually run git or sync commands.
 */

const REPO_ROOT = join(__dirname, '../..');
const VAULTY_DIR = join(REPO_ROOT, 'apps/vaulty');
const VAULTY_SRC = join(VAULTY_DIR, 'src');
const VAULTY_SCRIPTS = join(VAULTY_DIR, 'script');

describe('Vaulty Scripts - File Existence', () => {
  it('should have restart-vaulty.sh', () => {
    expect(existsSync(join(VAULTY_DIR, 'restart-vaulty.sh'))).toBe(true);
  });

  it('should have vault-init.sh', () => {
    expect(existsSync(join(VAULTY_SRC, 'vault-init.sh'))).toBe(true);
  });

  it('should have git-sync.sh', () => {
    expect(existsSync(join(VAULTY_SRC, 'git-sync.sh'))).toBe(true);
  });

  it('should have git-sync-realtime.sh', () => {
    expect(existsSync(join(VAULTY_SRC, 'git-sync-realtime.sh'))).toBe(true);
  });

  it('should have Dockerfile', () => {
    expect(existsSync(join(VAULTY_DIR, 'Dockerfile'))).toBe(true);
  });

  it('should have .env.example', () => {
    expect(existsSync(join(VAULTY_DIR, '.env.example'))).toBe(true);
  });
});

describe('Vaulty Scripts - Script Structure', () => {
  describe('restart-vaulty.sh', () => {
    let content: string;

    it('should exist and be readable', () => {
      expect(() => {
        content = readFileSync(join(VAULTY_DIR, 'restart-vaulty.sh'), 'utf-8');
      }).not.toThrow();
    });

    it('should have proper error handling', () => {
      content = readFileSync(join(VAULTY_DIR, 'restart-vaulty.sh'), 'utf-8');
      expect(content).toContain('set -euo pipefail');
    });

    it('should source required script files', () => {
      content = readFileSync(join(VAULTY_DIR, 'restart-vaulty.sh'), 'utf-8');
      expect(content).toContain('source "$SCRIPT_DIR/common.sh"');
      expect(content).toContain('source "$SCRIPT_DIR/prepare.sh"');
      expect(content).toContain('source "$SCRIPT_DIR/build.sh"');
      expect(content).toContain('source "$SCRIPT_DIR/pod.sh"');
      expect(content).toContain('source "$SCRIPT_DIR/run.sh"');
    });

    it('should check for healthcheck', () => {
      content = readFileSync(join(VAULTY_DIR, 'restart-vaulty.sh'), 'utf-8');
      expect(content).toContain('health_check');
    });
  });

  describe('vault-init.sh', () => {
    let content: string;

    it('should validate vault mount', () => {
      content = readFileSync(join(VAULTY_SRC, 'vault-init.sh'), 'utf-8');
      expect(content).toContain('mountpoint -q /vault');
      expect(content).toContain('Vault volume /vault is not mounted');
    });

    it('should handle git initialization', () => {
      content = readFileSync(join(VAULTY_SRC, 'vault-init.sh'), 'utf-8');
      expect(content).toContain('GIT_USERNAME');
      expect(content).toContain('GIT_TOKEN');
      expect(content).toContain('GIT_REPO');
      expect(content).toContain('git clone');
      expect(content).toContain('git init');
    });

    it('should configure git identity', () => {
      content = readFileSync(join(VAULTY_SRC, 'vault-init.sh'), 'utf-8');
      expect(content).toContain('GIT_USER_NAME');
      expect(content).toContain('GIT_USER_EMAIL');
      expect(content).toContain('git -C /vault config user.name');
      expect(content).toContain('git -C /vault config user.email');
    });

    it('should handle vault seeding', () => {
      content = readFileSync(join(VAULTY_SRC, 'vault-init.sh'), 'utf-8');
      expect(content).toContain('.vault-seeded');
      expect(content).toContain('Seeding vault');
      expect(content).toContain('seed.py');
    });

    it('should support sync modes', () => {
      content = readFileSync(join(VAULTY_SRC, 'vault-init.sh'), 'utf-8');
      expect(content).toContain('SYNC_MODE');
      expect(content).toContain('realtime');
      expect(content).toContain('git-sync-realtime.sh');
      expect(content).toContain('git-sync.sh');
    });
  });

  describe('git-sync.sh', () => {
    let content: string;

    it('should use proper interval sync', () => {
      content = readFileSync(join(VAULTY_SRC, 'git-sync.sh'), 'utf-8');
      expect(content).toContain('GIT_SYNC_INTERVAL');
      expect(content).toContain('while true');
      expect(content).toContain('sleep');
    });

    it('should reference vault path', () => {
      content = readFileSync(join(VAULTY_SRC, 'git-sync.sh'), 'utf-8');
      expect(content).toContain('VAULT_PATH');
      expect(content).toContain('/vault');
    });

    it('should show git status diagnostics', () => {
      content = readFileSync(join(VAULTY_SRC, 'git-sync.sh'), 'utf-8');
      expect(content).toContain('git status');
      expect(content).toContain('pre-sync git status');
    });

    it('should use python sync script', () => {
      content = readFileSync(join(VAULTY_SRC, 'git-sync.sh'), 'utf-8');
      expect(content).toContain('python3');
      expect(content).toContain('sync.py');
    });

    it('should validate LOCAL_VAULT_PATH on startup', () => {
      content = readFileSync(join(VAULTY_SRC, 'git-sync.sh'), 'utf-8');
      expect(content).toContain('LOCAL_VAULT_PATH');
      expect(content).toContain('[ -d "$LOCAL_VAULT_PATH" ]');
      expect(content).toContain('does not exist');
    });

    it('should sync local to volume if configured', () => {
      content = readFileSync(join(VAULTY_SRC, 'git-sync.sh'), 'utf-8');
      expect(content).toContain('Syncing local path to vault volume');
      expect(content).toContain('📥');
      expect(content).toContain('LOCAL_VAULT_PATH');
      expect(content).toContain('VAULT_DATA_VOLUME');
    });

    it('should sync volume to local after git sync', () => {
      content = readFileSync(join(VAULTY_SRC, 'git-sync.sh'), 'utf-8');
      expect(content).toContain('Syncing vault volume to local path');
      expect(content).toContain('📤');
      expect(content).toContain('cp -a /src/. /dst/');
    });

    it('should handle bidirectional sync (local → volume → github → volume → local)', () => {
      content = readFileSync(join(VAULTY_SRC, 'git-sync.sh'), 'utf-8');
      // Local to volume
      expect(content).toContain('Syncing local path to vault volume');
      // Volume to github (via python sync)
      expect(content).toContain('sync.py');
      // Github to volume (implicit in sync.py)
      // Volume to local
      expect(content).toContain('Syncing vault volume to local path');
    });
  });

  describe('git-sync-realtime.sh', () => {
    let content: string;

    it('should use inotify for file watching', () => {
      content = readFileSync(join(VAULTY_SRC, 'git-sync-realtime.sh'), 'utf-8');
      expect(content).toContain('inotifywait');
      expect(content).toContain('modify,create,delete');
    });

    it('should handle git operations', () => {
      content = readFileSync(join(VAULTY_SRC, 'git-sync-realtime.sh'), 'utf-8');
      expect(content).toContain('git add');
      expect(content).toContain('git commit');
      expect(content).toContain('git push');
    });

    it('should use commit message from environment', () => {
      content = readFileSync(join(VAULTY_SRC, 'git-sync-realtime.sh'), 'utf-8');
      expect(content).toContain('GIT_COMMIT_MESSAGE');
      expect(content).toContain('auto-sync');
    });

    it('should have watch loop', () => {
      content = readFileSync(join(VAULTY_SRC, 'git-sync-realtime.sh'), 'utf-8');
      expect(content).toContain('while true');
      expect(content).toContain('Watching');
    });
  });
});

describe('Vaulty Scripts - Environment Configuration', () => {
  it('.env.example should have required git variables', () => {
    const content = readFileSync(join(VAULTY_DIR, '.env.example'), 'utf-8');
    expect(content).toContain('GIT_TOKEN');
    expect(content).toContain('GIT_USERNAME');
    expect(content).toContain('GIT_REPO');
  });

  it('.env.example should have sync configuration', () => {
    const content = readFileSync(join(VAULTY_DIR, '.env.example'), 'utf-8');
    expect(content).toContain('GIT_SYNC_INTERVAL');
    expect(content).toContain('GIT_SYNC_PUSH');
  });

  it('.env.example should have git user configuration', () => {
    const content = readFileSync(join(VAULTY_DIR, '.env.example'), 'utf-8');
    expect(content).toContain('GIT_USER');
  });
});

describe('Vaulty Scripts - Dockerfile', () => {
  let content: string;

  it('should install required dependencies', () => {
    content = readFileSync(join(VAULTY_DIR, 'Dockerfile'), 'utf-8');
    expect(content).toContain('git');
    expect(content).toContain('python3');
  });

  it('should copy necessary scripts', () => {
    content = readFileSync(join(VAULTY_DIR, 'Dockerfile'), 'utf-8');
    expect(content).toMatch(/COPY.*git-sync/i);
    expect(content).toMatch(/COPY.*vault-init/i);
  });

  it('should set proper entrypoint', () => {
    content = readFileSync(join(VAULTY_DIR, 'Dockerfile'), 'utf-8');
    expect(content).toContain('ENTRYPOINT');
  });

  it('should configure vault volume', () => {
    content = readFileSync(join(VAULTY_DIR, 'Dockerfile'), 'utf-8');
    expect(content).toContain('VOLUME');
    expect(content).toContain('/vault');
  });
});

describe('Vaulty Scripts - Health Monitoring', () => {
  it('should reference health status in README', () => {
    const content = readFileSync(join(VAULTY_DIR, 'README.md'), 'utf-8');
    expect(content).toContain('Health');
    expect(content).toContain('.sync-status.json');
    expect(content).toContain('healthy');
  });

  it('README should document sync modes', () => {
    const content = readFileSync(join(VAULTY_DIR, 'README.md'), 'utf-8');
    expect(content).toContain('interval');
    expect(content).toContain('realtime');
    expect(content).toContain('SYNC_MODE');
  });
});
