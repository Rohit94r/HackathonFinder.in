import fs from 'node:fs';
import path from 'node:path';

/** The monorepo root: the nearest folder above `from` with pnpm-workspace.yaml. */
export function repoRoot(from = process.cwd()): string {
  let dir = path.resolve(from);
  while (!fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) {
    const parent = path.dirname(dir);
    if (parent === dir) return path.resolve(from);
    dir = parent;
  }
  return dir;
}

/**
 * Loads the root .env (one file for the website, agents and scripts). Variables
 * already set in the environment win, so hosting providers can override it.
 */
export function loadEnv(): void {
  const file = path.join(repoRoot(), '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)?\s*$/);
    if (!m || line.trimStart().startsWith('#')) continue;
    const key = m[1];
    let value = (m[2] ?? '').trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = value;
  }
}
