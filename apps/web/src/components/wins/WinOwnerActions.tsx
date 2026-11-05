'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { errorMessage } from '@/components/community/useCommunity';
import { apiFetch } from '@/lib/apiClient';

/** Edit and delete, for the story's author and for admins moderating. */
export default function WinOwnerActions({ slug, title, mine }: { slug: string; title: string; mine: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onDelete = async () => {
    if (!window.confirm(mine ? `Delete your story about ${title}? This can’t be undone.` : `Delete the story about ${title}? This can’t be undone.`)) return;
    setBusy(true);
    setError('');
    try {
      await apiFetch(`/api/wins/${slug}`, { method: 'DELETE' });
      router.push('/wins');
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg bg-ink/5 p-4 text-sm text-ink/70">
      <p>{mine ? 'This is your story. You can change it any time.' : 'Admin: you can edit or remove this story.'}</p>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        <Link href={`/wins/${slug}?edit=1`} className="inline-flex items-center gap-1.5 font-semibold text-ink hover:underline">
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Edit story
        </Link>
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline disabled:opacity-60 dark:text-brand-300"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
          {mine ? 'Delete my story' : 'Delete (admin)'}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 font-medium text-brand-700 dark:text-brand-300">
          {error}
        </p>
      )}
    </div>
  );
}
