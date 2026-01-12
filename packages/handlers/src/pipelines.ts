import fs from 'node:fs/promises';
import path from 'node:path';
import { getVaultRoot } from './utils.js';

export async function listPipelines() {
  const dir = path.join(getVaultRoot(), '.vaulty', 'pipelines');
  const entries = await safeReadDir(dir);
  return entries
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''));
}

export async function readPipeline(name: string) {
  const file = path.join(
    getVaultRoot(),
    '.vaulty',
    'pipelines',
    `${name}.json`
  );
  const raw = await fs.readFile(file, 'utf8');
  return JSON.parse(raw);
}

export async function writePipeline(name: string, pipeline: any) {
  const dir = path.join(getVaultRoot(), '.vaulty', 'pipelines');
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, `${name}.json`);
  const validated = validatePipeline(name, pipeline);
  await fs.writeFile(file, JSON.stringify(validated, null, 2), 'utf8');
  return { name, path: `.vaulty/pipelines/${name}.json` };
}

async function safeReadDir(dir: string): Promise<string[]> {
  try {
    return await fs.readdir(dir);
  } catch {
    return [];
  }
}

function validatePipeline(
  name: string,
  pipeline: any
): {
  name: string;
  steps: any[];
  options: { stopOnError: boolean; previewMode: boolean };
} {
  if (!pipeline || typeof pipeline !== 'object') {
    throw new Error('Pipeline must be an object');
  }

  if (!Array.isArray(pipeline.steps)) {
    throw new Error('Pipeline.steps must be an array');
  }

  validateSteps(pipeline.steps);

  const options = pipeline.options || {};
  const stopOnError =
    typeof options.stopOnError === 'boolean' ? options.stopOnError : false;
  const previewMode =
    typeof options.previewMode === 'boolean' ? options.previewMode : true;

  return {
    name: pipeline.name || name,
    steps: pipeline.steps,
    options: { stopOnError, previewMode },
  };
}

function validateSteps(steps: any[]) {
  const allowed = new Set([
    'patch',
    'move',
    'autoLink',
    'metadata',
    'refactor',
  ]);

  steps.forEach((step, idx) => {
    if (!step || typeof step !== 'object') {
      throw new Error(`Step ${idx} must be an object`);
    }
    const type = step.type;
    if (!allowed.has(type)) {
      throw new Error(`Step ${idx} has unknown type '${type}'`);
    }

    switch (type) {
      case 'patch':
        if (!Array.isArray(step.operations)) {
          throw new Error(`Step ${idx} (patch) missing operations array`);
        }
        break;
      case 'move':
        if (!step.from || !step.to) {
          throw new Error(`Step ${idx} (move) requires from and to`);
        }
        break;
      case 'autoLink':
        if (!step.path) {
          throw new Error(`Step ${idx} (autoLink) requires path`);
        }
        break;
      case 'metadata':
        if (!step.path || !step.frontmatter) {
          throw new Error(
            `Step ${idx} (metadata) requires path and frontmatter`
          );
        }
        break;
      case 'refactor':
        if (!step.path || !Array.isArray(step.operations)) {
          throw new Error(
            `Step ${idx} (refactor) requires path and operations array`
          );
        }
        break;
      default:
        break;
    }
  });
}
