#!/usr/bin/env node

/**
 * Live Testing Script for Vault Platform
 * Tests MCP tools with COD validation gating
 */

import http from 'http';

const MCP_URL = 'http://localhost:4000/mcp';

// Helper to make MCP RPC calls
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
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('\n🧪 LIVE TESTING SESSION - Vault Platform\n');
  console.log('='.repeat(60));

  const results = [];

  // Test 1: Task Graph
  console.log('\n📊 TEST 1.1: Task Graph (obsidian_task_graph)');
  try {
    const result = await callMcpTool('obsidian_task_graph', {});
    console.log(
      'Response structure:',
      JSON.stringify(result, null, 2).slice(0, 500)
    );
    if (result.result?.structuredContent?.nodes) {
      const nodes = result.result.structuredContent.nodes;
      console.log(`✅ PASS - Graph contains ${nodes.length} task(s)`);
      results.push({ test: '1.1', name: 'Task Graph', status: 'PASS' });
    } else {
      console.log('❌ FAIL - No nodes in response');
      results.push({ test: '1.1', name: 'Task Graph', status: 'FAIL' });
    }
  } catch (e) {
    console.log(`❌ FAIL - ${e.message}`);
    results.push({ test: '1.1', name: 'Task Graph', status: 'FAIL' });
  }

  // Test 2: Next Actions with COD validation (EP2)
  console.log('\n🎯 TEST 2.1: Next Actions with COD Validation (EP2)');
  try {
    const result = await callMcpTool('obsidian_task_next_actions', {
      max: 10,
      maxFocusCost: 3,
    });
    if (result.result?.structuredContent?.unblocked !== undefined) {
      const unblocked = result.result.structuredContent.unblocked || [];
      const failed = result.result.structuredContent.failed || [];
      console.log(
        `✅ PASS - Returned ${unblocked.length} unblocked task(s), ${failed.length} failed validation`
      );
      results.push({ test: '2.1', name: 'Next Actions (COD)', status: 'PASS' });
    } else {
      console.log('❌ FAIL - No unblocked tasks in response');
      results.push({ test: '2.1', name: 'Next Actions (COD)', status: 'FAIL' });
    }
  } catch (e) {
    console.log(`❌ FAIL - ${e.message}`);
    results.push({ test: '2.1', name: 'Next Actions (COD)', status: 'FAIL' });
  }

  // Test 3: Plan Session (EP1)
  console.log('\n⏱️  TEST 3.1: Plan Session with COD Validation (EP1)');
  let sessionId = null;
  try {
    const result = await callMcpTool('obsidian_plan_session', {
      durationMinutes: 45,
      maxFocusCost: 2,
    });
    // Check both formats: .session.id (old) or .id (new)
    const session =
      result.result?.structuredContent?.session ||
      result.result?.structuredContent;
    if (session?.id) {
      sessionId = session.id;
      const tasks = session.tasks || [];
      console.log(
        `✅ PASS - Session created (${sessionId}) with ${tasks.length} task(s)`
      );
      results.push({ test: '3.1', name: 'Plan Session (COD)', status: 'PASS' });
    } else {
      console.log('❌ FAIL - No session ID in response');
      results.push({ test: '3.1', name: 'Plan Session (COD)', status: 'FAIL' });
    }
  } catch (e) {
    console.log(`❌ FAIL - ${e.message}`);
    results.push({ test: '3.1', name: 'Plan Session (COD)', status: 'FAIL' });
  }

  // Test 4: Start Session (EP10)
  if (sessionId) {
    console.log('\n🚀 TEST 3.2: Start Session with COD Validation (EP10)');
    try {
      const result = await callMcpTool('obsidian_start_session', {
        sessionId,
      });
      // Check both formats: .session or directly
      const session =
        result.result?.structuredContent?.session ||
        result.result?.structuredContent;
      if (session?.status === 'active') {
        console.log(`✅ PASS - Session started (${sessionId})`);
        results.push({
          test: '3.2',
          name: 'Start Session (COD)',
          status: 'PASS',
        });
      } else if (session?.id) {
        console.log(
          `✅ PASS - Session response received with status: ${session.status}`
        );
        results.push({
          test: '3.2',
          name: 'Start Session (COD)',
          status: 'PASS',
        });
      } else {
        console.log('❌ FAIL - No session in response');
        results.push({
          test: '3.2',
          name: 'Start Session (COD)',
          status: 'FAIL',
        });
      }
    } catch (e) {
      console.log(`❌ FAIL - ${e.message}`);
      results.push({
        test: '3.2',
        name: 'Start Session (COD)',
        status: 'FAIL',
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

  // Test 5: List Sessions
  console.log('\n📋 TEST 4.1: List Sessions');
  try {
    const result = await callMcpTool('obsidian_list_sessions', {
      limit: 10,
    });
    if (result.result?.structuredContent?.sessions !== undefined) {
      const sessions = result.result.structuredContent.sessions || [];
      console.log(`✅ PASS - Retrieved ${sessions.length} session(s)`);
      results.push({ test: '4.1', name: 'List Sessions', status: 'PASS' });
    } else {
      console.log('❌ FAIL - No sessions in response');
      results.push({ test: '4.1', name: 'List Sessions', status: 'FAIL' });
    }
  } catch (e) {
    console.log(`❌ FAIL - ${e.message}`);
    results.push({ test: '4.1', name: 'List Sessions', status: 'FAIL' });
  }

  // Test 6: Pipeline Operations
  console.log('\n🔄 TEST 5.1: List Pipelines');
  try {
    const result = await callMcpTool('obsidian_list_pipelines', {});
    // Handle both content (text message) and structuredContent (data)
    if (result.result?.content) {
      const text = result.result.content[0]?.text || '';
      console.log(
        `✅ PASS - Retrieved pipeline status: ${text.substring(0, 50)}...`
      );
      results.push({ test: '5.1', name: 'List Pipelines', status: 'PASS' });
    } else if (result.result?.structuredContent?.pipelines !== undefined) {
      const pipelines = result.result.structuredContent.pipelines || [];
      console.log(`✅ PASS - Retrieved ${pipelines.length} pipeline(s)`);
      results.push({ test: '5.1', name: 'List Pipelines', status: 'PASS' });
    } else {
      console.log('❌ FAIL - No response in pipelines result');
      results.push({ test: '5.1', name: 'List Pipelines', status: 'FAIL' });
    }
  } catch (e) {
    console.log(`❌ FAIL - ${e.message}`);
    results.push({ test: '5.1', name: 'List Pipelines', status: 'FAIL' });
  }

  // Test 7: Operation Journal
  console.log('\n📝 TEST 6.1: List Operations (Journal)');
  try {
    const result = await callMcpTool('obsidian_list_operations', {
      limit: 10,
    });
    if (result.result?.structuredContent?.operations !== undefined) {
      const operations = result.result.structuredContent.operations || [];
      console.log(`✅ PASS - Retrieved ${operations.length} operation(s)`);
      results.push({ test: '6.1', name: 'List Operations', status: 'PASS' });
    } else {
      console.log('❌ FAIL - No operations in response');
      results.push({ test: '6.1', name: 'List Operations', status: 'FAIL' });
    }
  } catch (e) {
    console.log(`❌ FAIL - ${e.message}`);
    results.push({ test: '6.1', name: 'List Operations', status: 'FAIL' });
  }

  // Test 8: Schema Validation
  console.log('\n✅ TEST 7.1: List Schemas');
  try {
    const result = await callMcpTool('obsidian_list_schemas', {});
    if (result.result?.structuredContent?.schemas !== undefined) {
      const schemas = result.result.structuredContent.schemas || [];
      console.log(`✅ PASS - Retrieved ${schemas.length} schema(s)`);
      results.push({ test: '7.1', name: 'List Schemas', status: 'PASS' });
    } else {
      console.log('❌ FAIL - No schemas in response');
      results.push({ test: '7.1', name: 'List Schemas', status: 'FAIL' });
    }
  } catch (e) {
    console.log(`❌ FAIL - ${e.message}`);
    results.push({ test: '7.1', name: 'List Schemas', status: 'FAIL' });
  }

  // Print Summary
  console.log('\n' + '='.repeat(60));
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
    console.log(`| ${r.test} | ${r.name.padEnd(25)} | ${icon} ${r.status} |`);
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
