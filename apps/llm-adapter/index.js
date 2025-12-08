#!/usr/bin/env node
// Minimal LLM adapter prototype
// No external dependencies (uses Node 18+ fetch)

const http = require('http');
const { URL } = require('url');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const BASE_PATH = process.env.MCP_BASE_PATH || '/mcp/llm';

function requireAuth(req) {
  const authType = process.env.MCP_AUTH_TYPE || 'none';
  if (authType === 'none') return true;
  if (authType === 'apikey') {
    const apiKey = process.env.MCP_API_KEY;
    const header = req.headers['x-api-key'];
    return header && apiKey && header === apiKey;
  }
  if (authType === 'bearer') {
    const token = process.env.MCP_TOKEN;
    const header = req.headers['authorization'];
    if (!header) return false;
    const parts = header.split(' ');
    if (parts.length !== 2) return false;
    return parts[1] === token;
  }
  return false;
}

function jsonResponse(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(body);
}

async function proxyToProvider(bodyJson) {
  // If PROVIDER_URL is set, forward the request; otherwise return a mock response.
  const providerUrl = process.env.PROVIDER_URL;
  if (!providerUrl) {
    return { provider: 'mock', result: `mock-reply to prompt: ${bodyJson.prompt || bodyJson.messages?.[0]?.content || '<none>'}` };
  }
  // Forward using global fetch (Node 18+)
  const res = await fetch(providerUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bodyJson)
  });
  const data = await res.json();
  return data;
}

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, `http://${req.headers.host}`);

    // Health
    if (u.pathname === `${BASE_PATH}/health` || u.pathname === '/health') {
      return jsonResponse(res, 200, { status: 'ok', uptime: process.uptime() });
    }

    // Require auth if configured
    if ((process.env.MCP_AUTH_TYPE || 'none') !== 'none') {
      const ok = requireAuth(req);
      if (!ok) return jsonResponse(res, 401, { error: 'unauthorized' });
    }

    if (req.method === 'POST' && (u.pathname === `${BASE_PATH}/v1/complete` || u.pathname === `${BASE_PATH}/v1/chat`)) {
      let body = '';
      for await (const chunk of req) body += chunk;
      const bodyJson = body ? JSON.parse(body) : {};

      // Basic input validation
      if (u.pathname.endsWith('/complete') && !bodyJson.prompt) {
        return jsonResponse(res, 400, { error: 'missing prompt' });
      }
      // Proxy or mock
      const providerResp = await proxyToProvider(bodyJson);
      return jsonResponse(res, 200, { ok: true, from: providerResp });
    }

    // Unknown route
    jsonResponse(res, 404, { error: 'not_found' });
  } catch (err) {
    console.error(err);
    jsonResponse(res, 500, { error: 'internal_error', detail: String(err) });
  }
});

server.listen(PORT, () => {
  console.log(`LLM Adapter prototype listening on http://localhost:${PORT}${BASE_PATH}`);
});
