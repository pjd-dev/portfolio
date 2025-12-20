# Vault Platform Enhancements

This document describes all the enhancements made to the Vault Platform.

## 1. Frontmatter Query Enhancements ✅

### Performance Improvements

- **Index-based search**: Built global frontmatter index for O(1) lookups in large vaults
- **Batch reading**: Process files in batches of 50 for better I/O performance
- **Pagination support**: Added `offset` and `limit` for efficient result handling
- **Regex operator**: New regex pattern matching for advanced queries

### Enhanced Caching Layer

- **LRU eviction**: Automatic least-recently-used eviction when cache is full
- **Cache statistics**: Track hits, misses, evictions, and hit rates
- **Multiple cache instances**: Separate caches for frontmatter, index, and content
- **Cache prewarm**: Bulk loading support for faster startup
- **Multi-get**: Retrieve multiple keys efficiently

### Files Modified

- `apps/mcp/src/core/cache.ts` - Enhanced cache implementation
- `apps/mcp/src/mcp/obsidian/tools/find_by_frontmatter.ts` - Index-based queries
- `apps/mcp/src/mcp/obsidian/tools/cache_stats.ts` - New cache management tool

## 2. Advanced Editing Tools ✅

### Structured Patch System

New `obsidian_structured_patch` tool provides:

- **Safe multi-operation patching**: Apply multiple edits atomically
- **Validation before apply**: Check match counts before modifying
- **Code-block awareness**: Skip replacements inside code blocks
- **Dry-run mode**: Preview changes before applying
- **Diff generation**: See exact changes that will be made
- **Rollback support**: Validation prevents partial failures

Operations supported:

- `replace`: Find and replace with validation
- `insert`: Insert at specific line numbers
- `delete`: Remove text with validation

### Enhanced Existing Tools

- `replace_in_section.ts`: Code-block aware replacements
- `insert_after_heading.ts`: Precise heading-based insertions
- Both support `skipCodeBlocks` option

### Files Created

- `apps/mcp/src/mcp/obsidian/tools/structured_patch.ts`

## 3. encode-md Improvements ✅

### New Features

- **Automatic code block escaping**: `--escape-code-blocks` flag
- **Chunked output**: `--chunked` mode with configurable `--chunk-size`
- **Diff preview**: `--diff` mode compares note with file
- **Configurable diff context**: `--diff-context` lines of context

### Usage Examples

```bash
# Escape code blocks for safe embedding
encode-md --escape-code-blocks --rpc --note code.md code.md

# Output in chunks for large files
encode-md --chunked --chunk-size 50000 large-file.md

# Preview differences
encode-md --diff --note existing.md updated.md --diff-context 5
```

### Files Modified

- `apps/mcp/src/tools/encode-md.ts`

## 4. Workflow Automation ✅

### Conversational Note Templates

New `obsidian_conversational_template` tool with templates for:

- **Meeting notes**: Attendees, agenda, discussion, action items
- **Project tracking**: Goals, milestones, resources, status
- **Daily journals**: Focus, completed tasks, notes, reflections
- **Task management**: Description, status, priority, checklist
- **Research notes**: Question, hypothesis, findings, sources
- **Custom templates**: User-defined markdown templates

All templates automatically populate frontmatter with appropriate metadata.

### Enhanced Auto-tagging

Existing `auto_tag.ts` tool provides:

- Keyword-based tag detection
- Configurable keyword mappings
- Append or replace mode
- Default patterns for common note types

### AI-driven Note Refactoring

New `obsidian_refactor_note` tool with operations:

- **fix-headings**: Correct heading hierarchy
- **normalize-lists**: Standardize list formatting
- **extract-todos**: Move tasks to dedicated section
- **add-toc**: Generate table of contents
- **split-long-sections**: Break up oversized sections
- **consolidate-links**: Create links reference section
- **format-code-blocks**: Clean up code block syntax

Supports dry-run mode for previewing changes.

### Files Created

- `apps/mcp/src/mcp/obsidian/tools/conversational_template.ts`
- `apps/mcp/src/mcp/obsidian/tools/refactor_note.ts`

## 5. Git Sync Enhancements ✅

### Merge Conflict Detection

- Automatically detect merge conflicts using `git diff --diff-filter=U`
- Report conflicted files with detailed error messages
- Exit with code 2 for manual intervention

### Better Error Handling

- **Retry logic**: Configurable retries with exponential backoff
- **Environment variables**: `MAX_RETRIES`, `RETRY_DELAY`
- **Structured logging**: JSON-formatted logs with timestamps
- **Detailed git status**: Track file changes with status codes
- **Non-fast-forward detection**: Auto-pull before push if rejected

### Event-based Triggers

- Structured log output for external monitoring
- Exit codes for different failure modes:
  - 0: Success
  - 1: Sync error
  - 2: Merge conflict (needs manual resolution)

### Files Modified

- `apps/vault-sync/scripts/sync.py`

## 6. Metadata Model Extensions ✅

### Version Tracking

- Semantic versioning (x.y.z)
- `bump-version` action: major, minor, patch
- Automatic version validation

### Status Lifecycle

State machine with enforced transitions:

1. **draft** → initial state
2. **review** → after draft completion
3. **stable** → after review approval
4. **deprecated** → from any state

Each transition records timestamp in lifecycle metadata.

### Type System Enforcement

Zod schema validation for:

- `version`: Semantic version format
- `status`: Enum of lifecycle states
- `type`: Note type classification
- `created`/`updated`: ISO timestamps
- `author`: String
- `tags`: Array of strings
- `lifecycle`: Object with transition timestamps

### Tool Actions

- `validate`: Check schema compliance
- `apply`: Set metadata with validation
- `transition`: Move through lifecycle states
- `bump-version`: Increment version numbers

### Files Created

- `apps/mcp/src/mcp/obsidian/tools/metadata_model.ts`

## 7. Security & Deployment ✅

### JWT-based Authentication

New optional JWT middleware:

- Bearer token support in Authorization header
- Cookie-based token fallback
- Token expiration validation
- Scope-based authorization
- Login endpoint generator

Usage:

```typescript
import {
  createJWTMiddleware,
  createLoginHandler,
  requireScope,
} from './middleware';

const jwtAuth = createJWTMiddleware({
  secret: process.env.JWT_SECRET!,
  required: true,
});

app.post(
  '/login',
  createLoginHandler({
    secret: process.env.JWT_SECRET!,
    validateCredentials: async (username, password) => {
      // Your validation logic
      return { userId: 'user123', scope: ['read', 'write'] };
    },
  })
);

app.use('/mcp', jwtAuth, requireScope('vault:write'));
```

### Container Orchestration

Orchestration runs through `scripts/vault` (Podman or Docker):

- `./scripts/vault start` - Start MCP + Vaulty
- `./scripts/vault stop` - Stop services
- `./scripts/vault build` - Build container images
- `./scripts/vault status` - Service status

### Private Tunnel Access

Can be configured with:

- Environment-based secrets (MCP_SECRET)
- JWT tokens for user authentication
- Scope-based access control

### Files Created

- `apps/mcp/src/middleware/jwt.ts`

## Installation

### Install Dependencies

```bash
cd apps/mcp
pnpm install
```

### Build

```bash
pnpm build
```

### Run Tests (if available)

```bash
pnpm test
```

## Environment Variables

### MCP Server

- `MCP_SECRET`: API authentication secret
- `JWT_SECRET`: (Optional) JWT signing secret
- `PORT`: Server port (default: 4000)
- `OBSIDIAN_VAULT_PATH`: Path to vault

### Vault Sync

- `VAULT_PATH`: Git repository path
- `GIT_REMOTE`: Git remote name (default: origin)
- `GIT_BRANCH`: Branch name (default: main)
- `MAX_RETRIES`: Retry attempts (default: 3)
- `RETRY_DELAY`: Seconds between retries (default: 5)

## New MCP Tools Summary

| Tool                               | Description                                     |
| ---------------------------------- | ----------------------------------------------- |
| `obsidian_structured_patch`        | Multi-operation atomic patching with validation |
| `obsidian_cache_stats`             | View and manage cache statistics                |
| `obsidian_conversational_template` | Create notes from interactive templates         |
| `obsidian_refactor_note`           | AI-driven structure improvements                |
| `obsidian_metadata_model`          | Version tracking and lifecycle management       |
| `obsidian_find_by_frontmatter`     | Enhanced with indexing and pagination           |
| `obsidian_graph_export`            | Export knowledge graph as JSON                  |
| `obsidian_find_related`            | Find related notes by links and tags            |
| `obsidian_graph_search`            | Full-text search with graph filtering           |
| `obsidian_graph_stats`             | Graph statistics and analysis                   |
| `obsidian_graph_rebuild`           | Rebuild knowledge graph cache                   |

## Architecture Improvements

### Performance

- Indexed queries reduce search time from O(n) to O(1)
- LRU cache prevents memory bloat
- Batch processing reduces I/O overhead
- Pagination supports large result sets

### Reliability

- Validation prevents partial failures
- Dry-run modes allow previewing
- Structured error handling with retry logic
- Merge conflict detection prevents data loss

### Developer Experience

- Comprehensive logging
- Clear error messages
- Type-safe schemas with Zod
- Modular tool architecture

## Migration Guide

### Existing Code Compatibility

All existing tools remain unchanged. New features are additive.

### Adopting New Features

#### 1. Enable JWT Authentication

```typescript
// In src/index.ts
import { createJWTMiddleware } from "./middleware";

const jwtAuth = createJWTMiddleware({
  secret: process.env.JWT_SECRET!,
  required: false  // Make optional initially
});

app.all("/mcp", jwtAuth, rateLimiter, ...);
```

#### 2. Use Enhanced Caching

```typescript
// Already enabled by default
// Monitor with: obsidian_cache_stats
```

#### 3. Apply Metadata Model

```typescript
// Use obsidian_metadata_model tool
{
  "action": "apply",
  "metadata": {
    "version": "1.0.0",
    "status": "draft"
  }
}
```

## 8. Knowledge Graph & Indexing ✅

### Link & Tag Graph

- **Automatic link indexing**: Parses `[[wiki-links]]` including alias format
- **Backlink tracking**: Maintains reverse link index automatically
- **Tag indexing**: Indexes frontmatter tags for quick filtering
- **Adjacency lists**: Fast lookups for note relationships
- **Scored relationships**: Weighted relevance (links: 3, backlinks: 2, tags: 1)

### Graph Analysis

- **Hub detection**: Identifies highly-connected notes
- **Orphan detection**: Finds isolated notes
- **Connectivity metrics**: Average links, graph density
- **Related note finder**: Discovers connections by links and tags

### Search & Discovery

- **Full-text search**: Search content and titles
- **Path filtering**: Restrict to specific folders
- **Tag filtering**: Match by frontmatter tags
- **Context highlighting**: Show surrounding lines
- **Case-sensitive option**: Optional case matching

### Graph Export

- **JSON export**: Full or compact format
- **Statistics**: Total notes, links, tags, averages
- **Visualization ready**: Compatible with external tools
- **Cache management**: 10-minute TTL, manual rebuild

### Files Created

- `apps/mcp/src/core/graph.ts` - Knowledge graph engine
- `apps/mcp/src/mcp/obsidian/tools/graph_export.ts` - Export tool
- `apps/mcp/src/mcp/obsidian/tools/find_related.ts` - Related notes
- `apps/mcp/src/mcp/obsidian/tools/graph_search.ts` - Search tool
- `apps/mcp/src/mcp/obsidian/tools/graph_stats.ts` - Statistics
- `apps/mcp/src/mcp/obsidian/tools/graph_rebuild.ts` - Cache rebuild
- `KNOWLEDGE_GRAPH.md` - Comprehensive documentation

---

## Future Enhancements

Potential areas for expansion:

- Real-time vault sync with WebSocket
- Plugin system for custom tools
- GraphQL API for complex queries
- Multi-vault support
- Conflict resolution UI
- Collaborative editing
- Semantic similarity with embeddings
- Community detection in graphs
- Backup and snapshot management

## Contributing

When adding new features:

1. Follow existing tool patterns in `apps/mcp/src/mcp/obsidian/tools/`
2. Add comprehensive Zod schemas for validation
3. Include dry-run modes for destructive operations
4. Write structured error messages
5. Update this README

## License

[Your License Here]
