import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { disconnectDb } from './connect';
import { loadEnv, repoRoot } from './env';
import { seedDatabase } from './seed';

// A real MongoDB for local development: no install, no Docker. Data lives in
// .data/mongo at the repo root, so it survives restarts. Production uses MONGODB_URI.

const PORT = Number(process.env.LOCAL_MONGO_PORT) || 27017;
export const LOCAL_URI = `mongodb://127.0.0.1:${PORT}/`;

function portInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: '127.0.0.1' });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
  });
}

async function main() {
  loadEnv();
  // pnpm installs the MongoDB binary into the root node_modules cache; look there, not in this package.
  process.env.MONGOMS_DOWNLOAD_DIR ??= path.join(repoRoot(), 'node_modules', '.cache', 'mongodb-memory-server');
  let server: MongoMemoryServer | null = null;

  if (await portInUse(PORT)) {
    console.log(`[mongo] Something is already listening on ${PORT}; using it.`);
  } else {
    const dbPath = path.join(repoRoot(), '.data', 'mongo');
    fs.mkdirSync(dbPath, { recursive: true });
    server = await MongoMemoryServer.create({ instance: { port: PORT, dbPath, storageEngine: 'wiredTiger' } });
  }

  process.env.MONGODB_URI = LOCAL_URI;
  await seedDatabase();
  await disconnectDb();
  // dev.mjs waits for this exact line before starting the website.
  console.log(`[mongo] Local MongoDB ready at ${LOCAL_URI} (data in .data/mongo)`);

  const stop = async () => {
    // Keep the data folder: it's the point of a persistent local database.
    if (server) await server.stop({ doCleanup: false });
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  // Stay alive while the website runs.
  setInterval(() => {}, 1 << 30);
}

main().catch((err) => {
  console.error('[mongo] Could not start the local database:', err);
  process.exit(1);
});
