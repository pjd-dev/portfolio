import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { VaultCache } from './cache.js';
import { getVaultRoot, walkMarkdownFiles } from './utils.js';

export interface NoteNode {
  path: string;
  title: string;
  tags: string[];
  links: string[];
  backlinks: string[];
  created?: string;
  updated?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: 'link' | 'tag';
}

export interface GraphData {
  nodes: Map<string, NoteNode>;
  edges: GraphEdge[];
  tagIndex: Map<string, string[]>; // tag -> note paths
  linkIndex: Map<string, string[]>; // note -> linked notes
  backlinkIndex: Map<string, string[]>; // note -> notes linking to it
}

export class KnowledgeGraph {
  private cache: VaultCache<GraphData>;
  private vaultPath: string;

  constructor(vaultPath: string) {
    this.vaultPath = vaultPath;
    this.cache = new VaultCache<GraphData>(600, 1); // 10 min TTL, single entry
  }

  async build(forceRebuild: boolean = false): Promise<GraphData> {
    const cacheKey = 'knowledge-graph';

    if (!forceRebuild) {
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    const graph: GraphData = {
      nodes: new Map(),
      edges: [],
      tagIndex: new Map(),
      linkIndex: new Map(),
      backlinkIndex: new Map(),
    };

    const files = await walkMarkdownFiles(this.vaultPath, '');

    // First pass: build nodes
    for (const filePath of files) {
      const fullPath = path.join(this.vaultPath, filePath);
      const content = await fs.readFile(fullPath, 'utf8');
      const parsed = matter(content);

      const title = this.extractTitle(content, filePath);
      const tags = this.extractTags(parsed.data);
      const links = this.extractLinks(content);

      const node: NoteNode = {
        path: filePath,
        title,
        tags,
        links,
        backlinks: [],
        created: (parsed.data as any).created,
        updated: (parsed.data as any).updated,
      };

      graph.nodes.set(filePath, node);

      // Index tags
      for (const tag of tags) {
        if (!graph.tagIndex.has(tag)) {
          graph.tagIndex.set(tag, []);
        }
        graph.tagIndex.get(tag)!.push(filePath);
      }

      // Index links
      graph.linkIndex.set(filePath, links);
    }

    // Second pass: build backlinks and edges
    for (const [fromPath, links] of graph.linkIndex.entries()) {
      for (const link of links) {
        const toPath = this.resolveLink(link, fromPath);

        if (toPath && graph.nodes.has(toPath)) {
          // Add backlink
          if (!graph.backlinkIndex.has(toPath)) {
            graph.backlinkIndex.set(toPath, []);
          }
          graph.backlinkIndex.get(toPath)!.push(fromPath);

          // Update node backlinks
          const toNode = graph.nodes.get(toPath);
          if (toNode && !toNode.backlinks.includes(fromPath)) {
            toNode.backlinks.push(fromPath);
          }

          // Add edge
          graph.edges.push({
            from: fromPath,
            to: toPath,
            type: 'link',
          });
        }
      }
    }

    // Add tag edges
    for (const [, notePaths] of graph.tagIndex.entries()) {
      for (let i = 0; i < notePaths.length; i++) {
        for (let j = i + 1; j < notePaths.length; j++) {
          graph.edges.push({
            from: notePaths[i],
            to: notePaths[j],
            type: 'tag',
          });
        }
      }
    }

    this.cache.set(cacheKey, graph);
    return graph;
  }

  async findRelated(
    notePath: string,
    limit: number = 10
  ): Promise<Array<{ path: string; score: number; reasons: string[] }>> {
    const graph = await this.build();
    const node = graph.nodes.get(notePath);

    if (!node) return [];

    const scores = new Map<string, { score: number; reasons: string[] }>();

    // Score direct links (weight: 3)
    for (const linkedPath of node.links) {
      const resolved = this.resolveLink(linkedPath, notePath);
      if (resolved && graph.nodes.has(resolved)) {
        if (!scores.has(resolved)) {
          scores.set(resolved, { score: 0, reasons: [] });
        }
        const entry = scores.get(resolved)!;
        entry.score += 3;
        entry.reasons.push('directly linked');
      }
    }

    // Score backlinks (weight: 2)
    for (const backlinkPath of node.backlinks) {
      if (!scores.has(backlinkPath)) {
        scores.set(backlinkPath, { score: 0, reasons: [] });
      }
      const entry = scores.get(backlinkPath)!;
      entry.score += 2;
      entry.reasons.push('backlink');
    }

    // Score shared tags (weight: 1 per tag)
    for (const tag of node.tags) {
      const taggedNotes = graph.tagIndex.get(tag) || [];
      for (const taggedPath of taggedNotes) {
        if (taggedPath !== notePath) {
          if (!scores.has(taggedPath)) {
            scores.set(taggedPath, { score: 0, reasons: [] });
          }
          const entry = scores.get(taggedPath)!;
          entry.score += 1;
          if (!entry.reasons.includes(`shared tag: ${tag}`)) {
            entry.reasons.push(`shared tag: ${tag}`);
          }
        }
      }
    }

    const results = Array.from(scores.entries())
      .map(([path, { score, reasons }]) => ({ path, score, reasons }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results;
  }

  async exportGraph(): Promise<{
    nodes: Array<{
      path: string;
      title: string;
      tags: string[];
      linkCount: number;
      backlinkCount: number;
    }>;
    edges: GraphEdge[];
    stats: {
      totalNotes: number;
      totalLinks: number;
      totalTags: number;
      avgLinksPerNote: number;
    };
  }> {
    const graph = await this.build();

    const nodes = Array.from(graph.nodes.values()).map((node) => ({
      path: node.path,
      title: node.title,
      tags: node.tags,
      linkCount: node.links.length,
      backlinkCount: node.backlinks.length,
    }));

    const stats = {
      totalNotes: graph.nodes.size,
      totalLinks: graph.edges.filter((e) => e.type === 'link').length,
      totalTags: graph.tagIndex.size,
      avgLinksPerNote:
        graph.nodes.size > 0
          ? graph.edges.filter((e) => e.type === 'link').length /
            graph.nodes.size
          : 0,
    };

    return {
      nodes,
      edges: graph.edges,
      stats,
    };
  }

  async search(
    query: string,
    options: {
      pathPrefix?: string;
      tags?: string[];
      caseSensitive?: boolean;
      limit?: number;
    } = {}
  ): Promise<
    Array<{
      path: string;
      title: string;
      matches: Array<{ line: number; text: string; context: string }>;
    }>
  > {
    const { pathPrefix, tags, caseSensitive = false, limit = 50 } = options;
    const graph = await this.build();
    const results: Array<{
      path: string;
      title: string;
      matches: Array<{ line: number; text: string; context: string }>;
    }> = [];

    const searchQuery = caseSensitive ? query : query.toLowerCase();

    for (const [filePath, node] of graph.nodes.entries()) {
      if (pathPrefix && !filePath.startsWith(pathPrefix)) continue;
      if (tags && tags.length > 0 && !tags.some((t) => node.tags.includes(t)))
        continue;

      const fullPath = path.join(this.vaultPath, filePath);
      const content = await fs.readFile(fullPath, 'utf8');
      const lines = content.split('\n');
      const matches: Array<{ line: number; text: string; context: string }> =
        [];

      const titleMatch = caseSensitive
        ? node.title.includes(searchQuery)
        : node.title.toLowerCase().includes(searchQuery);

      if (titleMatch) {
        matches.push({
          line: 0,
          text: node.title,
          context: 'title',
        });
      }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const searchLine = caseSensitive ? line : line.toLowerCase();

        if (searchLine.includes(searchQuery)) {
          const contextStart = Math.max(0, i - 1);
          const contextEnd = Math.min(lines.length - 1, i + 1);
          const context = lines.slice(contextStart, contextEnd + 1).join('\n');

          matches.push({
            line: i + 1,
            text: line.trim(),
            context,
          });
        }
      }

      if (matches.length > 0) {
        results.push({
          path: filePath,
          title: node.title,
          matches,
        });

        if (results.length >= limit) break;
      }
    }

    return results;
  }

  async getHubs(
    limit: number = 10
  ): Promise<Array<{ path: string; title: string; connections: number }>> {
    const graph = await this.build();

    return Array.from(graph.nodes.values())
      .map((node) => ({
        path: node.path,
        title: node.title,
        connections: node.links.length + node.backlinks.length,
      }))
      .sort((a, b) => b.connections - a.connections)
      .slice(0, limit);
  }

  async getOrphans(): Promise<string[]> {
    const graph = await this.build();

    return Array.from(graph.nodes.values())
      .filter((node) => node.links.length === 0 && node.backlinks.length === 0)
      .map((node) => node.path);
  }

  invalidateCache(): void {
    this.cache.clear();
  }

  private extractTitle(content: string, filePath: string): string {
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^#\s+(.+)$/);
      if (match) return match[1].trim();
    }
    return path.basename(filePath, '.md');
  }

  private extractTags(frontmatter: any): string[] {
    const tags = frontmatter.tags || [];
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') return [tags];
    return [];
  }

  private extractLinks(content: string): string[] {
    const linkRegex = /\[\[([^\]]+)\]\]/g;
    const links: string[] = [];
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const link = match[1];
      const cleanLink = link.split('|')[0].trim();
      links.push(cleanLink);
    }

    return [...new Set(links)];
  }

  private resolveLink(link: string, fromPath: string): string | null {
    let targetPath = link.endsWith('.md') ? link : `${link}.md`;

    if (targetPath.startsWith('./') || targetPath.startsWith('../')) {
      const fromDir = path.dirname(fromPath);
      targetPath = path.normalize(path.join(fromDir, targetPath));
    }

    return targetPath;
  }
}

export function createGraph(): KnowledgeGraph {
  return new KnowledgeGraph(getVaultRoot());
}
