'use client';

import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/apiClient';

/** Shown on the student's own story so they can remove it. */
export default function MyStoryActions({ id, title }: { id: string; title: string }) {
  const router = useRouter();

  const onDelete = async () => {
    if (!window.confirm(`Delete your story about ${title}? This can’t be undone.`)) return;
    await apiFetch(`/api/wins/${id}`, { method: 'DELETE' });
    router.push('/wins');
    router.refresh();
  };

  return (
    <div className="rounded-2xl bg-ink/5 p-4 text-sm text-ink/70">
      <p>This is your story. It’s saved in this browser until accounts launch, so only you can see it for now.</p>
      <button type="button" onClick={onDelete} className="mt-3 inline-flex items-center gap-1.5 font-semibold text-rose-600 hover:underline dark:text-rose-400">
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        Delete my story
      </button>
    </div>
  );
}
