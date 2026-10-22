import { disconnectDb } from '../connect';
import { loadEnv } from '../env';
import { seedDatabase } from './index';

// pnpm db:seed [--reset]: loads the sample content into MONGODB_URI.

async function main() {
  loadEnv();
  if (!process.env.MONGODB_URI) {
    console.error('[seed] MONGODB_URI is not set. Add it to .env, or run `pnpm db:local` for a local database.');
    process.exit(1);
  }
  await seedDatabase({ reset: process.argv.includes('--reset') });
  await disconnectDb();
}

main().catch(async (err) => {
  console.error('[seed] Failed:', err);
  await disconnectDb();
  process.exit(1);
});
