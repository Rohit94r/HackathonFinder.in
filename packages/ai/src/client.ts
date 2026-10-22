import Anthropic from '@anthropic-ai/sdk';

// One client per process. The SDK retries 408/409/429/5xx and connection errors
// with backoff; extraction runs in the background, so a few extra tries is fine.
let client: Anthropic | null = null;

/** True when an Anthropic key (or token) is configured. Without one, callers use the rule-based fallbacks. */
export function isAiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export function getClient(): Anthropic {
  if (!client) client = new Anthropic({ maxRetries: 4, timeout: 120_000 });
  return client;
}

/** Model for extraction, writing and smart search. Override with AI_MODEL. */
export function aiModel(): string {
  return process.env.AI_MODEL || 'claude-opus-5-5';
}

// If a request is declined by a safety classifier, the API re-runs it on a
// fallback model inside the same call ("default" picks by refusal category).
export const FALLBACK_BETA = 'server-side-fallback-2026-07-01';
