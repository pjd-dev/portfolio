# Environment Variable Strategy

**Date**: December 18, 2025  
**Scope**: Vault Platform Full - Configuration management  
**Status**: ✅ COMPLETE

---

## Executive Summary

Environment variable management follows a **hierarchical override pattern** where more specific configurations take precedence over general ones. This document defines the hierarchy, required vs optional variables, and validation procedures.

---

## Configuration Hierarchy (Precedence Order)

Variables are resolved in this order - **first match wins**:

```text
1. Runtime environment (set at execution time)
   └─ Highest priority

2. Container environment (Dockerfile ENV, scripts/services/start.sh env files)

3. App-level .env file (apps/*/. env)

4. Root-level .env file (./.env)

5. Application defaults (hardcoded in code)
   └─ Lowest priority
```

### Example Resolution

For `VAULT_PATH`:

```bash
# Check in this order:
1. export VAULT_PATH=/custom  # ✅ Uses /custom (runtime)
2. Remove export, use env_file directive in compose
3. Check apps/vaulty/.env
4. Check root .env
5. Default to /vault (hardcoded)
```

---

## Variables by Application

### Root Level (All Apps)

| Variable    | Default       | Required | Type    | Description                                        |
| ----------- | ------------- | -------- | ------- | -------------------------------------------------- |
| `LOG_LEVEL` | `info`        | No       | string  | Logging verbosity: debug, info, warn, error        |
| `NODE_ENV`  | `development` | No       | string  | Environment mode: development, staging, production |
| `PORT`      | varies        | No       | number  | HTTP server port (per-app override)                |
| `DEBUG`     | `false`       | No       | boolean | Enable debug output                                |

### MCP App (apps/mcp/)

| Variable                                   | Default      | Required | Type    | Description                           |
| ------------------------------------------ | ------------ | -------- | ------- | ------------------------------------- |
| `MCP_PORT`                                 | `3001`       | No       | number  | MCP server port                       |
| `MCP_HOST`                                 | `0.0.0.0`    | No       | string  | Bind address                          |
| `VAULT_ROOT`                               | `/vault`     | Yes      | path    | Obsidian vault directory              |
| `POD_NAME`                                 | `vaulty-pod` | No       | string  | Container pod name for MCP connection |
| `MAX_WORKERS`                              | `4`          | No       | number  | Thread pool size                      |
| `CACHE_TTL`                                | `3600`       | No       | number  | Cache expiration in seconds           |
| `PIPELINE_SCHEDULER_ENABLED`               | `false`      | No       | boolean | Enable scheduled pipeline runs        |
| `PIPELINE_SCHEDULER_INTERVAL_MS`           | `60000`      | No       | number  | Pipeline scheduler interval (ms)      |
| `RECURRING_TEMPLATE_SCHEDULER_ENABLED`     | `false`      | No       | boolean | Enable recurring template scheduler   |
| `RECURRING_TEMPLATE_SCHEDULER_INTERVAL_MS` | `60000`      | No       | number  | Recurring template interval (ms)      |
| `ENABLE_TRACING`                           | `false`      | No       | boolean | Enable OpenTelemetry tracing          |

**Notes**:

- `VAULT_ROOT` is required; MCP cannot function without it
- `POD_NAME` must match the vaulty container pod
- Increase `MAX_WORKERS` for high-concurrency scenarios

### Vaulty App (apps/vaulty/)

| Variable               | Default             | Required | Type    | Description                                   |
| ---------------------- | ------------------- | -------- | ------- | --------------------------------------------- |
| `VAULT_PATH`           | `/vault`            | Yes      | path    | Vault mount point in container                |
| `SYNC_MODE`            | `interval`          | No       | string  | Sync strategy: interval or realtime           |
| `GIT_SYNC_INTERVAL`    | `30`                | No       | number  | Sync interval in seconds (interval mode only) |
| `GIT_USERNAME`         | `pjd-dev`           | Yes      | string  | Git commit author username                    |
| `GIT_EMAIL`            | `pjd@example.com`   | Yes      | string  | Git commit author email                       |
| `GIT_REPO`             | `obsidianVault.git` | Yes      | string  | Git repository name (no protocol)             |
| `GIT_TOKEN`            | (none)              | Yes\*    | string  | GitHub personal access token (\*not in image) |
| `GIT_SYNC_PUSH`        | `1`                 | No       | boolean | Auto-push changes (1/0/true/false)            |
| `HEALTH_CHECK_MAX_AGE` | `120`               | No       | number  | Max seconds before health check fails         |
| `MAX_DELETIONS`        | `15`                | No       | number  | Max files to delete in single sync            |
| `MAX_DELETE_RATIO`     | `0.5`               | No       | number  | Max deletion ratio (0-1)                      |
| `VAULTY_ENABLE_GIT`    | `false`             | No       | boolean | Enable obsidian-git plugin in seed            |

**Critical Notes**:

- `GIT_TOKEN` is **NOT** baked into the Dockerfile for security
- Provide via runtime environment or secrets management
- `GIT_USERNAME`, `GIT_EMAIL`, `GIT_REPO` must be set for any git operations
- `MAX_DELETIONS` prevents accidental vault destruction

### Auth App (apps/auth/)

| Variable                    | Default | Required | Type   | Description                              |
| --------------------------- | ------- | -------- | ------ | ---------------------------------------- |
| `AUTH_PORT`                 | `3000`  | No       | number | Authentication server port               |
| `SUPABASE_URL`              | (none)  | Yes      | string | Supabase project URL                     |
| `SUPABASE_ANON_KEY`         | (none)  | Yes      | string | Supabase anonymous key                   |
| `SUPABASE_SERVICE_ROLE_KEY` | (none)  | Yes      | string | Supabase service role (admin operations) |
| `JWT_SECRET`                | (none)  | Yes      | string | JWT signing secret                       |
| `SESSION_TIMEOUT`           | `3600`  | No       | number | Session duration in seconds              |

**Security Notes**:

- Never commit `SUPABASE_*` or `JWT_SECRET` to version control
- Use GitHub Secrets for CI/CD
- Use HashiCorp Vault or similar for production

### LLM Adapter (apps/llm-adapter/)

| Variable        | Default    | Required | Type   | Description                                       |
| --------------- | ---------- | -------- | ------ | ------------------------------------------------- |
| `PORT`          | `3000`     | No       | number | HTTP server port                                  |
| `MCP_AUTH_TYPE` | `none`     | No       | string | Auth method: none, apikey, or bearer              |
| `MCP_API_KEY`   | (none)     | No\*     | string | API key (\*required if MCP_AUTH_TYPE=apikey)      |
| `MCP_TOKEN`     | (none)     | No\*     | string | Bearer token (\*required if MCP_AUTH_TYPE=bearer) |
| `PROVIDER_URL`  | (none)     | No       | string | LLM provider endpoint for forwarding              |
| `MCP_BASE_PATH` | `/mcp/llm` | No       | string | Base path for API routes                          |

**Notes**:

- If `PROVIDER_URL` is not set, adapter returns mock responses
- Useful for testing without external dependencies

---

## .env File Format

Each `.env` file uses simple KEY=VALUE format with comments:

```bash
# Root .env
LOG_LEVEL=debug
NODE_ENV=development

# apps/vaulty/.env
VAULT_PATH=/vault
SYNC_MODE=interval
GIT_USERNAME=my-username
GIT_EMAIL=my@email.com
GIT_REPO=my-vault.git

# apps/mcp/.env
MCP_PORT=3001
VAULT_ROOT=/vault
```

### .env.example Files

Each app includes `.env.example` showing:

- All available variables
- Recommended values
- Security notes

Usage:

```bash
cp apps/vaulty/.env.example apps/vaulty/.env
# Edit with actual values
```

---

## Configuration by Environment

### Development

```bash
# Root .env
NODE_ENV=development
LOG_LEVEL=debug
DEBUG=true

# apps/vaulty/.env
SYNC_MODE=realtime
GIT_SYNC_PUSH=0  # Don't auto-push in dev

# apps/mcp/.env
CACHE_TTL=600  # Shorter cache for development
```

### Staging

```bash
# Root .env
NODE_ENV=staging
LOG_LEVEL=info
DEBUG=false

# apps/vaulty/.env
SYNC_MODE=interval
GIT_SYNC_INTERVAL=60
GIT_SYNC_PUSH=1

# apps/mcp/.env
CACHE_TTL=1800  # 30 minutes
ENABLE_TRACING=true
```

### Production

```bash
# Root .env (or use secrets management)
NODE_ENV=production
LOG_LEVEL=warn

# apps/vaulty/.env (via secrets)
SYNC_MODE=interval
GIT_SYNC_INTERVAL=300  # 5 minutes
GIT_SYNC_PUSH=1
MAX_DELETIONS=5  # Stricter limit in production

# apps/mcp/.env (via secrets)
CACHE_TTL=3600  # 1 hour
ENABLE_TRACING=true
```

---

## Script Environment Management

The `scripts/services/start.sh` script loads environments in order:

```bash
load_env_files() {
  # 1. Root .env
  if [[ -f "$REPO_ROOT/.env" ]]; then
    set -o allexport
    source "$REPO_ROOT/.env"
    set +o allexport
  fi

  # 2. App-level .env (overrides root)
  for app in mcp vaulty; do
    local app_env="$REPO_ROOT/apps/$app/.env"
    if [[ -f "$app_env" ]]; then
      set -o allexport
      source "$app_env"
      set +o allexport
    fi
  done
}
```

**Result**: App-level variables override root-level.

---

## Security Best Practices

### DO ✅

- Use `.env.example` as a template
- Never commit `.env` files
- Add `.env` to `.gitignore`
- Use different `.env` files per environment
- Rotate secrets regularly
- Use secrets management (HashiCorp Vault, GitHub Secrets, AWS Secrets Manager)
- Validate required variables at startup

### DON'T ❌

- Commit `.env` with real credentials
- Hardcode secrets in Dockerfile ENV
- Use same secrets across environments
- Check secrets into git history
- Share `.env` files via email/chat

---

## Variable Validation

### At Startup

Each app should validate required variables:

```bash
# Example: vaulty startup check
if [[ -z "$GIT_USERNAME" ]]; then
  echo "ERROR: GIT_USERNAME not set" >&2
  exit 1
fi

if [[ -z "$GIT_EMAIL" ]]; then
  echo "ERROR: GIT_EMAIL not set" >&2
  exit 1
fi
```

### Validation Script

Run `scripts/infrastructure/validate.sh` to check all variables:

```bash
./scripts/infrastructure/validate.sh
```

Output:

```text
✓ VAULT_PATH=/vault
✓ GIT_USERNAME=pjd-dev
✗ GIT_TOKEN not set (required for git operations)
```

---

## Troubleshooting

### "Variable not found" errors

1. Check hierarchy - is it set at the right level?
2. Verify `.env` file exists and is readable
3. Check for typos in variable names (case-sensitive)
4. Ensure `allexport` is enabled when sourcing

### "Variable has wrong value"

1. Check which .env file is being read
2. Verify no runtime override is shadowing it
3. Check container ENV directives in docker-compose

### "Secret not injected"

1. For CI/CD: Check GitHub Secrets are set correctly
2. For containers: Verify env_file path in compose
3. Check pod/container environment: `docker inspect` or `podman inspect`

---

## Environment Variable Reference by App

### apps/mcp/

```text
Required: VAULT_ROOT
Optional: MCP_PORT, MCP_HOST, MAX_WORKERS, CACHE_TTL, ENABLE_TRACING, LOG_LEVEL
```

See: [apps/mcp/.env.example](apps/mcp/.env.example)

### apps/vaulty/

```text
Required: VAULT_PATH, GIT_USERNAME, GIT_EMAIL, GIT_REPO, GIT_TOKEN
Optional: SYNC_MODE, GIT_SYNC_INTERVAL, GIT_SYNC_PUSH, HEALTH_CHECK_MAX_AGE, MAX_DELETIONS, MAX_DELETE_RATIO, VAULTY_ENABLE_GIT
```

See: [apps/vaulty/.env.example](apps/vaulty/.env.example)

### apps/auth/

```text
Required: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET
Optional: AUTH_PORT, SESSION_TIMEOUT, LOG_LEVEL
```

See: [apps/auth/.env.example](apps/auth/.env.example)

### apps/llm-adapter/

```text
Required: (none - uses all defaults)
Optional: PORT, MCP_AUTH_TYPE, MCP_API_KEY, MCP_TOKEN, PROVIDER_URL, MCP_BASE_PATH
```

See: [apps/llm-adapter/.env.example](apps/llm-adapter/.env.example)

---

## CI/CD Secret Management

### GitHub Actions

Secrets are stored in GitHub Organization Settings → Secrets → Actions:

```yaml
# In workflows, reference as:
env:
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
  GIT_TOKEN: ${{ secrets.GIT_TOKEN }}
```

List of required GitHub Secrets:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `GIT_TOKEN`
- `REGISTRY_USERNAME` (for container registry)
- `REGISTRY_PASSWORD` (for container registry)

---

## Summary Table

| Aspect             | Strategy                                                   | Status        |
| ------------------ | ---------------------------------------------------------- | ------------- |
| Override hierarchy | Runtime > Container > App .env > Root .env > Code defaults | ✅ Documented |
| Required variables | Per-app documentation in this file                         | ✅ Documented |
| Security           | Never commit secrets, use GitHub Secrets for CI/CD         | ✅ Defined    |
| Validation         | scripts/infrastructure/validate.sh                         | ✅ Available  |
| Troubleshooting    | Common issues listed above                                 | ✅ Documented |
| Examples           | .env.example files in each app                             | ✅ Present    |

---

**End of Document**  
Last Updated: December 18, 2025
