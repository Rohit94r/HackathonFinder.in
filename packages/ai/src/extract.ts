import type Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { aiModel, FALLBACK_BETA, getClient, isAiEnabled } from './client';
import { ExtractedEventSchema, type ExtractedEvent } from './schemas';

// Stable text only (no dates, no URLs) so the prompt cache can reuse it across calls.
const SYSTEM = `You read hackathon announcements for HackathonFinder.in, a free site that helps Indian college students find hackathons near them. The input can be an event page, a platform listing, an Instagram or LinkedIn caption, a forwarded WhatsApp message, a Google search snippet, or a poster image.

Return the event's details using only what the source says. Never invent dates, prizes, fees or links.

Rules:
- isEvent is false for anything that is not one specific event students can register for: lists of many events, news articles, results announcements for finished events, job posts, courses, spam.
- Dates: write ISO 8601 with an offset. Indian events without a stated timezone use IST (+05:30). If a year is missing, choose the next occurrence after today's date (given in the message). A single-day event has the same start and end date. If only a date is given, use 09:00 for starts, 18:00 for ends and 23:59 for deadlines.
- city: the plain city name. Map localities and suburbs to their city (Hinjewadi, Baner, Wakad → Pune; Gurugram, Noida → Delhi NCR; Whitefield, Koramangala → Bengaluru; HITEC City → Hyderabad; Navi Mumbai, Andheri → Mumbai).
- mode: offline when there is a physical venue only; hybrid when both a venue and online participation are offered; online otherwise.
- Money: prizePool is the total cash prize as a plain number. "₹1.5 lakh" is 150000, "1 crore" is 10000000, "$5K" is 5000 with prizeCurrency USD. fee is per team in INR; 0 when it says free or no fee.
- themes: pick 1 to 3 from the allowed list that best match the tracks or problem statements; use open-innovation when there is no fixed theme.
- eligibility: students when it says students or college; college-only when restricted to one college; women-only when only women can take part; professionals when working people can join; open-to-all when anyone can.
- beginnerFriendly is true only if the source says first-timers or beginners are welcome, or it offers workshops or mentoring aimed at newcomers.
- tagline and summary must be written in your own words, plain and friendly, for students deciding whether to join. Do not copy sentences from the source. No hype, no emojis.
- confidence: 0.9 or more only when title, dates, deadline, mode and a registration link are all clearly stated. Lower it for every important field you had to leave null, and list those in missing.
- If an "Already known" block is given, keep those values unless the content clearly contradicts them.`;

export type ExtractImage =
  | { url: string }
  | { base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' };

export interface ExtractInput {
  url?: string;
  /** Page text, post caption, search snippet or pasted message. */
  text?: string;
  /** Poster or banner images; read with vision. */
  images?: ExtractImage[];
  /** Where it came from, e.g. "Instagram post by @gdgpune". */
  sourceHint?: string;
  /** Fields the connector already read reliably; the model fills the gaps. */
  known?: Record<string, unknown>;
  now?: Date;
}

export interface ExtractResult {
  event: ExtractedEvent;
  /** True when the text was longer than we send and only its start was read. */
  truncated: boolean;
  model: string;
}

// Event pages are rarely this long; past it we read the start, and say so in the prompt.
const MAX_TEXT_CHARS = 120_000;

function imageBlock(img: ExtractImage): Anthropic.Beta.BetaImageBlockParam {
  return 'url' in img
    ? { type: 'image', source: { type: 'url', url: img.url } }
    : { type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.base64 } };
}

/**
 * Reads one event's details from text and/or images. Returns null when AI is not
 * configured, when the request is declined, or when no structured result came back.
 * API errors (rate limits after retries, bad requests) are thrown for the caller to record.
 */
export async function extractEvent(input: ExtractInput): Promise<ExtractResult | null> {
  if (!isAiEnabled()) return null;
  const text = (input.text ?? '').trim();
  if (!text && !input.images?.length) return null;

  const truncated = text.length > MAX_TEXT_CHARS;
  const today = (input.now ?? new Date()).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const parts = [
    `Today is ${today} (India time).`,
    input.sourceHint ? `Source: ${input.sourceHint}` : '',
    input.url ? `URL: ${input.url}` : '',
    input.known && Object.keys(input.known).length ? `Already known:\n${JSON.stringify(input.known, null, 2)}` : '',
    text ? `Content${truncated ? ' (only the first part; the page is very long)' : ''}:\n"""\n${text.slice(0, MAX_TEXT_CHARS)}\n"""` : '',
    input.images?.length ? 'The image(s) above are the event poster or banner.' : '',
  ].filter(Boolean);

  const response = await getClient().beta.messages.parse({
    model: aiModel(),
    max_tokens: 16000,
    betas: [FALLBACK_BETA],
    fallbacks: 'default',
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: [...(input.images ?? []).map(imageBlock), { type: 'text', text: parts.join('\n\n') }] }],
    // Extraction is a read-and-fill task; low effort keeps high-volume runs fast and cheap.
    output_config: { effort: 'low', format: betaZodOutputFormat(ExtractedEventSchema) },
  });

  if (response.stop_reason === 'refusal' || !response.parsed_output) return null;
  return { event: response.parsed_output, truncated, model: response.model };
}
