'use client';

import { useState } from 'react';
import { avatarColor, initials, isPhotoUrl } from '@/data/people';
import { cn } from '@/lib/cn';

const SIZES = {
  xs: 'h-6 w-6 text-[9px]',
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-11 w-11 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-28 w-28 text-4xl',
};

export type AvatarSize = keyof typeof SIZES;

/**
 * The student's photo (uploaded, or from Google or GitHub) when there is one, otherwise
 * their initials on a colour picked from the name, so the same person always looks the same.
 */
export default function Avatar({
  name,
  image,
  size = 'md',
  className,
}: {
  name: string;
  image?: string | null;
  size?: AvatarSize;
  className?: string;
}) {
  const [broken, setBroken] = useState<string | null>(null);
  const showImage = isPhotoUrl(image) && broken !== image;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-sans font-semibold text-white ring-2 ring-surface',
        showImage ? 'bg-ink/10' : avatarColor(name),
        SIZES[size],
        className
      )}
      aria-hidden="true"
    >
      {showImage ? (
        // Photos come from several hosts (Cloudinary, Google, GitHub), so a plain img keeps config simple.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setBroken(image)}
        />
      ) : (
        initials(name || '?')
      )}
    </span>
  );
}
