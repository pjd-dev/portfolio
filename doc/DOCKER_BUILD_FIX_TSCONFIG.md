# Docker Build Fix: Missing tsconfig.base.json

**Date**: December 18, 2025  
**Issue**: Podman/Docker build failing with `Cannot read file '/app/tsconfig.base.json'`  
**Status**: ✅ FIXED

---

## Problem

When running the service startup workflow (`./scripts/vault start`), the MCP container build was failing with:

```
error: Cannot read file '/app/tsconfig.base.json'
```

### Root Cause

The MCP app's `tsconfig.json` extends the root-level `tsconfig.base.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  ...
}
```

However, the `apps/mcp/Dockerfile` was not copying these configuration files into the build context. The Dockerfile only copied:

- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`

But was missing:

- `tsconfig.base.json` (at root)
- `tsconfig.json` (at root)

---

## Solution

### File Modified

**[apps/mcp/Dockerfile](../apps/mcp/Dockerfile)** - Line 8

**Before**:

```dockerfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
```

**After**:

```dockerfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json tsconfig.json ./
```

### Why This Works

1. When the Dockerfile runs `pnpm install` and `pnpm build`, these commands parse TypeScript configs
2. The MCP's `tsconfig.json` extends the root's `tsconfig.base.json`
3. By copying both files to `/app/` in the container, the relative path `../../tsconfig.base.json` now resolves correctly to `/app/tsconfig.base.json`

---

## Verification

### Build Test Result

✅ **SUCCESS** - MCP image builds without errors

```bash
$ podman build -t localhost/mcp:latest -f apps/mcp/Dockerfile .

STEP 4/15: COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json tsconfig.json ./
--> Using cache c48bd0be1717af9c723c8789ba2999f2185be0c2004b314ba0c8250f4bf67753
...
Successfully tagged localhost/mcp:latest
Successfully tagged localhost/mcp:test
```

### Image Created

```
REPOSITORY              TAG        IMAGE ID       CREATED          SIZE
localhost/mcp           latest     0760a9a6747e   2 minutes ago    489 MB
localhost/mcp           test       0760a9a6747e   2 minutes ago    489 MB
```

---

## Related Files

- **Service Start Script**: [scripts/services/start.sh](../scripts/services/start.sh) (uses repo root as build context)
- **MCP tsconfig**: [apps/mcp/tsconfig.json](../apps/mcp/tsconfig.json) (extends root tsconfig.base.json)
- **Vaulty Dockerfile**: [apps/vaulty/Dockerfile](../apps/vaulty/Dockerfile) (no TypeScript, no issue)
- **LLM-Adapter Dockerfile**: [apps/llm-adapter/Dockerfile](../apps/llm-adapter/Dockerfile) (no root tsconfig dependency)

---

## Testing the Service Script

Now the startup workflow should work properly:

```bash
pnpm vault:services:start
```

---

## Note on Build Context

The MCP Dockerfile correctly uses the repository root as its build context:

```bash
podman build -t mcp -f "$REPO_ROOT/apps/mcp/Dockerfile" "$REPO_ROOT"
                                                         ^^^^^^^^^^^^^^^^
                                                    Build context = repo root
```

This allows the Dockerfile to access files from anywhere in the repo, including the root-level `tsconfig` files.

---

## Summary

| Item             | Status |
| ---------------- | ------ |
| Issue identified | ✅     |
| Root cause found | ✅     |
| Fix implemented  | ✅     |
| Build tested     | ✅     |
| Image created    | ✅     |
| Ready to use     | ✅     |

The MCP container can now be built successfully as part of the compose workflow.
