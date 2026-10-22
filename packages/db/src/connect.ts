import mongoose from 'mongoose';

/** Thrown when MONGODB_URI is missing, so callers can show a setup message instead of crashing. */
export class DbNotConfiguredError extends Error {
  constructor() {
    super('MONGODB_URI is not set. Add it to your environment, or run `pnpm dev` to use a local database.');
    this.name = 'DbNotConfiguredError';
  }
}

interface Cache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// One connection per process. Next.js reloads modules in development, so the cache lives on globalThis.
const g = globalThis as typeof globalThis & { __hfMongo?: Cache };
const cache: Cache = g.__hfMongo ?? (g.__hfMongo = { conn: null, promise: null });

export function isDbConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

export async function connectDb(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new DbNotConfiguredError();

  if (!cache.promise) {
    mongoose.set('strictQuery', true);
    cache.promise = mongoose
      .connect(uri, {
        dbName: process.env.MONGODB_DB || 'hackathonfinder',
        maxPoolSize: Number(process.env.MONGODB_POOL_SIZE) || 10,
        serverSelectionTimeoutMS: 10_000,
      })
      .catch((err) => {
        // Let the next request try again instead of caching the failure.
        cache.promise = null;
        throw err;
      });
  }
  cache.conn = await cache.promise;
  return cache.conn;
}

export async function disconnectDb(): Promise<void> {
  if (!cache.conn) return;
  await mongoose.disconnect();
  cache.conn = null;
  cache.promise = null;
}
