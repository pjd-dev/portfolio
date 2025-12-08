LLM Adapter — Prototype (Node.js)

This is a minimal prototype of an LLM Adapter designed to run behind your MCP server.
It has no external dependencies and uses Node's built-in http and the global `fetch` if `PROVIDER_URL` is set (Node 18+).

Quick start (local)

1. In a terminal, run:

```bash
cd apps/llm-adapter
node index.js
```

2. Health check:

```bash
curl http://localhost:3000/mcp/llm/health
```

3. Example completion (mock provider):

```bash
curl -sS -X POST http://localhost:3000/mcp/llm/v1/complete -H 'Content-Type: application/json' -d '{"model":"gpt-4-like","prompt":"Hello","max_tokens":10}'
```

Auth
- Configure `MCP_AUTH_TYPE` in the environment to `apikey` or `bearer`.
- Set `MCP_API_KEY` or `MCP_TOKEN` accordingly.

Example with API key:

```bash
export MCP_AUTH_TYPE=apikey
export MCP_API_KEY=supersecret
curl -H "x-api-key: $MCP_API_KEY" -H 'Content-Type: application/json' -d '{"prompt":"hi"}' http://localhost:3000/mcp/llm/v1/complete
```

Docker
- Build and run with Docker (see Dockerfile in repository):

```bash
docker build -t llm-adapter-proto .
docker run -p 3000:3000 --env MCP_AUTH_TYPE=none llm-adapter-proto
```

Notes
- If you set `PROVIDER_URL`, requests will be forwarded to that URL (POSTed as JSON). Otherwise responses are mocked.
- This prototype is intentionally small for quick testing; production requires rate-limiting, monitoring, retries, and secure secret storage.
