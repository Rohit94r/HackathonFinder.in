'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { ApiClientError, apiFetch } from '@/lib/apiClient';
import { useMe } from '@/lib/useMe';

const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Profile photo: pick a JPG, PNG or WebP (up to 8 MB), see it at once, and it uploads
 * straight away (POST /api/me/avatar), cropped square around the face. Can be removed.
 */
export default function AvatarUploader({ name }: { name: string }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const { me, refresh } = useMe();
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<'upload' | 'remove' | null>(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  // Free the preview's memory when it's replaced or the form closes.
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const image = preview ?? me?.image;

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    setDone('');
    if (!TYPES.includes(file.type)) return setError('Use a JPG, PNG or WebP photo.');
    if (file.size > MAX_BYTES) return setError('Use a photo under 8 MB.');
    setPreview(URL.createObjectURL(file));
    setBusy('upload');
    try {
      const form = new FormData();
      form.set('photo', file);
      await apiFetch('/api/me/avatar', { body: form });
      await refresh();
      setPreview(null);
      setDone('Photo saved.');
    } catch (err) {
      setPreview(null);
      setError(err instanceof ApiClientError ? err.message : 'Couldn’t upload your photo. Try again.');
    } finally {
      setBusy(null);
      if (input.current) input.current.value = '';
    }
  };

  const remove = async () => {
    if (!window.confirm('Remove your profile photo? Your initials will show instead.')) return;
    setError('');
    setDone('');
    setBusy('remove');
    try {
      await apiFetch('/api/me/avatar', { method: 'DELETE' });
      await refresh();
      setDone('Photo removed.');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Couldn’t remove your photo. Try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-ink/10 p-4 sm:flex-row sm:items-center">
      <div className="relative shrink-0 self-start">
        <Avatar name={name || me?.name || 'You'} image={image} size="xl" className="h-24 w-24 ring-0" />
        {busy === 'upload' && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-navy/50 text-white">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
            <span className="sr-only">Uploading</span>
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">Profile photo</p>
        <p className="mt-0.5 text-xs leading-5 text-ink/60">
          A clear photo of your face helps teammates trust your invite. JPG, PNG or WebP, up to 8 MB. We crop it square.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <label htmlFor={`${id}-photo`} className="btn-secondary cursor-pointer px-4 py-2 text-sm">
            <Camera className="h-4 w-4" aria-hidden="true" />
            {me?.image ? 'Change photo' : 'Upload photo'}
          </label>
          <input
            ref={input}
            id={`${id}-photo`}
            type="file"
            accept={TYPES.join(',')}
            className="sr-only"
            disabled={Boolean(busy)}
            onChange={(e) => void pick(e.target.files?.[0])}
          />
          {me?.image && (
            <button type="button" onClick={remove} disabled={Boolean(busy)} className="btn-secondary px-4 py-2 text-sm">
              {busy === 'remove' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
              Remove
            </button>
          )}
        </div>
        {error && (
          <p role="alert" className="mt-2 text-xs font-medium text-brand-700 dark:text-brand-300">
            {error}
          </p>
        )}
        {done && !error && (
          <p role="status" className="mt-2 text-xs font-medium text-ink/70">
            {done}
          </p>
        )}
      </div>
    </div>
  );
}
