import Link from 'next/link';
import { ChevronUp, MessageSquare, Pin } from 'lucide-react';
import { THEMES } from '@hackathonfinder/shared';
import Avatar from '@/components/Avatar';
import { categoryById, isThemeTag, tagLabel, type CategoryId } from '@/data/discussions';
import { cn } from '@/lib/cn';
import { CATEGORY_ICONS, CATEGORY_STYLES } from './categories';
import { MAX_TAGS, ago, authorHref, normalizeTag, type Author, type ThreadItem } from './model';

/** Field error text and border: brand red, the palette's error colour. */
export const ERROR_TEXT = 'mt-1 text-xs font-medium text-brand-700 dark:text-brand-300';
export const INVALID = 'border-brand-500 dark:border-brand-400';

export function VoteButton({
  count,
  voted,
  onToggle,
  label,
  inline = false,
}: {
  count: number;
  voted: boolean;
  onToggle: () => void;
  /** What is being voted on, for screen readers. */
  label: string;
  inline?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={voted}
      aria-label={`${voted ? 'Remove upvote from' : 'Upvote'} ${label} (${count} ${count === 1 ? 'vote' : 'votes'})`}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-xl border font-semibold transition',
        inline ? 'gap-1 px-3 py-1.5 text-sm' : 'h-14 w-12 flex-col text-sm',
        voted
          ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-400 dark:bg-brand-400/10 dark:text-brand-300'
          : 'border-ink/15 text-ink/70 hover:border-brand-500 hover:text-brand-700 dark:hover:border-brand-400 dark:hover:text-brand-300'
      )}
    >
      <ChevronUp className="h-5 w-5" />
      <span aria-hidden="true">{count}</span>
    </button>
  );
}

/** Name and picture, linking to the profile. Deleted accounts show "Former student" with no link. */
export function AuthorLink({
  author,
  mine = false,
  size = 'sm',
  className,
}: {
  author: Author;
  /** The signed-in student wrote it: link to /profile and say "(you)". */
  mine?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const href = authorHref(author, mine);
  const inner = (
    <>
      <Avatar name={author.name} image={author.image} size={size} />
      <span className="truncate">
        {author.name}
        {mine && <span className="font-normal text-ink/60"> (you)</span>}
      </span>
    </>
  );
  const classes = cn('inline-flex min-w-0 items-center gap-2 font-semibold text-ink', className);
  return href ? (
    <Link href={href} className={cn(classes, 'hover:underline')}>
      {inner}
    </Link>
  ) : (
    <span className={cn(classes, 'text-ink/70')}>{inner}</span>
  );
}

export function CategoryChip({ id, className }: { id: CategoryId; className?: string }) {
  const Icon = CATEGORY_ICONS[id];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', CATEGORY_STYLES[id], className)}>
      <Icon className="h-3.5 w-3.5" />
      {categoryById(id)?.label ?? id}
    </span>
  );
}

export function PinnedChip() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-0.5 text-xs font-bold text-surface">
      <Pin className="h-3 w-3" />
      Pinned
    </span>
  );
}

export function TagChip({ tag }: { tag: string }) {
  return <span className="rounded-md bg-ink/5 px-2 py-0.5 text-xs font-medium text-ink/70">{tagLabel(tag)}</span>;
}

// Site paths in a post (like /submit) become links.
const PATH = /(^|[\s(“"])(\/[a-z][a-z0-9-]*(?:\/[a-z0-9-]+)*)/g;

function linkify(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  PATH.lastIndex = 0;
  while ((m = PATH.exec(text))) {
    const start = m.index + m[1].length;
    out.push(text.slice(last, start));
    out.push(
      <Link key={start} href={m[2]} className="font-semibold text-brand-700 underline underline-offset-2 dark:text-brand-300">
        {m[2]}
      </Link>
    );
    last = start + m[2].length;
  }
  out.push(text.slice(last));
  return out;
}

/** Plain text with blank lines between paragraphs; single line breaks are kept. */
export function Paragraphs({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn('space-y-4 text-[15px] leading-7 text-ink/80', className)}>
      {text.split(/\n\s*\n/).map((p, i) => (
        <p key={i} className="whitespace-pre-line break-words">
          {linkify(p)}
        </p>
      ))}
    </div>
  );
}

/** Themes picked from chips plus free words typed with commas. */
export interface TagDraft {
  themes: string[];
  extra: string;
}

export const MAX_THEME_TAGS = 3;

export function tagDraftFrom(tags: string[]): TagDraft {
  return { themes: tags.filter(isThemeTag), extra: tags.filter((t) => !isThemeTag(t)).join(', ') };
}

/** The tags to send: themes first, then the free words, cleaned up and without repeats. */
export function tagsFromDraft(draft: TagDraft): string[] {
  return [...new Set([...draft.themes, ...draft.extra.split(',').map(normalizeTag)].filter(Boolean))];
}

export function TagFields({
  idPrefix,
  value,
  onChange,
  error,
}: {
  idPrefix: string;
  value: TagDraft;
  onChange: (next: TagDraft) => void;
  error?: string;
}) {
  const toggle = (slug: string) =>
    onChange({
      ...value,
      themes: value.themes.includes(slug)
        ? value.themes.filter((t) => t !== slug)
        : value.themes.length < MAX_THEME_TAGS
          ? [...value.themes, slug]
          : value.themes,
    });
  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="label">Themes (optional, up to {MAX_THEME_TAGS})</legend>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((t) => {
            const on = value.themes.includes(t.slug);
            return (
              <button
                key={t.slug}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(t.slug)}
                disabled={!on && value.themes.length >= MAX_THEME_TAGS}
                className={cn('chip text-xs disabled:cursor-not-allowed disabled:opacity-50', on && 'chip-active')}
              >
                {t.name}
              </button>
            );
          })}
        </div>
      </fieldset>
      <div>
        <label htmlFor={`${idPrefix}-tags`} className="label">
          Other tags (optional, separate with commas)
        </label>
        <input
          id={`${idPrefix}-tags`}
          className={cn('input', error && INVALID)}
          value={value.extra}
          onChange={(e) => onChange({ ...value, extra: e.target.value })}
          maxLength={120}
          placeholder="e.g. first-timers, travel"
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? `${idPrefix}-tags-error` : `${idPrefix}-tags-hint`}
        />
        {error ? (
          <p id={`${idPrefix}-tags-error`} className={ERROR_TEXT}>
            {error}
          </p>
        ) : (
          <p id={`${idPrefix}-tags-hint`} className="mt-1 text-xs text-ink/60">
            Up to {MAX_TAGS} tags in all, themes included.
          </p>
        )}
      </div>
    </div>
  );
}

/** A short list of threads for sidebars: title, category and counts. */
export function CompactThreadList({ threads, now, showCategory = false }: { threads: ThreadItem[]; now: string; showCategory?: boolean }) {
  return (
    <ul className="divide-y divide-ink/10">
      {threads.map((t) => (
        <li key={t.id} className="py-3 first:pt-0 last:pb-0">
          {showCategory && <CategoryChip id={t.category} className="mb-1.5" />}
          <Link href={`/community/${t.slug}`} className="block text-sm font-semibold leading-snug text-ink hover:underline">
            {t.title}
          </Link>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-ink/60">
            <span className="inline-flex items-center gap-0.5">
              <ChevronUp className="h-3.5 w-3.5" />
              {t.votes}
              <span className="sr-only"> votes</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {t.replyCount}
              <span className="sr-only"> replies</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>{ago(t.createdAt, now)}</span>
          </p>
        </li>
      ))}
    </ul>
  );
}
