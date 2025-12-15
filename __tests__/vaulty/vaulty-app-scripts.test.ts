/**
 * Vaulty App Script Tests
 * Tests for Vaulty app scripts in apps/vaulty/script/
 * - build.sh: Build Vaulty container image
 * - pod.sh: Pod management
 * - run.sh: Container run configuration
 * - healthcheck.sh: Container health monitoring
 * - common.sh: Shared Vaulty utilities
 * - prepare.sh: Environment preparation
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const WORKSPACE_ROOT = join(__dirname, '..', '..');
const VAULTY_SCRIPT_DIR = join(WORKSPACE_ROOT, 'apps', 'vaulty', 'script');

describe('Vaulty App Scripts - File Existence', () => {
  it('should have build.sh', () => {
    expect(existsSync(join(VAULTY_SCRIPT_DIR, 'build.sh'))).toBe(true);
  });

  it('should have pod.sh', () => {
    expect(existsSync(join(VAULTY_SCRIPT_DIR, 'pod.sh'))).toBe(true);
  });

  it('should have run.sh', () => {
    expect(existsSync(join(VAULTY_SCRIPT_DIR, 'run.sh'))).toBe(true);
  });

  it('should have healthcheck.sh', () => {
    expect(existsSync(join(VAULTY_SCRIPT_DIR, 'healthcheck.sh'))).toBe(true);
  });

  it('should have common.sh', () => {
    expect(existsSync(join(VAULTY_SCRIPT_DIR, 'common.sh'))).toBe(true);
  });

  it('should have prepare.sh', () => {
    expect(existsSync(join(VAULTY_SCRIPT_DIR, 'prepare.sh'))).toBe(true);
  });
});

describe('Vaulty build.sh - Container Build', () => {
  let content: string;

  it('should be executable bash script', () => {
    content = readFileSync(join(VAULTY_SCRIPT_DIR, 'build.sh'), 'utf-8');
    expect(content).toMatch(/^#!/);
  });

  it('should use podman build command', () => {
    content = readFileSync(join(VAULTY_SCRIPT_DIR, 'build.sh'), 'utf-8');
    expect(content).toContain('podman build');
  });

  it('should use IMAGE_NAME variable', () => {
    content = readFileSync(join(VAULTY_SCRIPT_DIR, 'build.sh'), 'utf-8');
    expect(content).toContain('IMAGE_NAME');
  });

  it('should build from Dockerfile', () => {
    content = readFileSync(join(VAULTY_SCRIPT_DIR, 'build.sh'), 'utf-8');
    expect(content).toMatch(/Dockerfile|DOCKERFILE_PATH/);
  });
});

describe('Vaulty pod.sh - Pod Management', () => {
  let content: string;

  it('should be executable bash script', () => {
    content = readFileSync(join(VAULTY_SCRIPT_DIR, 'pod.sh'), 'utf-8');
    expect(content).toMatch(/^#!/);
  });

  it('should use POD_NAME variable', () => {
    content = readFileSync(join(VAULTY_SCRIPT_DIR, 'pod.sh'), 'utf-8');
    expect(content).toContain('POD_NAME');
  });

  it('should create or manage pod', () => {
    content = readFileSync(join(VAULTY_SCRIPT_DIR, 'pod.sh'), 'utf-8');
    expect(content).toContain('podman pod');
  });
});

describe('Vaulty run.sh - Container Run', () => {
  let content: string;

  it('should be executable bash script', () => {
    content = readFileSync(join(VAULTY_SCRIPT_DIR, 'run.sh'), 'utf-8');
    expect(content).toMatch(/^#!/);
  });

  it('should use CONTAINER_NAME variable', () => {
    content = readFileSync(join(VAULTY_SCRIPT_DIR, 'run.sh'), 'utf-8');
    expect(content).toContain('CONTAINER_NAME');
  });

  it('should mount vault volume', () => {
    content = readFileSync(join(VAULTY_SCRIPT_DIR, 'run.sh'), 'utf-8');
    expect(content).toContain('/vault');
    expect(content).toMatch(/VAULT_DATA_VOLUME|VAULT_HOST_PATH/);
  });

  it('should run in pod', () => {
    content = readFileSync(join(VAULTY_SCRIPT_DIR, 'run.sh'), 'utf-8');
    expect(content).toContain('--pod');
  });

  it('should integrate with container lifecycle', () => {
    content = readFileSync(join(VAULTY_SCRIPT_DIR, 'run.sh'), 'utf-8');
    expect(content).toMatch(/podman run|CONTAINER_NAME/);
  });

  it('should pass environment variables', () => {
    content = readFileSync(join(VAULTY_SCRIPT_DIR, 'run.sh'), 'utf-8');
    expect(content).toMatch(/--env|--env-file/);
  });
});

describe('Vaulty healthcheck.sh - Health Monitoring', () => {
  let content: string;

  it('should be executable bash script', () => {
    content = readFileSync(join(VAULTY_SCRIPT_DIR, 'healthcheck.sh'), 'utf-8');
    expect(content).toMatch(/^#!/);
  });

  it('should check vault sync status', () => {
    content = readFileSync(join(VAULTY_SCRIPT_DIR, 'healthcheck.sh'), 'utf-8');
    expect(content).toMatch(/vault|sync/i);
  });

  it('should validate vault directory', () => {
    content = readFileSync(join(VAULTY_SCRIPT_DIR, 'healthcheck.sh'), 'utf-8');
    expect(content).toContain('/vault');
  });
});

describe('Vaulty common.sh - Shared Utilities', () => {
  let content: string;

  it('should be executable bash script', () => {
    content = readFileSync(join(VAULTY_SCRIPT_DIR, 'common.sh'), 'utf-8');
    expect(content).toMatch(/^#!/);
  });

  it('should source root common.sh', () => {
    content = readFileSync(join(VAULTY_SCRIPT_DIR, 'common.sh'), 'utf-8');
    expect(content).toContain('ROOT_COMMON');
    expect(content).toContain('source');
  });

  it('should define utility functions', () => {
    content = readFileSync(join(VAULTY_SCRIPT_DIR, 'common.sh'), 'utf-8');
    // Should have at least some function definitions
    expect(content.match(/^[a-z_]+\(\)/gm)).toBeTruthy();
  });
});

describe('Vaulty prepare.sh - Environment Preparation', () => {
  let content: string;

  it('should be executable bash script', () => {
    content = readFileSync(join(VAULTY_SCRIPT_DIR, 'prepare.sh'), 'utf-8');
    expect(content).toMatch(/^#!/);
  });

  it('should set up environment variables', () => {
    content = readFileSync(join(VAULTY_SCRIPT_DIR, 'prepare.sh'), 'utf-8');
    expect(content).toMatch(/export|ENV/);
  });

  it('should reference vault configuration', () => {
    content = readFileSync(join(VAULTY_SCRIPT_DIR, 'prepare.sh'), 'utf-8');
    expect(content).toContain('VAULT');
  });
});

describe('Vaulty Scripts - Integration', () => {
  it('all scripts should be bash scripts', () => {
    const scripts = [
      'build.sh',
      'pod.sh',
      'run.sh',
      'healthcheck.sh',
      'common.sh',
      'prepare.sh',
    ];

    scripts.forEach((script) => {
      const content = readFileSync(join(VAULTY_SCRIPT_DIR, script), 'utf-8');
      expect(content).toMatch(/^#!/);
    });
  });

  it('should have consistent variable naming', () => {
    const scripts = ['build.sh', 'pod.sh', 'run.sh'];
    const commonVars = ['IMAGE_NAME', 'CONTAINER_NAME', 'POD_NAME'];

    scripts.forEach((script) => {
      const content = readFileSync(join(VAULTY_SCRIPT_DIR, script), 'utf-8');
      // At least one common variable should be present
      const hasCommonVar = commonVars.some((v) => content.includes(v));
      expect(hasCommonVar).toBe(true);
    });
  });

  it('should reference vault consistently', () => {
    const scripts = ['run.sh', 'healthcheck.sh'];

    scripts.forEach((script) => {
      const content = readFileSync(join(VAULTY_SCRIPT_DIR, script), 'utf-8');
      expect(content).toMatch(/VAULT|vault/);
    });
  });

  it('should integrate with sync operations', () => {
    const content = readFileSync(join(VAULTY_SCRIPT_DIR, 'run.sh'), 'utf-8');
    // Should reference git or sync functionality
    expect(content).toMatch(/git|sync|GIT|SYNC/i);
  });
});
