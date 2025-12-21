#!/usr/bin/env node

/**
 * Live Testing Script for Vault Platform - DEBUG VERSION
 * Tests MCP tools with detailed error reporting
 */

import http from 'http';

const MCP_URL = 'http://localhost:4000/mcp';

// Helper to make MCP RPC calls with detailed debugging
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

    console.log(
      `  📤 Request: ${toolName} with args:`,
      JSON.stringify(args, null, 2)
    );

    const req = http.request(options, (res) => {
      console.log(`  📬 Response status: ${res.statusCode}`);
      console.log(`  📬 Response headers:`, res.headers);

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log(`  📬 Response body (${data.length} bytes):`);
        console.log(data.substring(0, 1000));
        if (data.length > 1000)
          console.log(`  ... (${data.length - 1000} more bytes)`);

        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(
            new Error(
              `Failed to parse response: ${e.message}\nBody: ${data.substring(0, 500)}`
            )
          );
        }
      });
    });

    req.on('error', (e) => {
      console.log(`  ❌ Request error: ${e.message}`);
      reject(e);
    });

    req.on('timeout', () => {
      console.log(`  ⏱️  Request timeout`);
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.setTimeout(5000);
    req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('\n🧪 LIVE TESTING SESSION - Vault Platform (DEBUG MODE)\n');
  console.log('='.repeat(80));

  const results = [];

  // Test 1: Task Graph
  console.log('\n📊 TEST 1.1: Task Graph (obsidian_task_graph)');
  try {
    const result = await callMcpTool('obsidian_task_graph', {});

    if (result.error) {
      console.log(
        `  ❌ FAIL - RPC Error [${result.error.code}]: ${result.error.message}`
      );
      results.push({
        test: '1.1',
        name: 'Task Graph',
        status: 'FAIL',
        error: result.error.message,
      });
    } else if (result.result) {
      console.log(`  ✅ Got result object`);
      console.log(
        `     - content: ${Array.isArray(result.result.content) ? result.result.content.length + ' items' : 'N/A'}`
      );
      console.log(
        `     - structuredContent: ${result.result.structuredContent ? 'present' : 'missing'}`
      );

      if (result.result.structuredContent?.nodes) {
        console.log(
          `  ✅ PASS - Graph contains ${result.result.structuredContent.nodes.length} task(s)`
        );
        results.push({ test: '1.1', name: 'Task Graph', status: 'PASS' });
      } else {
        console.log(`  ❌ FAIL - No nodes in structuredContent`);
        console.log(
          `     Available keys: ${Object.keys(result.result.structuredContent || {})}`
        );
        results.push({ test: '1.1', name: 'Task Graph', status: 'FAIL' });
      }
    } else {
      console.log(`  ❌ FAIL - No result or error in response`);
      console.log(`     Response keys: ${Object.keys(result)}`);
      results.push({ test: '1.1', name: 'Task Graph', status: 'FAIL' });
    }
  } catch (e) {
    console.log(`  ❌ FAIL - Exception: ${e.message}`);
    results.push({
      test: '1.1',
      name: 'Task Graph',
      status: 'FAIL',
      error: e.message,
    });
  }

  // Test 2: Next Actions (EP2)
  console.log('\n🎯 TEST 2.1: Next Actions with COD Validation (EP2)');
  try {
    const result = await callMcpTool('obsidian_task_next_actions', {
      max: 10,
      maxFocusCost: 3,
    });

    if (result.error) {
      console.log(
        `  ❌ FAIL - RPC Error [${result.error.code}]: ${result.error.message}`
      );
      results.push({
        test: '2.1',
        name: 'Next Actions (COD)',
        status: 'FAIL',
        error: result.error.message,
      });
    } else if (result.result?.structuredContent) {
      const sc = result.result.structuredContent;
      const unblocked = sc.unblocked?.length || 0;
      const failed = sc.failed?.length || 0;
      console.log(
        `  ✅ PASS - Returned ${unblocked} unblocked task(s), ${failed} failed validation`
      );
      results.push({ test: '2.1', name: 'Next Actions (COD)', status: 'PASS' });
    } else {
      console.log(`  ❌ FAIL - No structuredContent`);
      results.push({ test: '2.1', name: 'Next Actions (COD)', status: 'FAIL' });
    }
  } catch (e) {
    console.log(`  ❌ FAIL - Exception: ${e.message}`);
    results.push({
      test: '2.1',
      name: 'Next Actions (COD)',
      status: 'FAIL',
      error: e.message,
    });
  }

  // Test 3: Plan Session (EP1)
  console.log('\n⏱️  TEST 3.1: Plan Session with COD Validation (EP1)');
  let sessionId = null;
  try {
    const result = await callMcpTool('obsidian_plan_session', {
      durationMinutes: 45,
      maxFocusCost: 2,
    });

    if (result.error) {
      console.log(
        `  ❌ FAIL - RPC Error [${result.error.code}]: ${result.error.message}`
      );
      results.push({
        test: '3.1',
        name: 'Plan Session (COD)',
        status: 'FAIL',
        error: result.error.message,
      });
    } else if (result.result?.structuredContent?.session?.id) {
      sessionId = result.result.structuredContent.session.id;
      const tasks = result.result.structuredContent.session.tasks || [];
      console.log(
        `  ✅ PASS - Session created (${sessionId}) with ${tasks.length} task(s)`
      );
      results.push({ test: '3.1', name: 'Plan Session (COD)', status: 'PASS' });
    } else {
      console.log(`  ❌ FAIL - No session ID`);
      console.log(
        `     structuredContent keys: ${Object.keys(result.result?.structuredContent || {})}`
      );
      results.push({ test: '3.1', name: 'Plan Session (COD)', status: 'FAIL' });
    }
  } catch (e) {
    console.log(`  ❌ FAIL - Exception: ${e.message}`);
    results.push({
      test: '3.1',
      name: 'Plan Session (COD)',
      status: 'FAIL',
      error: e.message,
    });
  }

  // Test 4: Start Session (EP10)
  if (sessionId) {
    console.log('\n🚀 TEST 3.2: Start Session with COD Validation (EP10)');
    try {
      const result = await callMcpTool('obsidian_start_session', {
        sessionId,
      });

      if (result.error) {
        console.log(
          `  ❌ FAIL - RPC Error [${result.error.code}]: ${result.error.message}`
        );
        results.push({
          test: '3.2',
          name: 'Start Session (COD)',
          status: 'FAIL',
          error: result.error.message,
        });
      } else if (
        result.result?.structuredContent?.session?.status === 'active'
      ) {
        console.log(`  ✅ PASS - Session started (${sessionId})`);
        results.push({
          test: '3.2',
          name: 'Start Session (COD)',
          status: 'PASS',
        });
      } else {
        console.log(
          `  ⚠️  WARN - Session status: ${result.result?.structuredContent?.session?.status}`
        );
        results.push({
          test: '3.2',
          name: 'Start Session (COD)',
          status: 'WARN',
        });
      }
    } catch (e) {
      console.log(`  ❌ FAIL - Exception: ${e.message}`);
      results.push({
        test: '3.2',
        name: 'Start Session (COD)',
        status: 'FAIL',
        error: e.message,
      });
    }
  } else {
    console.log('\n⏭️  TEST 3.2: SKIPPED (no session from 3.1)');
    results.push({
      test: '3.2',
      name: 'Start Session (COD)',
      status: 'SKIPPED',
    });
  }

  // Print Summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 TEST SUMMARY\n');

  const passed = results.filter((r) => r.status === 'PASS').length;
  const warned = results.filter((r) => r.status === 'WARN').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const skipped = results.filter((r) => r.status === 'SKIPPED').length;

  console.log('| Test | Name | Status |');
  console.log('|------|------|--------|');
  results.forEach((r) => {
    const icon = {
      PASS: '✅',
      FAIL: '❌',
      WARN: '⚠️ ',
      SKIPPED: '⏭️',
    }[r.status];
    let line = `| ${r.test} | ${r.name.padEnd(25)} | ${icon} ${r.status}`;
    if (r.error) {
      line += ` | ${r.error}`;
    }
    console.log(line + ' |');
  });

  console.log(
    `\n📈 Results: ${passed} passed, ${warned} warned, ${failed} failed, ${skipped} skipped\n`
  );

  if (failed === 0) {
    console.log('🎉 All critical tests passed!\n');
    process.exit(0);
  } else {
    console.log(`⚠️  ${failed} test(s) failed\n`);
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Test runner error:', e);
  process.exit(1);
});
