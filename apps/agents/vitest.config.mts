import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    // The database tests start a throwaway MongoDB (mongodb-memory-server); never the real one.
    testTimeout: 60_000,
    hookTimeout: 120_000,
    env: { MONGODB_URI: '', CLOUDINARY_CLOUD_NAME: '', CLOUDINARY_API_KEY: '', CLOUDINARY_API_SECRET: '', CLOUDINARY_URL: '', ANTHROPIC_API_KEY: '' },
  },
});
