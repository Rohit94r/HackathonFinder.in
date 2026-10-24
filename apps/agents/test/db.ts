import path from 'node:path';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDb, disconnectDb, mongoose } from '@hackathonfinder/db';

// A throwaway MongoDB per test file. It never touches MONGODB_URI from .env (vitest
// blanks it), so tests can't write to the real database.

let server: MongoMemoryServer | null = null;

export async function startDb(): Promise<void> {
  // pnpm keeps the MongoDB binary in the root node_modules cache (see packages/db/src/local-mongo.ts).
  process.env.MONGOMS_DOWNLOAD_DIR ??= path.resolve(__dirname, '../../../node_modules/.cache/mongodb-memory-server');
  server = await MongoMemoryServer.create();
  process.env.MONGODB_URI = server.getUri();
  process.env.MONGODB_DB = 'hf-test';
  await connectDb();
}

export async function stopDb(): Promise<void> {
  await disconnectDb();
  await server?.stop();
  server = null;
  process.env.MONGODB_URI = '';
}

export async function clearDb(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) return;
  for (const c of await db.collections()) await c.deleteMany({});
}
