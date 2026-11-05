'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, MapPin, MessageSquare, Pencil, PenLine, Pin, PinOff, Send, Trash2 } from 'lucide-react';
import { cityName } from '@hackathonfinder/shared';
import Avatar from '@/components/Avatar';
import SignInPrompt from '@/components/auth/SignInPrompt';
import ShareButtons from '@/components/hackathon/ShareButtons';
import { ApiClientError, apiFetch, goToLogin } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import {
  BODY_MAX,
  BODY_MIN,
  MAX_TAGS,
  REPLY_MAX,
  REPLY_MIN,
  TITLE_MAX,
  TITLE_MIN,
  ago,
  authorHref,
  type ReplyItem,
  type ThreadDetailData,
  type ThreadItem,
  type Viewer,
} from './model';
import { AuthorLink, CategoryChip, ERROR_TEXT, INVALID, Paragraphs, PinnedChip, TagChip, TagFields, VoteButton, tagDraftFrom, tagsFromDraft, type TagDraft } from './parts';
import { errorMessage, useVotes } from './useCommunity';

const smallHeading = 'font-sans text-base font-bold normal-case leading-tight tracking-normal';
const alertBox = 'rounded-lg bg-brand-50 px-4 py-3 text-sm font-medium text-brand-800 dark:bg-brand-400/10 dark:text-brand-200';
const dangerLink = 'inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline disabled:opacity-60 dark:text-brand-300';

/** The thread, its replies and the reply form. The page around it is rendered on the server. */
export default function ThreadView({ initial, viewer }: { initial: ThreadDetailData; viewer: Viewer | null }) {
  const router = useRouter();
  const votes = useVotes();
  const [thread, setThread] = useState<ThreadItem>(initial.thread);
  const [replies, setReplies] = useState<ReplyItem[]>(initial.replies);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const now = initial.now;
  const isAdmin = viewer?.role === 'admin';
  const canDelete = thread.mine || isAdmin;

  const tv = votes.view('thread', thread);
  const replyCount = replies.length;

  const run = async (key: string, action: () => Promise<void>) => {
    if (busy) return;
    setBusy(key);
    setError('');
    try {
      await action();
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) goToLogin();
      else setError(errorMessage(err));
    } finally {
      setBusy('');
    }
  };

  const removeThread = () => {
    const who = thread.mine ? 'your discussion' : `${thread.author.name}’s discussion`;
    if (!window.confirm(`Delete ${who}? Its replies go with it. This can’t be undone.`)) return;
    run('delete', async () => {
      await apiFetch(`/api/threads/${thread.slug}`, { method: 'DELETE' });
      router.push('/community');
      router.refresh();
    });
  };

  const togglePin = () =>
    run('pin', async () => {
      const res = await apiFetch<{ thread: ThreadItem }>(`/api/threads/${thread.slug}`, { method: 'PATCH', body: { pinned: !thread.pinned } });
      setThread((t) => ({ ...t, pinned: res.thread.pinned }));
    });

  const removeReply = (r: ReplyItem) => {
    if (!window.confirm(r.mine ? 'Delete your reply?' : `Delete ${r.author.name}’s reply?`)) return;
    run(`reply-${r.id}`, async () => {
      await apiFetch(`/api/replies/${r.id}`, { method: 'DELETE' });
      setReplies((list) => list.filter((x) => x.id !== r.id));
    });
  };

  return (
    <div className="min-w-0 space-y-6">
      <article className="card overflow-hidden">
        <div className="p-5 sm:p-8">
          {editing ? (
            <EditThreadForm
              thread={thread}
              onCancel={() => setEditing(false)}
              onSaved={(next) => {
                setThread((t) => ({ ...t, title: next.title, body: next.body, tags: next.tags, editedAt: next.editedAt ?? new Date().toISOString() }));
                setEditing(false);
                router.refresh();
              }}
            />
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                {thread.pinned && <PinnedChip />}
                <CategoryChip id={thread.category} />
                {thread.city && (
                  <Link
                    href={`/cities/${thread.city}`}
                    className="inline-flex items-center gap-1 rounded-full border border-ink/15 px-2.5 py-0.5 text-xs font-semibold text-ink hover:border-brand-500"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    {cityName(thread.city)}
                  </Link>
                )}
                {thread.tags.map((tag) => (
                  <TagChip key={tag} tag={tag} />
                ))}
              </div>
              <h1 className="break-words font-sans text-2xl font-bold normal-case leading-tight tracking-normal sm:text-3xl">{thread.title}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink/60">
                <AuthorLink author={thread.author} mine={thread.mine} size="md" />
                {thread.author.isSample && (
                  <span className="rounded border border-ink/15 bg-ink/[0.06] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink/65">
                    Sample
                  </span>
                )}
                {thread.author.about && <span className="hidden sm:inline">{thread.author.about}</span>}
                <span aria-hidden="true">·</span>
                <span>{ago(thread.createdAt, now)}</span>
                {thread.editedAt && <span className="text-xs">(edited)</span>}
              </div>

              <Paragraphs text={thread.body} className="mt-6" />
            </>
          )}

          {error && (
            <p role="alert" className={cn(alertBox, 'mt-6')}>
              {error}
            </p>
          )}

          {!editing && (
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-ink/10 pt-5 text-sm">
              <VoteButton inline count={tv.votes} voted={tv.voted} onToggle={() => votes.toggle('thread', { id: thread.id, ...tv })} label="this discussion" />
              <a href="#replies" className="inline-flex items-center gap-1.5 font-semibold text-ink/70 hover:text-ink">
                <MessageSquare className="h-4 w-4" />
                {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
              </a>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:ml-auto">
                {thread.canEdit && (
                  <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 font-semibold text-ink hover:underline">
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                )}
                {isAdmin && (
                  <button type="button" onClick={togglePin} disabled={Boolean(busy)} className="inline-flex items-center gap-1.5 font-semibold text-ink hover:underline disabled:opacity-60">
                    {thread.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                    {thread.pinned ? 'Unpin' : 'Pin'}
                  </button>
                )}
                {canDelete && (
                  <button type="button" onClick={removeThread} disabled={Boolean(busy)} className={dangerLink}>
                    {busy === 'delete' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    {thread.mine ? 'Delete' : 'Delete (admin)'}
                  </button>
                )}
              </div>
            </div>
          )}
          {votes.error && (
            <p role="alert" className={cn(alertBox, 'mt-4')}>
              {votes.error}
            </p>
          )}
        </div>
      </article>

      <div className="card p-5">
        <h2 className={cn(smallHeading, 'mb-3')}>Share this discussion</h2>
        <ShareButtons title={thread.title} path={`/community/${thread.slug}`} />
      </div>

      <section id="replies" aria-labelledby="replies-heading" className="scroll-mt-24">
        <h2 id="replies-heading" className="mb-4 font-sans text-xl font-bold normal-case tracking-normal">
          {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
        </h2>
        {replyCount > 0 ? (
          <ol className="card divide-y divide-ink/10">
            {replies.map((r) => {
              const rv = votes.view('reply', r);
              const href = authorHref(r.author, r.mine);
              const op = Boolean(r.author.id) && r.author.id === thread.author.id;
              return (
                <li key={r.id} id={`reply-${r.id}`} className="flex scroll-mt-24 gap-3 p-4 sm:gap-4 sm:p-5">
                  {href ? (
                    <Link href={href} tabIndex={-1} aria-hidden="true" className="shrink-0">
                      <Avatar name={r.author.name} image={r.author.image} size="md" />
                    </Link>
                  ) : (
                    <Avatar name={r.author.name} size="md" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 text-sm">
                      {href ? (
                        <Link href={href} className="font-semibold text-ink hover:underline">
                          {r.author.name}
                          {r.mine && <span className="font-normal text-ink/60"> (you)</span>}
                        </Link>
                      ) : (
                        <span className="font-semibold text-ink/70">{r.author.name}</span>
                      )}
                      {op && <span className="rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">Author</span>}
                      <span className="text-xs text-ink/60">{ago(r.createdAt, now)}</span>
                    </p>
                    <Paragraphs text={r.body} className="mt-1.5" />
                    <div className="mt-3 flex items-center gap-4 text-xs">
                      <VoteButton inline count={rv.votes} voted={rv.voted} onToggle={() => votes.toggle('reply', { id: r.id, ...rv })} label={`${r.author.name}’s reply`} />
                      {(r.mine || isAdmin) && (
                        <button type="button" onClick={() => removeReply(r)} disabled={Boolean(busy)} className={dangerLink}>
                          {busy === `reply-${r.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          {r.mine ? 'Delete' : 'Delete (admin)'}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="card p-6 text-sm text-ink/70">No replies yet. Be the first to help.</p>
        )}
      </section>

      {viewer ? (
        <ReplyForm
          slug={thread.slug}
          onPosted={(reply) => {
            setReplies((list) => [...list, reply]);
            // Wait for the new reply to render before scrolling to it.
            window.setTimeout(() => document.getElementById(`reply-${reply.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
          }}
        />
      ) : (
        <SignInPrompt
          compact
          next={`/community/${thread.slug}#replies`}
          icon={PenLine}
          title="Sign in to reply"
          text="Anyone can read this discussion. Sign in to reply and upvote; it takes a minute and it’s free."
        />
      )}
    </div>
  );
}

function ReplyForm({ slug, onPosted }: { slug: string; onPosted: (reply: ReplyItem) => void }) {
  const [body, setBody] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    if (body.trim().length < REPLY_MIN) {
      setFieldError('Write your reply first.');
      document.getElementById('rp-body')?.focus();
      return;
    }
    setFieldError('');
    setSending(true);
    try {
      const { reply } = await apiFetch<{ reply: ReplyItem }>(`/api/threads/${slug}/replies`, { body: { body: body.trim() } });
      setBody('');
      onPosted(reply);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) goToLogin();
      else setFieldError(err instanceof ApiClientError ? err.fields?.body ?? err.message : errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate aria-label="Add a reply" className="card space-y-4 p-5 sm:p-6">
      <h2 className="flex items-center gap-2 font-sans text-lg font-bold normal-case tracking-normal">
        <PenLine className="h-5 w-5" />
        Add a reply
      </h2>
      <div>
        <label htmlFor="rp-body" className="label">
          Your reply
        </label>
        <textarea
          id="rp-body"
          className={cn('input min-h-[110px]', fieldError && INVALID)}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={REPLY_MAX}
          placeholder="Share what worked for you, or ask a follow-up question."
          aria-invalid={Boolean(fieldError) || undefined}
          aria-describedby={fieldError ? 'rp-body-error' : undefined}
        />
        {fieldError && (
          <p id="rp-body-error" className={ERROR_TEXT}>
            {fieldError}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink/60">Be kind and specific. Abusive words are blocked. Don’t post phone numbers.</p>
        <button type="submit" className="btn-primary py-2.5" disabled={sending}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {sending ? 'Posting…' : 'Post reply'}
        </button>
      </div>
    </form>
  );
}

type EditField = 'title' | 'body' | 'tags';

/** The author's edit form: title, details and tags, in the first 24 hours. */
function EditThreadForm({ thread, onSaved, onCancel }: { thread: ThreadItem; onSaved: (t: ThreadItem) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(thread.title);
  const [body, setBody] = useState(thread.body);
  const [tags, setTags] = useState<TagDraft>(() => tagDraftFrom(thread.tags));
  const [errors, setErrors] = useState<Partial<Record<EditField, string>>>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const found: Partial<Record<EditField, string>> = {};
    const cleanTags = tagsFromDraft(tags);
    if (title.trim().length < TITLE_MIN) found.title = `Write a title of at least ${TITLE_MIN} characters.`;
    if (body.trim().length < BODY_MIN) found.body = `Add a few more details (at least ${BODY_MIN} characters).`;
    if (cleanTags.length > MAX_TAGS) found.tags = `Use up to ${MAX_TAGS} tags in all.`;
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;
    setSaving(true);
    try {
      const res = await apiFetch<{ thread: ThreadItem }>(`/api/threads/${thread.slug}`, {
        method: 'PATCH',
        body: { title: title.trim(), body: body.trim(), tags: cleanTags },
      });
      onSaved(res.thread);
    } catch (err) {
      setSaving(false);
      if (err instanceof ApiClientError && err.fields) setErrors(err.fields as Partial<Record<EditField, string>>);
      setFormError(errorMessage(err));
    }
  };

  return (
    <form onSubmit={submit} noValidate aria-label="Edit your discussion" className="space-y-5">
      <h2 className="font-sans text-xl font-bold normal-case tracking-normal">Edit your discussion</h2>
      <div>
        <label htmlFor="ed-title" className="label">
          Title
        </label>
        <input
          id="ed-title"
          className={cn('input', errors.title && INVALID)}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={TITLE_MAX}
          aria-invalid={Boolean(errors.title) || undefined}
          aria-describedby={errors.title ? 'ed-title-error' : undefined}
        />
        {errors.title && (
          <p id="ed-title-error" className={ERROR_TEXT}>
            {errors.title}
          </p>
        )}
      </div>
      <TagFields idPrefix="ed" value={tags} onChange={setTags} error={errors.tags} />
      <div>
        <label htmlFor="ed-body" className="label">
          Details
        </label>
        <textarea
          id="ed-body"
          className={cn('input min-h-[180px]', errors.body && INVALID)}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={BODY_MAX}
          aria-invalid={Boolean(errors.body) || undefined}
          aria-describedby={errors.body ? 'ed-body-error' : undefined}
        />
        {errors.body && (
          <p id="ed-body-error" className={ERROR_TEXT}>
            {errors.body}
          </p>
        )}
      </div>
      {formError && (
        <p role="alert" className={alertBox}>
          {formError}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn-secondary py-2.5">
          Cancel
        </button>
        <button type="submit" className="btn-primary py-2.5" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
