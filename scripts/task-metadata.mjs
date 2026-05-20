import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const DEFAULT_METADATA_PATH = '.linear/migration.json';

export function loadTaskMetadata({
  metadataPath = process.env.LINEAR_MIGRATION_METADATA || DEFAULT_METADATA_PATH
} = {}) {
  if (metadataPath && existsSync(metadataPath)) {
    return {
      source: metadataPath,
      tasks: readMetadataFile(metadataPath).map(normalizeTask)
    };
  }

  throw new Error(`No task metadata found. Expected ${metadataPath}.`);
}

export function findTaskById(taskId, options = {}) {
  const metadata = loadTaskMetadata(options);
  const normalized = String(taskId || '').toLowerCase();
  const matches = metadata.tasks.filter((task) => (
    [
      task.id,
      task.identifier,
      task.linearId,
      task.linearIdentifier,
      task.legacyId,
      task.browserGateTag
    ].filter(Boolean).some((candidate) => String(candidate).toLowerCase() === normalized)
  ));

  if (matches.length === 0) {
    throw new Error(`Task ${taskId} was not found in ${metadata.source}.`);
  }

  if (matches.length > 1) {
    throw new Error(`Task ${taskId} matched ${matches.length} records in ${metadata.source}.`);
  }

  return {
    source: metadata.source,
    task: matches[0]
  };
}

export function normalizeTask(record) {
  const legacyId = record.legacyId || record.sourceId || '';
  const linearIdentifier = record.linearIdentifier || record.identifier || '';
  const id = record.id || linearIdentifier || legacyId;

  return {
    ...record,
    id,
    identifier: linearIdentifier || id,
    legacyId,
    linearId: record.linearId || '',
    linearIdentifier,
    title: record.title || id,
    description: record.description || '',
    type: record.type || 'task',
    labels: Array.isArray(record.labels) ? record.labels : [],
    browserGateTag: record.browserGateTag || legacyId || linearIdentifier || id
  };
}

function readMetadataFile(filePath) {
  const parsed = JSON.parse(readFileSync(filePath, 'utf8'));
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (Array.isArray(parsed.tasks)) {
    return parsed.tasks;
  }
  if (Array.isArray(parsed.issues)) {
    return parsed.issues;
  }
  throw new Error(`${path.relative(process.cwd(), filePath)} must contain a tasks or issues array.`);
}
