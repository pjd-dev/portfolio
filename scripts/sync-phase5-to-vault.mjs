#!/usr/bin/env node

import http from 'http';
import fs from 'fs';
import path from 'path';

function callMcpTool(toolName, args = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
      id: Math.floor(Math.random() * 10000),
    });

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        'Content-Length': payload.length,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function syncTasksToVault() {
  console.log('🔄 Syncing Phase 5 Tasks to Vault via Vaulty MCP...\n');

  const tasksDir = './tasks';
  const phase5Files = fs
    .readdirSync(tasksDir)
    .filter((f) => f.startsWith('phase5-') && f.endsWith('.md'));

  console.log(`📋 Found ${phase5Files.length} Phase 5 task files to sync:\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const file of phase5Files) {
    const filePath = path.join(tasksDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const vaultPath = `tasks/${file}`;

    console.log(`📝 Creating: ${file}`);

    try {
      const result = await callMcpTool('obsidian_create_note', {
        path: vaultPath,
        content: content,
      });

      if (result.result?.content) {
        console.log(`   ✅ Success - Created in vault\n`);
        successCount++;
      } else if (result.error) {
        console.log(`   ⚠️  Error: ${result.error.message}\n`);
        errorCount++;
      } else {
        console.log(`   ✅ Success - Note created\n`);
        successCount++;
      }
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}\n`);
      errorCount++;
    }

    // Small delay between requests
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📊 Sync Summary:`);
  console.log(`   ✅ Created: ${successCount}/${phase5Files.length}`);
  if (errorCount > 0) {
    console.log(`   ❌ Errors: ${errorCount}/${phase5Files.length}`);
  }
  console.log('═══════════════════════════════════════════════════════════\n');

  if (successCount === phase5Files.length) {
    console.log('🎉 All Phase 5 tasks synced to vault successfully!');
    console.log('\n📍 Tasks are now discoverable via:');
    console.log('   • obsidian_task_graph (see all tasks with phase5 tag)');
    console.log('   • obsidian_next_actions (filter by phase5)');
    console.log('   • obsidian_plan_session (include in session planning)');
  } else {
    console.log(
      `⚠️  ${errorCount} task(s) failed to sync. Check MCP server status.`
    );
  }
}

syncTasksToVault().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
