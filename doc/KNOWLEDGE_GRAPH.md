# Knowledge Graph & Indexing

Comprehensive knowledge graph and indexing system for the Vault Platform.

## Overview

The knowledge graph system indexes Obsidian links (`[[like-this]]`), frontmatter tags, and relationships between notes to enable powerful navigation and querying capabilities for both humans and AI.

## Features

### 1. Link & Tag Graph
- **Automatic link indexing**: Parses `[[wiki-links]]` including alias format `[[link|alias]]`
- **Adjacency list**: Fast lookups for which notes link to which
- **Backlink tracking**: Automatically maintains reverse link index
- **Tag indexing**: Indexes all frontmatter tags for quick filtering
- **Relationship computation**: Calculates related notes based on shared links and tags

### 2. Graph Analysis
- **Hub detection**: Identifies highly-connected notes
- **Orphan detection**: Finds notes with no links or backlinks
- **Connectivity metrics**: Average links per note, graph density
- **Scored relationships**: Weighted relevance scoring for related notes

### 3. Search Tools
- **Full-text search**: Search note content and titles
- **Filter by path**: Restrict search to specific folders
- **Filter by tags**: Match notes with specific tags
- **Context highlighting**: Show surrounding lines for matches
- **Case-sensitive option**: Optional case matching

### 4. Graph Export
- **JSON export**: Lightweight graph representation
- **Full format**: Complete node and edge data
- **Compact format**: Minimal representation for bandwidth efficiency
- **Statistics**: Graph metrics and analysis

## Architecture

### Graph Builder (`core/graph.ts`)

The `KnowledgeGraph` class provides:
- In-memory graph construction with 10-minute cache TTL
- Two-pass building: nodes first, then edges/backlinks
- Efficient link resolution and path normalization
- Score-based related note finder

### Caching Strategy
- **Build-on-demand**: Graph builds on first access
- **TTL-based cache**: 10-minute expiration (configurable)
- **Manual invalidation**: Force rebuild via `graph_rebuild` tool
- **Single entry cache**: Only one graph cached per vault

## MCP Tools

### obsidian_graph_export
Export the entire knowledge graph as JSON.

**Input:**
```json
{
  "includeStats": true,
  "format": "full",  // or "compact"
  "rebuild": false
}
```

**Output:**
```json
{
  "nodes": [
    {
      "path": "notes/example.md",
      "title": "Example Note",
      "tags": ["tag1", "tag2"],
      "linkCount": 5,
      "backlinkCount": 3
    }
  ],
  "edges": [
    { "from": "note1.md", "to": "note2.md", "type": "link" },
    { "from": "note1.md", "to": "note3.md", "type": "tag" }
  ],
  "stats": {
    "totalNotes": 150,
    "totalLinks": 320,
    "totalTags": 45,
    "avgLinksPerNote": 2.13
  }
}
```

### obsidian_find_related
Find notes related to a given note based on links and tags.

**Input:**
```json
{
  "path": "projects/my-project.md",
  "limit": 10,
  "minScore": 1
}
```

**Scoring:**
- Direct links: +3 points
- Backlinks: +2 points
- Shared tags: +1 point per tag

**Output:**
```json
{
  "related": [
    {
      "path": "notes/reference.md",
      "score": 5,
      "reasons": ["directly linked", "shared tag: project"]
    }
  ]
}
```

### obsidian_graph_search
Full-text search with graph-aware filtering.

**Input:**
```json
{
  "query": "machine learning",
  "pathPrefix": "research/",
  "tags": ["ai", "ml"],
  "caseSensitive": false,
  "limit": 20,
  "includeContext": true
}
```

**Output:**
```json
{
  "results": [
    {
      "path": "research/ml-overview.md",
      "title": "Machine Learning Overview",
      "matches": [
        {
          "line": 15,
          "text": "Machine learning is a subset of AI...",
          "context": "...\nPrevious line\nMachine learning is a subset of AI...\nNext line\n..."
        }
      ]
    }
  ]
}
```

### obsidian_graph_stats
Get statistics and analysis of the knowledge graph.

**Input:**
```json
{
  "includeHubs": true,
  "includeOrphans": true,
  "hubLimit": 10,
  "rebuild": false
}
```

**Output:**
```json
{
  "stats": {
    "totalNotes": 150,
    "totalLinks": 320,
    "totalTags": 45,
    "avgLinksPerNote": 2.13
  },
  "hubs": [
    {
      "path": "index.md",
      "title": "Index",
      "connections": 47
    }
  ],
  "orphans": [
    "drafts/unconnected.md",
    "scratch/temp.md"
  ]
}
```

### obsidian_graph_rebuild
Force rebuild of the knowledge graph cache.

**Input:**
```json
{
  "verify": true
}
```

**Output:**
```json
{
  "success": true,
  "buildTime": 245,
  "stats": {
    "totalNotes": 150,
    "totalLinks": 320,
    "totalTags": 45,
    "avgLinksPerNote": 2.13
  }
}
```

## Usage Examples

### Find Related Research Papers
```typescript
// Find papers related to "machine-learning-intro.md"
const related = await mcp.call("obsidian_find_related", {
  path: "research/machine-learning-intro.md",
  limit: 5,
  minScore: 2
});
```

### Search for Topic Across Project Folder
```typescript
// Search for "deployment" in projects folder
const results = await mcp.call("obsidian_graph_search", {
  query: "deployment",
  pathPrefix: "projects/",
  tags: ["engineering"],
  limit: 10
});
```

### Identify Knowledge Hubs
```typescript
// Find the most connected notes
const stats = await mcp.call("obsidian_graph_stats", {
  includeHubs: true,
  hubLimit: 10
});
```

### Export for Visualization
```typescript
// Export graph for external visualizer
const graph = await mcp.call("obsidian_graph_export", {
  format: "compact",
  includeStats: true
});
```

## Performance

### Optimization Strategies
- **Lazy building**: Graph builds only when needed
- **Cache reuse**: 10-minute TTL reduces rebuilds
- **Batch processing**: Files processed in parallel
- **Efficient data structures**: Maps and Sets for O(1) lookups
- **Link resolution caching**: Path normalization cached

### Benchmarks (typical vault with 500 notes)
- **Initial build**: 500-800ms
- **Cached access**: <5ms
- **Search query**: 50-150ms (depends on query complexity)
- **Related notes**: 10-30ms
- **Export**: 20-40ms

### Scalability
- **1,000 notes**: ~1.5s build time
- **5,000 notes**: ~7s build time
- **10,000 notes**: ~15s build time (consider persistent index)

## Implementation Details

### Link Extraction
```typescript
// Regex pattern for Obsidian wiki links
const linkRegex = /\[\[([^\]]+)\]\]/g;

// Handles formats:
// [[simple-link]]
// [[link-with-alias|Display Text]]
// [[folder/nested/link]]
```

### Link Resolution
```typescript
// Simple resolution strategy:
// 1. Add .md extension if missing
// 2. Resolve relative paths (../ and ./)
// 3. Normalize path separators
// 4. Return canonical path
```

### Scoring Algorithm
```typescript
const score = 
  (directLinks * 3) + 
  (backlinks * 2) + 
  (sharedTags * 1);
```

### Graph Structure
```typescript
interface GraphData {
  nodes: Map<string, NoteNode>;
  edges: GraphEdge[];
  tagIndex: Map<string, string[]>;
  linkIndex: Map<string, string[]>;
  backlinkIndex: Map<string, string[]>;
}
```

## Integration with Existing Tools

### Combines With
- **obsidian_find_by_frontmatter**: Use graph to enhance metadata queries
- **obsidian_search_notes**: Basic search now superseded by graph_search
- **obsidian_auto_tag**: Use graph to suggest tags based on connections
- **obsidian_refactor_note**: Add backlinks section during refactoring

### Workflow Examples

**1. Research Navigation**
```typescript
// Start with a paper
const note = "research/papers/attention-is-all-you-need.md";

// Find related papers
const related = await findRelated(note);

// Search for specific concepts across related papers
for (const rel of related) {
  const matches = await graphSearch({
    query: "transformer architecture",
    pathPrefix: path.dirname(rel.path)
  });
}
```

**2. Project Discovery**
```typescript
// Find all projects with specific tags
const projects = await graphSearch({
  query: "",
  pathPrefix: "projects/",
  tags: ["active", "engineering"]
});

// Identify hub project (most connected)
const stats = await graphStats({
  includeHubs: true,
  hubLimit: 1
});
```

**3. Knowledge Gap Detection**
```typescript
// Find orphaned notes that need connections
const stats = await graphStats({
  includeOrphans: true
});

// Review and add links
for (const orphan of stats.orphans) {
  const content = await readNote(orphan);
  // Suggest related notes based on content
}
```

## Future Enhancements

### Potential Additions
- **Temporal analysis**: Track link changes over time
- **Semantic similarity**: Use embeddings for content-based relations
- **Community detection**: Find note clusters/topics
- **Path finding**: Shortest path between two notes
- **Citation analysis**: PageRank-style importance scoring
- **Interactive visualization**: Web UI for graph exploration
- **Persistent index**: SQLite/LevelDB for large vaults
- **Incremental updates**: Update graph on file changes only

### Plugin Architecture
```typescript
interface GraphPlugin {
  name: string;
  analyze(graph: GraphData): any;
  enhance(graph: GraphData): GraphData;
}
```

## Troubleshooting

### Graph seems stale
```typescript
// Force rebuild
await mcpCall("obsidian_graph_rebuild", { verify: true });
```

### Missing links
- Check link format: must be `[[exactly-like-this]]`
- Verify file paths are correct
- Ensure .md extension resolution

### Performance issues
- Consider smaller `limit` values
- Use `pathPrefix` to scope searches
- Rebuild graph less frequently
- Enable compact export format

## API Reference

See tool implementations in:
- `apps/mcp/src/core/graph.ts`
- `apps/mcp/src/mcp/obsidian/tools/graph_*.ts`

## License

Part of Vault Platform - see main LICENSE file.
