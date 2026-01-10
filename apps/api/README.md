# Vault API Service

REST API service that exposes MCP tools without requiring an LLM. Useful for:

- Automation and webhooks
- Direct programmatic access to vault operations
- Integration with external services
- CLI tools and scripts

## Quick Start

```bash
# From monorepo root
pnpm install
pnpm build:api

# Set environment
export VAULT_PATH=/path/to/your/vault

# Run
cd apps/api
pnpm dev
```

## Configuration

Create `.env` from the example:

```bash
cp .env.example .env
```

| Variable           | Default                 | Description                                                                                                  |
| ------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| `PORT`             | `4200`                  | Server port                                                                                                  |
| `HOST`             | `0.0.0.0`               | Server host                                                                                                  |
| `NODE_ENV`         | `development`           | Environment                                                                                                  |
| `CORS_ORIGIN`      | `http://localhost:3000` | CORS allowed origin(s). Supports comma-separated list. Set to `true` to allow all (dev), `false` to disable. |
| `VAULT_ROOT`       | (required)              | Path to Obsidian vault                                                                                       |
| `AUTH_ENABLED`     | `false`                 | Enable token auth                                                                                            |
| `AUTH_SERVICE_URL` | `http://localhost:4100` | Auth service URL                                                                                             |
| `LOG_LEVEL`        | `info`                  | Logging level                                                                                                |

## REST Quick Reference

Base URL: `http://localhost:4200/api/v1`

Docs UI: `http://localhost:4200/docs` (Swagger UI, served from `openapi.yaml`)

| Endpoint                       | Method | Purpose                      | Notes                                            |
| ------------------------------ | ------ | ---------------------------- | ------------------------------------------------ |
| `/health`                      | GET    | Service liveness             | Also `/health/detailed`                          |
| `/tools`                       | GET    | List registered tools        |                                                  |
| `/tools/:name`                 | GET    | Tool info/schema             |                                                  |
| `/tools/:name/execute`         | POST   | Execute a tool               | Body = tool input                                |
| `/notes`                       | GET    | List notes                   | `pattern` query (glob)                           |
| `/notes/search`                | GET    | Search notes                 | `query`, `pattern`                               |
| `/notes/:path`                 | GET    | Read a note                  | `:path` is URL-encoded                           |
| `/notes/:path/frontmatter`     | GET    | Frontmatter only             |                                                  |
| `/tasks`                       | GET    | List tasks                   | `status`, `limit`, `sortBy`, `sortOrder`         |
| `/tasks/find`                  | POST   | Filter/search tasks          | Body mirrors tool filters                        |
| `/tasks/:path`                 | GET    | Get task                     |                                                  |
| `/tasks/:path/metrics`         | GET    | Basic task metrics           | Stub metrics today                               |
| `/tasks/:path/history`         | GET    | Task history                 | Stub (empty list)                                |
| `/tasks/next-actions`          | GET    | COD next actions             | `max`, `maxEffort`, `maxFocusCost`               |
| `/graph/search`                | GET    | Graph-aware search           | `query`, `limit`                                 |
| `/graph/stats`                 | GET    | Graph stats                  | hubs/orphans                                     |
| `/graph/related/:path`         | GET    | Related notes                |                                                  |
| `/sessions`                    | GET    | List sessions                |                                                  |
| `/sessions/:id`                | GET    | Session details              |                                                  |
| `/sessions/stats`              | GET    | Session stats                |                                                  |
| `/cod/status`                  | GET    | Human state + active session | Reads `_state/cod/human-state.json` when present |
| `/cod/avatar`                  | GET    | Avatar state                 |                                                  |
| `/cod/world`                   | GET    | World state                  |                                                  |
| `/cod/hard-stop`               | GET    | HARD_STOP status             |                                                  |
| `/cod/decision-loop`           | GET    | Decision loop state          |                                                  |
| `/cod/productivity`            | GET    | Productivity patterns        |                                                  |
| `/cod/productivity/peak-hours` | GET    | Peak hours                   |                                                  |
| `/scheduler/status`            | GET    | Scheduler status             | Env-driven pipeline runner status                |

### Example requests

- List tasks:

  ```bash
  curl "http://localhost:4200/api/v1/tasks?status=todo&limit=10"
  ```

- Execute a tool directly:

  ```bash
  curl -X POST http://localhost:4200/api/v1/tools/obsidian_list_notes/execute \
    -H "Content-Type: application/json" \
    -d '{"pattern":"tasks/**/*.md"}'
  ```

- Get related notes:
  ```bash
  curl "http://localhost:4200/api/v1/graph/related/tasks%2Fmy-task.md?limit=5"
  ```

## API Endpoints

### Health

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health with memory/uptime

### Tools (Generic)

- `GET /api/v1/tools` - List all available tools
- `GET /api/v1/tools/:name` - Get tool info and schema
- `POST /api/v1/tools/:name/execute` - Execute any tool

### Notes (Convenience)

- `GET /api/v1/notes` - List notes (query: `pattern`)
- `GET /api/v1/notes/search` - Search notes (query: `query`, `pattern`)
- `GET /api/v1/notes/:path` - Read a note
- `GET /api/v1/notes/:path/frontmatter` - Get note frontmatter

### Tasks (Convenience)

- `GET /api/v1/tasks` - List tasks (query: `status`, `limit`, `sortBy`, `sortOrder`)
- `POST /api/v1/tasks/find` - Find tasks with filters
- `GET /api/v1/tasks/:path` - Get a task
- `GET /api/v1/tasks/:path/metrics` - Get task metrics
- `GET /api/v1/tasks/next-actions` - Get COD-aware next actions

### Sessions

- `GET /api/v1/sessions` - List sessions
- `GET /api/v1/sessions/:id` - Get a session
- `GET /api/v1/sessions/stats` - Get session stats

### Knowledge Graph

- `GET /api/v1/graph/search` - Search the graph (query: `query`, `limit`)
- `GET /api/v1/graph/stats` - Get graph statistics
- `GET /api/v1/graph/related/:path` - Find related notes

### COD (Cognitive Operating Discipline)

- `GET /api/v1/cod/avatar` - Get avatar state
- `GET /api/v1/cod/world` - Get world state
- `GET /api/v1/cod/hard-stop` - Get HARD_STOP status
- `GET /api/v1/cod/decision-loop` - Get decision loop state
- `GET /api/v1/cod/productivity` - Get productivity patterns
- `GET /api/v1/cod/productivity/peak-hours` - Get peak productivity hours
- `GET /api/v1/scheduler/status` - Scheduler status (jobs, allowlist, last runs)

## Example Usage

### List all tasks

```bash
curl http://localhost:4200/api/v1/tasks
```

### Execute a specific tool

```bash
curl -X POST http://localhost:4200/api/v1/tools/obsidian_list_notes/execute \
  -H "Content-Type: application/json" \
  -d '{"pattern": "tasks/**/*.md"}'
```

### Search notes

```bash
curl "http://localhost:4200/api/v1/notes/search?query=meeting"
```

### Get COD status

```bash
curl http://localhost:4200/api/v1/cod/avatar
```

## Docker

```bash
# Build from monorepo root
docker build -f apps/api/Dockerfile -t vault-api .

# Run
docker run -p 4200:4200 -v /path/to/vault:/vault vault-api
```

## Architecture

```
apps/api/
├── src/
│   ├── index.ts           # Main server entry point
│   ├── config/
│   │   └── index.ts       # Configuration management
│   ├── plugins/
│   │   └── auth.ts        # Auth middleware (stub/real)
│   ├── routes/
│   │   ├── health.ts      # Health check routes
│   │   ├── tools.ts       # Generic tool execution
│   │   └── convenience.ts # RESTful convenience routes
│   └── tools/
│       └── loader.ts      # MCP tool loader
├── Dockerfile
├── package.json
└── tsconfig.json
```

The API service:

1. Loads MCP tools from `apps/mcp` (same tools used by the MCP server)
2. Exposes them via REST endpoints
3. Provides convenience routes for common operations
4. Supports optional token-based authentication

## Related Services

| Service       | Port | Purpose                     |
| ------------- | ---- | --------------------------- |
| `apps/mcp`    | 4000 | MCP server (for LLM agents) |
| `apps/auth`   | 4100 | Authentication service      |
| `apps/api`    | 4200 | REST API (this service)     |
| `apps/viewer` | 3000 | Gatsby web viewer           |
