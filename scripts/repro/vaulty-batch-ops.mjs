#!/usr/bin/env node
import http from 'node:http';
import https from 'node:https';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const MCP_URL = process.env.MCP_URL || 'http://localhost:4000/mcp';

const argValue = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  if (index !== -1 && process.argv[index + 1]) {
    return process.argv[index + 1];
  }
  return fallback;
};

const fixtureCount = Number(
  argValue('count', process.env.FIXTURE_COUNT || '60')
);
const baseDir = argValue(
  'base',
  process.env.FIXTURE_BASE || 'dump/_repro/vaulty-batch-ops'
);
const movedDir = argValue(
  'moved',
  process.env.FIXTURE_MOVED || `${baseDir}-moved`
);
const logDir = argValue('log-dir', process.env.REPRO_LOG_DIR || 'logs');

const runId = randomUUID();
const startedAt = new Date().toISOString();
const logPath = path.join(
  logDir,
  `vaulty-batch-ops-repro-${startedAt.slice(0, 10)}.json`
);

const run = {
  runId,
  startedAt,
  mcpUrl: MCP_URL,
  fixtureCount,
  baseDir,
  movedDir,
  steps: [],
  ok: true,
};

const clientForUrl = (url) => (url.protocol === 'https:' ? https : http);

const callMcpTool = (toolName, args = {}) =>
  new Promise((resolve, reject) => {
    const url = new URL(MCP_URL);
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
      id: Math.floor(Math.random() * 10000),
    });

    const request = clientForUrl(url).request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error(`Failed to parse response: ${data}`));
          }
        });
      }
    );

    request.on('error', reject);
    request.write(payload);
    request.end();
  });

const recordStep = async (name, tool, args) => {
  const step = {
    name,
    tool,
    args,
    startedAt: new Date().toISOString(),
  };
  try {
    const response = await callMcpTool(tool, args);
    step.response = response;
    step.ok = true;
    run.steps.push(step);
    return response;
  } catch (error) {
    step.ok = false;
    step.error = error instanceof Error ? error.message : String(error);
    run.steps.push(step);
    run.ok = false;
    throw error;
  } finally {
    step.finishedAt = new Date().toISOString();
  }
};

const extractNotes = (response) => {
  const notes = response?.result?.structuredContent?.notes;
  if (Array.isArray(notes)) return notes;
  const alt = response?.result?.notes;
  if (Array.isArray(alt)) return alt;
  return [];
};

const fixturePaths = Array.from({ length: fixtureCount }, (_, i) => {
  const index = String(i + 1).padStart(3, '0');
  return `${baseDir}/fixture-${index}.md`;
});

const cleanupNotes = async (pattern) => {
  try {
    const response = await recordStep(
      'list-notes-cleanup',
      'obsidian_list_notes',
      {
        pattern,
      }
    );
    const notes = extractNotes(response);
    for (const notePath of notes) {
      await recordStep('delete-note-cleanup', 'obsidian_delete_note', {
        path: notePath,
      });
    }
  } catch (error) {
    console.warn(`Cleanup warning for pattern ${pattern}: ${error.message}`);
  }
};

const writeFixtures = async () => {
  for (const notePath of fixturePaths) {
    await recordStep('write-fixture', 'obsidian_write_note', {
      path: notePath,
      content: `# Fixture ${notePath}\n\nRun: ${runId}\n`,
    });
  }
};

const main = async () => {
  console.log('Vaulty batch ops repro harness');
  console.log(`MCP_URL=${MCP_URL}`);
  console.log(`Base=${baseDir}`);
  console.log(`Moved=${movedDir}`);
  console.log(`Fixtures=${fixtureCount}`);

  await mkdir(logDir, { recursive: true });

  try {
    await cleanupNotes(`${baseDir}/**/*.md`);
    await cleanupNotes(`${movedDir}/**/*.md`);

    await writeFixtures();

    const listResponse = await recordStep('list-notes-base', 'obsidian_list_notes', {
      pattern: `${baseDir}/**/*.md`,
    });
    const listedNotes = extractNotes(listResponse);
    console.log(`Listed ${listedNotes.length} base fixtures`);

    await recordStep('read-note', 'obsidian_read_note', {
      path: fixturePaths[0],
    });

    await recordStep('batch-move-folder', 'obsidian_batch_move', {
      operations: [
        {
          type: 'folder',
          from: baseDir,
          to: movedDir,
        },
      ],
      updateLinks: false,
      updateBacklinks: false,
      failOnConflict: true,
      stopOnError: true,
    });

    const movedListResponse = await recordStep(
      'list-notes-moved',
      'obsidian_list_notes',
      { pattern: `${movedDir}/**/*.md` }
    );
    const movedNotes = extractNotes(movedListResponse);
    console.log(`Listed ${movedNotes.length} moved fixtures`);

    const movedSample = `${movedDir}/${path.basename(fixturePaths[0])}`;
    await recordStep('move-file', 'obsidian_move_file', {
      from: movedSample,
      to: `${movedDir}/fixture-001-renamed.md`,
      updateLinks: false,
      updateBacklinks: false,
      failOnConflict: true,
    });

    const deleteTarget = `${movedDir}/${path.basename(fixturePaths[1])}`;
    await recordStep('delete-note', 'obsidian_delete_note', {
      path: deleteTarget,
    });

    await recordStep('list-notes-post', 'obsidian_list_notes', {
      pattern: `${movedDir}/**/*.md`,
    });
  } catch (error) {
    console.error(`Run failed: ${error.message}`);
  } finally {
    await cleanupNotes(`${baseDir}/**/*.md`);
    await cleanupNotes(`${movedDir}/**/*.md`);
    run.finishedAt = new Date().toISOString();
    await writeFile(logPath, JSON.stringify(run, null, 2));
    console.log(`Run log written to ${logPath}`);
    if (!run.ok) {
      process.exitCode = 1;
    }
  }
};

main();
