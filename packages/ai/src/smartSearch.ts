import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { CITIES } from '@hackathonfinder/shared';
import { aiModel, FALLBACK_BETA, getClient, isAiEnabled } from './client';
import { SearchFiltersSchema, type SearchFilters } from './schemas';

const SYSTEM = `You turn a student's plain-English hackathon search into filters for HackathonFinder.in, an Indian hackathon finder.

City slugs: ${CITIES.map((c) => `${c.slug} (${c.name}, ${c.state})`).join('; ')}. Use "online" when they ask for online-only events and "" when no place is given. Map nearby towns to the closest listed city (Gurugram → delhi-ncr, Mohali → chandigarh, Navi Mumbai → mumbai).

Rules:
- Defaults when not asked for: status "open", fee "any", team "any", eligibility "", beginner false, minPrize 0, within "", km 0, sort "deadline", empty lists.
- "near me", "nearby", "closest" → sort "nearest". "within 20 km" → km 25 (round up to 10, 25, 50 or 150).
- "this week" → within "week"; "this month" or "next 30 days" → within "month". "closing soon" or "last chance" → status "closing-soon". "happening now" → status "in-progress".
- "free" → fee "free". "solo" or "alone" → team "solo". "team of 3" → team "team".
- "first hackathon", "beginner", "newbie" → beginner true. "women", "girls" → eligibility "women-only". "students", "college", "2nd year" → eligibility "students".
- "big prize" → sort "prize". "1 lakh" or "100k" → minPrize 100000; "2 lakh" → 200000; "50k" → 50000.
- Put only meaningful leftover words in q (organizer names, specific topics not covered by themes). Never put filler words or the words you already mapped into q.
- understood: one short label per filter you applied, in the order they appear in the query.`;

/**
 * Turns "free AI hackathon in Pune this month for beginners" into Explore filters.
 * Returns null when AI isn't configured or the request fails, so callers fall back
 * to the rule-based parser.
 */
export async function parseSearchQuery(query: string): Promise<SearchFilters | null> {
  if (!isAiEnabled() || !query.trim()) return null;
  try {
    const response = await getClient().beta.messages.parse({
      model: aiModel(),
      max_tokens: 2000,
      betas: [FALLBACK_BETA],
      fallbacks: 'default',
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: query.slice(0, 300) }],
      output_config: { effort: 'low', format: betaZodOutputFormat(SearchFiltersSchema) },
    });
    if (response.stop_reason === 'refusal') return null;
    return response.parsed_output ?? null;
  } catch (err) {
    console.error('[ai] smart search failed, using rules instead:', err instanceof Error ? err.message : err);
    return null;
  }
}
