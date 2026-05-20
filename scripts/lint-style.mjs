import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const checkedRoots = [
  'index.html',
  'package.json',
  'src',
  'scripts',
  'tests',
  'tsconfig.json',
  'tsconfig.node.json',
  'vite.config.ts',
  'style.css'
];

const checkedExtensions = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.mjs',
  '.ts',
  '.tsx'
]);

const ignoredDirectories = new Set([
  '.git',
  'dist',
  'node_modules'
]);

const violations = [];

for (const root of checkedRoots) {
  await collectAndLint(root);
}

if (violations.length > 0) {
  console.error('Style lint failed:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log('Style lint passed');

async function collectAndLint(relativePath) {
  const fullPath = path.resolve(relativePath);

  let stats;
  try {
    stats = await stat(fullPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return;
    }
    throw error;
  }

  if (stats.isDirectory()) {
    if (ignoredDirectories.has(path.basename(relativePath))) {
      return;
    }

    const entries = await readdir(fullPath);
    for (const entry of entries) {
      await collectAndLint(path.join(relativePath, entry));
    }
    return;
  }

  if (!stats.isFile() || !checkedExtensions.has(path.extname(relativePath))) {
    return;
  }

  await lintFile(relativePath);
}

async function lintFile(relativePath) {
  const contents = await readFile(relativePath, 'utf8');

  if (contents.includes('\r')) {
    violations.push(`${relativePath}: uses CRLF line endings`);
  }

  if (contents.length > 0 && !contents.endsWith('\n')) {
    violations.push(`${relativePath}: missing final newline`);
  }

  const lines = contents.split('\n');
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const lineNumber = index + 1;

    if (line.endsWith(' ') || line.endsWith('\t')) {
      violations.push(`${relativePath}:${lineNumber}: trailing whitespace`);
    }

    if (line.includes('\t')) {
      violations.push(`${relativePath}:${lineNumber}: tab character`);
    }
  }
}
