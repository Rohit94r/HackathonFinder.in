// `pnpm dev`: starts a local MongoDB (unless MONGODB_URI is set in .env) and the website.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

function loadEnv() {
  const file = path.join(root, '.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)?\s*$/);
    if (!m || line.trimStart().startsWith('#')) continue;
    let value = (m[2] ?? '').trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}

const children = [];
function start(name, cwd, args, env) {
  const child = spawn(process.execPath, args, { cwd, env: { ...process.env, ...env }, stdio: ['inherit', 'pipe', 'pipe'] });
  const prefix = (chunk, stream) => chunk.toString().split(/\r?\n/).filter(Boolean).forEach((l) => stream.write(`[${name}] ${l}\n`));
  child.stdout.on('data', (c) => prefix(c, process.stdout));
  child.stderr.on('data', (c) => prefix(c, process.stderr));
  child.on('exit', (code) => {
    console.log(`[${name}] exited with code ${code}`);
    shutdown(code ?? 0);
  });
  children.push(child);
  return child;
}

let stopping = false;
function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const c of children) if (!c.killed) c.kill('SIGINT');
  setTimeout(() => process.exit(code), 1500);
}
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

loadEnv();
const dbDir = path.join(root, 'packages', 'db');
const webDir = path.join(root, 'apps', 'web');
const tsx = require.resolve('tsx/cli', { paths: [dbDir] });
const next = require.resolve('next/dist/bin/next', { paths: [webDir] });
const startWeb = (env = {}) => start('web', webDir, [next, 'dev', '-p', process.env.PORT || '3000'], env);

if (process.env.MONGODB_URI) {
  console.log('[dev] Using MONGODB_URI from .env');
  startWeb();
} else {
  console.log('[dev] No MONGODB_URI in .env: starting a local MongoDB first (data in .data/mongo)');
  const port = process.env.LOCAL_MONGO_PORT || '27017';
  const mongo = start('db', dbDir, [tsx, 'src/local-mongo.ts'], {});
  let started = false;
  mongo.stdout.on('data', (chunk) => {
    if (!started && chunk.toString().includes('Local MongoDB ready')) {
      started = true;
      startWeb({ MONGODB_URI: `mongodb://127.0.0.1:${port}/` });
    }
  });
}
