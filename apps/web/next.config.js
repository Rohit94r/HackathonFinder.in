const fs = require('node:fs');
const path = require('node:path');

// One .env at the repo root serves the website, the agents and the scripts.
// Variables already in the environment (e.g. from the host) win.
const rootEnv = path.join(__dirname, '..', '..', '.env');
if (fs.existsSync(rootEnv)) {
  for (const line of fs.readFileSync(rootEnv, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)?\s*$/);
    if (!m || line.trimStart().startsWith('#')) continue;
    let value = (m[2] ?? '').trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages ship TypeScript source, so Next compiles them.
  transpilePackages: ['@hackathonfinder/shared', '@hackathonfinder/db', '@hackathonfinder/ai', '@hackathonfinder/agents'],
  experimental: {
    // Server-only packages with native or dynamic requires; keep them out of the bundle.
    serverComponentsExternalPackages: ['mongoose', 'mongodb', 'bcryptjs', '@anthropic-ai/sdk'],
    // src/instrumentation.ts starts the 02:00 / 14:00 scrape scheduler on long-running servers.
    instrumentationHook: true,
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // "Near me" needs geolocation; nothing needs the camera or microphone.
          { key: 'Permissions-Policy', value: 'geolocation=(self), camera=(), microphone=(), payment=(), interest-cohort=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          // No plugins, no <base> hijacking, and no framing by other sites. Scripts aren't
          // restricted here because Next.js inlines its own.
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'" },
          ...(process.env.NODE_ENV === 'production'
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
            : []),
        ],
      },
    ];
  },
};

module.exports = nextConfig;
