import type { ListTemplatesInput, ListTemplatesOutput } from './schema.js';

type TemplateInfo = {
  name: string;
  category: string;
  path: string;
  description?: string;
  tags?: string[];
};

export type ListTemplatesDeps = {
  templateDiscoveryService: {
    discoverTemplates: (forceRefresh: boolean) => Promise<TemplateInfo[]>;
  };
};

export async function handler(
  input: ListTemplatesInput,
  deps: ListTemplatesDeps
): Promise<ListTemplatesOutput> {
  const templates = await deps.templateDiscoveryService.discoverTemplates(
    input.forceRefresh
  );

  let filtered = templates;
  if (input.category) {
    filtered = templates.filter((t) => t.category === input.category);
  }

  const summary = filtered
    .map((t) => {
      const parts = [
        `- ${t.name}`,
        `  Category: ${t.category}`,
        `  Path: ${t.path}`,
      ];

      if (t.description) {
        parts.push(`  Description: ${t.description}`);
      }

      if (t.tags && t.tags.length > 0) {
        parts.push(`  Tags: ${t.tags.join(', ')}`);
      }

      return parts.join('\n');
    })
    .join('\n\n');

  return {
    content: [
      {
        type: 'text',
        text: `Found ${filtered.length} template(s):\n\n${summary}`,
      },
    ],
    structuredContent: { templates: filtered, total: filtered.length },
  };
}
