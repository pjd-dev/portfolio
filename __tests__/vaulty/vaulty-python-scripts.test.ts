/**
 * Vaulty Python Scripts Tests
 * Tests for Python scripts that run inside the Vaulty container
 * - healthcheck.py: Health status monitoring
 * - seed.py: Vault initialization and seeding
 * - sync.py: Git synchronization with safety features
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const WORKSPACE_ROOT = join(__dirname, '..', '..');
const VAULTY_SCRIPTS_DIR = join(
  WORKSPACE_ROOT,
  'apps',
  'vaulty',
  'src',
  'scripts'
);

describe('Vaulty Python Scripts - File Existence', () => {
  it('should have healthcheck.py', () => {
    const path = join(VAULTY_SCRIPTS_DIR, 'healthcheck.py');
    expect(existsSync(path)).toBe(true);
  });

  it('should have seed.py', () => {
    const path = join(VAULTY_SCRIPTS_DIR, 'seed.py');
    expect(existsSync(path)).toBe(true);
  });

  it('should have sync.py', () => {
    const path = join(VAULTY_SCRIPTS_DIR, 'sync.py');
    expect(existsSync(path)).toBe(true);
  });
});

describe('healthcheck.py - Health Monitoring', () => {
  let content: string;

  it('should be executable Python script', () => {
    content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'healthcheck.py'), 'utf-8');
    expect(content).toMatch(/^#!\/usr\/bin\/env python3/);
  });

  it('should check .sync-status.json', () => {
    content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'healthcheck.py'), 'utf-8');
    expect(content).toContain('.sync-status.json');
    expect(content).toContain('STATUS_PATH');
  });

  it('should validate status field', () => {
    content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'healthcheck.py'), 'utf-8');
    expect(content).toContain('status.get("status"');
    expect(content).toContain('healthy');
    expect(content).toContain('running');
  });

  it('should check last sync timestamp', () => {
    content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'healthcheck.py'), 'utf-8');
    expect(content).toContain('last_sync');
    expect(content).toContain('datetime.fromisoformat');
  });

  it('should have configurable max age', () => {
    content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'healthcheck.py'), 'utf-8');
    expect(content).toContain('HEALTH_CHECK_MAX_AGE');
    expect(content).toContain('os.getenv');
  });

  it('should report metrics', () => {
    content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'healthcheck.py'), 'utf-8');
    expect(content).toContain('metrics');
    expect(content).toContain('total_changes');
    expect(content).toContain('commits');
  });

  it('should exit with proper codes', () => {
    content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'healthcheck.py'), 'utf-8');
    expect(content).toContain('sys.exit');
    expect(content).toContain('return 0');
    expect(content).toContain('return 1');
  });
});

describe('seed.py - Vault Initialization', () => {
  let content: string;

  it('should be executable Python script', () => {
    content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'seed.py'), 'utf-8');
    expect(content).toMatch(/^#!\/usr\/bin\/env python3/);
  });

  it('should use environment variables for paths', () => {
    content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'seed.py'), 'utf-8');
    expect(content).toContain('VAULT_PATH');
    expect(content).toContain('SEEDS_PATH');
    expect(content).toContain('os.getenv');
  });

  it('should check seeding marker', () => {
    content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'seed.py'), 'utf-8');
    expect(content).toContain('.vault-seeded');
    expect(content).toContain('is_vault_seeded');
    expect(content).toContain('mark_vault_seeded');
  });

  it('should seed schemas', () => {
    content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'seed.py'), 'utf-8');
    expect(content).toContain('seed_schemas');
    expect(content).toContain('.vault-schemas');
  });

  it('should seed templates', () => {
    content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'seed.py'), 'utf-8');
    expect(content).toContain('seed_templates');
    expect(content).toContain('templates');
  });

  it('should create vault directories', () => {
    content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'seed.py'), 'utf-8');
    expect(content).toContain('create_vault_directories');
    expect(content).toContain('projects');
    expect(content).toContain('tasks');
    expect(content).toContain('.vault-ops');
  });

  it('should handle errors gracefully', () => {
    content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'seed.py'), 'utf-8');
    expect(content).toContain('try:');
    expect(content).toContain('except');
    expect(content).toContain('raise');
  });

  it('should use shutil for directory operations', () => {
    content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'seed.py'), 'utf-8');
    expect(content).toContain('import shutil');
    expect(content).toContain('shutil.copytree');
  });
});

describe('sync.py - Git Synchronization', () => {
  let content: string;

  it('should be executable Python script', () => {
    content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'sync.py'), 'utf-8');
    expect(content).toMatch(/^#!\/usr\/bin\/env python3/);
  });

  it('should have comprehensive environment configuration', () => {
    content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'sync.py'), 'utf-8');
    expect(content).toContain('VAULT_PATH');
    expect(content).toContain('GIT_REMOTE');
    expect(content).toContain('GIT_BRANCH');
    expect(content).toContain('MAX_RETRIES');
    expect(content).toContain('RETRY_DELAY');
  });

  it('should implement lock mechanism', () => {
    content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'sync.py'), 'utf-8');
    expect(content).toContain('LOCK_PATH');
    expect(content).toContain('.sync.lock');
    expect(content).toContain('acquire_lock');
    expect(content).toContain('is_lock_stale');
    expect(content).toContain('LOCK_TIMEOUT');
  });

  it('should have safety brakes for deletions', () => {
    content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'sync.py'), 'utf-8');
    expect(content).toContain('MAX_DELETIONS');
    expect(content).toContain('MAX_DELETE_RATIO');
  });

  it('should protect critical directories', () => {
    content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'sync.py'), 'utf-8');
    expect(content).toContain('PROTECTED_DIRS');
    expect(content).toContain('tasks');
    expect(content).toContain('_system');
  });

  it('should implement health status reporting', () => {
    content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'sync.py'), 'utf-8');
    expect(content).toContain('HealthStatus');
    expect(content).toContain('.sync-status.json');
    expect(content).toContain('STATUS_PATH');
    expect(content).toContain('update');
  });

  it('should have custom exception classes', () => {
    content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'sync.py'), 'utf-8');
    expect(content).toContain('class SyncError');
    expect(content).toContain('class MergeConflictError');
    expect(content).toContain('class NetworkError');
  });

  it('should implement metrics tracking', () => {
    content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'sync.py'), 'utf-8');
    expect(content).toContain('class SyncMetrics');
    expect(content).toContain('changes_count');
    expect(content).toContain('deletions_count');
    expect(content).toContain('additions_count');
    expect(content).toContain('commits');
  });

  it('should have structured logging', () => {
    content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'sync.py'), 'utf-8');
    expect(content).toContain('def log(');
    expect(content).toContain('json.dumps');
    expect(content).toContain('timestamp');
    expect(content).toContain('level');
  });

  it('should implement git command wrapper', () => {
    content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'sync.py'), 'utf-8');
    expect(content).toContain('def run_git');
    expect(content).toContain('subprocess.run');
    expect(content).toContain('capture_output');
  });

  it('should handle network errors', () => {
    content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'sync.py'), 'utf-8');
    expect(content).toContain('connection refused');
    expect(content).toContain('timeout');
    expect(content).toContain('NetworkError');
  });

  it('should support dry-run mode', () => {
    content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'sync.py'), 'utf-8');
    expect(content).toContain('DRY_RUN');
  });

  it('should have retry logic with exponential backoff', () => {
    content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'sync.py'), 'utf-8');
    expect(content).toContain('MAX_RETRIES');
    expect(content).toContain('RETRY_DELAY');
  });
});

describe('Python Scripts - Documentation', () => {
  it('healthcheck.py should have docstring', () => {
    const content = readFileSync(
      join(VAULTY_SCRIPTS_DIR, 'healthcheck.py'),
      'utf-8'
    );
    expect(content).toContain('"""');
    expect(content).toContain('Health check');
  });

  it('seed.py should have docstring', () => {
    const content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'seed.py'), 'utf-8');
    expect(content).toContain('"""');
    expect(content).toContain('Vault Seeding');
  });

  it('sync.py should have comprehensive docstring', () => {
    const content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'sync.py'), 'utf-8');
    expect(content).toContain('"""');
    expect(content).toContain('SAFE Vault Sync');
    expect(content).toContain('Bidirectional');
  });
});

describe('Python Scripts - Error Handling', () => {
  it('healthcheck.py should handle missing status file', () => {
    const content = readFileSync(
      join(VAULTY_SCRIPTS_DIR, 'healthcheck.py'),
      'utf-8'
    );
    expect(content).toContain('os.path.exists');
    expect(content).toContain('UNHEALTHY: No status file');
  });

  it('healthcheck.py should handle JSON parse errors', () => {
    const content = readFileSync(
      join(VAULTY_SCRIPTS_DIR, 'healthcheck.py'),
      'utf-8'
    );
    expect(content).toContain('json.load');
    expect(content).toContain('except Exception');
  });

  it('seed.py should handle seeding failures', () => {
    const content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'seed.py'), 'utf-8');
    expect(content).toContain('except Exception as e');
    expect(content).toContain('Seeding failed');
  });

  it('sync.py should handle git command failures', () => {
    const content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'sync.py'), 'utf-8');
    expect(content).toContain('if check and r.returncode != 0');
    expect(content).toContain('raise SyncError');
  });

  it('sync.py should handle subprocess timeout', () => {
    const content = readFileSync(join(VAULTY_SCRIPTS_DIR, 'sync.py'), 'utf-8');
    expect(content).toContain('TimeoutExpired');
    expect(content).toContain('timeout=');
  });
});
