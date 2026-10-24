import 'server-only';
import { ContentFlag, type FlagKind } from '@hackathonfinder/db';
import { ApiError } from './api';

// The bad-word filter for everything students post: discussions, replies, team posts,
// requests, invites, chat messages, winning stories and profile text.
//
// Text is normalised first (lowercase, NFKC, zero-width characters removed, common
// leetspeak undone), then split into words. A word is offensive when it is one of
// WORDS, contains one of STEMS (only stems that never occur inside normal words), or
// when a phrase from PHRASES appears. Repeated letters ("fuuuck"), spaced-out letters
// ("f u c k", "f.u.c.k") and masked letters ("f*ck") are caught too. Whole-word matching
// keeps "class", "assess" and "Scunthorpe" safe; ALLOW lists normal words that look close.

export const RESPECT_MESSAGE = 'Please keep it respectful — remove the offensive words and try again.';

/** Whole words: English, Hindi/Hinglish and Marathi (romanised and Devanagari). */
const WORDS = [
  // English
  'fuck', 'fucks', 'fucked', 'fucker', 'fuckers', 'fucking', 'fuckin', 'fuk', 'fuking', 'fukin', 'fuq', 'fck', 'fcking', 'fckin',
  'fcuk', 'phuck', 'fack', 'stfu', 'gtfo', 'shit', 'shits', 'shitty', 'shitting', 'bullshit', 'horseshit', 'shithead',
  'bitch', 'bitches', 'bitchy', 'biatch', 'bastard', 'bastards', 'asshole', 'assholes', 'arsehole', 'dumbass', 'jackass',
  'asswipe', 'dickhead', 'dickheads', 'cunt', 'cunts', 'twat', 'wanker', 'wankers', 'slut', 'sluts', 'whore', 'whores',
  'pussy', 'cocksucker', 'motherfucker', 'motherfuckers', 'motherfucking', 'mofo', 'douchebag', 'bollocks', 'tits', 'boobs',
  'retard', 'retards', 'retarded', 'faggot', 'faggots', 'fag', 'fags', 'nigger', 'niggers', 'nigga', 'niggas', 'tranny', 'kys',
  'jizz', 'dildo',
  // Hindi / Hinglish
  'chutiya', 'chutiye', 'chutiyo', 'chutia', 'chootiya', 'chutiyapa', 'chut', 'choot', 'bhosdi', 'bhosdike', 'bhosdika',
  'bhosadike', 'bhosda', 'bhosdiwale', 'bsdk', 'madarchod', 'maderchod', 'madarchot', 'madarjat', 'behenchod', 'bhenchod',
  'benchod', 'bahenchod', 'behnchod', 'bhencho', 'bkl', 'mkc', 'mkb', 'bakchod', 'bakchodi', 'chodu', 'chudai', 'gaand',
  'gaandu', 'gandu', 'gand', 'lauda', 'lavda', 'lawda', 'loda', 'lodu', 'lavde', 'lawde', 'lund', 'randi', 'raand', 'randwa',
  'randibaaz', 'harami', 'haraami', 'haramkhor', 'haramzada', 'haramzade', 'haramzadi', 'kamina', 'kamine', 'kaminey',
  'kutiya', 'kutte', 'kuttiya', 'bhadwa', 'bhadwe', 'bhadva', 'bhadve', 'bhadvya', 'jhaat', 'jhaatu', 'jhant', 'jhantu',
  'tatti', 'tatte', 'hijde',
  // Marathi
  'zavadya', 'zhavadya', 'zavnya', 'zhavnya', 'zavla', 'zhavla', 'zavli', 'zhavli', 'lavdya', 'lavdu', 'bhikarchot',
  'bhikarchod', 'gandit', 'aighala', 'aaighala', 'yedzava', 'yedzhava',
  // Devanagari (nuktas are dropped before matching, so ड़ is written ड here)
  'चूतिया', 'चुतिया', 'चूतिये', 'चुतिये', 'चूत', 'भोसडी', 'भोसडीके', 'भोसडा', 'मादरचोद', 'बहनचोद', 'भेनचोद', 'बेहेनचोद',
  'गांडू', 'गाण्डू', 'गांड', 'लौडा', 'लोडा', 'लवडा', 'लंड', 'रंडी', 'हरामी', 'हरामखोर', 'हरामजादा', 'हरामजादे', 'कमीना',
  'कमीने', 'कुतिया', 'भडवा', 'भडवे', 'भडव्या', 'झाट', 'झवाड्या', 'झवला', 'झवली', 'चोदू', 'चुदाई', 'टट्टी', 'बकचोद',
];

/** Pieces that never appear inside a normal word, so they match anywhere in one. */
const STEMS = [
  'fuck', 'motherf', 'bitch', 'asshole', 'cocksuck', 'dickhead', 'faggot', 'chutiy', 'chootiy', 'bhosd', 'bhosad',
  'madarchod', 'maderchod', 'behenchod', 'bhenchod', 'bahenchod', 'benchod', 'bakchod', 'haramkhor', 'haramzad',
  'gaandu', 'jhaatu', 'jhantu', 'zavad', 'zhavad', 'lavdya', 'bhikarcho',
  'चूतिय', 'चुतिय', 'भोसड', 'मादरचोद', 'बहनचोद', 'भेनचोद', 'हरामखोर', 'हरामजाद', 'झवाड',
];

/** Multi-word insults, matched on whole words. */
const PHRASES = [
  'maa ki chut', 'ma ki chut', 'maa chod', 'maa ka bhosda', 'behen chod', 'bhen chod', 'bahen chod', 'madar chod', 'mader chod',
  'bhosdi ke', 'bhosadi ke', 'bhosdi wale', 'behen ke lode', 'bhen ke lode', 'bahen ke lode', 'behen ke laude', 'aai zavli',
  'aai zhavli', 'aaichi gand', 'kill yourself', 'go die', 'piss off', 'son of a bitch', 'suck my', 'मां की चूत', 'माँ की चूत',
  'बहन के लौडे', 'मादर चोद', 'बहन चोद',
];

/** Normal words that come close to an abusive one after normalising. */
const ALLOW = new Set([
  'scunthorpe', 'penistone', 'shiitake', 'shitake', 'cockpit', 'cocktail', 'peacock', 'hancock', 'dickens', 'assess',
  'assessment', 'assassin', 'class', 'classic', 'bass', 'pass', 'passion', 'grass', 'glass', 'mass', 'massive', 'assist',
  'assistant', 'sussex', 'essex', 'analysis', 'analyst', 'therapist', 'title', 'titan', 'button', 'fukuoka', 'fukushima',
  'niger', 'nigeria', 'niggard', 'lundi', 'gandhi', 'gandhinagar', 'kamineni', 'chutney', 'sakhi', 'lunar', 'rand',
]);

/** Folded letters stand in for these words too ("gaaandu" → "gandu"), except where that makes a real word. */
const FOLD_SKIP = new Set(['bobs', 'rand', 'niger', 'as', 'pas', 'gand', 'jhat', 'chot', 'tate']);

const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', $: 's', '!': 'i', '|': 'i' };

/** Every run of repeated characters down to one ("fuuuck" → "fuck"). */
const fold = (w: string) => w.replace(/(.)\1+/gu, '$1');
/** Runs of three or more down to two ("boooobs" → "boobs"), keeping real double letters. */
const squeeze = (w: string) => w.replace(/(.)\1{2,}/gu, '$1$1');

function buildWordSet(): Set<string> {
  const set = new Set<string>();
  for (const word of WORDS) {
    const w = normaliseText(word);
    set.add(w);
    const folded = fold(w);
    if (!FOLD_SKIP.has(folded)) set.add(folded);
  }
  return set;
}

let wordSet: Set<string> | null = null;
let stems: string[] = [];
let phrases: string[] = [];

function lists() {
  if (!wordSet) {
    wordSet = buildWordSet();
    // Not folded: the word being checked is, and folding a stem can turn it into a normal word.
    stems = [...new Set(STEMS.map(normaliseText))];
    phrases = [...new Set(PHRASES.map((p) => tokens(p).join(' ')).flatMap((p) => [p, p.split(' ').map(fold).join(' ')]))];
  }
  return { words: wordSet, stems, phrases };
}

/** Lowercase, NFKC, no zero-width or soft-hyphen characters, Devanagari nuktas dropped. */
export function normaliseText(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[­͏؜ᅟᅠ᠎​-‏‪-‮⁠-⁤⁪-⁯﻿]/g, '')
    .replace(/़/g, '')
    .replace(/ँ/g, 'ं');
}

/** Leetspeak back to letters, only in words that have letters (so "2026" stays a number). */
function unLeet(run: string): string {
  if (!/\p{L}/u.test(run)) return run;
  return run.replace(/^[!|]+|[!|]+$/g, '').replace(/[013457@$!|]/g, (c) => LEET[c] ?? c);
}

const RUN = /[\p{L}\p{M}\p{N}@$!|*#]+/gu;

/** The words of a text, normalised. Masked words keep their * so they can be matched as wildcards. */
function tokens(text: string): string[] {
  return (normaliseText(text).match(RUN) ?? []).map(unLeet).filter(Boolean);
}

/** Adds the dictionary words and stems hiding in one word to `out`. */
function checkWord(word: string, out: Set<string>) {
  const { words, stems } = lists();
  const forms = [...new Set([word, squeeze(word), fold(word)])];
  if (forms.some((f) => ALLOW.has(f))) return;
  for (const f of forms) {
    if (words.has(f)) out.add(f);
    for (const s of stems) if (f.includes(s)) out.add(s);
  }
}

/** "f*ck", "sh#t": the masked letters may be any one to three letters. */
function checkMasked(word: string, out: Set<string>) {
  const letters = word.replace(/[*#]/g, '');
  if (letters.length < 2 || word.length < 3) return;
  // Words only hold letters, marks and digits besides the masks, so nothing else needs escaping.
  const rx = new RegExp(`^${word.replace(/[*#]+/g, '\\p{L}{1,3}')}$`, 'u');
  const { words } = lists();
  for (const w of words) if (rx.test(w)) out.add(w);
}

/** The abusive words and phrases found in `text`, normalised; empty when it's fine. */
export function findBadWords(text: string): string[] {
  if (!text) return [];
  const found = new Set<string>();
  const raw = tokens(text.slice(0, 20_000));
  const plain: string[] = [];

  for (const t of raw) {
    if (/[*#]/.test(t)) checkMasked(t, found);
    for (const part of t.split(/[*#]+/)) {
      if (!part) continue;
      plain.push(part);
      checkWord(part, found);
    }
  }

  // Spaced-out letters: "f u c k", "f.u.c.k", "s-h-i-t". Single letters are joined back up.
  let run: string[] = [];
  const flush = () => {
    for (let i = 0; i < run.length; i++) {
      for (let j = i + 3; j <= Math.min(run.length, i + 16); j++) checkWord(run.slice(i, j).join(''), found);
    }
    run = [];
  };
  for (const p of plain) {
    if ([...p].length === 1 && /\p{L}/u.test(p)) run.push(p);
    else flush();
  }
  flush();

  // Phrases, on whole words.
  const { phrases } = lists();
  const joined = ` ${plain.join(' ')} `;
  const joinedFolded = ` ${plain.map(fold).join(' ')} `;
  for (const p of phrases) if (joined.includes(` ${p} `) || joinedFolded.includes(` ${p} `)) found.add(p);

  return [...found];
}

type Text = string | null | undefined | readonly (string | null | undefined)[];

interface Who {
  /** The student posting. */
  userId?: string | null;
  /** What they were posting, for the admin review list. */
  kind: FlagKind;
  ip?: string;
}

/**
 * Stops abusive text before it's saved. On a hit it records a ContentFlag for admins
 * (who, what kind of post, the start of the text and the words that matched) and
 * rejects the request with a friendly 400.
 */
export async function assertRespectful(who: Who, ...texts: Text[]): Promise<void> {
  const parts = texts.flat().filter((t): t is string => typeof t === 'string' && t.trim() !== '');
  if (!parts.length) return;
  const words = findBadWords(parts.join('\n'));
  if (!words.length) return;
  try {
    await ContentFlag.create({
      userId: who.userId || undefined,
      kind: who.kind,
      excerpt: parts.join(' · ').slice(0, 300),
      words: words.slice(0, 20),
      ip: who.ip,
    });
  } catch (err) {
    // The post is still refused; a failed log shouldn't turn that into a 500.
    console.error('[moderation] Could not record a content flag:', err);
  }
  throw new ApiError(400, 'offensive', RESPECT_MESSAGE);
}
