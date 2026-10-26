import { disconnectDb } from '../connect';
import { loadEnv } from '../env';
import { setupDatabase } from './index';

// pnpm db:setup: creates every collection and index in MONGODB_URI and removes old sample data.

async function main() {
  loadEnv();
  if (!process.env.MONGODB_URI) {
    console.error('[db] MONGODB_URI is not set. Add it to .env, or run `pnpm db:local` for a local database.');
    process.exit(1);
  }
  await setupDatabase();
  await disconnectDb();
}

main().catch(async (err) => {
  console.error('[db] Setup failed:', err);
  await disconnectDb();
  process.exit(1);
});
