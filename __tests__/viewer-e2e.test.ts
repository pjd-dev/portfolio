import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import { spawn } from 'node:child_process';

type CommandResult = {
  stdout: string;
  stderr: string;
};

const viewerRoot = path.resolve(process.cwd(), 'apps', 'viewer');
const gatsbyBin = path.join(
  viewerRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'gatsby.cmd' : 'gatsby'
);

const isRequested = process.env.RUN_VIEWER_E2E === '1';
const hasViewer = fs.existsSync(viewerRoot);
const hasGatsby = fs.existsSync(gatsbyBin);

if (isRequested && (!hasViewer || !hasGatsby)) {
  const missing: string[] = [];
  if (!hasViewer) {
    missing.push('apps/viewer');
  }
  if (!hasGatsby) {
    missing.push('apps/viewer/node_modules/.bin/gatsby');
  }
  throw new Error(
    `Viewer E2E preflight failed: missing ${missing.join(
      ', '
    )}. Run pnpm install in apps/viewer first.`
  );
}

const timeoutMs = Number(process.env.VIEWER_E2E_TIMEOUT_MS || '300000');
const viewerTest = isRequested ? it : it.skip;

describe('Viewer E2E', () => {
  viewerTest(
    'builds and serves vault content',
    { timeout: Number.isFinite(timeoutMs) ? timeoutMs : 300_000 },
    async () => {
      const tempVault = await fsPromises.mkdtemp(
        path.join(os.tmpdir(), 'vault-viewer-e2e-')
      );
      const collections = ['notes', 'tasks', 'reports'];
      const hadPublic = fs.existsSync(path.join(viewerRoot, 'public'));
      const hadCache = fs.existsSync(path.join(viewerRoot, '.cache'));

      try {
        await Promise.all(
          collections.map((name) =>
            fsPromises.mkdir(path.join(tempVault, name), { recursive: true })
          )
        );

        await fsPromises.writeFile(
          path.join(tempVault, 'notes', 'hello.md'),
          [
            '---',
            'title: "Sample Note"',
            'tags: ["alpha", "beta"]',
            '---',
            '',
            'Hello viewer.',
          ].join('\n')
        );

        await fsPromises.writeFile(
          path.join(tempVault, 'tasks', 'task.md'),
          [
            '---',
            'title: "Sample Task"',
            'status: "todo"',
            '---',
            '',
            'Task body.',
          ].join('\n')
        );

        await fsPromises.writeFile(
          path.join(tempVault, 'reports', 'report.md'),
          ['---', 'title: "Sample Report"', '---', '', 'Report body.'].join(
            '\n'
          )
        );

        await runCommand(gatsbyBin, ['build'], {
          cwd: viewerRoot,
          env: buildEnv(tempVault),
        });

        const port = await getAvailablePort();
        const server = spawn(
          gatsbyBin,
          ['serve', '-H', '127.0.0.1', '-p', String(port)],
          {
            cwd: viewerRoot,
            env: buildEnv(tempVault),
            stdio: 'pipe',
          }
        );

        try {
          await waitForUrl(`http://127.0.0.1:${port}/`, 30_000);

          const indexHtml = await fetchText(`http://127.0.0.1:${port}/`);
          expect(indexHtml).toContain('Sample Note');
          expect(indexHtml).toContain('Sample Task');
          expect(indexHtml).toContain('Sample Report');

          const noteHtml = await fetchText(
            `http://127.0.0.1:${port}/notes/hello/`
          );
          expect(noteHtml).toContain('Sample Note');
          expect(noteHtml).toContain('Hello viewer.');
        } finally {
          server.kill('SIGTERM');
          await waitForExit(server, 10_000);
        }
      } finally {
        await fsPromises.rm(tempVault, { recursive: true, force: true });

        if (!hadPublic) {
          await fsPromises.rm(path.join(viewerRoot, 'public'), {
            recursive: true,
            force: true,
          });
        }

        if (!hadCache) {
          await fsPromises.rm(path.join(viewerRoot, '.cache'), {
            recursive: true,
            force: true,
          });
        }
      }
    }
  );
});

function buildEnv(vaultPath: string) {
  return {
    ...process.env,
    VAULT_CONTENT_PATH: vaultPath,
    GATSBY_TELEMETRY_DISABLED: '1',
    NODE_ENV: 'production',
  };
}

function runCommand(
  command: string,
  args: string[],
  options: { cwd: string; env: NodeJS.ProcessEnv }
) {
  return new Promise<CommandResult>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: 'pipe',
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(
          new Error(
            `Command failed (${command} ${args.join(' ')}): ${stderr || stdout}`
          )
        );
      }
    });
  });
}

function getAvailablePort() {
  return new Promise<number>((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Failed to determine port'));
        return;
      }
      const { port } = address;
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}

async function waitForUrl(url: string, timeoutMs: number) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch (error) {
      // Keep waiting until timeout.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function fetchText(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }
  return response.text();
}

function waitForExit(child: ReturnType<typeof spawn>, timeoutMs: number) {
  return new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      resolve();
    }, timeoutMs);

    child.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}
